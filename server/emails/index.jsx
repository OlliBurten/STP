/* STP transactional email — React Email branded layout.
 * Bundled by emails/build.mjs → lib/emailRender.js (plain ESM, no JSX at runtime). */
import * as React from "react";
import {
  Html, Head, Body, Container, Section, Heading, Text, Button, Hr, Link, Preview,
} from "@react-email/components";
import { render } from "@react-email/render";

const C = {
  paper: "#f4f1ea",
  card: "#ffffff",
  line: "#e7e3da",
  green: "#1F5F5C",
  greenDeep: "#154240",
  ink900: "#0a1a1a",
  ink700: "#2a3a3c",
  ink400: "#7d878a",
};
const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

function StpEmail({ preview, heading, paragraphs = [], ctaUrl, ctaText, footNote }) {
  return (
    <Html lang="sv">
      <Head />
      {preview ? <Preview>{preview}</Preview> : null}
      <Body style={{ margin: 0, padding: 0, background: C.paper, fontFamily: FONT }}>
        <Container style={{ maxWidth: "600px", margin: "0 auto", padding: "32px 16px" }}>
          {/* Brand header */}
          <Section style={{ paddingBottom: "20px" }}>
            <table cellPadding={0} cellSpacing={0} role="presentation">
              <tbody>
                <tr>
                  <td style={{ width: "34px", height: "34px", borderRadius: "9px", background: C.green, color: "#ffffff", textAlign: "center", verticalAlign: "middle", fontWeight: 800, fontSize: "16px", fontFamily: FONT }}>S</td>
                  <td style={{ paddingLeft: "11px", fontWeight: 800, fontSize: "16px", color: C.ink900, letterSpacing: "-0.2px", fontFamily: FONT }}>Sveriges Transportplattform</td>
                </tr>
              </tbody>
            </table>
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
                    <React.Fragment key={j}>{j > 0 ? <br /> : null}{line}</React.Fragment>
                  ))}
                </Text>
              ))}
            </Section>

            {ctaUrl && ctaText ? (
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
              </Text>
            </Section>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

/** Render a branded STP email to an HTML string.
 *  @param {{preview?:string, heading?:string, paragraphs?:string[], ctaUrl?:string, ctaText?:string, footNote?:string}} props */
export async function renderEmail(props) {
  return await render(<StpEmail {...props} />);
}
