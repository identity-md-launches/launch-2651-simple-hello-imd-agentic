import { useId, useRef, useState, type FormEvent } from "react";
import { BreakableName } from "./BreakableName";
import { NAME_MAX_LENGTH, cleanName } from "./greeting";

// The brief asks for 0 styling: no stylesheet, no style attributes and no class names.
// Everything below renders with the browser's default styles.
export function App() {
  const inputId = useId();
  const errorId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [greeted, setGreeted] = useState("");
  const [names, setNames] = useState<string[]>([]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleaned = cleanName(name);
    if (!cleaned) {
      setError("Type your name, then press Say hello.");
      inputRef.current?.focus();
      return;
    }
    setError("");
    setGreeted(cleaned);
    setNames((previous) => [cleaned, ...previous]);
    setName("");
  }

  return (
    <main>
      <h1>Hello, IMD agentic world.</h1>
      <p>A plain page that says hello back to you.</p>

      <form onSubmit={handleSubmit} noValidate>
        <p>
          <label htmlFor={inputId}>Your name</label>
          <br />
          <input
            ref={inputRef}
            id={inputId}
            name="name"
            type="text"
            autoComplete="given-name"
            maxLength={NAME_MAX_LENGTH}
            placeholder="Ada"
            value={name}
            onChange={(event) => setName(event.target.value)}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
          />
        </p>
        {error && <p id={errorId}>{error}</p>}
        <p>
          <button type="submit">Say hello</button>
        </p>
      </form>

      <p role="status">
        {greeted && (
          <>
            Hello, <BreakableName name={greeted} />. Welcome to the IMD agentic world.
          </>
        )}
      </p>

      <h2>Hellos on this page</h2>
      {names.length === 0 ? (
        <p>No hellos yet. Say hello above to add the first.</p>
      ) : (
        <ol reversed>
          {names.map((entry, index) => (
            <li key={`${names.length - index}-${entry}`}>
              <BreakableName name={entry} />
            </li>
          ))}
        </ol>
      )}
      <p>This list stays in this tab and clears when you reload.</p>
    </main>
  );
}
