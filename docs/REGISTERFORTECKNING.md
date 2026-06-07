# Registerförteckning – behandling av personuppgifter (GDPR art. 30)

**Personuppgiftsansvarig:** Sveriges Transportplattform (STP)
**Kontakt:** dataskydd@transportplattformen.se
**Senast uppdaterad:** 2026-06-07

> Detta är STP:s register över behandlingar enligt GDPR artikel 30. Det beskriver
> vilka personuppgifter vi behandlar, varför, på vilken rättslig grund, var de
> lagras och hur länge. Uppdatera vid varje ny typ av behandling eller ny
> underleverantör.

---

## 1. Behandlingar

### 1.1 Förarkonton & förarprofiler
| Fält | Värde |
|---|---|
| **Ändamål** | Tillhandahålla tjänsten: skapa profil, matchas mot jobb, bli synlig för åkerier |
| **Kategorier av registrerade** | Yrkesförare (användare) |
| **Personuppgifter** | Namn, e-post, telefonnummer (frivilligt), region/bostadsort, körkortsbehörigheter, certifikat (YKB/ADR m.m.), arbetslivserfarenhet, profiltext, synlighetsinställningar |
| **Rättslig grund** | Avtal (art. 6.1.b) – nödvändigt för att leverera tjänsten |
| **Mottagare** | Åkerier (endast om föraren aktiverat synlighet), underleverantörer (se §2) |
| **Lagringstid** | Så länge kontot är aktivt. Raderas omedelbart vid kontoradering. |
| **Särskilda kategorier (art. 9)?** | Nej. Körkort/certifikat är inte särskilda kategorier. |

### 1.2 Åkeri-/företagskonton
| Fält | Värde |
|---|---|
| **Ändamål** | Publicera jobb, söka och kontakta förare, hantera organisation/team |
| **Kategorier av registrerade** | Kontaktpersoner hos transportföretag |
| **Personuppgifter** | Namn (kontaktperson), e-post, företagsnamn, organisationsnummer |
| **Rättslig grund** | Avtal (art. 6.1.b) |
| **Mottagare** | Förare (vid kontakt), underleverantörer |
| **Lagringstid** | Så länge kontot är aktivt. Raderas vid kontoradering. |

### 1.3 Meddelanden / konversationer
| Fält | Värde |
|---|---|
| **Ändamål** | Möjliggöra direktkommunikation mellan förare och åkeri kring ett jobb |
| **Personuppgifter** | Meddelandeinnehåll, avsändare/mottagare, tidpunkt |
| **Rättslig grund** | Avtal (art. 6.1.b) |
| **Lagringstid** | Bevaras i **12 månader efter kontots radering**, raderas därefter automatiskt |

### 1.4 Tekniska uppgifter & säkerhet
| Fält | Värde |
|---|---|
| **Ändamål** | Felövervakning, skydd mot missbruk, drift och förbättring |
| **Personuppgifter** | IP-adress (anonymiserad statistik), inloggningstidpunkter, fellogg-data |
| **Rättslig grund** | Berättigat intresse (art. 6.1.f) – säkerhet och stabil drift |
| **Lagringstid** | Begränsad; rensas löpande |

### 1.5 Analys (webbstatistik)
| Fält | Värde |
|---|---|
| **Ändamål** | Förstå användning och förbättra plattformen |
| **Personuppgifter** | Beteendedata (sidvisningar, händelser) |
| **Rättslig grund** | **Samtycke (art. 6.1.a)** – aktiveras endast om användaren accepterar analytics-cookies (CookieBanner) |
| **Lagringstid** | Enligt leverantörens inställning (PostHog, EU) |

### 1.6 E-postutskick (transaktionsmejl)
| Fält | Värde |
|---|---|
| **Ändamål** | Verifiering, välkomst, notiser (ansökan/meddelande/matchning), lösenordsbyte |
| **Personuppgifter** | Namn, e-postadress, relevant kontext (jobbtitel m.m.) |
| **Rättslig grund** | Avtal (art. 6.1.b). Inga marknadsföringsutskick utan samtycke. |

---

## 2. Underleverantörer (personuppgiftsbiträden)

| Leverantör | Roll | Datatyp | Plats (datalagring) | Skyddsmekanism |
|---|---|---|---|---|
| **Railway** | Hosting + databas (Postgres) | All persondata (kärnlager) | **EU – Amsterdam (europe-west4)** ✅ | DPA (verifiera SCC) |
| **Vercel** | Frontend-hosting | Endast statisk frontend + ev. analytics | EU/global | DPA / DPF |
| **Resend** | E-postutskick | Namn, e-post, kontext | USA | DPA + SCC/DPF (verifiera) |
| **Sentry** | Felövervakning | Fellogg-data (kan innehålla uppgifter) | USA (EU-region möjlig) | DPA + SCC/DPF (verifiera) |
| **PostHog** | Produktanalys | Beteendedata | **EU** ✅ | DPA |

> **Att verifiera:** att DPA/SCC faktiskt är tecknade/accepterade med Resend och
> Sentry (US-baserade). Överväg att flytta Sentry till EU-region för att hålla
> all data inom EU.

---

## 3. Den registrerades rättigheter (art. 15–22)

| Rättighet | Hur den uppfylls i STP |
|---|---|
| Tillgång (art. 15) | Profilen visar all egen data; utdrag via dataskydd@transportplattformen.se |
| Rättelse (art. 16) | Användaren rättar själv via sin profil |
| Radering (art. 17) | **Självservice** – radera konto i inställningar → all data raderas omedelbart |
| Begränsning (art. 18) | Synlighet kan stängas av; begäran via kontakt |
| Dataportabilitet (art. 20) | Utdrag av egna uppgifter via kontakt |
| Invändning (art. 21) | Mot behandling på berättigat intresse, via kontakt |
| Återkalla samtycke | Avböj/återställ analytics-cookies (CookieBanner) |

---

## 4. Tekniska & organisatoriska säkerhetsåtgärder (art. 32)

- Krypterad överföring (HTTPS/TLS)
- Lösenord lagras hashade (bcrypt)
- JWT-baserad autentisering med kort giltighetstid
- Felövervakning (Sentry) och driftövervakning
- Åtkomst till produktionsdata begränsad
- Persondata i EU (Railway, Amsterdam)
