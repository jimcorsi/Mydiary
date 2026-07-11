# Mydiary — setup (10-15 minuti, gratis)

App di journaling che salva le voci come eventi su un calendario Google dedicato ("Mydiary (Journal App)"). Nessun server, nessun database: i dati vivono nel tuo account Google, quindi telefono e web sono automaticamente sincronizzati.

Due cose da fare una tantum: **(1)** creare le credenziali Google, **(2)** pubblicare i file su un URL fisso gratuito.

---

## 1. Crea il progetto Google Cloud e le credenziali OAuth

1. Vai su [console.cloud.google.com](https://console.cloud.google.com) con il tuo account `jimcorsi@gmail.com`.
2. In alto, crea un **nuovo progetto** (es. nome "Mydiary") e selezionalo.
3. Menu ☰ → **API e servizi** → **Libreria** → cerca **Google Calendar API** → **Abilita**.
4. Menu ☰ → **API e servizi** → **Schermata consenso OAuth**:
   - Tipo utente: **Esterno**.
   - Nome app: `Mydiary`, email di supporto e email sviluppatore: `jimcorsi@gmail.com`.
   - Salva e continua nelle schermate successive (scope e utenti di test puoi lasciarli vuoti).
   - Nella sezione **Utenti di test**, aggiungi `jimcorsi@gmail.com`.
   - Salva. L'app resta in stato "Testing": va benissimo per uso personale, nessuna verifica richiesta.
5. Menu ☰ → **API e servizi** → **Credenziali** → **Crea credenziali** → **ID client OAuth**.
   - Tipo applicazione: **Applicazione web**.
   - Nome: `Mydiary web`.
   - **Origini JavaScript autorizzate** → **+ Add URI** → solo dominio, senza percorso:
     `https://jimcorsi.github.io`
   - Crea, poi copia il **Client ID** generato (finisce in `.apps.googleusercontent.com`).

---

## 2. Pubblica i file (GitHub Pages)

Repo già creato: `github.com/jimcorsi/Mydiary`, file già caricati, GitHub Pages già attivo.

Sito live: **`https://jimcorsi.github.io/Mydiary/`**

Ogni commit su `main` fa ripartire automaticamente la build di GitHub Pages (circa 30-40 secondi) — nessun passaggio manuale extra dopo aver modificato un file.

---

## 3. Collega le due cose

1. Apri `config.js` su GitHub (icona matita ✏️) e sostituisci:
   ```js
   GOOGLE_CLIENT_ID: "INCOLLA_QUI_IL_TUO_CLIENT_ID.apps.googleusercontent.com",
   ```
   con il Client ID copiato al passo 1. Commit changes.
2. Verifica su Google Cloud Console → Credenziali → il tuo Client ID → che tra le **Origini JavaScript autorizzate** ci sia esattamente `https://jimcorsi.github.io` (solo dominio, niente percorso `/Mydiary`).

---

## 4. Usala

1. Apri `https://jimcorsi.github.io/Mydiary/` dal telefono → tocca "Accedi con Google" → accedi con `jimcorsi@gmail.com`.
2. **La prima volta Google mostrerà un avviso "App non verificata"**: è normale, è la tua app personale non ancora sottoposta a revisione Google (revisione necessaria solo per app pubbliche di terzi). Clicca **"Continue"** per procedere. Di norma compare una sola volta per dispositivo/browser.
3. Su iPhone: Safari → icona condividi → **Aggiungi a Home**.
   Su Android: Chrome → menu **⋮** → **Aggiungi a schermata Home** (o "Installa app" se Chrome la propone da sola).
4. Apri lo stesso URL da un browser desktop, accedi con lo stesso account: vedrai le stesse voci — sync automatico perché sono lo stesso calendario Google.

---

## Promemoria giornaliero (intelligente)

Tocca 🔔 in alto, attiva il toggle, scegli l'orario (default 23:00) e salva: l'app crea un evento ricorrente giornaliero sul calendario "Mydiary". Riceverai la notifica push direttamente dall'app Google Calendar sul telefono, come per qualsiasi altro evento.

**Non è un promemoria "muto":** ogni volta che salvi la voce del giorno corrente, l'app cancella automaticamente l'occorrenza di stasera di quel promemoria (resta invece attivo per i giorni successivi). Se entro l'orario scelto non hai ancora scritto nulla, il promemoria parte normalmente. Nessuna configurazione aggiuntiva richiesta: succede da solo ogni volta che salvi.

Se la notifica non arriva: apri l'app Google Calendar → Impostazioni → **Mydiary (Journal App)** → verifica che le notifiche siano attive per quel calendario (di norma lo sono già di default).

## Frase e immagine motivazionale

Ogni volta che apri una voce, vedi una frase originale e una piccola illustrazione a tema "serenità finanziaria" — sono le stesse per tutto il giorno (cambiano il giorno dopo), generate localmente nell'app: nessuna chiamata a servizi esterni, nessuna chiave API da configurare. Le frasi sono aforismi scritti per questa app, non citazioni reali attribuite a persone esistenti.

## Confronto con Day One Silver (l'ex "Premium")

| Funzione | Day One Silver | Questa app |
|---|---|---|
| Voci illimitate, sync multi-dispositivo | ✅ | ✅ (via Google Calendar) |
| Prompt/spunto giornaliero | ✅ | ✅ (frase motivazionale) |
| Promemoria | ✅ (SMS) | ✅ (notifica Google Calendar, "intelligente") |
| Foto/video/audio/PDF fino a 30 per voce | ✅ | ❌ non incluso |
| Crittografia end-to-end | ✅ | ❌ — vedi nota privacy sotto |
| Email/IFTTT/Zapier | ✅ | ❌ richiede un backend |
| Stampa libro, supporto prioritario | ✅ | ❌ non applicabile |

## Note pratiche

- **Le voci sono eventi "tutto il giorno"** sul calendario dedicato "Mydiary (Journal App)", che l'app crea da sola al primo accesso. Non tocca gli altri tuoi calendari.
- **Puoi vederle anche da Google Calendar normale**, spuntando quel calendario nella lista a sinistra — utile come backup/verifica extra.
- **Sessione**: l'accesso dura circa un'ora; scaduta, basta ritoccare "Accedi con Google" (un tap, niente da reinserire).
- **Un giorno = una voce**: se riapri un giorno già scritto, lo modifichi/sovrascrivi; per due pensieri lo stesso giorno, aggiungili nello stesso testo.
- **Privacy**: i dati non passano da nessun server intermedio, solo browser ↔ Google. Il Client ID non è un segreto (è pubblico per design nelle app client-side); l'accesso è comunque protetto dal login Google.
- **Niente crittografia end-to-end**: a differenza di Day One, i testi delle voci sono leggibili da Google come qualsiasi evento di Calendar (protetti solo dalla sicurezza del tuo account Gmail, non da una chiave che solo tu possiedi). Se scrivi contenuti molto sensibili, tienilo presente.
