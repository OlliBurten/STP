/**
 * Beräknar förtroendeskapande badges för en förare.
 * Används i DriverCard och DriverDetail.
 * Returnerar array av { label, className }.
 */
export function computeDriverBadges(driver) {
  const badges = [];

  if ((driver.profileScore ?? 0) >= 90) {
    badges.push({
      label: "Komplett profil",
      className: "bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/20",
    });
  }

  if ((driver.yearsExperience ?? 0) >= 5) {
    badges.push({
      label: "Erfaren chaufför",
      className: "bg-slate-100 text-slate-700 border border-slate-200",
    });
  }

  const hasAdr = driver.certificates?.some((c) => c === "ADR" || c === "ADR_Tank");
  if (hasAdr) {
    badges.push({
      label: "ADR-certifierad",
      className: "bg-orange-50 text-orange-700 border border-orange-200",
    });
  }

  if ((driver.licenses?.length ?? 0) >= 3) {
    badges.push({
      label: "Flera körkort",
      className: "bg-slate-100 text-slate-700 border border-slate-200",
    });
  }

  if ((driver.regionsWilling?.length ?? 0) >= 5) {
    badges.push({
      label: "Flexibel region",
      className: "bg-slate-100 text-slate-700 border border-slate-200",
    });
  }

  return badges;
}
