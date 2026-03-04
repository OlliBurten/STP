# Projektet – enkel översikt

Kort förklaring av hur allt hänger ihop så du känner att du har koll.

---

## Vad är det här?

**En webbplats** där förare och åkerier matchas (jobb, profiler, inloggning). Den består av **två delar** som pratar med varandra:

1. **Frontend** = det användaren ser i webbläsaren (sidor, formulär, logga).
2. **Backend** = servern som har databasen, loggar in användare, sparar jobb m.m.

Frontend **anropar** backend (API). De måste peka på varandra: frontend måste veta backendens adress, backend måste tillåta frontendens adress (CORS).

---

## Var ligger vad?

| Del       | Var det körs  | Vad du gör där                          |
|-----------|----------------|-----------------------------------------|
| **Kod**   | GitHub (repo)  | All kod. Du pushar hit från din dator.  |
| **Frontend** | Vercel     | Byggs och visas som webbplats. Deploy sker när du pushar till den branch Vercel lyssnar på (ofta `main`). |
| **Backend**  | Railway    | Kör API + databas. Deploy när du pushar (eller Railway bygger från samma repo). |
| **Databas**  | Railway    | Postgres. Hänger ihop med **en** backend (prod har egen, demo har egen). |

Så: **GitHub** = källan. **Vercel** = hemsidan. **Railway** = servern + databasen.

---

## Live vs demo (två “kopior” av sajten)

Ni har **två miljöer** så att ni kan testa utan att förstöra det riktiga:

|           | **Live (prod)**              | **Demo**                          |
|-----------|------------------------------|-----------------------------------|
| **Syfte** | Riktiga användare, riktig data | Test och presentation             |
| **Webb**  | t.ex. transportplattformen.se | t.ex. transportplattform-demo.vercel.app |
| **Backend** | Eget Railway-projekt        | Eget Railway-projekt              |
| **Databas** | Egen Postgres (bara live)  | Egen Postgres (bara demo)         |

**Viktigt:** Live och demo ska **aldrig** dela samma databas. Då blir det rörigt och du tappar kontrollen. Varje miljö = egen backend + egen databas.

---

## Vad du styr (din “kontroll”)

1. **Vilken kod som körs**  
   Du pushar till GitHub. Den branch som **Vercel** är kopplad till (ofta `main`) blir det som byggs till hemsidan. Så: **samma repo, olika branches** = olika versioner. Mergar du till `main` får live/demo den koden (beroende på vilket Vercel-projekt som bygger från `main`).

2. **Vilken hemsida som är “live” respektive “demo”**  
   I Vercel har du ett (eller två) projekt. Ett projekt kan vara kopplat till **transportplattformen.se** (live), ett annat till **transportplattform-demo.vercel.app** (demo). Båda kan bygga från samma repo men olika branch om du vill (t.ex. live från `main`, demo från `main` eller från en egen branch).

3. **Vilken backend hemsidan anropar**  
   I **Vercel** sätter du miljövariabeln **`VITE_API_URL`** till backend-URL (prod-backend för live, demo-backend för demo). Det värdet “bakas in” vid **build**. Så: bygger du om efter att du ändrat `VITE_API_URL` använder hemsidan den nya adressen.

4. **Vilka som får logga in som admin**  
   I **Railway** (på respektive backend) sätter du **`ADMIN_EMAILS`** = dina e-postadresser, komma-separerade. Det är **bara** det som styr admin-rättigheter.

5. **E-post (verifiering, glömt lösenord)**  
   I **Railway** sätter du **`RESEND_API_KEY`** och **`EMAIL_FROM`** på den backend som hemsidan använder. Då skickas mail. Utan det skickas inga mail.

---

## Enkel flödesbild (på ren svenska)

```
[ Du skriver kod lokalt ]
         |
         v
[ git push till GitHub ]
         |
         +---> [ Vercel bygger frontend ]  -->  hemsidan (live eller demo)
         |
         +---> [ Railway bygger backend ] -->  API + databas (live eller demo)
```

**Så du får “kontroll” igen:**  
- **Kod:** GitHub + din branch.  
- **Live-sajt:** Vercel-projekt som pekar på prod-backend (`VITE_API_URL`), prod-backend på Railway med egen databas.  
- **Demo-sajt:** Vercel-projekt som pekar på demo-backend, demo-backend på Railway med egen databas.  
- **Vem som är admin:** `ADMIN_EMAILS` på Railway.  
- **Om mail fungerar:** `RESEND_API_KEY` (+ `EMAIL_FROM`) på Railway.

När något strular, kolla: (1) rätt branch pushat? (2) rätt `VITE_API_URL` i Vercel för den sajt du tittar på? (3) `FRONTEND_URL` på Railway inkluderar den sajt-URL du använder? (4) för inloggning: `ADMIN_EMAILS` och eventuellt e-postverifiering (Resend).

---

## Snabblänkar (om du har så här)

- **Live-webb:** https://transportplattformen.se  
- **Demo-webb:** https://transportplattform-demo.vercel.app  
- **Repo:** GitHub – OlliBurten/STP (eller ert repo)  
- **Backend health (kolla att API svarar):** `https://<din-backend-url>/api/health`  
- **Mer detaljer:** docs/INFRASTRUKTUR.md, docs/RUNBOOK-INLOGGNING.md  
- **Hur du och AI jobbar (branch, push, demo först):** docs/ARBETSGANG-MED-AI.md  

Den här filen är menad att vara den du öppnar först när du ska orientera dig. Resten av docs-mappen är “när något specifikt strular”.
