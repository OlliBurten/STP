/**
 * STP – logotyp (riktig märkesversion: STP + swoosh).
 * Använd height för att styra storlek.
 * variant="light" för vit knockout på mörk bakgrund (t.ex. mörk hero/footer).
 */
export default function Logo({ className = "", height = 40, variant = "default" }) {
  const src = variant === "light" ? "/stp-logo-white.png" : "/stp-logo.png";
  return (
    <img
      src={src}
      alt="STP – Sveriges Transportplattform"
      style={{ height: `${height}px`, width: "auto", display: "block" }}
      className={className}
    />
  );
}
