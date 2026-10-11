/**
 * Annonstext → säker HTML (samma regler som src/utils/formatText.js i appen):
 * **fet**, rubriker ("# X" eller en rad som bara är **X** / **X:**), punktlistor
 * ("- ", "* ", "• ", "1. ") och stycken. All text escapas först.
 */
const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const inline = (t) => esc(t).replace(/\*\*([^*]+?)\*\*/g, "<strong>$1</strong>");

export function formattedTextToHtml(raw, { headingTag = "h3" } = {}) {
  const lines = String(raw || "").replace(/\r\n?/g, "\n").split("\n");
  const out = [];
  let para = [];
  let list = null;
  const flushPara = () => { if (para.length) out.push(`<p>${para.map(inline).join("<br>")}</p>`); para = []; };
  const flushList = () => { if (list) out.push(`<ul>${list.map((i) => `<li>${inline(i)}</li>`).join("")}</ul>`); list = null; };
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) { flushPara(); flushList(); continue; }
    const heading = line.match(/^#{1,6}\s+(.+)$/) || line.match(/^\*\*([^*]+?)\*\*:?$/);
    if (heading) { flushPara(); flushList(); out.push(`<${headingTag}>${inline(heading[1].replace(/:$/, ""))}</${headingTag}>`); continue; }
    const item = line.match(/^(?:[-*•]|\d+[.)])\s+(.+)$/);
    if (item) { flushPara(); (list ||= []).push(item[1]); continue; }
    flushList();
    para.push(line);
  }
  flushPara();
  flushList();
  return out.join("");
}

/** Ren text utan formateringstecken — för metabeskrivningar. */
export function stripFormatting(raw) {
  return String(raw || "")
    .replace(/\*\*([^*]+?)\*\*/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*(?:[-*•]|\d+[.)])\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}
