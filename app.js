/* ---------- State (keep all of this at the very top) ---------- */
let editingId = null;
let payday = localStorage.getItem("payday") || "";
let fixedCosts = JSON.parse(localStorage.getItem("fixedCosts")) || [];
let items = JSON.parse(localStorage.getItem("items")) || [];
let deadlines = JSON.parse(localStorage.getItem("deadlines")) || [];
let sessions = JSON.parse(localStorage.getItem("sessions")) || [];
let weekHistory = JSON.parse(localStorage.getItem("weekHistory")) || [];
let weeklyGoal = parseFloat(localStorage.getItem("weeklyGoal")) || 10;
let weekStart = localStorage.getItem("weekStart") || todayISO();
localStorage.setItem("weekStart", weekStart);
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/* ---------- Small helpers ---------- */
function todayISO() {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}
function fmtH(mins) { return (mins / 60).toFixed(1) + "h"; }
function val(id) {
  const el = document.getElementById(id);
  return el ? el.value : "";
}

/* ---------- Theme ---------- */
const btn = document.getElementById("themeBtn");
setTheme(localStorage.getItem("theme") || "light");

btn.addEventListener("click", () => {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  setTheme(next);
});

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem("theme", theme);
  btn.textContent = theme === "dark" ? "Light mode" : "Dark mode";
}

/* ---------- Budget tracker ---------- */
document.getElementById("addBtn").addEventListener("click", () => {
  const desc = document.getElementById("desc").value.trim();
  const amount = parseFloat(document.getElementById("amount").value);
  const type = document.getElementById("type").value;
  const category = document.getElementById("category").value;

  if (!desc || isNaN(amount) || amount <= 0) {
    alert("Enter a description and a valid amount.");
    return;
  }

  const existing = editingId ? items.find(i => i.id === editingId) : null;
  if (existing) {
    existing.desc = desc;
    existing.amount = amount;
    existing.type = type;
    existing.category = category;
  } else {
    items.push({ id: Date.now(), desc, amount, type, category });
  }
  editingId = null;
  document.getElementById("addBtn").textContent = "Add";

  save();
  document.getElementById("desc").value = "";
  document.getElementById("amount").value = "";
});

function editItem(id) {
  const item = items.find(i => i.id === id);
  if (!item) return;
  document.getElementById("desc").value = item.desc;
  document.getElementById("amount").value = item.amount;
  document.getElementById("type").value = item.type;
  document.getElementById("category").value = item.category || "Other";
  editingId = id;
  document.getElementById("addBtn").textContent = "Save changes";
  document.getElementById("desc").scrollIntoView({ behavior: "smooth", block: "center" });
  document.getElementById("desc").focus();
}

function deleteItem(id) {
  if (editingId === id) {
    editingId = null;
    document.getElementById("addBtn").textContent = "Add";
  }
  items = items.filter(item => item.id !== id);
  save();
}

function save() {
  localStorage.setItem("items", JSON.stringify(items));
  render();
}

function render() {
  const list = document.getElementById("list");
  list.innerHTML = "";
  let balance = 0;

  items.forEach(item => {
    const sign = item.type === "income" ? 1 : -1;
    balance += sign * item.amount;
    const li = document.createElement("li");
    li.innerHTML = `
      <span class="item-desc"></span>
      <span class="${item.type}">${sign > 0 ? "+" : "-"}R${item.amount.toFixed(2)}
        <button class="del" onclick="editItem(${item.id})">Edit</button>
        <button class="del" onclick="deleteItem(${item.id})">Delete</button>
      </span>`;
    li.querySelector(".item-desc").textContent = item.desc;
    list.appendChild(li);
  });

  renderInsights(balance);
  renderPayday(balance);

  document.getElementById("balance").textContent = "R" + balance.toFixed(2);
}

