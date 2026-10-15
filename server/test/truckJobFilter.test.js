import { test } from "node:test";
import assert from "node:assert/strict";
import { isTruckDriverTitle } from "../lib/jobIngestor.js";

// Riktiga titlar från AF i prod 2026-10-15.
const KEEP = [
  "Lastbilschaufför", "CE-chaufför fjärrkörning", "Distributionsförare C", "Truck Driver", "Spannmålsbil",
  "Kranbilsförare", "Renhållningsförare med C-kort till SSAM i Växjö!", "Slambilsförare till Markaryd!",
  "Liftdumper och lastväxlarförare – Rosersberg", "Lastbilschaufför, maskinförare", "CE förare sökes",
  "Har du C/CE-körkort och erfarenhet? Vi söker dig!", "Fjärrtransport", "Betongbilsförare sökes i Jönköping– Heltid",
  "C-Chaufför Baklastare södra Stockholm", "Kombinerad tjänst Utlastare/chaufför", "C-chaufför med YKB / mark och anläggningsarbetare",
];
const DROP = [
  "Miljöarbetare Rosersberg", "Miljöarbetare med CE-kort", "Biträdande platschef i Jönköping", "Vikarierande Brandman",
  "Flyttkarl", "Sophämtare", "Fordonsvårdare", "Spolbilsoperatör", "Bilbärgare", "Truckförare", "Bussförare",
  "Taxiförare", "Budbilsförare", "Skåpbilschaufför Malmö, Tillsvidareanställning", "Rangerare med CE-kort på Dagab",
  "Leverera julgranar i Göteborg", "Kärltvättare med C- körkort till Kinab", "Transportledare sökes till Norrköping",
];

test("bara lastbilsjobb (C/CE) släpps in från AF", () => {
  for (const t of KEEP) assert.equal(isTruckDriverTitle(t), true, `ska in: ${t}`);
  for (const t of DROP) assert.equal(isTruckDriverTitle(t), false, `ska bort: ${t}`);
});
