/**
 * Stegdata för produktrundturen (ProductTour).
 *
 * Varje steg: { element?: string (CSS-selektor), title, description }.
 * Steg utan `element` = centrerat intro/outro-steg.
 *
 * Copy och `data-tour`-selektorer är flyttade ordagrant från de tidigare
 * hookarna useCompanyTour/useDriverTour (driver.js). Ankare finns i
 * AppTopNav.jsx samt ForCompanies.jsx / JobList.jsx.
 */

export const COMPANY_TOUR_STEPS = [
  {
    title: "Välkommen till Sveriges Transportplattform! 👋",
    description:
      "Här hittar du kvalificerade CE- och C-förare direkt — utan rekryteringsavgifter eller mellanhänder. Den här guiden visar dig runt på 1 minut.",
  },
  {
    element: "[data-tour='company-overview']",
    title: "Din översikt",
    description:
      "Här ser du statistik på dina annonser, nya ansökningar och obesvarade meddelanden — allt på ett ställe.",
  },
  {
    element: "[data-tour='company-post-job']",
    title: "Publicera ett jobb",
    description:
      "Klicka här för att lägga ut en ny tjänst. Det tar 2 minuter — välj körkortskrav, region och typ av anställning. Helt gratis.",
  },
  {
    element: "[data-tour='company-drivers']",
    title: "Hitta förare proaktivt",
    description:
      "Vänta inte på ansökningar — sök bland hundratals förare och filtrera på körkort, certifikat och region. Kontakta direkt de som passar.",
  },
  {
    element: "[data-tour='company-jobs']",
    title: "Mina annonser",
    description:
      "Här hanterar du alla dina aktiva och avslutade jobbannonser. Du kan se hur många förare som visat intresse och skicka meddelanden direkt.",
  },
  {
    element: "[data-tour='notifications']",
    title: "Notiser & meddelanden",
    description:
      "Här ser du när förare ansöker eller svarar. Svara snabbt — de bästa förarna har ofta flera alternativ.",
  },
  {
    element: "[data-tour='user-menu']",
    title: "Företagsprofil",
    description:
      "Fyll i er företagsprofil — logga, beskrivning och kontaktinfo. Förare ser er profil och väljer aktivt åkerier de vill jobba för.",
  },
  {
    title: "Allt klart! 🎉",
    description:
      "Börja med att publicera ert första jobb — det tar 2 minuter och syns direkt för förare i er region. Välkommen till STP!",
  },
];

export const DRIVER_TOUR_STEPS = [
  {
    title: "Välkommen till Sveriges Transportplattform! 👋",
    description:
      "Plattformen där du hittar jobb som CE- eller C-förare och blir kontaktad direkt av åkerier — utan bemanning. En snabb rundtur på under en minut.",
  },
  {
    element: "[data-tour='jobs-link']",
    title: "1. Hitta lediga jobb",
    description:
      "Här finns alla aktiva tjänster i hela Sverige — filtrerat på din region och ditt körkort. Klicka på ett jobb för att läsa mer och ansöka direkt.",
  },
  {
    element: "[data-tour='favoriter-link']",
    title: "2. Spara intressanta jobb",
    description:
      "Hittar du ett jobb du vill återkomma till? Spara det som favorit så hittar du tillbaka enkelt.",
  },
  {
    element: "[data-tour='user-menu']",
    title: "3. Fyll i din profil — viktigast av allt",
    description:
      "Här fyller du i körkort, certifikat, region och presentation. Ju mer komplett din profil är, desto fler åkerier hittar dig och desto bättre matchningar får du.",
  },
  {
    element: "[data-tour='messages-link']",
    title: "4. Bli kontaktad",
    description:
      "När ett åkeri vill prata med dig hamnar konversationen här. Svara snabbt — åkerier går ofta vidare fort.",
  },
  {
    element: "[data-tour='notifications']",
    title: "5. Missa inget",
    description:
      "Notiser om nya matchningar och meddelanden dyker upp här. Håll koll så du inte missar ett jobb.",
  },
  {
    title: "Du är redo! 🎉",
    description:
      "Nästa steg: komplettera din profil — det tar några minuter och gör att åkerier kan hitta dig direkt. Lycka till!",
  },
];
