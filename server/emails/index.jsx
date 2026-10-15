/* STP transactional email — React Email branded layout.
 * Bundled by emails/build.mjs → lib/emailRender.js (plain ESM, no JSX at runtime). */
import * as React from "react";
import {
  Html, Head, Body, Container, Section, Heading, Text, Button, Hr, Link, Preview, Img,
} from "@react-email/components";
import { render } from "@react-email/render";

// Brand Book 2026: Väggrön, Asfalt, off-white. Samma tokens som index.css.
const C = {
  paper: "#F5F7F3",
  card: "#ffffff",
  line: "#DDE3DD",
  green: "#1E6B5B",
  greenTint: "#E8F1EE",
  amber: "#F2A41C",
  ink900: "#1B2421",
  ink700: "#3A4743",
  ink400: "#7A8580",
};
const LOGO = "https://transportplattformen.se/stp-logo.png"; // 849×352
const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

// Inline-länkar i brödtexten: [etikett](https://…) blir ett riktigt <a>.
//
// Utan det här renderades varje URL som ren text. Uppföljningsmejlet
// ("Fick du jobbet?") la ut upp till 15 råa uppfoljning-länkar som INTE gick
// att klicka på — hela mejlets syfte satt i text som e-postklienten inte gjorde
// något av, medan den enda riktiga knappen ledde bort till jobblistan.
const LINK_RE = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;

function renderInline(line, keyPrefix) {
  const out = [];
  let last = 0;
  let m;
  LINK_RE.lastIndex = 0;
  while ((m = LINK_RE.exec(line)) !== null) {
    if (m.index > last) out.push(line.slice(last, m.index));
    out.push(
      <Link key={`${keyPrefix}-l${m.index}`} href={m[2]} style={{ color: C.green, fontWeight: 700, textDecoration: "underline" }}>{m[1]}</Link>
    );
    last = m.index + m[0].length;
  }
  if (last < line.length) out.push(line.slice(last));
  return out.length ? out : [line];
}