function renderInsights(balance) {
  const chart = document.getElementById("chart");
  const avg = document.getElementById("avg");
  const runway = document.getElementById("runway");
  const expenses = items.filter(i => i.type === "expense");

  if (!expenses.length) {
    chart.innerHTML = "";
    avg.textContent = "R0";
    runway.textContent = "No data yet";
    return;
  }

  const total = expenses.reduce((sum, i) => sum + i.amount, 0);
  const firstDay = Math.min(...expenses.map(i => i.id));
  const days = Math.max(1, Math.ceil((Date.now() - firstDay) / 86400000));
  const daily = total / days;

  avg.textContent = "R" + daily.toFixed(2);
  const left = Math.floor(balance / daily);
  runway.textContent = balance <= 0 ? "Out of money" : left + " days";
  runway.className = balance <= 0 || left < 7 ? "expense" : "income";

  const byCat = {};
  expenses.forEach(i => {
    const c = i.category || "Other";
    byCat[c] = (byCat[c] || 0) + i.amount;
  });

  chart.innerHTML = "<h3>Where your money goes</h3>" +
    Object.entries(byCat)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, amt]) => `
        <div class="bar-row">
          <div class="bar-label"><span>${cat}</span><span>R${amt.toFixed(2)}</span></div>
          <div class="bar-track"><div class="bar-fill" style="width:${(amt / total) * 100}%"></div></div>
        </div>`).join("");
}

/* ---------- Payday planner: safe to spend per day ---------- */
const paydayInput = document.getElementById("payday");
if (paydayInput) {
  paydayInput.value = payday;
  paydayInput.addEventListener("change", e => {
    payday = e.target.value;
    localStorage.setItem("payday", payday);
    render();
  });
}

const addFixedBtn = document.getElementById("addFixed");
if (addFixedBtn) {
  addFixedBtn.addEventListener("click", () => {
    const name = document.getElementById("fName").value.trim();
    const amount = parseFloat(document.getElementById("fAmount").value);
    const date = document.getElementById("fDate").value;
    if (!name || isNaN(amount) || amount <= 0 || !date) {
      alert("Enter a name, an amount and the due date.");
      return;
    }
    fixedCosts.push({ id: Date.now(), name, amount, date });
    saveFixed();
    document.getElementById("fName").value = "";
    document.getElementById("fAmount").value = "";
    document.getElementById("fDate").value = "";
  });
}

function saveFixed() {
  localStorage.setItem("fixedCosts", JSON.stringify(fixedCosts));
  render();
}

function deleteFixed(id) {
  fixedCosts = fixedCosts.filter(f => f.id !== id);
  saveFixed();
}

function markPaid(id) {
  const f = fixedCosts.find(x => x.id === id);
  if (!f) return;
  items.push({ id: Date.now(), desc: f.name, amount: f.amount, type: "expense", category: "Other" });
  fixedCosts = fixedCosts.filter(x => x.id !== id);
  localStorage.setItem("fixedCosts", JSON.stringify(fixedCosts));
  save();
}

