/* ==========================================================================
   Diario — app di journaling appoggiata su Google Calendar.
   Ogni voce = un evento "tutto il giorno" su un calendario dedicato
   ("Diario (Journal App)") creato nel tuo account Google al primo accesso.
   Nessun server: tutto gira nel browser, i dati vivono in Google Calendar.
   ========================================================================== */

const SCOPES = "https://www.googleapis.com/auth/calendar";
const API_BASE = "https://www.googleapis.com/calendar/v3";
const LS_CALENDAR_ID = "diario_calendar_id";
const LS_LAST_EMAIL = "diario_last_email";
const LS_REMINDER_EVENT_ID = "diario_reminder_event_id";
const LS_REMINDER_ENABLED = "diario_reminder_enabled";
const LS_REMINDER_TIME = "diario_reminder_time";

// ---------------------------------------------------------------------------
// Contenuti motivazionali — frasi originali (nessuna citazione attribuita a
// persone reali, per non rischiare attribuzioni false) a tema serenità
// finanziaria, + piccole illustrazioni SVG generate localmente (nessuna
// chiamata di rete, nessuna dipendenza da servizi esterni a pagamento).
// ---------------------------------------------------------------------------
const QUOTES = [
  "La serenità finanziaria non nasce da quanto guadagni, ma da quanto controllo hai su ciò che spendi.",
  "Ogni piccola scelta di oggi è un mattone della tua tranquillità di domani.",
  "Non stai inseguendo i soldi: stai costruendo la libertà di scegliere.",
  "La pazienza è l'interesse composto delle buone abitudini.",
  "Un passo alla volta, un risparmio alla volta: la calma finanziaria si allena, non si improvvisa.",
  "Il tuo obiettivo non è avere di più, ma preoccuparti di meno.",
  "Ogni giorno che resisti a una spesa impulsiva, rinforzi la persona che vuoi diventare.",
  "La vera ricchezza è dormire tranquilli sapendo di aver scelto con lucidità.",
  "Piccoli progressi costanti battono i grandi sforzi sporadici.",
  "Respira: il percorso verso la serenità finanziaria è una maratona, non uno scatto.",
];

const ILLUSTRATIONS = [
  // Pianta che cresce da una moneta
  `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="82" r="14" fill="#d9a441"/>
    <text x="50" y="87" font-size="14" text-anchor="middle" fill="#8f4e22" font-family="serif">€</text>
    <path d="M50 68 C50 55 50 50 50 40" stroke="#7a9b76" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M50 55 C40 50 34 40 38 30 C48 34 50 45 50 55 Z" fill="#7a9b76"/>
    <path d="M50 48 C60 43 66 33 62 23 C52 27 50 38 50 48 Z" fill="#8fb589"/>
  </svg>`,
  // Alba serena sull'orizzonte
  `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <rect x="0" y="60" width="100" height="40" fill="#fdf6ec"/>
    <circle cx="50" cy="60" r="20" fill="#e3a458"/>
    <line x1="0" y1="60" x2="100" y2="60" stroke="#b5652f" stroke-width="2"/>
    <path d="M20 75 q10 -8 20 0" stroke="#b5652f" stroke-width="2" fill="none" stroke-linecap="round"/>
    <path d="M60 82 q10 -8 20 0" stroke="#b5652f" stroke-width="2" fill="none" stroke-linecap="round"/>
  </svg>`,
  // Crescita costante, gradini verso una bandierina
  `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <rect x="10" y="75" width="14" height="15" fill="#c9926a"/>
    <rect x="28" y="62" width="14" height="28" fill="#c9926a"/>
    <rect x="46" y="49" width="14" height="41" fill="#c9926a"/>
    <rect x="64" y="36" width="14" height="54" fill="#b5652f"/>
    <line x1="71" y1="36" x2="71" y2="18" stroke="#8f4e22" stroke-width="2"/>
    <path d="M71 18 L86 24 L71 28 Z" fill="#7a9b76"/>
  </svg>`,
  // Albero con foglie-moneta e radici salde
  `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <line x1="50" y1="55" x2="50" y2="85" stroke="#8f4e22" stroke-width="4" stroke-linecap="round"/>
    <path d="M50 85 L40 95 M50 85 L60 95" stroke="#8f4e22" stroke-width="3" stroke-linecap="round" fill="none"/>
    <circle cx="50" cy="40" r="22" fill="#8fb589"/>
    <circle cx="38" cy="45" r="6" fill="#d9a441"/>
    <circle cx="58" cy="35" r="6" fill="#d9a441"/>
    <circle cx="50" cy="55" r="6" fill="#d9a441"/>
  </svg>`,
];

