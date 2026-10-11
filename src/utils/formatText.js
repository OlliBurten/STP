/**
 * Enkel, säker tolkning av annonstext (en delmängd av markdown):
 *   **fet**, rubriker ("# X", "## X" eller en rad som bara är **X** / **X:**),
 *   punktlistor ("- ", "* ", "• ", "1. ") och stycken. Ingen HTML släpps igenom.
 * Åkerier klistrar in text från AI eller Word — tidigare syntes asteriskerna rakt av.
 */

/** Delar texten i block: { type: "h" | "ul" | "p", text | items }. */
export function parseFormattedText(raw) {
  const lines = String(raw || "").replace(/\r\n?/g, "\n").split("\n");
  const blocks = [];
  let para = [];
  let list = null;
  const flushPara = () => { if (para.length) blocks.push({ type: "p", text: para.join("\n") }); para = []; };
  const flushList = () => { if (list) blocks.push({ type: "ul", items: list }); list = null; };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) { flushPara(); flushList(); continue; }
    const heading = line.match(/^#{1,6}\s+(.+)$/) || line.match(/^\*\*([^*]+?)\*\*:?$/);
    if (heading) { flushPara(); flushList(); blocks.push({ type: "h", text: heading[1].replace(/:$/, "") }); continue; }
    const item = line.match(/^(?:[-*•]|\d+[.)])\s+(.+)$/);
    if (item) { flushPara(); (list ||= []).push(item[1]); continue; }
    flushList();
    para.push(line);
  }
  flushPara();
  flushList();
  return blocks;
}

/** Dela en rad i { text, bold }-bitar för **fet** text. */
export function parseInline(text) {
  const parts = [];
  const re = /\*\*([^*]+?)\*\*/g;
  let last = 0;
  let m;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push({ text: text.slice(last, m.index), bold: false });
    parts.push({ text: m[1], bold: true });
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push({ text: text.slice(last), bold: false });
  return parts;
}

/** Ren text utan formateringstecken — för förhandsvisningar och metabeskrivningar. */
export function stripFormatting(raw) {
  return String(raw || "")
    .replace(/\*\*([^*]+?)\*\*/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*(?:[-*•]|\d+[.)])\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}
