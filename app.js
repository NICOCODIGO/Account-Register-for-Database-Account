// ===== utilities =====
const $ = (id) => document.getElementById(id);
const DB_KEY = "secret.users";
const SESSION_KEY = "secret.session";

const readUsers  = () => JSON.parse(localStorage.getItem(DB_KEY) || "{}");
const writeUsers = (obj) => localStorage.setItem(DB_KEY, JSON.stringify(obj));

async function sha256(text){
  const enc = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return [...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,"0")).join("");
}
const norm = (u) => (u||"").trim().toLowerCase();

function say(type, text){
  const msg = $("msg");
  msg.className = "msg " + (type === "err" ? "err" : type === "ok" ? "ok" : "");
  msg.innerHTML = text;
}

// ===== data to render after login =====
const PEOPLE = [
  { name:"Walter White",  email:"WalterWhite@example.com",  phone:"(212) 555-0198", address:"308 Negra Arroyo Lane, Albuquerque, NM" },
  { name:"Skyler White",   email:"SkylerWhite@example.com",   phone:"(212) 555-0198", address:"308 Negra Arroyo Lane, Albuquerque, NM" },
  { name:"Jesse Pinkman",  email:"jesse.pinkman@example.com",  phone:"(505) 148-3369", address:"9801 Margo St, Albuquerque, NM" },
  { name:"Mike Ehrmantraut",   email:"mike.ehrmantraut@example.com",   phone:"(646) 555-3110", address:"1001 5th St, Albuquerque, NM" },
  { name:"Tony Sopranos",    email:"tony.sopranos@example.com",    phone:"(201) 555-7744", address:"14 aspen dr, north caldwell, NJ" },
  { name:"Peter Parker",      email:"peter.parker@example.com",      phone:"(973) 555-0077", address:"410 chelsea st, Manhattan, NY" },
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

// the sign in
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