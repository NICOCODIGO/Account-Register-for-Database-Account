const $ = (id) => document.getElementById(id);
const DB_KEY = "secret.users";
const readUsers  = () => JSON.parse(localStorage.getItem(DB_KEY) || "{}");
const writeUsers = (obj) => localStorage.setItem(DB_KEY, JSON.stringify(obj));
const norm = (u) => (u||"").trim().toLowerCase();

async function sha256(text){
  const enc = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return [...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,"0")).join("");
}

const msg = $("rMsg");
function say(type, text){
  msg.className = "msg " + (type==="err"?"err":"ok");
  msg.innerHTML = text;
}

// show/hide password
$("rShow").addEventListener("change", e=>{
  const t = e.target.checked ? "text" : "password";
  $("rPass").type = t;
  $("rConfirm").type = t;
});

$("regForm").addEventListener("submit", async (e)=>{
  e.preventDefault();
  const user = norm($("rUser").value);
  const p1 = $("rPass").value;
  const p2 = $("rConfirm").value;

  if(!user || !p1 || !p2) return say("err", "Fill out all fields.");
  if(p1.length < 6)       return say("err", "Password must be at least 6 characters.");
  if(p1 !== p2)           return say("err", "Passwords do not match.");

  const users = readUsers();
  if(users[user]) return say("err", "That username is taken.");

  const hash = await sha256(p1 + "|" + user);
  users[user] = { hash, createdAt: Date.now() };
  writeUsers(users);

  say("ok", "Account created. Redirecting to sign in…");
  setTimeout(()=> location.href = "index.html", 900);
});
