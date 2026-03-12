# Feedback kring plattformen

Olika sätt att samla in feedback från förare och åkerier.

---

## 1. In-app formulär (rekommenderat för er kontroll)

**Fördelar:** Allt finns i er app, ingen extern tjänst, ni bestämmer formatet.

- Lägg en **“Ge feedback”**-länk i sidfoten (eller under Min profil).
- Formulär: fritext + valfritt e-post (om användaren inte är inloggad).
- Backend: `POST /api/feedback` som skickar mailet till `ADMIN_EMAILS` (eller en egen `FEEDBACK_EMAIL`). Alternativt spara i en `Feedback`-tabell i databasen för att kunna söka och prioritera senare.

**Implementerat:** `POST /api/feedback` med body `{ "message": "text (max 5000 tecken)", "email": "valfritt" }`. Skickar e-post till alla i `ADMIN_EMAILS`. Koppla en sida eller modal i frontend (t.ex. “Ge feedback” i sidfoten) som anropar den.

---

## 2. Extern tjänst (Typeform, Google Form m.m.)

**Fördelar:** Ingen kod, färdiga formulär och statistik.

- Skapa ett formulär i [Typeform](https://typeform.com), [Google Forms](https://forms.google.com) eller liknande.
- Lägg länken i sidfoten: “Ge oss feedback” → öppnar formuläret i ny flik.

**Nackdel:** Svaren hamnar utanför er app; ni måste logga in på tjänsten för att se dem.

---

## 3. E-postlänk (enklast)

- Länk i sidfoten: “Feedback: maila till feedback@transportplattformen.se” (eller er supportadress). Öppnar användarens e-postklient med förifylld adress och eventuellt ämne.

---

## Snabbreferens

| Metod              | Er insats                         | Var svaren hamnar        |
|--------------------|-----------------------------------|--------------------------|
| In-app + `/api/feedback` | Frontend-formulär + befintlig API | E-post till admin / DB   |
| Typeform/Google Form    | Länk i sidfot                     | Tjänstens webbgränssnitt |
| E-postlänk              | Länk i sidfot                     | Er inkorg                |

Om ni vill ha allt på ett ställe och kunna koppla feedback till användare/roller senare: använd in-app formulär mot `POST /api/feedback` och spara eventuellt i databasen utöver e-post till admin.
