import { Fragment } from "react";
import { breakablePieces } from "./greeting";

/** Renders a visitor's name with <wbr> break opportunities, so a long unbroken name still wraps. */
export function BreakableName({ name }: { name: string }) {
  return (
    <>
      {breakablePieces(name).map((piece, index) => (
        <Fragment key={index}>
          {index > 0 && <wbr />}
          {piece}
        </Fragment>
      ))}
    </>
  );
}
