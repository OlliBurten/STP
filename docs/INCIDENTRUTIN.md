# Incidentrutin – personuppgiftsincidenter (GDPR art. 33–34)

**Gäller:** Sveriges Transportplattform (STP)
**Ansvarig:** [namn/roll – t.ex. grundare/teknisk ansvarig]
**Kontakt:** dataskydd@transportplattformen.se
**Senast uppdaterad:** 2026-06-07

> En personuppgiftsincident = en säkerhetsincident som leder till oavsiktlig eller
> olaglig förstöring, förlust, ändring, obehörigt röjande av eller åtkomst till
> personuppgifter. Exempel: läckt databas, obehörig inloggning, felaktigt utskick,
> förlorad enhet med åtkomst, sårbarhet som exponerat data.

---

## ⏱️ Tidskrav (viktigast)
**Anmälan till IMY ska ske utan onödigt dröjsmål och senast inom 72 timmar** efter
att incidenten upptäckts, om den sannolikt medför en risk för individers
rättigheter och friheter. Klockan startar vid **upptäckt**, inte vid inträffande.

---

## Steg 1 – Upptäck & larma (omedelbart)
- Vem som helst som misstänker en incident larmar **dataskydd@transportplattformen.se**.
- Källor att bevaka: Sentry-larm, Railway-loggar, användarrapporter, ovanlig trafik.
- Notera tidpunkt för **upptäckt** (72h-klockan startar här).

## Steg 2 – Begränsa skadan (inom timmar)
- Stoppa pågående läcka: rotera nycklar/lösenord, återkalla tokens, stäng sårbar endpoint.
- Vid komprometterad databas: överväg att ta tjänsten offline (underhållsläge:
  `VITE_MAINTENANCE=1`) tills läget är under kontroll.
- Bevara bevis (loggar) för utredning – ändra inte i onödan.

## Steg 3 – Bedöm allvar & risk
Dokumentera:
- **Vad** hände och **vilka uppgifter** berördes (kategorier + ungefärligt antal personer)
- **Vilka** är drabbade (förare/åkerier)
- **Sannolik konsekvens** (t.ex. identitetsstöld, integritetsintrång)
- **Risknivå:** låg / medel / hög

| Risk | Anmäl till IMY? | Informera drabbade? |
|---|---|---|
| Osannolik risk för individer | Nej (men dokumentera internt) | Nej |
| Sannolik risk | **Ja, inom 72h** | Endast om hög risk |
| Hög risk | **Ja, inom 72h** | **Ja, utan onödigt dröjsmål** (art. 34) |

## Steg 4 – Anmäl till IMY (vid risk)
- Anmäl via **imy.se** → e-tjänst för personuppgiftsincidenter.
- Om alla uppgifter inte finns inom 72h: gör en **preliminär anmälan** och komplettera.
- Innehåll: incidentens art, kategorier/antal, kontaktperson, sannolika konsekvenser,
  vidtagna/planerade åtgärder.

## Steg 5 – Informera drabbade (vid hög risk, art. 34)
- Tydligt språk: vad hände, sannolika konsekvenser, vad de bör göra (t.ex. byta lösenord),
  och vår kontaktuppgift.

## Steg 6 – Dokumentera & lär (efteråt)
- För in incidenten i **incidentloggen** nedan (krav även om den inte anmäls).
- Gör en kort post-mortem: rotorsak + åtgärd för att förhindra upprepning.

---

## Incidentlogg

| Datum (upptäckt) | Vad hände | Berörda uppgifter | Risk | Anmäld IMY? | Åtgärd |
|---|---|---|---|---|---|
| – | (inga incidenter registrerade) | – | – | – | – |

---

## Snabb-checklista
- [ ] Tidpunkt för upptäckt noterad (72h-klockan)
- [ ] Skadan begränsad (nycklar roterade, läcka stoppad)
- [ ] Risk bedömd och dokumenterad
- [ ] IMY-anmälan gjord (om risk) – inom 72h
- [ ] Drabbade informerade (om hög risk)
- [ ] Incidentloggen uppdaterad + post-mortem
