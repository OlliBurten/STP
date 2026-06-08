/**
 * Engångsskript: extraherar blogginnehåll ur React-komponenterna i
 * src/pages/blogg/*.jsx → server/lib/seoBlog.js (för bot-SSR).
 * Kör: node scripts/extract-blog.mjs  (från server/)
 */
import fs from "fs";
import path from "path";

const BLOG_DIR = path.resolve("../src/pages/blogg");
const OUT = path.resolve("./lib/seoBlog.js");

function strConst(src, name) {
  // const NAME = "..."  eller  const NAME = `...`
  const m = src.match(new RegExp(`const ${name}\\s*=\\s*(["\`])([\\s\\S]*?)\\1`));
  return m ? m[2].trim() : null;
}
function attr(src, name) {
  const m = src.match(new RegExp(`${name}="([^"]*)"`));
  return m ? m[1] : null;
}

function jsxToHtml(body, title, desc) {
  let h = body;
  // Ta bort ArticleJsonLd-blocket (self-closing, ev. flerrad)
  h = h.replace(/<ArticleJsonLd[\s\S]*?\/>/g, "");
  // Ta bort <BlogPost ...> wrapper-taggar (behåll innehåll)
  h = h.replace(/<\/?BlogPost[^>]*>/g, "");
  // Platta ut div/section (behåll innehåll)
  h = h.replace(/<\/?(div|section|article|header|footer)[^>]*>/g, "");
  // <Link to="x"> → <a href="x">
  h = h.replace(/<Link\s+to="([^"]*)"[^>]*>/g, '<a href="$1">').replace(/<\/Link>/g, "</a>");
  // JSX-uttryck: {" "} → mellanslag, {TITLE}/{DESC} → text, övriga {…} → bort
  h = h.replace(/\{"\s*"\}/g, " ").replace(/\{'\s*'\}/g, " ");
  h = h.replace(/\{TITLE\}/g, title || "").replace(/\{DESC\}/g, desc || "");
  h = h.replace(/\{[^{}]*\}/g, "");
  // Strippa attribut utom href: className, target, rel, style m.fl.
  h = h.replace(/\s(className|target|rel|style|loading|width|height|aria-[a-z]+)="[^"]*"/g, "");
  h = h.replace(/\s(target|rel)=\{[^}]*\}/g, "");
  // Behåll bara semantiska taggar
  const allowed = new Set(["h1","h2","h3","h4","p","ul","ol","li","a","strong","em","b","i","blockquote","table","thead","tbody","tr","td","th"]);
  h = h.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)((?:\s[^>]*)?)>/g, (full, tag, rest) => {
    if (!allowed.has(tag.toLowerCase())) return "";
    if (tag.toLowerCase() === "a") {
      const href = (rest.match(/href="([^"]*)"/) || [])[1];
      return full.startsWith("</") ? "</a>" : (href ? `<a href="${href}">` : "<a>");
    }
    return full.startsWith("</") ? `</${tag}>` : `<${tag}>`;
  });
  // Städa whitespace
  h = h.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").replace(/>\s+</g, ">\n<").trim();
  return h;
}

const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith(".jsx") && f !== "BloggIndex.jsx");
const articles = [];
for (const file of files) {
  const src = fs.readFileSync(path.join(BLOG_DIR, file), "utf8");
  const title = strConst(src, "TITLE");
  const desc = strConst(src, "DESC");
  const canonical = attr(src, "canonical") || (src.match(/canonical:\s*"([^"]*)"/) || [])[1];
  const datePublished = attr(src, "datePublished");
  const slug = (canonical || "").replace("/blogg/", "");
  // Body = från <BlogPost till </BlogPost>
  const bodyMatch = src.match(/<BlogPost[\s\S]*?<\/BlogPost>/);
  const bodyHtml = bodyMatch ? jsxToHtml(bodyMatch[0], title, desc) : "";
  if (!slug || !title) { console.warn("HOPPAR ÖVER (saknar slug/title):", file); continue; }
  articles.push({ slug, title, desc, datePublished, bodyHtml });
  console.log(`✓ ${slug} — ${bodyHtml.length} tecken`);
}

const out = `// AUTO-GENERERAD av scripts/extract-blog.mjs — redigera inte för hand.\nexport const blogArticles = ${JSON.stringify(articles, null, 2)};\n`;
fs.writeFileSync(OUT, out);
console.log(`\nSkrev ${articles.length} artiklar → ${OUT}`);
