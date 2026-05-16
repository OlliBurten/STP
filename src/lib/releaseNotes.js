export const CURRENT_VERSION = "v0.9.0";

export const releaseNotes = [
  {
    version: "v0.9.0",
    date: "2026-05-16",
    title: "PWA, GDPR och lansering",
    items: [
      "STP fungerar nu som en app — Android-användare kan installera plattformen direkt på hemskärmen via en banner som visas automatiskt.",
      "iOS: lägg till STP på hemskärmen via Safari → Dela → Lägg till på hemskärmen. Appen har eget ikon och namn.",
      "Cookie-samtyckesbanner är nu på plats — du väljer själv om du vill dela anonym statistik och felrapportering. Inloggning och grundfunktioner kräver inga analytiska cookies.",
      "Felrapportering (Sentry) aktiveras nu enbart om du accepterat analytics-cookies — i linje med GDPR.",
      "Meddelande-emails skickas nu max en gång var 4:e timme per konversation, så du slipper spam när en tråd är aktiv.",
      "Startsidan är uppdaterad — vi visar nu tydligt vad STP är och vad du kan göra här, direkt när du landar.",
      "Push-notiser fungerar nu fullt ut i produktion för Android och moderna webbläsare.",
    ],
  },
  {
    version: "v0.8.0",
    date: "2026-05-10",
    title: "Team-hantering och Bolagsverket-verifiering",
    items: [
      "Åkerier: ny team-sida där du ser alla medlemmar, deras roller och när de gick med — nås via Header → Team.",
      "Ägare kan nu ta bort teammedlemmar direkt från team-sidan.",
      "Hanterar du flera åkerier? Byt enkelt mellan dem via en ny dropdown i headern — du behöver inte längre logga ut och in.",
      "Organisationsnummer valideras nu i realtid mot Bolagsverket när du registrerar ett åkeri — företagsnamn, ort och bransch fylls i automatiskt.",
      "Bolagsverket kontrollerar nu även att företaget är registrerat som transportverksamhet — bara åkerier och transportföretag godkänns.",
      "Om ett åkeri redan finns på STP visas tydlig information om hur du går tillväga istället för ett generiskt felmeddelande.",
    ],
  },
  {
    version: "v0.7.0",
    date: "2026-04-23",
    title: "Publik förarprofil, CV-verktyg och åkeridatabas",
    items: [
      "Förare: din profil har nu en publik länk (transportplattformen.se/forare/...) som du kan dela direkt med åkerier — ingen inloggning krävs för att se den.",
      "Förare: se hur många åkerier som tittat på din profil de senaste 7 och 30 dagarna, samt hur många som kontaktat dig.",
      "Erfarenhet är nu ett eget steg i registreringsflödet — lägg till jobbhistorik, fordonstyp och körtyp direkt när du skapar kontot.",
      "Erfarenhetssektionen på profilen har byggts om med tidslinje, fordonschips (CE lastbil, tankbil, kranbil m.fl.) och körtyp (fjärrkörning, distribution etc.).",
      "Ny åkeridatabas: bläddra bland åkerier i Sverige med kontaktuppgifter — tillgänglig för inloggade förare.",
      "Företag: lägg till en extern ansökningslänk på jobbannonsen om ni vill ta emot ansökningar via er egen sida.",
    ],
  },
  {
    version: "v0.6.0",
    date: "2026-04-15",
    title: "Mina ansökningar, lösenordshantering och smarta annonser",
    items: [
      "Förare: ny sida 'Mina ansökningar' visar alla jobb du sökt med status (inväntar svar, utvald, ej aktuell).",
      "Du kan nu ändra lösenord direkt från din profil — utan att behöva logga ut.",
      "Lösenordstext kan nu visas/döljas med ögat på inloggning, registrering och lösenordsåterställning.",
      "Välkomstmail skickas nu automatiskt när du skapar ett nytt konto.",
      "Bekräftelsemail skickas till föraren direkt när en ansökan har skickats.",
      "Säkerhetsmail skickas när ditt lösenord ändras — om du inte kände igen ändringen kan du agera direkt.",
      "Jobbannonser arkiveras nu automatiskt efter 60 dagar. Företag får ett tips-mail efter 30 dagar och en varning 5 dagar innan.",
      "Företag: förnya en annons med ett klick från 'Mina jobb' — annonsen får nytt publiceringsdatum och visas högre i söket.",
      "Sidor scrollar nu automatiskt till toppen vid navigering.",
    ],
  },
  {
    version: "v0.5.0",
    date: "2026-04-13",
    title: "Mobilanpassning, ny design och bättre upplevelse",
    items: [
      "Plattformen fungerar nu bättre på mobil — alla sidor är anpassade för telefon och surfplatta.",
      "Sidorna 'För förare' och 'För åkerier' har fått ny design med tydligare innehåll och bättre struktur.",
      "Onboarding-flödena för både förare och företag är nu tydligare med steg-för-steg-guide.",
      "Bekräftelser och felmeddelanden visas nu som tydliga notiser i nedre hörnet istället för dolda feltexter.",
      "Profilmeny och navigering är förenklat och tydligare på alla skärmstorlekar.",
      "Sidtitlar och sidinnehåll är uppdaterade med korrekt terminologi genomgående.",
    ],
  },
  {
    version: "v0.4.0",
    date: "2026-03-18",
    title: "Säkrare inloggning och enklare användning",
    items: [
      "Du loggas nu ut efter 15 minuter utan aktivitet för bättre säkerhet.",
      "Om du loggar ut i en flik loggas du nu ut i alla öppna flikar.",
      "Inloggning med Google och Microsoft fungerar stabilare.",
      "Företagsupplevelsen har förbättrats för enklare samarbete i team.",
    ],
  },
  {
    version: "v0.3.0",
    date: "2026-03-10",
    title: "Bättre samarbete för företag",
    items: [
      "Företag kan bjuda in fler personer i teamet.",
      "Onboarding för nya företagskonton blev tydligare.",
      "Vi har förbättrat grunden för organisationskonton.",
    ],
  },
];
