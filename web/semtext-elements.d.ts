import type * as React from "react";

/*
 * The SemText custom elements this site renders as JSX (the authored markup
 * is the vocabulary itself — see app/reference/). React's JSX types accept
 * an intrinsic element only when declared; these are the dash-tagged
 * elements the pages use so far. Others (sem-properties, …) are emitted as
 * HTML strings through the <Sem> wrapper and need no declaration.
 */
declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "sem-code": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        lang?: string;
        filename?: string;
        mark?: string;
        controls?: string;
      };
    }
  }
}