function renderPayday(balance) {
  const safe = document.getElementById("safe");
  const note = document.getElementById("safeNote");
  const flist = document.getElementById("flist");
  if (!safe || !note || !flist) return; // payday card missing from index.html

  flist.innerHTML = "";
  [...fixedCosts].sort((a, b) => a.date.localeCompare(b.date)).forEach(f => {
    const li = document.createElement("li");
    li.innerHTML = `
      <div><strong class="f-name"></strong><small>Due ${f.date}</small></div>
      <span class="expense">R${f.amount.toFixed(2)}</span>
      <button class="del" title="Mark as paid" onclick="markPaid(${f.id})">Paid</button>
      <button class="del" onclick="deleteFixed(${f.id})">Delete</button>`;
    li.querySelector(".f-name").textContent = f.name;
    flist.appendChild(li);
  });

  safe.className = "";
  if (!payday) {
    safe.textContent = "Not set";
    note.textContent = "Set your next payday to see this.";
    return;
  }
  const daysToPay = daysLeft(payday);
  if (daysToPay <= 0) {
    safe.textContent = "Not set";
    note.textContent = "Payday is today or has passed. Set your next payday.";
    return;
  }

  const fixedDue = fixedCosts
    .filter(f => { const n = daysLeft(f.date); return n >= 0 && n <= daysToPay; })
    .reduce((sum, f) => sum + f.amount, 0);

  const perDay = (balance - fixedDue) / daysToPay;

  if (perDay < 0) {
    safe.textContent = "R0.00";
    safe.className = "expense";
    note.textContent = `You're short by R${(-(balance - fixedDue)).toFixed(2)} before payday. Cut back or find extra income.`;
  } else {
    safe.textContent = "R" + perDay.toFixed(2);
    safe.className = perDay < 30 ? "expense" : "income";
    note.textContent = `R${balance.toFixed(2)} − R${fixedDue.toFixed(2)} fixed costs ÷ ${daysToPay} day${daysToPay === 1 ? "" : "s"} to payday`;
  }
}

render();

/* ---------- Shared: subjects ---------- */
function refreshSubjects() {
  const datalist = document.getElementById("subjectList");
  if (!datalist) return;
  const names = new Set();
  deadlines.forEach(d => d.subject && names.add(d.subject));
  sessions.forEach(s => s.subject && names.add(s.subject));
  datalist.innerHTML = "";
  names.forEach(n => {
    const o = document.createElement("option");
    o.value = n;
    datalist.appendChild(o);
  });
}