function StpEmail({ preview, heading, paragraphs = [], ctaUrl, ctaText, footNote, actions = [], items = [], unsubscribeUrl }) {
  return (
    <Html lang="sv">
      <Head />
      {preview ? <Preview>{preview}</Preview> : null}
      <Body style={{ margin: 0, padding: 0, background: C.paper, fontFamily: FONT }}>
        <Container style={{ maxWidth: "600px", margin: "0 auto", padding: "32px 16px" }}>
          {/* Brand header — riktiga loggan (samma som sajten), inte den gamla STP-rutan */}
          <Section style={{ paddingBottom: "20px" }}>
            <Img src={LOGO} width="87" height="36" alt="STP — Sveriges Transportplattform" style={{ display: "block" }} />
          </Section>

          {/* Card */}
          <Section style={{ background: C.card, borderRadius: "16px", border: `1px solid ${C.line}`, overflow: "hidden" }}>
            <Section style={{ height: "4px", lineHeight: "4px", fontSize: "1px", background: C.green }}>&nbsp;</Section>
            <Section style={{ padding: "32px 32px 4px" }}>
              {heading ? (
                <Heading as="h1" style={{ fontSize: "22px", fontWeight: 800, color: C.ink900, margin: "0 0 16px", letterSpacing: "-0.4px", fontFamily: FONT }}>{heading}</Heading>
              ) : null}
              {paragraphs.map((p, i) => (
                <Text key={i} style={{ fontSize: "15px", lineHeight: "1.7", color: C.ink700, margin: "0 0 14px", fontFamily: FONT }}>
                  {String(p).split("\n").map((line, j) => (
                    <React.Fragment key={j}>{j > 0 ? <br /> : null}{renderInline(line, `${i}-${j}`)}</React.Fragment>
                  ))}
                </Text>
              ))}
            </Section>

            {items.length > 0 ? (
              <Section style={{ padding: "0 32px 8px" }}>
                {items.map((it, i) => (
                  <Section key={i} style={{ border: `1px solid ${C.line}`, borderRadius: "12px", padding: "16px 18px", marginBottom: "10px" }}>
                    <Text style={{ fontSize: "15px", fontWeight: 800, color: C.ink900, margin: "0 0 3px", fontFamily: FONT }}>{it.title}</Text>
                    {it.meta ? <Text style={{ fontSize: "13px", color: C.ink400, margin: "0 0 8px", fontFamily: FONT }}>{it.meta}</Text> : null}
                    {it.tags?.length ? (
                      <Text style={{ margin: "0 0 10px", fontFamily: FONT }}>
                        {it.tags.map((t, j) => (
                          <span key={j} style={{ display: "inline-block", fontSize: "11px", fontWeight: 700, padding: "3px 8px", borderRadius: "5px", marginRight: "6px", background: t.tone === "amber" ? C.amber : C.greenTint, color: t.tone === "amber" ? C.ink900 : C.green }}>{t.label}</span>
                        ))}
                      </Text>
                    ) : null}
                    {it.href ? <Link href={it.href} style={{ fontSize: "14px", fontWeight: 700, color: C.green, textDecoration: "none", fontFamily: FONT }}>{it.cta || "Se jobbet"} →</Link> : null}
                  </Section>
                ))}
              </Section>
            ) : null}

            {actions.length > 0 ? (
              <Section style={{ padding: "8px 32px 28px" }}>
                {actions.map((a, i) => (
                  <Button key={i} href={a.href} style={{ display: "block", textAlign: "center", marginBottom: "10px", background: a.primary ? C.green : C.paper, color: a.primary ? "#ffffff" : C.ink900, border: a.primary ? "none" : `1px solid ${C.line}`, fontSize: "15px", fontWeight: 700, textDecoration: "none", padding: "13px 18px", borderRadius: "10px", fontFamily: FONT }}>{a.label}</Button>
                ))}
              </Section>
            ) : ctaUrl && ctaText ? (
              <Section style={{ padding: "8px 32px 32px" }}>
                <Button href={ctaUrl} style={{ background: C.green, color: "#ffffff", fontSize: "15px", fontWeight: 700, textDecoration: "none", padding: "13px 28px", borderRadius: "10px", display: "inline-block", fontFamily: FONT }}>{ctaText}</Button>
              </Section>
            ) : (
              <Section style={{ height: "16px", lineHeight: "16px", fontSize: "1px" }}>&nbsp;</Section>
            )}

            <Hr style={{ borderColor: C.line, borderTopWidth: "1px", margin: 0 }} />
            <Section style={{ padding: "18px 32px 26px" }}>
              <Text style={{ fontSize: "13px", lineHeight: "1.6", color: C.ink400, margin: "0 0 6px", fontFamily: FONT }}>
                {footNote || "Du får det här mejlet eftersom du har ett konto på Sveriges Transportplattform."}
              </Text>
              <Text style={{ fontSize: "13px", color: C.ink400, margin: 0, fontFamily: FONT }}>
                <Link href="https://transportplattformen.se" style={{ color: C.green, textDecoration: "none", fontWeight: 600 }}>transportplattformen.se</Link>
                {unsubscribeUrl ? <>{" · "}<Link href={unsubscribeUrl} style={{ color: C.ink400, textDecoration: "underline" }}>Avprenumerera</Link></> : null}
              </Text>
            </Section>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

/** Render a branded STP email to an HTML string.
 *  @param {{preview?:string, heading?:string, paragraphs?:string[], ctaUrl?:string, ctaText?:string, footNote?:string,
 *           actions?:{label:string,href:string,primary?:boolean}[], items?:{title:string,meta?:string,tags?:{label:string,tone?:string}[],href?:string,cta?:string}[],
 *           unsubscribeUrl?:string}} props */
export async function renderEmail(props) {
  return await render(<StpEmail {...props} />);
}
