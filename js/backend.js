// backend.js - database + email. Firebase "compat" version (simple, no build tools).
var db = null, auth = null;
var lastError = "";   // CHANGE 26: fail hone ka karan yahan rakha jata hai, alert me dikhane ke liye
function dbReady() { return db !== null; }
if (typeof firebase === "undefined") lastError = "Firebase script load nahi hui (internet check karo)";
else if (FIREBASE_CONFIG.projectId === "PASTE_HERE") lastError = "js/config.js me Firebase keys abhi PASTE_HERE hain";
if (typeof firebase !== "undefined" && FIREBASE_CONFIG.projectId !== "PASTE_HERE") {
  firebase.initializeApp(FIREBASE_CONFIG);     // site ko Firebase se jodta hai
  db = firebase.firestore();                   // Firestore = database (collections: reviews, photos, enquiries)
  auth = firebase.auth();                      // sirf owner login ke liye
}

// Owner ko email bhejta hai (Web3Forms). Fail ho jaye to bhi baaki kaam rukta nahi.
function emailOwner(subject, text) {
  if (WEB3FORMS_KEY === "PASTE_HERE") { lastError += " | Web3Forms key PASTE_HERE hai"; return Promise.resolve(false); }
  return fetch("https://api.web3forms.com/submit", {
    method: "POST", headers: { "Content-Type": "application/json", "Accept": "application/json" },
    body: JSON.stringify({ access_key: WEB3FORMS_KEY, subject: subject, from_name: "SKM Caters website", message: text })
  }).then(function (r) { return r.ok; }).catch(function () { return false; });
}

// Enquiry: database me save + owner ko email. Dono me se ek bhi chale to success.
function saveEnquiry(data, text) {
  var saved = dbReady() ? db.collection("enquiries").add(Object.assign({ created: Date.now() }, data)).then(function () { return true; }).catch(function (e) { lastError = "Database: " + e.message; console.error(e); return false; }) : Promise.resolve(false);
  return Promise.all([saved, emailOwner("New enquiry - " + data.name, text)]).then(function (r) { return r[0] || r[1]; });
}

// Review: approved:false ke saath save hota hai, owner approve kare tab hi site par dikhta hai.
function saveReview(r, text) {
  var saved = dbReady() ? db.collection("reviews").add(Object.assign({ approved: false, created: Date.now() }, r)).then(function () { return true; }).catch(function (e) { lastError = "Database: " + e.message; console.error(e); return false; }) : Promise.resolve(false);
  return Promise.all([saved, emailOwner("New review - " + r.name, text)]).then(function (x) { return x[0] || x[1]; });
}
