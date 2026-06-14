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
      // Element-steg pekar på faktiska data-tour-ankare i AppTopNav.
      // Intro/outro saknar element och är medvetet centrerade.
      const allSteps = [
        {
          popover: {
            title: "Välkommen till Sveriges Transportplattform! 👋",
            description:
              "Plattformen där du hittar jobb som CE- eller C-förare och blir kontaktad direkt av åkerier — utan bemanning. En snabb rundtur på under en minut.",
            side: "over",
            align: "center",
          },
        },
        {
          element: "[data-tour='jobs-link']",
          popover: {
            title: "1. Hitta lediga jobb",
            description:
              "Här finns alla aktiva tjänster i hela Sverige — filtrerat på din region och ditt körkort. Klicka på ett jobb för att läsa mer och ansöka direkt.",
            side: "bottom",
            align: "start",
          },
        },
        {
          element: "[data-tour='favoriter-link']",
          popover: {
            title: "2. Spara intressanta jobb",
            description:
              "Hittar du ett jobb du vill återkomma till? Spara det som favorit så hittar du tillbaka enkelt.",
            side: "bottom",
            align: "start",
          },
        },
        {
          element: "[data-tour='user-menu']",
          popover: {
            title: "3. Fyll i din profil — viktigast av allt",
            description:
              "Här fyller du i körkort, certifikat, region och presentation. Ju mer komplett din profil är, desto fler åkerier hittar dig och desto bättre matchningar får du.",
            side: "bottom",
            align: "end",
          },
        },
        {
          element: "[data-tour='messages-link']",
          popover: {
            title: "4. Bli kontaktad",
            description:
              "När ett åkeri vill prata med dig hamnar konversationen här. Svara snabbt — åkerier går ofta vidare fort.",
            side: "bottom",
            align: "start",
          },
        },
        {
          element: "[data-tour='notifications']",
          popover: {
            title: "5. Missa inget",
            description:
              "Notiser om nya matchningar och meddelanden dyker upp här. Håll koll så du inte missar ett jobb.",
            side: "bottom",
            align: "end",
          },
        },
        {
          popover: {
            title: "Du är redo! 🎉",
            description:
              "Nästa steg: komplettera din profil — det tar några minuter och gör att åkerier kan hitta dig direkt. Lycka till!",
            side: "over",
            align: "center",
          },
        },
      ];

      // Filtrera bort element-steg vars ankare inte finns i DOM så vi aldrig
      // visar en centrerad spöksruta utan spotlight. Intro/outro behålls alltid.
      const steps = allSteps.filter(
        (s) => !s.element || document.querySelector(s.element)
      );

      const hasElementStep = steps.some((s) => s.element);
      if (!hasElementStep) return;

      const driverObj = driver({
        animate: false,
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
        steps,
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
