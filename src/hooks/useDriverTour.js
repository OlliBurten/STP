/**
 * useDriverTour — product tour för nya förare.
 * Visas automatiskt första gången en förare loggar in.
 * Sparas i localStorage så den inte visas igen.
 */
import { useEffect, useRef } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

const STORAGE_KEY = "stp_driver_tour_done";

export function useDriverTour({ isDriver, user, profileLoaded }) {
  const tourRef = useRef(null);

  useEffect(() => {
    if (!isDriver || !user || !profileLoaded) return;
    if (localStorage.getItem(STORAGE_KEY)) return;
    if (window.innerWidth < 768) return;

    // Vänta lite så att sidan hinner rendera klart
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
        overlayColor: "#000",
        popoverClass: "stp-tour-popover",
        onDestroyed: () => {
          localStorage.setItem(STORAGE_KEY, "1");
        },
        steps: [
          {
            popover: {
              title: "Välkommen till Sveriges Transportplattform! 👋",
              description:
                "Vi hjälper dig hitta rätt tjänst som CE- eller C-förare. Den här guiden visar dig runt på 1 minut.",
              side: "over",
              align: "center",
            },
          },
          {
            element: "[data-tour='jobs-link']",
            popover: {
              title: "Lediga jobb",
              description:
                "Här hittar du alla aktiva tjänster. Klicka för att bläddra bland jobb i hela Sverige — filtererat på din region och ditt körkort.",
              side: "bottom",
              align: "start",
            },
          },
          {
            element: "[data-tour='job-filters']",
            popover: {
              title: "Filtrera jobb",
              description:
                "Välj region, körkort (CE/C), anställningstyp och mer. Plattformen visar automatiskt jobb som matchar din profil högst upp.",
              side: "bottom",
              align: "start",
            },
          },
          {
            element: "[data-tour='user-menu']",
            popover: {
              title: "Din profil — viktigast av allt",
              description:
                "Fyll i din profil så att åkerier kan hitta dig. Ju mer info du lägger in — körkort, certifikat, region — desto fler matcher får du.",
              side: "bottom",
              align: "end",
            },
          },
          {
            element: "[data-tour='notifications']",
            popover: {
              title: "Notiser & meddelanden",
              description:
                "När ett åkeri kontaktar dig dyker det upp här. Håll koll — åkerier går ofta vidare snabbt.",
              side: "bottom",
              align: "end",
            },
          },
          {
            popover: {
              title: "Du är redo! 🎉",
              description:
                "Börja med att komplettera din profil — det tar 3 minuter och gör att åkerier kan hitta dig direkt. Lycka till!",
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
  }, [isDriver, user, profileLoaded]);

  return {
    restartTour: () => {
      localStorage.removeItem(STORAGE_KEY);
      tourRef.current?.drive();
    },
  };
}