function dayOfYear(dateStr) {
  const d = strToDate(dateStr);
  const start = new Date(d.getFullYear(), 0, 0);
  return Math.floor((d - start) / 86400000);
}

const WEEKDAY_LABELS = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];
const MONTH_LABELS = [
  "Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno",
  "Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"
];

// ---------------------------------------------------------------------------
// Stato applicazione
// ---------------------------------------------------------------------------
const state = {
  tokenClient: null,
  accessToken: null,
  tokenExpiresAt: 0,
  calendarId: null,
  viewYear: new Date().getFullYear(),
  viewMonth: new Date().getMonth(), // 0-based
  entriesByDate: {},   // "YYYY-MM-DD" -> {id, summary, description}
  activeDate: null,    // data attualmente aperta nel pannello voce
  allEntriesCache: null, // per la vista Voci/timeline
};

// ---------------------------------------------------------------------------
// Riferimenti DOM
// ---------------------------------------------------------------------------
const el = (id) => document.getElementById(id);
const dom = {
  loginScreen: el("loginScreen"),
  mainScreen: el("mainScreen"),
  loginBtn: el("loginBtn"),
  loginStatus: el("loginStatus"),
  logoutBtn: el("logoutBtn"),

  tabCalendarBtn: el("tabCalendarBtn"),
  tabTimelineBtn: el("tabTimelineBtn"),
  calendarView: el("calendarView"),
  timelineView: el("timelineView"),

  prevMonthBtn: el("prevMonthBtn"),
  nextMonthBtn: el("nextMonthBtn"),
  monthLabel: el("monthLabel"),
  weekdaysEl: el("weekdays"),
  calendarGrid: el("calendarGrid"),
  calendarLoading: el("calendarLoading"),

  searchInput: el("searchInput"),
  timelineList: el("timelineList"),
  timelineEmpty: el("timelineEmpty"),
  timelineLoading: el("timelineLoading"),

  entryOverlay: el("entryOverlay"),
  entryDateLabel: el("entryDateLabel"),
  entryText: el("entryText"),
  entryCharCount: el("entryCharCount"),
  saveEntryBtn: el("saveEntryBtn"),
  deleteEntryBtn: el("deleteEntryBtn"),
  closeEntryBtn: el("closeEntryBtn"),
  entryStatus: el("entryStatus"),
  motivationImage: el("motivationImage"),
  motivationQuote: el("motivationQuote"),

  reminderBtn: el("reminderBtn"),
  reminderOverlay: el("reminderOverlay"),
  closeReminderBtn: el("closeReminderBtn"),
  reminderEnabledInput: el("reminderEnabledInput"),
  reminderTimeInput: el("reminderTimeInput"),
  saveReminderBtn: el("saveReminderBtn"),
  reminderStatus: el("reminderStatus"),

  toast: el("toast"),
};

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------
function pad2(n) { return String(n).padStart(2, "0"); }

function dateToStr(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function strToDate(s) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatLongDate(dateStr) {
  const d = strToDate(dateStr);
  const days = ["Domenica","Lunedì","Martedì","Mercoledì","Giovedì","Venerdì","Sabato"];
  return `${days[d.getDay()]} ${d.getDate()} ${MONTH_LABELS[d.getMonth()]} ${d.getFullYear()}`;
}

function showToast(msg, isError) {
  dom.toast.textContent = msg;
  dom.toast.classList.toggle("error", !!isError);
  dom.toast.classList.remove("hidden");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => dom.toast.classList.add("hidden"), 2600);
}

