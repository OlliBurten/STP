import { parseFormattedText, parseInline } from "../utils/formatText";

function Inline({ text }) {
  return parseInline(text).map((p, i) => (p.bold ? <strong key={i} style={{ fontWeight: 700, color: "var(--ink-900)" }}>{p.text}</strong> : <span key={i}>{p.text}</span>));
}

/** Annonstext med fetstil, rubriker och punktlistor — se utils/formatText.js. */
export default function FormattedText({ text, style, fontSize = "var(--text-md)" }) {
  const blocks = parseFormattedText(text);
  return (
    <div style={{ fontSize, color: "var(--ink-700)", lineHeight: 1.75, overflowWrap: "break-word", ...style }}>
      {blocks.map((b, i) => {
        const top = i === 0 ? 0 : "0.9em";
        if (b.type === "h") return <h3 key={i} style={{ fontSize: "1.05em", fontWeight: 800, color: "var(--ink-900)", letterSpacing: -0.2, margin: `${i === 0 ? 0 : "1.3em"} 0 0.35em` }}><Inline text={b.text} /></h3>;
        if (b.type === "ul") return (
          <ul key={i} style={{ margin: `${top} 0 0`, paddingLeft: "1.25em", listStyle: "disc" }}>
            {b.items.map((it, k) => <li key={k} style={{ margin: "0.15em 0" }}><Inline text={it} /></li>)}
          </ul>
        );
        return <p key={i} style={{ margin: `${top} 0 0`, whiteSpace: "pre-line" }}><Inline text={b.text} /></p>;
      })}
    </div>
  );
}
