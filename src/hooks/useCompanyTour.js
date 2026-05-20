/**
 * useCompanyTour — product tour för nya åkerier.
 * Visas automatiskt första gången ett åkeri loggar in på /foretag.
 */
import { useEffect, useRef } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

const STORAGE_KEY = "stp_company_tour_done";

export function useCompanyTour({ isCompany, user, ready = true }) {
  const tourRef = useRef(null);

  useEffect(() => {
    if (!isCompany || !user || !ready) return;
    if (localStorage.getItem(STORAGE_KEY)) return;
    if (window.innerWidth < 768) return;

    const timer = setTimeout(() => {
      const driverObj = driver({
        animate: true,
        overlayOpacity: 0.7,
        showProgress: true,
        progressText: "{{current}} av {{total}}",
        nextBtnText: "Nästa →",
        prevBtnText: "← Tillbaka",
        doneBtnText: "Kom igång! 🚀",
        allowClose: true,
        popoverClass: "stp-tour-popover",
        onDestroyed: () => {
          localStorage.setItem(STORAGE_KEY, "1");
        },
        steps: [
          {
            popover: {
              title: "Välkommen till Sveriges Transportplattform! 👋",
              description:
                "Här hittar du kvalificerade CE- och C-förare direkt — utan rekryteringsavgifter eller mellanhänder. Den här guiden visar dig runt på 1 minut.",
              side: "over",
              align: "center",
            },
          },
          {
            element: "[data-tour='company-overview']",
            popover: {
              title: "Din översikt",
              description:
                "Här ser du statistik på dina annonser, förare som matchas mot dina tjänster och dina senaste meddelanden — allt på ett ställe.",
              side: "bottom",
              align: "start",
            },
          },
          {
            element: "[data-tour='company-post-job']",
            popover: {
              title: "Publicera ett jobb",
              description:
                "Klicka här för att lägga ut en ny tjänst. Det tar 2 minuter — välj körkortskrav, region och typ av anställning. Helt gratis.",
              side: "bottom",
              align: "end",
            },
          },
          {
            element: "[data-tour='company-jobs']",
            popover: {
              title: "Mina annonser",
              description:
                "Här hanterar du alla dina aktiva och avslutade jobbannonser. Du kan se hur många förare som visat intresse och skicka meddelanden direkt.",
              side: "bottom",
              align: "start",
            },
          },
          {
            element: "[data-tour='company-drivers']",
            popover: {
              title: "Hitta förare proaktivt",
              description:
                "Vänta inte på ansökningar — sök bland hundratals förare och filtrera på körkort, certifikat och region. Kontakta direkt de som passar.",
              side: "bottom",
              align: "start",
            },
          },
          {
            element: "[data-tour='notifications']",
            popover: {
              title: "Notiser & meddelanden",
              description:
                "Här ser du när förare ansöker eller svarar. Svara snabbt — de bästa förarna har ofta flera alternativ.",
              side: "bottom",
              align: "end",
            },
          },
          {
            element: "[data-tour='user-menu']",
            popover: {
              title: "Företagsprofil",
              description:
                "Fyll i er företagsprofil — logga, beskrivning och kontaktinfo. Förare ser er profil och väljer aktivt åkerier de vill jobba för.",
              side: "bottom",
              align: "end",
            },
          },
          {
            popover: {
              title: "Allt klart! 🎉",
              description:
                "Börja med att publicera ert första jobb — det tar 2 minuter och syns direkt för förare i er region. Välkommen till STP!",
              side: "over",
              align: "center",
            },
          },
        ],
      });

      tourRef.current = driverObj;
      driverObj.drive();
    }, 800);

    return () => clearTimeout(timer);
  }, [isCompany, user, ready]);

  return {
    restartTour: () => {
      localStorage.removeItem(STORAGE_KEY);
      tourRef.current?.drive();
    },
  };
}
