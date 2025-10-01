// ========================= HELPERS =========================
function $(id) {
  return document.getElementById(id);
}

const DB_KEY = "secret.users";

function readUsers() {
  const raw = localStorage.getItem(DB_KEY); 
  const safe = raw || "{}";      // default to empty object if nothing is inputed 
  return JSON.parse(safe);
}

function writeUsers(obj) {
  const json = JSON.stringify(obj);  // objects must be saved as strings
  localStorage.setItem(DB_KEY, json);
}

function norm(u) {
  const safe = u || "";          
  return safe.trim().toLowerCase();
}

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

// ========================= THE PASSWORD SECTION =========================


//this is just to collect the user input
const showPasswordsCheckbox = $("rShow"); //the "show passwords" checkbox, does not actually show passwords yet, the event does that
const passwordField = $("rPass"); // where the user types their password
const confirmPasswordField = $("rConfirm"); // where the user retypes their password to confirm it


function setPasswordFieldTypes(shouldShow) {
  const newType = shouldShow ? "text" : "password"; // the 'text' type shows the password, the 'password' type mask it

  if (passwordField)
     passwordField.type = newType; // after the bracket, copy the same text and add .type = newType; this changes the type of the input field

  if (confirmPasswordField)
     confirmPasswordField.type = newType; //same as before but for the confirm password field
}


//======================== A lot going on when the user clicks the show passwords checkbox =========================

function handleShowPasswordsChange(event) { // the 'function' word creates a function named handleShowPasswordsChange, and the event programs the function to run when the checkbox is clicked
  const checkbox = event.target; // event.target is the checkbox that was clicked
  const isChecked = checkbox.checked === true; // checks if the checkbox is checked or not, if it is checked, isChecked will be true, if not, it will be false
  
  setPasswordFieldTypes(isChecked);
  const label = document.querySelector('label[for="rShow"]'); //in the register.html theres a lot of 'label', this line finds the one that is for the rShow checkbox
  
  if (label) label.textContent = isChecked ? "Hide passwords" : "Show passwords"; //this is where it actually shows the password plain text 
  checkbox.setAttribute("aria-checked", String(isChecked)); //this is for screen readers, it tells the screen reader if the checkbox is checked or not
}

if (showPasswordsCheckbox) {
  setPasswordFieldTypes(showPasswordsCheckbox.checked);
  showPasswordsCheckbox.addEventListener("change", handleShowPasswordsChange); 
}


// ========================= FORM SUBMISSION =========================


$("regForm").addEventListener("submit", async (e) => { // when the form is submitted, this function runs
  e.preventDefault();

  const userInput = $("rUser");
  const passInput = $("rPass");
  const confirmInput = $("rConfirm");

  const username = norm(userInput?.value);
  const p1 = passInput?.value ?? "";
  const p2 = confirmInput?.value ?? "";

  if (!username || !p1 || !p2) { // checks if any of the fields are empty
    say("err", "Fill out all fields.");
    return;
  }
  if (p1.length < 6) {
    say("err", "Password must be at least 6 characters."); 
    return;
  }
  if (p1 !== p2) {
    say("err", "Passwords do not match.");
    return;
  }

  const existingUsers = readUsers();
  if (Object.prototype.hasOwnProperty.call(existingUsers, username)) {
    say("err", "That username is taken.");
    return;
  }

  let passwordHash;
  try {
    const saltedInput = `${p1}|${username}`; 
    passwordHash = await sha256(saltedInput);
  } catch {
    say("err", "Could not hash the password.");
    return;
  }

  const newUserRecord = { hash: passwordHash, createdAt: Date.now() };
  const updatedUsers = { ...existingUsers, [username]: newUserRecord };
  writeUsers(updatedUsers);

  say("ok", "Account created. Redirecting to sign in…");  
  setTimeout(() => { location.href = "index.html"; }, 900); //redirect to sign in page after 0.9 seconds (900 milliseconds)
});
