// CHANGE 3: form ids renamed name->bName etc. (b = booking form at the bottom of the page), email/phone come from config.js.
// menu.js - logic of the Menu page, in simple JavaScript.
// MENU (the dish list) comes from data.js, which is loaded before this file.

var picked = [];       // dishes the customer has ticked, like ["soup|रसम", "sweet|रस मलाई"]
var current = 0;       // which section is open (0 = Soups, 1 = Drinks ...)

// Step 1: draw the section buttons (Soups, Drinks, ...) inside <div id="tabs">
function showTabs() {
  var box = document.getElementById("tabs");
  box.innerHTML = "";                                   // clear old buttons
  for (var i = 0; i < MENU.length; i++) {               // loop over every section
    var b = document.createElement("button");           // make a new <button>
    b.className = (i === current) ? "tab on" : "tab";   // highlight the open section
    b.textContent = MENU[i].hi + " " + MENU[i].en;      // text on the button
    b.onclick = (function (n) {                         // what happens on click:
      return function () { current = n; document.getElementById("search").value = ""; showTabs(); showDishes(); };
    })(i);
    box.appendChild(b);                                 // put the button on the page
  }
}

// Step 2: draw the dishes of the open section, filtered by the search box
function showDishes() {
  var section = MENU[current];
  var word = document.getElementById("search").value.trim();   // text typed in search
  var box = document.getElementById("dishes");
  box.innerHTML = "";
  for (var i = 0; i < section.items.length; i++) {
    var dish = section.items[i];
    if (dish.indexOf(word) === -1) continue;            // skip dishes that do not contain the search word
    var b = document.createElement("button");
    var key = section.id + "|" + dish;                  // unique name of this dish
    b.className = (picked.indexOf(key) !== -1) ? "chip on" : "chip";   // gold if already picked
    b.textContent = dish;
    b.onclick = (function (k) { return function () { toggleDish(k); }; })(key);
    box.appendChild(b);
  }
}

// Step 3: add the dish if not picked, remove it if already picked
function toggleDish(key) {
  var pos = picked.indexOf(key);        // position in list, or -1 if not there
  if (pos === -1) picked.push(key); else picked.splice(pos, 1);
  refresh();
}

// Update the counter, the list of picked dishes and the gold buttons
function refresh() {
  document.getElementById("count").textContent = picked.length;
  var names = picked.map(function (k) { return k.split("|")[1]; });   // keep only the dish name
  document.getElementById("pickedList").textContent = names.length ? names.join(", ") : "Nothing selected yet.";
  showDishes();
}

function clearAll() { picked = []; refresh(); }

// Step 4: write the enquiry text that will be sent
function buildMessage() {
  var lines = ["New menu enquiry - SKM Caters",
    "Name: " + document.getElementById("bName").value,
    "Phone: " + document.getElementById("bPhone").value,
    "Event: " + document.getElementById("bEvent").value,
    "Guests: " + document.getElementById("bGuests").value,
    "Date: " + document.getElementById("bDate").value,
    "Note: " + document.getElementById("bNote").value, "",
    "Dishes (" + picked.length + "):"];
  for (var i = 0; i < MENU.length; i++) {                // group dishes by section
    var got = [];
    for (var j = 0; j < picked.length; j++)
      if (picked[j].indexOf(MENU[i].id + "|") === 0) got.push(picked[j].split("|")[1]);
    if (got.length) lines.push(MENU[i].hi + ": " + got.join(", "));
  }
  return lines.join("\n");
}

// Check that name, phone and at least one dish are filled
function formOk() {
  if (!document.getElementById("bName").value.trim() || !document.getElementById("bPhone").value.trim() ) {
    alert("Please add your name and phone.");
    return false;
  }
  return true;
}

// Step 5 (CHANGE 21): form submit = database + owner ko email. WhatsApp button alag se customer ke phone se khulta hai.
function sendEnquiry() {
  if (!formOk()) return;
  var d = { name: document.getElementById("bName").value, phone: document.getElementById("bPhone").value, event: document.getElementById("bEvent").value,
            guests: document.getElementById("bGuests").value, date: document.getElementById("bDate").value, dishes: picked.map(function (k) { return k.split("|")[1]; }) };
  var btn = document.getElementById("bSend"); btn.disabled = true; btn.textContent = "Sending...";
  saveEnquiry(d, buildMessage()).then(function (ok) {
    btn.disabled = false; btn.textContent = "Send enquiry";
    alert(ok ? "Thank you! We will contact you soon." : "Could not send. Karan: " + lastError);
  });
}
function sendWhatsApp() {
  if (!formOk()) return;
  window.open("https://wa.me/" + SKM_PHONE + "?text=" + encodeURIComponent(buildMessage()), "_blank");
}

// CHANGE 22: Event card par "Plan this event" dabao -> event select hota hai aur seedha Menu section khulta hai
function chooseEvent(name) {
  document.getElementById("bEvent").value = name;                 // booking form me event pehle se bhar do
  document.getElementById("eventBar").style.display = "block";    // menu ke upar "Planning: Wedding" bar dikhao
  document.getElementById("eventName").textContent = name;
  var box = document.getElementById("suggest"); box.innerHTML = "";
  (EVENT_DISHES[name] || []).forEach(function (dish) {            // suggested dishes ke buttons
    var key = findKey(dish); if (!key) return;
    var b = document.createElement("button"); b.className = picked.indexOf(key) !== -1 ? "chip on" : "chip"; b.textContent = "+ " + dish;
    b.onclick = function () { toggleDish(key); chooseEvent(name); }; box.appendChild(b);
  });
  document.getElementById("menu").scrollIntoView({ behavior: "smooth" });   // seedha menu creation par
}
function findKey(dish) {   // dish ka "section|naam" key dhundo
  for (var i = 0; i < MENU.length; i++) if (MENU[i].items.indexOf(dish) !== -1) return MENU[i].id + "|" + dish;
  return null;
}

// When the page opens, draw everything once
showTabs();
showDishes();
