/* ════════════════════════════════════════════════════════════
   STP — Layout-standard (EN sanning för alla inloggade skärmar)

   Prototyperna varierar bredd/spacing/rubrikstorlek mellan skärmar.
   Här låser vi EN uppsättning regler så varje skärm blir konsekvent:

   • BREDD — två avsiktliga nivåer, inget annat:
       WIDE  = 1240px  → list-/grid-/dashboard-sidor + sidor med sidebar
       READ  = 1040px  → smala läs-/formulär-/inställningssidor
     Header-bandet OCH innehållet på en sida använder ALLTID samma bredd.

   • SIDPADDING — alltid 32px (PAD).

   • HEADER-BAND — pt 32 / pb 20, paper-bakgrund, undre linje.
       eyebrow: 11px / 800 / ls 1.4 / uppercase / ink-500   (mb 10)
       titel:   34px / 900 / ls -1.2 / lh 1.15               (mb 6)
       sub:     14px / 500 / ink-500

   • AVSTÅND header → första innehållet: 24px (main pt).
   • KORT-RYTM: 18px mellan staplade kort (GAP).
   • SEKTIONSRUBRIK i innehåll: 20px / 800, mt 36 / mb 14.

   Använd ALLTID <AppPage> + <PageHeader>/<Breadcrumb> + <Section>
   istället för att handkoda maxWidth/padding per skärm.
════════════════════════════════════════════════════════════ */
import { Icon, TopNav, PageShell } from "./index.jsx";

export const LAYOUT = {
  WIDE: 1240,    // = --w-app (inloggade app-sidor)
  PUBLIC: 1200,  // = --w-public (utloggade marknads-/innehållssidor)
  READ: 1040,    // = --w-read (tät läs-/app-bredd)
  PROSE: 680,    // = --w-prose (artikel-/långtextkolumn)
  FORM: 560,     // = --w-form (centrerade formulär)
  PAD: 32,
  GAP: 18,
};

/* Typskala (px) — speglar CSS-tokens --text-* för JS/inline-style-konsumenter.
   Föredra CSS-varianten ("var(--text-sm)") i inline styles; importera dessa
   bara när ett numeriskt värde behövs (beräkningar, clamp-baser). */
export const TYPE = {
  "2xs": 11, xs: 12, sm: 13, base: 14, md: 15, lg: 16,
  xl: 18, "2xl": 20, "3xl": 24, "4xl": 28, "5xl": 34, "6xl": 40,
};

/* Spacing-skala (px, 4px-bas) — speglar --space-* */
export const SPACE = {
  1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 7: 28, 8: 32, 10: 40, 12: 48, 16: 64, 20: 80,
};

const widthOf = (w) => (w === "read" ? LAYOUT.READ : LAYOUT.WIDE);

/* ────── AppPage — TopNav + standardiserad innehållsbredd ──────
   width: "wide" (1240, default) | "read" (1040)
   nav:   props vidare till <TopNav> (items, active, onActive, currentUser, brandSub, rightExtras)
   header / breadcrumb: valfria element som renderas mellan nav och main
   contentPad: main-padding (default "24px 32px 80px" — 24px ned till headern)
*/
export const AppPage = ({
  width = "wide",
  nav,
  header,
  breadcrumb,
  children,
  contentPad,
}) => {
  const maxWidth = widthOf(width);
  return (
    <PageShell>
      {nav && <TopNav {...nav} />}
      {breadcrumb}
      {header}
      <main className="stp-page-main" style={{ maxWidth, margin: "0 auto", padding: contentPad || `24px ${LAYOUT.PAD}px 80px` }}>
        {children}
      </main>
    </PageShell>
  );
};

/* ────── PageHeader — standardiserat header-band ──────
   eyebrow + titel + sub. Valfri actions (höger) och tabs (under).
   width matchar AppPage-bredden så band och innehåll alltid linjerar.
*/
export const PageHeader = ({ eyebrow, title, sub, actions, tabs, width = "wide" }) => {
  const maxWidth = widthOf(width);
  return (
    <div style={{ background: "var(--paper)", borderBottom: "1px solid var(--line)", paddingTop: 32, paddingBottom: tabs ? 0 : 20 }}>
      <div className="stp-header-inner" style={{ maxWidth, margin: "0 auto", padding: `0 ${LAYOUT.PAD}px` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16, marginBottom: tabs ? 24 : 0 }}>
          <div>
            {eyebrow && (
              <p style={{ fontSize: "var(--text-2xs)", fontWeight: 800, color: "var(--ink-500)", letterSpacing: 1.4, textTransform: "uppercase", marginBottom: 10 }}>{eyebrow}</p>
            )}
            <h1 className="stp-page-title" style={{ fontSize: "var(--text-5xl)", fontWeight: 900, color: "var(--ink-900)", letterSpacing: -1.2, lineHeight: 1.15, marginBottom: sub ? 6 : 0 }}>{title}</h1>
            {sub && <p style={{ fontSize: "var(--text-base)", color: "var(--ink-500)", fontWeight: 500 }}>{sub}</p>}
          </div>
          {actions && <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>{actions}</div>}
        </div>
        {tabs && (
          <div style={{ display: "flex", gap: 0, borderBottom: "1px solid var(--line)" }}>{tabs}</div>
        )}
      </div>
    </div>
  );
};

/* ────── Breadcrumb — standardiserad tillbaka-länk ────── */
export const Breadcrumb = ({ label = "Tillbaka", onClick, width = "wide" }) => {
  const maxWidth = widthOf(width);
  return (
    <div className="stp-breadcrumb" style={{ maxWidth, margin: "0 auto", padding: `24px ${LAYOUT.PAD}px 0` }}>
      <button onClick={onClick} style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--ink-500)" }}>
        <Icon name="arrowLeft" size={14} stroke={2} />
        {label}
      </button>
    </div>
  );
};

/* ────── Section — standardiserad innehållsrubrik + block ────── */
export const Section = ({ title, accessory, children, first }) => (
  <section>
    {title && (
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: first ? 0 : 36, marginBottom: 14 }}>
        <h2 style={{ fontSize: "var(--text-2xl)", fontWeight: 800, color: "var(--ink-900)", letterSpacing: -0.4 }}>{title}</h2>
        {accessory}
      </div>
    )}
    {children}
  </section>
);

/* ────── CardStack — staplade kort med standard-gap (18px) ────── */
export const CardStack = ({ children, gap = LAYOUT.GAP, style, className = "" }) => (
  <div className={className} style={{ display: "flex", flexDirection: "column", gap, ...style }}>{children}</div>
);
