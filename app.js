function $(id) {
  return document.getElementById(id);
}


/* ========= Keys for localStorage/session ========= */
const DB_KEY = "secret.users";
const SESSION_KEY = "secret.session";


/* ========= Read/Write users (more explicit + safe) ========= */ 
function readUsers() {
  const raw = localStorage.getItem(DB_KEY);
  const fallback = "{}";
  try {
    const parsed = JSON.parse(raw ?? fallback);
    return parsed || {};
  } catch {
    return {};
  }
}

function writeUsers(obj) {
  const jsonText = JSON.stringify(obj);
  localStorage.setItem(DB_KEY, jsonText);
}

async function sha256(text) {
  const encoder = new TextEncoder();
  const inputBytes = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", inputBytes);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  return hex;
}

function norm(u) {
  const safe = u ?? "";
  const trimmed = safe.trim();
  const lowered = trimmed.toLowerCase();
  return lowered;
}

// keeps the html aspect 
function say(type, text) {
  const msgEl = $("msg");
  if (!msgEl) return;
  let cls = "msg";
  if (type === "ok") cls += " ok";
  else if (type === "err") cls += " err";
  msgEl.className = cls;
  msgEl.innerHTML = text;
}

// ===== data to render after login =====
const PEOPLE = [
  { name:"Walter White",  email:"WalterWhite@example.com",  phone:"(212) 555-0198", address:"308 Negra Arroyo Lane, Albuquerque, NM" },
  { name:"Skyler White",   email:"SkylerWhite@example.com",   phone:"(212) 555-0198", address:"308 Negra Arroyo Lane, Albuquerque, NM" },
  { name:"Jesse Pinkman",  email:"jesse.pinkman@example.com",  phone:"(505) 148-3369", address:"9801 Margo St, Albuquerque, NM" },
  { name:"Mike Ehrmantraut",   email:"mike.ehrmantraut@example.com",   phone:"(646) 555-3110", address:"1001 5th St, Albuquerque, NM" },
  { name:"Tony Soprano",    email:"tony.soprano@example.com",    phone:"(201) 555-7744", address:"14 Aspen Dr, North Caldwell, NJ" },
  { name:"Peter Parker",      email:"peter.parker@example.com",      phone:"(973) 555-0077", address:"410 Chelsea St, Manhattan, NY" },
  { name:"Sherlock Holmes",     email:"sherlock.holmes@example.com",     phone:"(732) 555-9922", address:"221B Baker Street, London, UK" },
  { name:"Homer Simpson", email:"homer.simpson@example.com", phone:"(908) 555-5535", address:"742 Evergreen Terrace, Springfield, USA" },
  { name:"Ivy Chen",       email:"ivy.chen@example.com",       phone:"(551) 555-8844", address:"233 Elm St, Hackensack, NJ" },
  { name:"Gale Boetticher",    email:"gale.boetticher@example.com",    phone:"(646) 555-1234", address:"6353 Juan Tabo Blvd NE, Albuquerque, NM" },
];

function renderTable(rows){
  const table = $("peopleTable");
  table.innerHTML = "";
  const head = document.createElement("thead");
  head.innerHTML = `<tr><th>Name</th><th>Email</th><th>Phone</th><th>Address</th></tr>`;
  const body = document.createElement("tbody");
  rows.forEach(r=>{
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${r.name}</td><td>${r.email}</td><td>${r.phone}</td><td>${r.address}</td>`;
    body.appendChild(tr);
  });
  table.append(head, body);
}

// ===== page wiring =====
const form = $("auth");               
const directory = $("directory");
const portal = $("portal");

// show/hide password
$("showpw").addEventListener("change", e=>{
  $("password").type = e.target.checked ? "text" : "password";
});

// go to register page
$("registerBtn").addEventListener("click", ()=>{
  location.href = "register.html";
});

// ================= TO SIGN IN =======================
form.addEventListener("submit", async (e)=>{
  e.preventDefault();
  const user = norm($("username").value);
  const pw   = $("password").value;

  if(!user || !pw) return say("err", "Missing <b>username</b> or <b>password</b>.");

  const users = readUsers();
  const rec = users[user];
  if(!rec) return say("err", "No account found. Click <b>Register</b> first.");

  const hash = await sha256(pw + "|" + user);
  if(hash !== rec.hash) return say("err", "Incorrect password.");

  // success: persist session + show table
  localStorage.setItem(SESSION_KEY, JSON.stringify({ user, ts: Date.now() }));
  document.body.classList.add("authed"); 
  say("ok", "Signed in as " + user);
  form.hidden = true;
  directory.hidden = false;
  renderTable(PEOPLE);
});

// sign out
$("signOutBtn").addEventListener("click", ()=>{
  localStorage.removeItem(SESSION_KEY);
  document.body.classList.remove("authed"); // hide directory, show form. this allows signing in again and keeps the page from losing its css style when logging out to it
  directory.hidden = true;
  form.hidden = false;
  form.reset();
  $("showpw").checked = false;
  $("password").type = "password";
  say("", ""); // clear message
}); 

// auto-restore session on page load
(function restore(){
  try{
    const sess = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
    if(sess && sess.user){
      document.body.classList.add("authed"); 
      form.hidden = true;
      directory.hidden = false;
      renderTable(PEOPLE);
      say("ok", "Welcome back, " + sess.user);
    }
  }catch{    
    document.body.classList.remove("authed");       //this is just a safety measure a fallback 
  }
})();