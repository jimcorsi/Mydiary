# Diario — setup (10-15 minuti, gratis)

App di journaling che salva le voci come eventi su un calendario Google dedicato ("Diario (Journal App)"). Nessun server, nessun database: i dati vivono nel tuo account Google, quindi telefono e web sono automaticamente sincronizzati.

Due cose da fare una tantum: **(1)** creare le credenziali Google, **(2)** pubblicare i file su un URL fisso gratuito.

---

## 1. Crea il progetto Google Cloud e le credenziali OAuth

1. Vai su [console.cloud.google.com](https://console.cloud.google.com) con il tuo account `jimcorsi@gmail.com`.
2. In alto, crea un **nuovo progetto** (es. nome "Diario App") e selezionalo.
3. Menu ☰ → **API e servizi** → **Libreria** → cerca **Google Calendar API** → **Abilita**.
4. Menu ☰ → **API e servizi** → **Schermata consenso OAuth**:
   - Tipo utente: **Esterno**.
   - Nome app: `Diario`, email di supporto e email sviluppatore: `jimcorsi@gmail.com`.
   - Salva e continua nelle schermate successive (scope e utenti di test puoi lasciarli vuoti).
   - Nella sezione **Utenti di test**, aggiungi `jimcorsi@gmail.com`.
   - Salva. L'app resta in stato "Testing": va benissimo per uso personale, nessuna verifica richiesta.
5. Menu ☰ → **API e servizi** → **Credenziali** → **Crea credenziali** → **ID client OAuth**.
   - Tipo applicazione: **Applicazione web**.
   - Nome: `Diario web`.
   - **Origini JavaScript autorizzate**: qui devi mettere l'URL dove pubblicherai l'app (vedi passo 2 sotto). Se usi GitHub Pages sarà del tipo:
     `https://TUO-USERNAME.github.io`
   - Crea, poi copia il **Client ID** generato (finisce in `.apps.googleusercontent.com`).

⚠️ Se non sai ancora l'URL finale, pubblica prima l'app (passo 2), poi torna qui ad aggiungere l'origine — puoi modificarla in qualsiasi momento dalle Credenziali.

---

## 2. Pubblica i file (hosting statico gratuito)

Consigliato: **GitHub Pages** (URL stabile, gratis per sempre).

1. Crea un account su [github.com](https://github.com) se non ce l'hai.
2. Crea un nuovo repository pubblico, es. `diario-app`.
3. Carica dentro **tutti i file di questa cartella** (`index.html`, `style.css`, `app.js`, `config.js`, `manifest.json`, `sw.js`, `icon-192.png`, `icon-512.png`) — con "Add file → Upload files" dal browser, oppure via git.
4. Nel repository: **Settings → Pages → Source: Deploy from a branch → branch `main` / cartella `/ (root)`** → Save.
5. Dopo un minuto GitHub ti darà l'URL, tipo:
   `https://tuo-username.github.io/diario-app/`

Alternativa altrettanto gratuita senza bisogno di git: [app.netlify.com/drop](https://app.netlify.com/drop) — trascini la cartella `diario-app`, ottieni subito un URL pubblico (richiede login gratuito per mantenerlo stabile nel tempo).

---

## 3. Collega le due cose

1. Apri `config.js` (nel repository o nella cartella locale) e sostituisci:
   ```js
   GOOGLE_CLIENT_ID: "INCOLLA_QUI_IL_TUO_CLIENT_ID.apps.googleusercontent.com",
   ```
   con il Client ID copiato al passo 1. Salva/carica di nuovo il file.
2. Torna su Google Cloud Console → Credenziali → il tuo Client ID → verifica che tra le **Origini JavaScript autorizzate** ci sia esattamente l'URL di GitHub Pages, es. `https://tuo-username.github.io` (senza percorso finale, solo dominio+eventuale sottopercorso se GitHub lo richiede — se l'app non si autentica, prova ad aggiungere anche la versione con `/diario-app`).

---

## 4. Usala

1. Apri l'URL pubblicato dal telefono → tocca "Accedi con Google" → accedi con `jimcorsi@gmail.com`.
2. **La prima volta Google mostrerà un avviso "App non verificata"**: è normale, è la tua app personale non ancora sottoposta a revisione Google (revisione necessaria solo per app pubbliche di terzi). Clicca "Avanzate" → "Vai su Diario (non sicuro)" → concedi l'accesso al Calendar. Sicuro al 100% perché l'app è tua.
3. Su iPhone: Safari → icona condividi → **Aggiungi a Home** → diventa un'icona come un'app vera.
   Su Android: Chrome → menu ⋮ → **Aggiungi a schermata Home**.
4. Apri lo stesso URL da un browser desktop, accedi con lo stesso account: vedrai le stesse voci — sync automatico perché sono lo stesso calendario Google.

---

## Promemoria giornaliero

Tocca 🔔 in alto, attiva il toggle, scegli l'orario e salva: l'app crea un evento ricorrente giornaliero sul calendario "Diario". Riceverai la notifica push direttamente dall'app Google Calendar sul telefono, come per qualsiasi altro evento.

Se non arriva: apri l'app Google Calendar → Impostazioni → **Diario (Journal App)** → verifica che le notifiche siano attive per quel calendario (di norma lo sono già di default).

## Frase e immagine motivazionale

Ogni volta che apri una voce, vedi una frase originale e una piccola illustrazione a tema "serenità finanziaria" — sono le stesse per tutto il giorno (cambiano il giorno dopo), generate localmente nell'app: nessuna chiamata a servizi esterni, nessuna chiave API da configurare. Le frasi sono aforismi scritti per questa app, non citazioni reali attribuite a persone esistenti.

## Confronto con Day One Silver (l'ex "Premium")

| Funzione | Day One Silver | Questa app |
|---|---|---|
| Voci illimitate, sync multi-dispositivo | ✅ | ✅ (via Google Calendar) |
| Prompt/spunto giornaliero | ✅ | ✅ (frase motivazionale) |
| Promemoria | ✅ (SMS) | ✅ (notifica Google Calendar) |
| Foto/video/audio/PDF fino a 30 per voce | ✅ | ❌ non incluso |
| Crittografia end-to-end | ✅ | ❌ — vedi nota privacy sotto |
| Email/IFTTT/Zapier | ✅ | ❌ richiede un backend |
| Stampa libro, supporto prioritario | ✅ | ❌ non applicabile |

## Note pratiche

- **Le voci sono eventi "tutto il giorno"** sul calendario dedicato "Diario (Journal App)", che l'app crea da sola al primo accesso. Non tocca gli altri tuoi calendari.
- **Puoi vederle anche da Google Calendar normale**, spuntando quel calendario nella lista a sinistra — utile come backup/verifica extra.
- **Sessione**: l'accesso dura circa un'ora; scaduta, basta ritoccare "Accedi con Google" (un tap, niente da reinserire).
- **Un giorno = una voce**: se riapri un giorno già scritto, lo modifichi/sovrascrivi; per due pensieri lo stesso giorno, aggiungili nello stesso testo.
- **Privacy**: i dati non passano da nessun server intermedio, solo browser ↔ Google. Il Client ID non è un segreto (è pubblico per design nelle app client-side); l'accesso è comunque protetto dal login Google.
- **Niente crittografia end-to-end**: a differenza di Day One, i testi delle voci sono leggibili da Google come qualsiasi evento di Calendar (protetti solo dalla sicurezza del tuo account Gmail, non da una chiave che solo tu possiedi). Se scrivi contenuti molto sensibili, tienilo presente.
