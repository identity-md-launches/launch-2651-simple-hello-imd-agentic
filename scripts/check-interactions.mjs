// Interaction check for the built export in dist/.
// Serves dist/ under /preview/ (a subpath, like an IPFS gateway), drives the page with Playwright
// and exits non-zero on the first failed check.
//
// Playwright is not a dependency of the site. Point PLAYWRIGHT_MODULE at its index.mjs, or install
// it where `import "playwright"` can see it:
//   PLAYWRIGHT_MODULE=/path/to/node_modules/playwright/index.mjs node scripts/check-interactions.mjs [screenshot-dir]
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { mkdirSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const dist = resolve("dist");
const shots = process.argv[2];
const { chromium, webkit } = process.env.PLAYWRIGHT_MODULE
  ? await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href)
  : await import("playwright");

const types = { ".html": "text/html", ".js": "text/javascript", ".svg": "image/svg+xml", ".png": "image/png" };
const server = createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (!path.startsWith("/preview/")) return res.writeHead(404).end();
  const file = normalize(join(dist, path.slice("/preview/".length) || "index.html"));
  if (!file.startsWith(dist)) return res.writeHead(403).end();
  try {
    const body = await readFile(file);
    res.writeHead(200, { "content-type": types[extname(file)] ?? "application/octet-stream" }).end(body);
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((done) => server.listen(0, "127.0.0.1", done));
const url = `http://127.0.0.1:${server.address().port}/preview/`;

const results = [];
function check(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  (${detail})` : ""}`);
}

async function run(engine, label) {
  let browser;
  try {
    browser = await engine.launch();
  } catch (error) {
    console.log(`SKIP  ${label}: browser not installed (${error.message.split("\n")[0]})`);
    return;
  }
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const problems = [];
  page.on("pageerror", (error) => problems.push(`pageerror: ${error.message}`));
  page.on("console", (msg) => msg.type() === "error" && problems.push(`console: ${msg.text()}`));
  page.on("response", (res) => res.status() >= 400 && problems.push(`${res.status()} ${res.url()}`));
  page.on("requestfailed", (req) => problems.push(`failed ${req.url()}`));

  await page.goto(url, { waitUntil: "networkidle" });
  for (const asset of ["favicon.svg", "og.png"]) {
    const res = await page.request.get(url + asset);
    check(`${label}: ${asset} served at the subpath`, res.ok(), String(res.status()));
  }

  const input = page.getByLabel("Your name");
  const button = page.getByRole("button", { name: "Say hello" });
  const status = page.getByRole("status");
  const inView = async (locator) => {
    const box = await locator.boundingBox();
    return box !== null && box.y >= 0 && box.y + box.height <= 844;
  };
  check(`${label}: heading, field and button on the first 390x844 screen`,
    (await inView(page.getByRole("heading", { level: 1 }))) && (await inView(input)) && (await inView(button)));
  if (shots) await page.screenshot({ path: join(shots, `${label}-390-empty.png`) });

  // Keyboard order: name field, then the button.
  await page.keyboard.press("Tab");
  check(`${label}: first Tab lands on the name field`, await input.evaluate((el) => el === document.activeElement));
  await page.keyboard.press("Tab");
  check(`${label}: second Tab lands on Say hello`, await button.evaluate((el) => el === document.activeElement));

  // Empty and whitespace-only submit shows a fix next to the field and returns focus to it.
  await input.fill("   ");
  await button.click();
  const error = page.getByText("Type your name, then press Say hello.");
  check(`${label}: blank name shows the error`, await error.isVisible());
  check(`${label}: blank name marks the field invalid`, (await input.getAttribute("aria-invalid")) === "true");
  const describedBy = await input.getAttribute("aria-describedby");
  check(`${label}: error is linked by aria-describedby`,
    describedBy !== null && (await error.getAttribute("id")) === describedBy);
  check(`${label}: focus returns to the field`, await input.evaluate((el) => el === document.activeElement));
  check(`${label}: no greeting after a blank name`, (await status.textContent()) === "");

  // Enter submits; the name is cleaned, greeted, listed and the field clears.
  await input.fill("  Ada   Lovelace ");
  await input.press("Enter");
  check(`${label}: Enter greets the cleaned name`,
    (await status.textContent()) === "Hello, Ada Lovelace. Welcome to the IMD agentic world.");
  check(`${label}: error clears after a valid name`, (await error.count()) === 0);
  check(`${label}: field clears after a hello`, (await input.inputValue()) === "");
  check(`${label}: empty state is replaced by the list`,
    (await page.getByText("No hellos yet.").count()) === 0 && (await page.getByRole("listitem").count()) === 1);

  // A click adds a second hello, newest first.
  await input.fill("Grace");
  await button.click();
  const items = await page.getByRole("listitem").allTextContents();
  check(`${label}: newest hello is listed first`, items.join("|") === "Grace|Ada Lovelace", items.join("|"));
  check(`${label}: status shows the latest greeting`,
    (await status.textContent()) === "Hello, Grace. Welcome to the IMD agentic world.");

  if (shots) await page.screenshot({ path: join(shots, `${label}-390-greeted.png`) });

  // Long names are capped by maxlength, and a long unbroken one still wraps at 320.
  await input.fill("W".repeat(80));
  check(`${label}: name field caps input at 60 characters`, (await input.inputValue()).length === 60);
  await page.setViewportSize({ width: 320, height: 900 });
  await input.press("Enter");
  const longOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  check(`${label}: a 60-character unbroken name wraps at 320`, longOverflow <= 0, `${longOverflow}px`);
  check(`${label}: the long name keeps every character`,
    (await page.getByRole("listitem").first().textContent()) === "W".repeat(60));
  if (shots) await page.screenshot({ path: join(shots, `${label}-320-long-name.png`), fullPage: true });

  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    check(`${label}: no horizontal scroll at ${width}`, overflow <= 0, `${overflow}px`);
    if (shots) await page.screenshot({ path: join(shots, `${label}-${width}.png`), fullPage: true });
  }

  check(`${label}: no console errors or failed requests`, problems.length === 0, problems.join("; "));
  await browser.close();
}

if (shots) mkdirSync(shots, { recursive: true });
try {
  await run(chromium, "chromium");
  await run(webkit, "webkit");
} finally {
  server.close();
}
const failed = results.filter((result) => !result.ok).length;
console.log(`\n${results.length - failed}/${results.length} checks passed`);
process.exit(failed || results.length === 0 ? 1 : 0);
