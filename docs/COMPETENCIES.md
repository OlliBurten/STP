# Behörigheter, certifikat och kompetenser (STP)

Referensdokument för datamodell och framtida filter. **MVP-faser** används i plattformen först; resten kan byggas ut successivt.

---

## 🚛 Körkort & grundbehörigheter

| Värde / typ | Beskrivning | MVP |
|-------------|-------------|-----|
| B | Personbil | ✅ |
| C | Lastbil (ej släp) | ✅ |
| CE | Lastbil med släp | ✅ |
| YKB | Yrkesförarkompetens (giltig / utgångsdatum) | ✅ |
| Digitalt färdskrivarkort | | ✅ (som certifikat) |
| Förarkort | | ✅ (som certifikat) |

---

## ⚠️ ADR (Farligt gods)

**Grund**
- ADR 1.3 (grundläggande utbildning)
- ADR Grund
- ADR Tank
- ADR Klass 1 (explosivt)
- ADR Klass 7 (radioaktivt)

**Datamodell (framtid):** Vilka moduler + giltighetstid.

| MVP | Beskrivning |
|-----|-------------|
| ✅ | ADR Grund |
| ✅ | ADR Tank |
| (senare) | Moduler + giltighet |

---

## 🏗 APV (Arbete på väg)

Många entreprenadjobb kräver detta.

| Värde | MVP |
|-------|-----|
| APV 1.1 | ✅ |
| APV 1.2 | ✅ |
| APV 2.1 | ✅ |
| APV 2.2 | ✅ |
| APV 3 | ✅ |

---

## 🚜 Maskin & fordonsrelaterade certifikat

| Typ | MVP |
|-----|-----|
| Truckkort (A/B/C/D) | ✅ (Truck A, B, C, D) |
| Hjullastare | (övr.) |
| Grävmaskin | (övr.) |
| Kranförarbevis | ✅ |
| Fordonsmonterad kran | ✅ |
| Travers | (övr.) |
| Liftkort | (övr.) |
| Bakgavellyft-utbildning | (övr.) |
| Lastsäkring | ✅ (övr.) |
| Säkra lyft | (övr.) |

---

## 🧯 Säkerhet & miljö

| Typ | MVP |
|-----|-----|
| Heta arbeten | ✅ (övr.) |
| ID06 | ✅ (övr.) |
| Fallskydd | (övr.) |
| Brandskydd | (övr.) |
| Miljöutbildning | (övr.) |
| BAS-U / BAS-P | (övr.) |
| SSG | (övr.) |
| Safe Construction | (övr.) |
| Säkerhet på terminal | (övr.) |

---

## 🚛 Specialkompetenser

| Typ | MVP |
|-----|-----|
| Tankrengöring | (övr.) |
| Livsmedelshantering | ✅ (övr.) |
| Djurskydd (djurtransport) | (övr.) |
| Tungbärgning | (övr.) |
| Specialtransport (dispens) | (övr.) |
| Eskort | (övr.) |

---

## 🧠 Administrativ & praktisk erfarenhet

(Ofta underskattat men viktigt – kan tas som fritext / profil senare.)

- Färdskrivare vana
- Digitala transportsystem (TransPA, Hogia, m.fl.)
- Ruttoptimeringssystem
- Egenföretagare / F-skatt
- Svenska / engelska
- Referenser

---

## ⏱ Arbetsprofil

| Dimension | MVP |
|-----------|-----|
| Fjärr / distribution | (jobType + segment) |
| Dag / natt | ✅ (schema) |
| Skift | ✅ (schema) |
| Veckopendling | ✅ (schema) |
| Fysisk tungt arbete ok / ej | ✅ (boolean) |
| Ensamarbete ok / ej | ✅ (boolean) |

---

## 🏆 Erfarenhetsnivå

| Intervall | MVP |
|-----------|-----|
| 0–1 år | ✅ |
| 1–3 år | ✅ |
| 3–5 år | ✅ |
| 5+ år | ✅ |
| Specialiserad (t.ex. 4 år tankbil) | (fritext i beskrivning) |

---

## MVP i plattformen (fas 1)

- **Körkort:** B, C, CE  
- **Certifikat:** YKB, ADR Grund, ADR Tank, APV (1.1–3), Truck (A/B/C/D), Kran, övriga (kort lista)  
- **Region** (befintlig)  
- **Erfarenhet:** 0–1, 1–3, 3–5, 5+  
- **Segment / bransch** (transportsegment, befintlig)  
- **Schema:** dag, kväll, natt, blandat, flex, skift, veckopendling  
- **Arbetsprofil (valfritt):** fysiskt tungt ok, ensamarbete ok  

Resten kan vara "Övriga certifikat" (kryssrutor eller fritext) och byggas ut senare.