// ---------------------------------------------------------------------------
// Autenticazione (Google Identity Services)
// ---------------------------------------------------------------------------
function initAuth() {
  if (!window.google || !google.accounts || !google.accounts.oauth2) {
    dom.loginStatus.textContent = "Impossibile caricare Google Identity Services. Controlla la connessione.";
    return;
  }
  if (!CONFIG.GOOGLE_CLIENT_ID || CONFIG.GOOGLE_CLIENT_ID.startsWith("INCOLLA_QUI")) {
    dom.loginStatus.textContent = "⚠️ Devi impostare GOOGLE_CLIENT_ID in config.js (vedi README).";
    dom.loginBtn.disabled = true;
    return;
  }

  state.tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CONFIG.GOOGLE_CLIENT_ID,
    scope: SCOPES,
    callback: (resp) => {
      if (resp.error) {
        dom.loginStatus.textContent = "Accesso non riuscito: " + resp.error;
        return;
      }
      state.accessToken = resp.access_token;
      state.tokenExpiresAt = Date.now() + (Number(resp.expires_in) || 3500) * 1000;
      onSignedIn();
    },
  });

  dom.loginBtn.addEventListener("click", () => {
    dom.loginStatus.textContent = "Apro la finestra di accesso Google…";
    state.tokenClient.requestAccessToken({ prompt: "" });
  });
}

function ensureValidToken() {
  return new Promise((resolve, reject) => {
    if (state.accessToken && Date.now() < state.tokenExpiresAt - 30000) {
      resolve(state.accessToken);
      return;
    }
    if (!state.tokenClient) { reject(new Error("no-token-client")); return; }
    const prevCallback = state.tokenClient.callback;
    state.tokenClient.callback = (resp) => {
      state.tokenClient.callback = prevCallback;
      if (resp.error) { reject(new Error(resp.error)); return; }
      state.accessToken = resp.access_token;
      state.tokenExpiresAt = Date.now() + (Number(resp.expires_in) || 3500) * 1000;
      resolve(state.accessToken);
    };
    // prompt vuoto = tenta rinnovo silenzioso se la sessione Google è ancora attiva
    state.tokenClient.requestAccessToken({ prompt: "" });
  });
}

function logout() {
  if (state.accessToken) {
    google.accounts.oauth2.revoke(state.accessToken, () => {});
  }
  state.accessToken = null;
  state.tokenExpiresAt = 0;
  dom.mainScreen.classList.add("hidden");
  dom.loginScreen.classList.remove("hidden");
  dom.loginStatus.textContent = "";
}

