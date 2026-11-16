// reviews.js - CHANGE 20: reviews ab database (Firestore) se aate hain, owner.html se approve hote hain.
var REVIEWS = [];   // approved reviews yahan aate hain

function drawReviews(boxId, max) {
  var box = document.getElementById(boxId);
  if (!box) return;
  box.innerHTML = "";
  if (REVIEWS.length === 0) { box.innerHTML = "<p>No reviews yet. Be the first to write one below.</p>"; return; }
  for (var i = 0; i < REVIEWS.length && i < max; i++) {
    var r = REVIEWS[i];
    var col = document.createElement("div"); col.className = "col-md-6 col-lg-4";
    var card = document.createElement("div"); card.className = "rev-card";
    var stars = document.createElement("div"); stars.className = "stars";
    stars.textContent = "\u2605".repeat(r.rating) + "\u2606".repeat(5 - r.rating);   // filled + empty stars
    var text = document.createElement("p"); text.textContent = r.text;               // textContent = safe, HTML chalta nahi
    var who = document.createElement("b"); who.textContent = r.name + " ";
    var ev = document.createElement("small"); ev.textContent = r.event;
    card.append(stars, text, who, ev); col.appendChild(card); box.appendChild(col);
  }
}

// Page khulte hi approved reviews database se lao (approved == true, naye pehle)
function showReviews(boxId, max) {
  if (!dbReady()) { drawReviews(boxId, max); return; }
  db.collection("reviews").where("approved", "==", true).get().then(function (snap) {
    REVIEWS = snap.docs.map(function (d) { return d.data(); }).sort(function (a, b) { return b.created - a.created; });
    drawReviews(boxId, max);
  }).catch(function () { drawReviews(boxId, max); });
}

// Review form: ek hi button. Database + owner ko email.
function sendReview() {
  var name = document.getElementById("rName").value.trim(), text = document.getElementById("rText").value.trim();
  if (!name || !text) { alert("Please add your name and your review."); return; }
  var r = { name: name, event: document.getElementById("rEvent").value, rating: Number(document.getElementById("rRating").value), text: text };
  var msg = "New review for SKM Caters\nName: " + r.name + "\nEvent: " + r.event + "\nRating: " + r.rating + "/5\n\n" + r.text;
  var btn = document.getElementById("rSend"); btn.disabled = true; btn.textContent = "Sending...";
  saveReview(r, msg).then(function (ok) {
    btn.disabled = false; btn.textContent = "Submit review";
    if (ok) { alert("Thank you! Your review will appear after we check it."); document.getElementById("rName").value = ""; document.getElementById("rText").value = ""; }
    else alert("Review nahi gaya. Karan: " + lastError);   // CHANGE 26: asli karan dikhao
  });
}
