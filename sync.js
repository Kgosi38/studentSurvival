/* Student Survival: accounts + cloud sync (Supabase)
   Paste your own values below. The anon/publishable key is safe to put here
   ONLY because row-level security limits each user to their own row.
   NEVER paste a "service_role" or "secret" key into this file. */
const SUPABASE_URL = "https://cwpxxooxmtgkdnqgrjog.supabase.co";
const SUPABASE_KEY = "sb_publishable_iVyvyHSlyvxWXcRggb0N2w_CGF1Z2C4";

(function () {
  const KEYS = ["items", "deadlines", "sessions", "weekHistory", "weeklyGoal",
                "weekStart", "payday", "fixedCosts", "focusMins", "theme"];
  const $ = id => document.getElementById(id);
  const origSet = Storage.prototype.setItem;
  const msg = t => { if ($("authMsg")) $("authMsg").textContent = t; };
  const status = t => { if ($("syncStatus")) $("syncStatus").textContent = t; };
  const lock = () => document.body.classList.add("locked");
  const unlock = () => document.body.classList.remove("locked");

  if (!window.supabase) {
  if (localStorage.getItem("ssUser")) {
    unlock();
    msg("Offline mode. Your data is saved on this device.");
  } else {
    msg("Connect to the internet to log in or sign up.");
  }
  return;
}
if (SUPABASE_URL.startsWith("PASTE") || SUPABASE_KEY.startsWith("PASTE")) {
  unlock();
  msg("Accounts are not switched on yet (add your Supabase keys in sync.js).");
  return;
}

  const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  let user = null, pushTimer = null, applying = false, syncing = false;

  /* Mark data as changed and schedule an upload whenever the app saves something */
  Storage.prototype.setItem = function (k, v) {
    origSet.call(this, k, v);
    if (this === localStorage && KEYS.includes(k) && !applying) {
      origSet.call(localStorage, "syncDirty", "1");
      if (user) schedulePush();
    }
  };

  function collect() {
    const o = {};
    KEYS.forEach(k => {
      const v = localStorage.getItem(k);
      if (v !== null) o[k] = v;
    });
    return o;
  }

  function hasLocalData() {
    return ["items", "deadlines", "sessions", "fixedCosts"].some(k => {
      try { return JSON.parse(localStorage.getItem(k) || "[]").length > 0; }
      catch (e) { return false; }
    });
  }

  async function push() {
    if (!user) return true;
    status("Saving…");
    try {
      const stamp = new Date().toISOString();
      const { error } = await client.from("user_data")
        .upsert({ user_id: user.id, data: collect(), updated_at: stamp });
      if (error) throw error;
      origSet.call(localStorage, "syncedAt", stamp);
      origSet.call(localStorage, "syncedUser", user.id);
      localStorage.removeItem("syncDirty");
      status("All changes saved online ✓");
      return true;
    } catch (e) {
      status("Couldn't save online. Your changes are safe on this device and will upload on your next change.");
      return false;
    }
  }

  function schedulePush() {
    clearTimeout(pushTimer);
    status("Saving…");
    pushTimer = setTimeout(push, 1500);
  }

  function applyCloud(row) {
    applying = true;
    KEYS.forEach(k => {
      if (row.data && row.data[k] !== undefined) origSet.call(localStorage, k, row.data[k]);
      else localStorage.removeItem(k);
    });
    origSet.call(localStorage, "syncedAt", row.updated_at);
    origSet.call(localStorage, "syncedUser", user.id);
    localStorage.removeItem("syncDirty");
    location.reload();
  }

  async function pullOrPush() {
    if (!user || syncing) return;
    syncing = true;
    try {
      status("Checking your online data…");
      const { data: row, error } = await client.from("user_data")
        .select("data, updated_at").eq("user_id", user.id).maybeSingle();
      if (error) { status("Offline. Your changes are saved on this device."); return; }

      const dirty = localStorage.getItem("syncDirty") === "1";
      const sameUser = localStorage.getItem("syncedUser") === user.id;
      const syncedAt = localStorage.getItem("syncedAt");

      if (!row) { await push(); return; }

      const cloudNewer = !sameUser || !syncedAt || Date.parse(row.updated_at) > Date.parse(syncedAt);
      if (!cloudNewer) {
        if (dirty) await push();
        else status("All changes saved online ✓");
        return;
      }

      if (hasLocalData() && (!sameUser || dirty)) {
        const useCloud = confirm(
          "This account already has saved data online.\n\n" +
          "OK = load your online data (replaces what's on this device)\n" +
          "Cancel = keep this device's data and overwrite the online copy"
        );
        if (!useCloud) { await push(); return; }
      }
      applyCloud(row);
    } finally {
      syncing = false;
    }
  }

  function updateUI() {
    if ($("authOut")) $("authOut").hidden = !!user;
    if ($("authIn")) $("authIn").hidden = !user;
    if (user && $("authUser")) {
  const name = user.user_metadata && user.user_metadata.name;
  $("authUser").textContent = name ? name + " (" + user.email + ")" : user.email;
}
  }

  client.auth.onAuthStateChange((event, session) => {
  user = session ? session.user : null;
  updateUI();
  if (user) {
    localStorage.setItem("ssUser", user.id);
    unlock();
    if (event === "SIGNED_IN" || event === "INITIAL_SESSION") setTimeout(pullOrPush, 0);
  } else {
    lock();
  }
});

  let mode = "login";

function setMode(m) {
  mode = m;
  const signup = m === "signup";
  $("tabLogin").classList.toggle("active", !signup);
  $("tabSignup").classList.toggle("active", signup);
  $("authName").hidden = !signup;
  $("authPass2").hidden = !signup;
  $("authSubmit").textContent = signup ? "Create my account" : "Log in";
  $("authPass").autocomplete = signup ? "new-password" : "current-password";
  $("authIntro").textContent = signup
    ? "New here? Create a free account to save your data and use it on any device."
    : "Welcome back! Log in to load your data.";
  msg("");
}

$("tabLogin").addEventListener("click", () => setMode("login"));
$("tabSignup").addEventListener("click", () => setMode("signup"));

$("authSubmit").addEventListener("click", async () => {
  const email = $("authEmail").value.trim();
  const password = $("authPass").value;
  if (!email || !password) { msg("Enter your email and password."); return; }

  if (mode === "signup") {
    const name = $("authName").value.trim();
    if (!name) { msg("Enter your first name."); return; }
    if (password.length < 6) { msg("Choose a password of at least 6 characters."); return; }
    if (password !== $("authPass2").value) { msg("The two passwords don't match."); return; }

    msg("Creating your account…");
    const { data, error } = await client.auth.signUp({
      email, password, options: { data: { name } }
    });
    if (error) {
      if (/already registered/i.test(error.message)) {
        setMode("login");
        msg("That email already has an account. Log in instead.");
      } else {
        msg(error.message);
      }
      return;
    }
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      setMode("login");
      msg("That email already has an account. Log in instead.");
      return;
    }
    if (data.session) {
      msg("Welcome, " + name + "! Your account is ready.");
    } else {
      setMode("login");
      msg("Account created. Check your email to confirm it, then log in.");
    }
  } else {
    msg("Logging in…");
    const { error } = await client.auth.signInWithPassword({ email, password });
    if (error) {
      if (/invalid login/i.test(error.message)) {
        msg("Wrong email or password. New here? Tap Create account.");
      } else if (/confirm/i.test(error.message)) {
        msg("Please confirm your email first. Check your inbox.");
      } else {
        msg(error.message);
      }
      return;
    }
    msg("");
  }
  $("authPass").value = "";
  $("authPass2").value = "";
});

  $("signOutBtn").addEventListener("click", async () => {
    if (localStorage.getItem("syncDirty") === "1") {
      const saved = await push();
      if (!saved && !confirm("Some changes aren't saved online yet. Log out and lose them?")) return;
    }
    // Clear this device so the next person on a shared phone doesn't see your data.
    KEYS.forEach(k => localStorage.removeItem(k));
    ["syncedAt", "syncedUser", "syncDirty", "ssUser"].forEach(k => localStorage.removeItem(k));
    await client.auth.signOut();
    location.reload();
  });
})();
