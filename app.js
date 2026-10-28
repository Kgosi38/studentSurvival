const btn = document.getElementById("themeBtn");
const saved = localStorage.getItem("theme") || "light";
setTheme(saved);

btn.addEventListener("click", () => {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  setTheme(next);
});

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem("theme", theme);
  btn.textContent = theme === "dark" ? "☀️" : "🌙";
}

let items = JSON.parse(localStorage.getItem("items")) || [];

document.getElementById("addBtn").addEventListener("click", () => {
  const desc = document.getElementById("desc").value.trim();
  const amount = parseFloat(document.getElementById("amount").value);
  const type = document.getElementById("type").value;
  const category = document.getElementById("category").value;


  if (!desc || isNaN(amount) || amount <= 0) {
    alert("Enter a description and a valid amount.");
    return;
  }
  items.push({ id: Date.now(), desc, amount, type, category });
  save();
  document.getElementById("desc").value = "";
  document.getElementById("amount").value = "";
});

function deleteItem(id) {
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
      <span>${item.desc}</span>
      <span class="${item.type}">${sign > 0 ? "+" : "-"}R${item.amount.toFixed(2)}
        <button class="del" onclick="deleteItem(${item.id})">🗑️</button>
      </span>`;
    list.appendChild(li);
  });

  renderInsights(balance);

  document.getElementById("balance").textContent = "R" + balance.toFixed(2);
}

render();

let deadlines = JSON.parse(localStorage.getItem("deadlines")) || [];

document.getElementById("addDeadline").addEventListener("click", () => {
  const title = document.getElementById("dTitle").value.trim();
  const date = document.getElementById("dDate").value;
  if (!title || !date) {
    alert("Enter a title and a date.");
    return;
  }
  deadlines.push({ id: Date.now(), title, date });
  saveDeadlines();
  document.getElementById("dTitle").value = "";
  document.getElementById("dDate").value = "";
});

function deleteDeadline(id) {
  deadlines = deadlines.filter(d => d.id !== id);
  saveDeadlines();
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

function renderDeadlines() {
  const list = document.getElementById("dlist");
  list.innerHTML = "";

  if (!deadlines.length) {
    list.innerHTML = '<li class="empty">No deadlines. Enjoy it while it lasts 😅</li>';
    return;
  }

  [...deadlines]
    .sort((a, b) => a.date.localeCompare(b.date))
    .forEach(dl => {
      const n = daysLeft(dl.date);
      let text, cls;
      if (n < 0) { text = `Overdue by ${-n} day${-n === 1 ? "" : "s"}`; cls = "urgent"; }
      else if (n === 0) { text = "Due today!"; cls = "urgent"; }
      else if (n === 1) { text = "Tomorrow"; cls = "urgent"; }
      else { text = `in ${n} days`; cls = n <= 7 ? "soon" : "fine"; }

      const li = document.createElement("li");
      li.innerHTML = `
        <div><strong class="dl-title"></strong><small>${dl.date}</small></div>
        <span class="badge ${cls}">${text}</span>
        <button class="del" onclick="deleteDeadline(${dl.id})">🗑️</button>`;
      li.querySelector(".dl-title").textContent = dl.title;
      list.appendChild(li);
    });
}

renderDeadlines();

function renderInsights(balance) {
  const chart = document.getElementById("chart");
  const avg = document.getElementById("avg");
  const runway = document.getElementById("runway");
  const expenses = items.filter(i => i.type === "expense");

  if (!expenses.length) {
    chart.innerHTML = "";
    avg.textContent = "R0";
    runway.textContent = "—";
    return;
  }

  const total = expenses.reduce((sum, i) => sum + i.amount, 0);
  const firstDay = Math.min(...expenses.map(i => i.id));
  const days = Math.max(1, Math.ceil((Date.now() - firstDay) / 86400000));
  const daily = total / days;

  avg.textContent = "R" + daily.toFixed(2);
  const left = Math.floor(balance / daily);
  runway.textContent = balance <= 0 ? "Broke! 😬" : left + " days";
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

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
let sessions = JSON.parse(localStorage.getItem("sessions")) || [];

document.getElementById("addSession").addEventListener("click", () => {
  const subject = document.getElementById("sSubject").value.trim();
  const day = document.getElementById("sDay").value;
  const mins = parseInt(document.getElementById("sMins").value);
  if (!subject || isNaN(mins) || mins <= 0) {
    alert("Enter a subject and the minutes you'll study.");
    return;
  }
  sessions.push({ id: Date.now(), subject, day, mins, done: false });
  saveSessions();
  document.getElementById("sSubject").value = "";
  document.getElementById("sMins").value = "";
});

document.getElementById("resetWeek").addEventListener("click", () => {
  sessions.forEach(s => (s.done = false));
  saveSessions();
});

function toggleSession(id) {
  const s = sessions.find(x => x.id === id);
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
}

function renderSessions() {
  const list = document.getElementById("slist");
  list.innerHTML = "";

  if (!sessions.length) {
    list.innerHTML = '<li class="empty">No sessions yet. Plan your week 📖</li>';
  }

  [...sessions]
    .sort((a, b) => DAYS.indexOf(a.day) - DAYS.indexOf(b.day))
    .forEach(s => {
      const li = document.createElement("li");
      if (s.done) li.classList.add("done");
      li.innerHTML = `
        <input type="checkbox" ${s.done ? "checked" : ""} onchange="toggleSession(${s.id})">
        <div><strong class="s-title"></strong><small>${s.day} · ${s.mins} min</small></div>
        <button class="del" onclick="deleteSession(${s.id})">🗑️</button>`;
      li.querySelector(".s-title").textContent = s.subject;
      list.appendChild(li);
    });

  const done = sessions.filter(s => s.done).length;
  const pct = sessions.length ? (done / sessions.length) * 100 : 0;
  document.getElementById("pText").textContent = `${done} / ${sessions.length} done`;
  document.getElementById("pFill").style.width = pct + "%";
}

renderSessions();

/* ---------- Focus timer ---------- */
let FOCUS = (parseInt(localStorage.getItem("focusMins")) || 25) * 60;;
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
      timeLeft = FOCUS;
      showTime();
      if (navigator.vibrate) navigator.vibrate(300);
      alert("Time's up! Take a 5 minute break 🎉");
    }
  }, 500);
});

document.getElementById("resetTimer").addEventListener("click", () => {
  clearInterval(timerId);
  timerId = null;
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

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js");
}