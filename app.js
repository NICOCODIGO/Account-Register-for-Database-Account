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
  { name:"Alice Johnson",  email:"alice.johnson@example.com",  phone:"(212) 555-0198", address:"120 Maple St, Brooklyn, NY" },
  { name:"Brian Lee",      email:"brian.lee@example.com",      phone:"(917) 555-2266", address:"44 5th Ave, New York, NY" },
  { name:"Carmen Diaz",    email:"carmen.diaz@example.com",    phone:"(718) 555-4420", address:"88 Grove Rd, Queens, NY" },
  { name:"Darren Patel",   email:"darren.patel@example.com",   phone:"(646) 555-3110", address:"9 Liberty Pl, Jersey City, NJ" },
  { name:"Elena Rossi",    email:"elena.rossi@example.com",    phone:"(201) 555-7744", address:"510 Ridge Blvd, Fort Lee, NJ" },
  { name:"Felix Kim",      email:"felix.kim@example.com",      phone:"(973) 555-0077", address:"42 Cedar St, Newark, NJ" },
  { name:"Grace Park",     email:"grace.park@example.com",     phone:"(732) 555-9922", address:"101 Ocean Ave, Long Branch, NJ" },
  { name:"Hector Alvarez", email:"hector.alvarez@example.com", phone:"(908) 555-5535", address:"75 Main St, Elizabeth, NJ" },
  { name:"Ivy Chen",       email:"ivy.chen@example.com",       phone:"(551) 555-8844", address:"233 Elm St, Hackensack, NJ" },
  { name:"Jacob Brown",    email:"jacob.brown@example.com",    phone:"(646) 555-1234", address:"700 West End Ave, New York, NY" },
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

// sign in
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
  say("ok", "Signed in as " + user);
  form.hidden = true;
  directory.hidden = false;
  renderTable(PEOPLE);
});

// sign out
$("signOutBtn").addEventListener("click", ()=>{
  localStorage.removeItem(SESSION_KEY);
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
      form.hidden = true;
      directory.hidden = false;
      renderTable(PEOPLE);
      say("ok", "Welcome back, " + sess.user);
    }
  }catch{}
})();