// ---------------------------------------------------------------------------
// Chiamate API Google Calendar
// ---------------------------------------------------------------------------
async function apiFetch(path, options = {}) {
  const token = await ensureValidToken();
  const res = await fetch(API_BASE + path, {
    ...options,
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${body.slice(0, 200)}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

async function ensureCalendar() {
  const cached = localStorage.getItem(LS_CALENDAR_ID);
  if (cached) {
    state.calendarId = cached;
    return cached;
  }
  // Cerca fra i calendari esistenti
  let pageToken = undefined;
  do {
    const data = await apiFetch(
      "/users/me/calendarList" + (pageToken ? `?pageToken=${pageToken}` : "")
    );
    const found = (data.items || []).find((c) => c.summary === CONFIG.CALENDAR_NAME);
    if (found) {
      state.calendarId = found.id;
      localStorage.setItem(LS_CALENDAR_ID, found.id);
      return found.id;
    }
    pageToken = data.nextPageToken;
  } while (pageToken);

  // Non esiste: crealo
  const created = await apiFetch("/calendars", {
    method: "POST",
    body: JSON.stringify({ summary: CONFIG.CALENDAR_NAME, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }),
  });
  state.calendarId = created.id;
  localStorage.setItem(LS_CALENDAR_ID, created.id);
  return created.id;
}

function addDays(dateStr, n) {
  const d = strToDate(dateStr);
  d.setDate(d.getDate() + n);
  return dateToStr(d);
}

async function fetchEntriesForRange(timeMinDate, timeMaxDate) {
  const params = new URLSearchParams({
    singleEvents: "true",
    orderBy: "startTime",
    timeMin: new Date(timeMinDate.getFullYear(), timeMinDate.getMonth(), timeMinDate.getDate()).toISOString(),
    timeMax: new Date(timeMaxDate.getFullYear(), timeMaxDate.getMonth(), timeMaxDate.getDate()).toISOString(),
    maxResults: "2500",
    privateExtendedProperty: "diarioApp=1",
  });
  const data = await apiFetch(`/calendars/${encodeURIComponent(state.calendarId)}/events?${params.toString()}`);
  return data.items || [];
}

async function fetchAllEntries() {
  let items = [];
  let pageToken = undefined;
  do {
    const params = new URLSearchParams({
      singleEvents: "true",
      orderBy: "startTime",
      maxResults: "2500",
      privateExtendedProperty: "diarioApp=1",
      timeMin: "2000-01-01T00:00:00Z",
    });
    if (pageToken) params.set("pageToken", pageToken);
    const data = await apiFetch(`/calendars/${encodeURIComponent(state.calendarId)}/events?${params.toString()}`);
    items = items.concat(data.items || []);
    pageToken = data.nextPageToken;
  } while (pageToken);
  return items.reverse(); // più recenti prima
}

async function upsertEntry(dateStr, text) {
  const existing = state.entriesByDate[dateStr];
  const firstLine = (text.split("\n")[0] || "").trim();
  const summary = firstLine ? firstLine.slice(0, 60) : "Voce di diario";
  const body = {
    summary,
    description: text,
    start: { date: dateStr },
    end: { date: addDays(dateStr, 1) },
    extendedProperties: { private: { diarioApp: "1" } },
  };

  if (existing) {
    return apiFetch(`/calendars/${encodeURIComponent(state.calendarId)}/events/${existing.id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  }
  return apiFetch(`/calendars/${encodeURIComponent(state.calendarId)}/events`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

async function deleteEntryApi(eventId) {
  return apiFetch(`/calendars/${encodeURIComponent(state.calendarId)}/events/${eventId}`, {
    method: "DELETE",
  });
}

// ---------------------------------------------------------------------------
// Vista Calendario
// ---------------------------------------------------------------------------
function renderWeekdayHeader() {
  dom.weekdaysEl.innerHTML = WEEKDAY_LABELS.map((w) => `<span>${w}</span>`).join("");
}

async function loadMonth() {
  dom.calendarLoading.classList.remove("hidden");
  dom.calendarGrid.innerHTML = "";
  const y = state.viewYear, m = state.viewMonth;
  dom.monthLabel.textContent = `${MONTH_LABELS[m]} ${y}`;

  const first = new Date(y, m, 1);
  const last = new Date(y, m + 1, 0);

  try {
    const items = await fetchEntriesForRange(first, new Date(y, m + 1, 1));
    state.entriesByDate = {};
    for (const ev of items) {
      const d = ev.start && (ev.start.date || (ev.start.dateTime || "").slice(0, 10));
      if (!d) continue;
      state.entriesByDate[d] = { id: ev.id, summary: ev.summary || "", description: ev.description || "" };
    }
  } catch (e) {
    showToast("Errore nel caricare gli eventi", true);
    console.error(e);
  } finally {
    dom.calendarLoading.classList.add("hidden");
  }

  renderCalendarGrid(first, last);
}

function renderCalendarGrid(first, last) {
  const cells = [];
  // Lunedì = 0 ... Domenica = 6
  const offset = (first.getDay() + 6) % 7;
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let day = 1; day <= last.getDate(); day++) cells.push(day);

  const todayStr = dateToStr(new Date());
  dom.calendarGrid.innerHTML = "";
  for (const day of cells) {
    const cellDiv = document.createElement("div");
    if (day === null) {
      cellDiv.className = "day-cell empty";
      dom.calendarGrid.appendChild(cellDiv);
      continue;
    }
    const dateStr = `${state.viewYear}-${pad2(state.viewMonth + 1)}-${pad2(day)}`;
    const isFuture = dateStr > todayStr;
    const hasEntry = !!state.entriesByDate[dateStr];

    cellDiv.className = "day-cell" + (dateStr === todayStr ? " today" : "") + (isFuture ? " future" : "");
    cellDiv.innerHTML = `<span>${day}</span>` + (hasEntry ? '<span class="dot"></span>' : "");
    if (!isFuture) {
      cellDiv.addEventListener("click", () => openEntryPanel(dateStr));
    }
    dom.calendarGrid.appendChild(cellDiv);
  }
}

dom.prevMonthBtn.addEventListener("click", () => {
  state.viewMonth--;
  if (state.viewMonth < 0) { state.viewMonth = 11; state.viewYear--; }
  loadMonth();
});
dom.nextMonthBtn.addEventListener("click", () => {
  state.viewMonth++;
  if (state.viewMonth > 11) { state.viewMonth = 0; state.viewYear++; }
  loadMonth();
});

// ---------------------------------------------------------------------------
// Pannello voce (crea / modifica / elimina)
// ---------------------------------------------------------------------------
function openEntryPanel(dateStr) {
  state.activeDate = dateStr;
  const existing = state.entriesByDate[dateStr];
  dom.entryDateLabel.textContent = formatLongDate(dateStr);
  dom.entryText.value = existing ? existing.description : "";
  dom.entryStatus.textContent = "";
  dom.deleteEntryBtn.classList.toggle("hidden", !existing);
  updateCharCount();

  const doy = dayOfYear(dateStr);
  dom.motivationImage.innerHTML = ILLUSTRATIONS[doy % ILLUSTRATIONS.length];
  dom.motivationQuote.textContent = QUOTES[doy % QUOTES.length];

  dom.entryOverlay.classList.remove("hidden");
  setTimeout(() => dom.entryText.focus(), 50);
}

function closeEntryPanel() {
  dom.entryOverlay.classList.add("hidden");
  state.activeDate = null;
}

function updateCharCount() {
  dom.entryCharCount.textContent = `${dom.entryText.value.length} caratteri`;
}
dom.entryText.addEventListener("input", updateCharCount);

dom.closeEntryBtn.addEventListener("click", closeEntryPanel);
dom.entryOverlay.addEventListener("click", (e) => {
  if (e.target === dom.entryOverlay) closeEntryPanel();
});

// Se scrivi la voce di OGGI e il promemoria è attivo, cancella solo
// l'occorrenza di stasera (la serie ricorrente resta intatta per i giorni
// successivi). Se non scrivi nulla, il promemoria delle 23:00 parte normale.
async function cancelTodayReminderIfNeeded(dateStr) {
  const todayStr = dateToStr(new Date());
  if (dateStr !== todayStr) return;
  if (localStorage.getItem(LS_REMINDER_ENABLED) !== "1") return;
  const reminderEventId = localStorage.getItem(LS_REMINDER_EVENT_ID);
  if (!reminderEventId) return;

  try {
    const now = new Date();
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const dayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
    const params = new URLSearchParams({
      timeMin: dayStart.toISOString(),
      timeMax: dayEnd.toISOString(),
      maxResults: "5",
    });
    const data = await apiFetch(
      `/calendars/${encodeURIComponent(state.calendarId)}/events/${reminderEventId}/instances?${params.toString()}`
    );
    const instance = (data.items || [])[0];
    if (instance && instance.status !== "cancelled") {
      await apiFetch(`/calendars/${encodeURIComponent(state.calendarId)}/events/${instance.id}`, {
        method: "DELETE",
      });
    }
  } catch (e) {
    // Non blocca il salvataggio della voce se questo fallisce: al peggio
    // stasera arriva un promemoria "di troppo".
    console.error("Impossibile annullare il promemoria di oggi:", e);
  }
}

dom.saveEntryBtn.addEventListener("click", async () => {
  const text = dom.entryText.value.trim();
  if (!text) { showToast("Scrivi qualcosa prima di salvare", true); return; }
  dom.saveEntryBtn.disabled = true;
  dom.entryStatus.textContent = "Salvo su Google Calendar…";
  try {
    const savedDate = state.activeDate;
    await upsertEntry(savedDate, text);
    await cancelTodayReminderIfNeeded(savedDate);
    showToast("Voce salvata");
    closeEntryPanel();
    state.allEntriesCache = null; // invalida cache timeline
    await loadMonth();
  } catch (e) {
    console.error(e);
    dom.entryStatus.textContent = "Errore nel salvataggio. Riprova.";
  } finally {
    dom.saveEntryBtn.disabled = false;
  }
});

dom.deleteEntryBtn.addEventListener("click", async () => {
  const existing = state.entriesByDate[state.activeDate];
  if (!existing) return;
  if (!confirm("Eliminare questa voce di diario?")) return;
  try {
    await deleteEntryApi(existing.id);
    showToast("Voce eliminata");
    closeEntryPanel();
    state.allEntriesCache = null;
    await loadMonth();
  } catch (e) {
    console.error(e);
    showToast("Errore nell'eliminazione", true);
  }
});

// ---------------------------------------------------------------------------
// Promemoria giornaliero (evento ricorrente su Google Calendar)
// ---------------------------------------------------------------------------
function localDateTimeString(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}:00`;
}

function openReminderPanel() {
  const enabled = localStorage.getItem(LS_REMINDER_ENABLED) === "1";
  const time = localStorage.getItem(LS_REMINDER_TIME) || "23:00";
  dom.reminderEnabledInput.checked = enabled;
  dom.reminderTimeInput.value = time;
  dom.reminderStatus.textContent = "";
  dom.reminderOverlay.classList.remove("hidden");
}
function closeReminderPanel() {
  dom.reminderOverlay.classList.add("hidden");
}

async function ensureReminderEvent(timeStr, enabled) {
  const existingId = localStorage.getItem(LS_REMINDER_EVENT_ID);

  if (!enabled) {
    if (existingId) {
      try {
        await apiFetch(`/calendars/${encodeURIComponent(state.calendarId)}/events/${existingId}`, { method: "DELETE" });
      } catch (e) { /* già rimosso o non trovato: ignora */ }
      localStorage.removeItem(LS_REMINDER_EVENT_ID);
    }
    localStorage.setItem(LS_REMINDER_ENABLED, "0");
    return;
  }

  const [hh, mm] = timeStr.split(":").map(Number);
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hh, mm, 0);
  const end = new Date(start.getTime() + 15 * 60000);
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const body = {
    summary: "📔 Scrivi il tuo pensiero di oggi",
    description:
      (CONFIG.APP_URL ? `Apri Diario: ${CONFIG.APP_URL}\n\n` : "") +
      "Un minuto per fermarti e scrivere come va, anche solo due righe.",
    start: { dateTime: localDateTimeString(start), timeZone: tz },
    end: { dateTime: localDateTimeString(end), timeZone: tz },
    recurrence: ["RRULE:FREQ=DAILY"],
    reminders: { useDefault: false, overrides: [{ method: "popup", minutes: 0 }] },
    extendedProperties: { private: { diarioReminder: "1" } },
  };

  let result;
  if (existingId) {
    result = await apiFetch(`/calendars/${encodeURIComponent(state.calendarId)}/events/${existingId}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  } else {
    result = await apiFetch(`/calendars/${encodeURIComponent(state.calendarId)}/events`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }
  localStorage.setItem(LS_REMINDER_EVENT_ID, result.id);
  localStorage.setItem(LS_REMINDER_ENABLED, "1");
  localStorage.setItem(LS_REMINDER_TIME, timeStr);
}

dom.reminderBtn.addEventListener("click", openReminderPanel);
dom.closeReminderBtn.addEventListener("click", closeReminderPanel);
dom.reminderOverlay.addEventListener("click", (e) => {
  if (e.target === dom.reminderOverlay) closeReminderPanel();
});

dom.saveReminderBtn.addEventListener("click", async () => {
  const enabled = dom.reminderEnabledInput.checked;
  const timeStr = dom.reminderTimeInput.value || "23:00";
  dom.saveReminderBtn.disabled = true;
  dom.reminderStatus.textContent = "Salvo su Google Calendar…";
  try {
    await ensureReminderEvent(timeStr, enabled);
    showToast(enabled ? "Promemoria attivato" : "Promemoria disattivato");
    closeReminderPanel();
  } catch (e) {
    console.error(e);
    dom.reminderStatus.textContent = "Errore nel salvataggio. Riprova.";
  } finally {
    dom.saveReminderBtn.disabled = false;
  }
});

// ---------------------------------------------------------------------------
// Vista Timeline / elenco voci
// ---------------------------------------------------------------------------
async function loadTimeline() {
  dom.timelineLoading.classList.remove("hidden");
  dom.timelineEmpty.classList.add("hidden");
  try {
    if (!state.allEntriesCache) {
      state.allEntriesCache = await fetchAllEntries();
    }
    renderTimeline(state.allEntriesCache);
  } catch (e) {
    console.error(e);
    showToast("Errore nel caricare le voci", true);
  } finally {
    dom.timelineLoading.classList.add("hidden");
  }
}

function renderTimeline(items) {
  const q = dom.searchInput.value.trim().toLowerCase();
  const filtered = q
    ? items.filter((ev) =>
        (ev.description || "").toLowerCase().includes(q) ||
        (ev.summary || "").toLowerCase().includes(q))
    : items;

  dom.timelineList.innerHTML = "";
  dom.timelineEmpty.classList.toggle("hidden", filtered.length > 0);

  for (const ev of filtered) {
    const dateStr = ev.start && (ev.start.date || (ev.start.dateTime || "").slice(0, 10));
    if (!dateStr) continue;
    const item = document.createElement("div");
    item.className = "timeline-item";
    item.innerHTML = `
      <div class="t-date">${formatLongDate(dateStr)}</div>
      <div class="t-preview"></div>
    `;
    item.querySelector(".t-preview").textContent = ev.description || "";
    item.addEventListener("click", () => {
      state.entriesByDate[dateStr] = { id: ev.id, summary: ev.summary || "", description: ev.description || "" };
      openEntryPanel(dateStr);
    });
    dom.timelineList.appendChild(item);
  }
}

let searchDebounce;
dom.searchInput.addEventListener("input", () => {
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(() => renderTimeline(state.allEntriesCache || []), 150);
});

// ---------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------
dom.tabCalendarBtn.addEventListener("click", () => {
  dom.tabCalendarBtn.classList.add("active");
  dom.tabTimelineBtn.classList.remove("active");
  dom.calendarView.classList.remove("hidden");
  dom.timelineView.classList.add("hidden");
});
dom.tabTimelineBtn.addEventListener("click", () => {
  dom.tabTimelineBtn.classList.add("active");
  dom.tabCalendarBtn.classList.remove("active");
  dom.timelineView.classList.remove("hidden");
  dom.calendarView.classList.add("hidden");
  loadTimeline();
});

dom.logoutBtn.addEventListener("click", logout);

// ---------------------------------------------------------------------------
// Avvio dopo login
// ---------------------------------------------------------------------------
async function onSignedIn() {
  dom.loginScreen.classList.add("hidden");
  dom.mainScreen.classList.remove("hidden");
  renderWeekdayHeader();
  try {
    await ensureCalendar();
    await loadMonth();
  } catch (e) {
    console.error(e);
    showToast("Errore di connessione a Google Calendar", true);
  }
}

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------
window.addEventListener("load", () => {
  // Attende che lo script GIS sia pronto
  const check = setInterval(() => {
    if (window.google && google.accounts && google.accounts.oauth2) {
      clearInterval(check);
      initAuth();
    }
  }, 100);
  setTimeout(() => clearInterval(check), 8000);

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
});