/* ---------- Deadline tracker with weight + priority ---------- */
document.getElementById("addDeadline").addEventListener("click", () => {
  const title = val("dTitle").trim();
  const subject = val("dSubject").trim();
  const weight = Math.min(100, Math.max(0, parseFloat(val("dWeight")) || 0));
  const date = val("dDate");
  if (!title || !date) {
    alert("Enter a title and a date.");
    return;
  }
  deadlines.push({ id: Date.now(), title, subject, weight, date });
  saveDeadlines();
  ["dTitle", "dSubject", "dWeight", "dDate"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
});

function deleteDeadline(id) {
  deadlines = deadlines.filter(d => d.id !== id);
  sessions.forEach(s => { if (s.deadlineId === id) s.deadlineId = null; });
  localStorage.setItem("sessions", JSON.stringify(sessions));
  saveDeadlines();
  renderSessions();
}

function saveDeadlines() {
  localStorage.setItem("deadlines", JSON.stringify(deadlines));
  renderDeadlines();
}

function daysLeft(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const due = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((due - today) / 86400000);
}

// Priority score = weight (%) ÷ days left (minimum 1). Overdue = 0.
function scoreOf(dl) {
  const n = daysLeft(dl.date);
  if (n < 0) return 0;
  return (Number(dl.weight) || 0) / Math.max(n, 1);
}
function plannedMinsFor(id) {
  return sessions.filter(s => s.deadlineId === id).reduce((t, s) => t + s.mins, 0);
}
function studiedMinsFor(id) {
  return sessions.filter(s => s.deadlineId === id).reduce((t, s) => t + (s.loggedMins || 0), 0);
}

function fillDeadlineSelect() {
  const sel = document.getElementById("sDeadline");
  if (!sel) return;
  const current = sel.value;
  sel.innerHTML = '<option value="">Not linked to a deadline</option>';
  deadlines.filter(d => daysLeft(d.date) >= 0).forEach(d => {
    const o = document.createElement("option");
    o.value = d.id;
    o.textContent = d.title + (d.subject ? " (" + d.subject + ")" : "");
    sel.appendChild(o);
  });
  sel.value = current;
}

function renderDeadlines() {
  const list = document.getElementById("dlist");
  list.innerHTML = "";
  refreshSubjects();
  fillDeadlineSelect();

  if (!deadlines.length) {
    list.innerHTML = '<li class="empty">No deadlines yet. Add your first one above.</li>';
    return;
  }

  const totalScore = deadlines.reduce((t, d) => t + scoreOf(d), 0);

  [...deadlines]
    .sort((a, b) => {
      const ka = daysLeft(a.date) < 0 ? -1 : scoreOf(a);
      const kb = daysLeft(b.date) < 0 ? -1 : scoreOf(b);
      return kb - ka || a.date.localeCompare(b.date);
    })
    .forEach(dl => {
      const n = daysLeft(dl.date);
      let text, cls;
      if (n < 0) { text = `Overdue by ${-n} day${-n === 1 ? "" : "s"}`; cls = "urgent"; }
      else if (n === 0) { text = "Due today!"; cls = "urgent"; }
      else if (n === 1) { text = "Tomorrow"; cls = "urgent"; }
      else { text = `in ${n} days`; cls = n <= 7 ? "soon" : "fine"; }

      const score = scoreOf(dl);
      let prio = "";
      if (n >= 0 && dl.weight > 0) {
        const level = score >= 5 ? ["High", "urgent"] : score >= 2 ? ["Medium", "soon"] : ["Low", "fine"];
        prio = `<span class="badge ${level[1]}">${level[0]} priority</span>`;
      }

      const planned = plannedMinsFor(dl.id);
      const studied = studiedMinsFor(dl.id);
      const suggested = n >= 0 && totalScore > 0 ? weeklyGoal * score / totalScore : 0;

      const meta = [dl.date, dl.subject, dl.weight ? dl.weight + "%" : ""].filter(Boolean).join(" · ");
      const plan = `Planned ${fmtH(planned)}` +
        (suggested > 0 ? ` / suggested ${suggested.toFixed(1)}h` : "") +
        ` · Studied ${fmtH(studied)}`;

      const li = document.createElement("li");
      li.innerHTML = `
        <div><strong class="dl-title"></strong><small class="dl-meta"></small><small class="dl-plan"></small></div>
        <div class="badges"><span class="badge ${cls}">${text}</span>${prio}</div>
        <button class="del" onclick="deleteDeadline(${dl.id})">Delete</button>`;
      li.querySelector(".dl-title").textContent = dl.title;
      li.querySelector(".dl-meta").textContent = meta;
      li.querySelector(".dl-plan").textContent = plan;
      list.appendChild(li);
    });
}

const goalInput = document.getElementById("weeklyGoal");
if (goalInput) {
  goalInput.value = weeklyGoal;
  goalInput.addEventListener("change", () => {
    const v = parseFloat(goalInput.value);
    weeklyGoal = !isNaN(v) && v > 0 && v <= 100 ? v : 10;
    goalInput.value = weeklyGoal;
    localStorage.setItem("weeklyGoal", weeklyGoal);
    renderDeadlines();
  });
}

/* ---------- Study planner ---------- */
document.getElementById("addSession").addEventListener("click", () => {
  let subject = val("sSubject").trim();
  const deadlineId = val("sDeadline") ? Number(val("sDeadline")) : null;
  const day = val("sDay");
  const mins = parseInt(val("sMins"));

  if (deadlineId && !subject) {
    const dl = deadlines.find(d => d.id === deadlineId);
    if (dl) subject = dl.subject || dl.title;
  }
  if (!subject || isNaN(mins) || mins <= 0) {
    alert("Enter a subject (or pick a deadline) and the minutes you'll study.");
    return;
  }
  sessions.push({ id: Date.now(), subject, deadlineId, day, mins, done: false, loggedMins: 0 });
  saveSessions();
  document.getElementById("sSubject").value = "";
  document.getElementById("sMins").value = "";
});

// Safe new week: archive finished sessions, carry unfinished ones forward, keep history.
document.getElementById("resetWeek").addEventListener("click", () => {
  if (!sessions.length) {
    alert("Nothing to archive yet. Add some sessions first.");
    return;
  }
  const done = sessions.filter(s => s.done);
  const open = sessions.filter(s => !s.done);
  const ok = confirm(
    "Start a new week?\n\n" +
    "• " + done.length + " finished session(s) will be archived\n" +
    "• " + open.length + " unfinished session(s) will carry forward\n\n" +
    "Your history is kept."
  );
  if (!ok) return;

  weekHistory.push({
    id: Date.now(),
    weekStart,
    total: sessions.length,
    done: done.length,
    rate: Math.round((done.length / sessions.length) * 100),
    plannedMins: sessions.reduce((t, s) => t + s.mins, 0),
    loggedMins: sessions.reduce((t, s) => t + (s.loggedMins || 0), 0)
  });
  localStorage.setItem("weekHistory", JSON.stringify(weekHistory));

  sessions = open.map(s => ({ ...s, loggedMins: 0 }));
  weekStart = todayISO();
  localStorage.setItem("weekStart", weekStart);

  saveSessions();
  renderWeekHistory();
});

function toggleSession(id) {
  const s = sessions.find(x => x.id === id);
  if (!s) return;
  s.done = !s.done;
  saveSessions();
}

function deleteSession(id) {
  sessions = sessions.filter(s => s.id !== id);
  saveSessions();
}

function saveSessions() {
  localStorage.setItem("sessions", JSON.stringify(sessions));
  renderSessions();
  renderDeadlines();
}

function renderSessions() {
  const list = document.getElementById("slist");
  list.innerHTML = "";
  refreshSubjects();

  if (!sessions.length) {
    list.innerHTML = '<li class="empty">No sessions yet. Add your first one above.</li>';
  }

  [...sessions]
    .sort((a, b) => DAYS.indexOf(a.day) - DAYS.indexOf(b.day))
    .forEach(s => {
      const dl = deadlines.find(d => d.id === s.deadlineId);
      const li = document.createElement("li");
      if (s.done) li.classList.add("done");
      li.innerHTML = `
        <input type="checkbox" ${s.done ? "checked" : ""} onchange="toggleSession(${s.id})">
        <div><strong class="s-title"></strong><small class="s-meta"></small></div>
        <button class="del" onclick="deleteSession(${s.id})">Delete</button>`;
      li.querySelector(".s-title").textContent = s.subject;
      li.querySelector(".s-meta").textContent =
        `${s.day} · ${s.loggedMins || 0}/${s.mins} min` + (dl ? ` · for ${dl.title}` : "");
      list.appendChild(li);
    });

  const done = sessions.filter(s => s.done).length;
  const pct = sessions.length ? Math.round((done / sessions.length) * 100) : 0;
  document.getElementById("pText").textContent =
    `${done} / ${sessions.length} done` + (sessions.length ? ` (${pct}%)` : "");
  document.getElementById("pFill").style.width = pct + "%";

  renderSubjectSummary();
  renderTimerSelect();
}

function renderSubjectSummary() {
  const box = document.getElementById("subjectSummary");
  if (!box) return;
  if (!sessions.length) {
    box.innerHTML = "";
    return;
  }
  const by = {};
  sessions.forEach(s => {
    const k = s.subject || "Other";
    by[k] = by[k] || { planned: 0, logged: 0 };
    by[k].planned += s.mins;
    by[k].logged += s.loggedMins || 0;
  });
  box.innerHTML = "<h3>Hours by subject (this week)</h3>";
  Object.entries(by)
    .sort((a, b) => b[1].planned - a[1].planned)
    .forEach(([name, v]) => {
      const pct = v.planned ? Math.min(100, (v.logged / v.planned) * 100) : 0;
      const row = document.createElement("div");
      row.className = "bar-row";
      row.innerHTML = `
        <div class="bar-label"><span class="sub-name"></span><span>Studied ${fmtH(v.logged)} of ${fmtH(v.planned)} planned</span></div>
        <div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>`;
      row.querySelector(".sub-name").textContent = name;
      box.appendChild(row);
    });
}

function renderWeekHistory() {
  const box = document.getElementById("weekHistory");
  if (!box) return;
  if (!weekHistory.length) {
    box.innerHTML = "";
    return;
  }
  box.innerHTML = "<h3>Past weeks</h3>";
  [...weekHistory].reverse().slice(0, 8).forEach(h => {
    const row = document.createElement("div");
    row.className = "history-row";
    row.textContent = `Week of ${h.weekStart}: ${h.done}/${h.total} done (${h.rate}%) · ${fmtH(h.loggedMins)} studied`;
    box.appendChild(row);
  });
}

/* ---------- Focus timer (logs time to a planned session) ---------- */
function renderTimerSelect() {
  const sel = document.getElementById("timerSession");
  if (!sel) return;
  const current = sel.value;
  sel.innerHTML = '<option value="">Not linked to a session</option>';
  sessions.filter(s => !s.done).forEach(s => {
    const o = document.createElement("option");
    o.value = s.id;
    o.textContent = `${s.subject} · ${s.day} (${s.loggedMins || 0}/${s.mins} min)`;
    sel.appendChild(o);
  });
  sel.value = current;
}

function logFocus(mins) {
  const id = Number(val("timerSession"));
  if (!id || mins <= 0) return;
  const s = sessions.find(x => x.id === id);
  if (!s) return;
  s.loggedMins = (s.loggedMins || 0) + mins;
  saveSessions();
}

let FOCUS = (parseInt(localStorage.getItem("focusMins")) || 25) * 60;
let timeLeft = FOCUS, timerId = null, endTime = 0;
const display = document.getElementById("timeDisplay");
const startBtn = document.getElementById("startTimer");

function showTime() {
  const m = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const s = String(timeLeft % 60).padStart(2, "0");
  display.textContent = `${m}:${s}`;
}

startBtn.addEventListener("click", () => {
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
    startBtn.textContent = "Start";
    return;
  }
  endTime = Date.now() + timeLeft * 1000;
  startBtn.textContent = "Pause";
  timerId = setInterval(() => {
    timeLeft = Math.max(0, Math.round((endTime - Date.now()) / 1000));
    showTime();
    if (timeLeft === 0) {
      clearInterval(timerId);
      timerId = null;
      startBtn.textContent = "Start";
      logFocus(Math.max(1, Math.round(FOCUS / 60)));
      timeLeft = FOCUS;
      showTime();
      if (navigator.vibrate) navigator.vibrate(300);
      alert("Time is up. Take a 5 minute break.");
    }
  }, 500);
});

document.getElementById("resetTimer").addEventListener("click", () => {
  const elapsed = FOCUS - timeLeft;
  clearInterval(timerId);
  timerId = null;
  if (elapsed >= 60) logFocus(Math.floor(elapsed / 60));
  timeLeft = FOCUS;
  startBtn.textContent = "Start";
  showTime();
});

function setFocus(mins) {
  if (isNaN(mins) || mins < 1 || mins > 180) {
    alert("Choose between 1 and 180 minutes.");
    return;
  }
  clearInterval(timerId);
  timerId = null;
  startBtn.textContent = "Start";
  FOCUS = mins * 60;
  timeLeft = FOCUS;
  localStorage.setItem("focusMins", mins);
  showTime();
}

document.querySelectorAll(".presets button[data-min]").forEach(b => {
  b.addEventListener("click", () => setFocus(parseInt(b.dataset.min)));
});

document.getElementById("setCustom").addEventListener("click", () => {
  const input = document.getElementById("customMin");
  setFocus(parseInt(input.value));
  input.value = "";
});

showTime();

/* ---------- First render ---------- */
renderDeadlines();
renderSessions();
renderWeekHistory();

/* ---------- Offline support ---------- */
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js");
}