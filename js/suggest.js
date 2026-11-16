// suggest.js - NAYI FILE: Master Menu se "Suggestions" panel. Baaki site ko nahi chhuta.
// Ye sirf MENU (data.js) ko padhta hai, aur menu.js ke toggleDish() / refresh() ko hi use karta hai.
// Hataana ho to index.html se is file ka <script> tag hata do, site pehle jaisi chalegi.
(function () {
  // 1) Ready-made menus: har dish ka naam data.js se bilkul match hona chahiye
  var COMBOS = [
    { name: "Simple Veg Menu", tag: "Budget friendly",
      dishes: ["टमाटर सूप","मिक्स चाट","दही बड़ा","दाल मखनी","मटर पनीर","आलू मेथी","वेजिटेबल पुलाव","नान","लच्छा पराठा","रसगुल्ला","गाजर हलवा","मिक्स जूस"] },
    { name: "Rajasthani Menu", tag: "Traditional",
      dishes: ["राजस्थानी राबड़ी","मोठ-राजस्थानी","राज कचोरी","बाटी–3 तरह की","पंचमेला दाल","जोधपुरी गट्टा","चुरमा जरीपला","बाजरे की रोटी","बुन्दी रायता","जलेबी रबड़ी","कांजी पकौड़ी"] },
    { name: "Chaat & Fast Food Party", tag: "Birthday / Kitty",
      dishes: ["गोलगप्पा 2 तरह का पानी 5 तरह का","आलू टिक्की","पाँव भाजी","भेल मुड़ी","पास्ता लाईव","पीजा","हाका नूडल्स","मनचूरियन","बर्गर","जलेबी रबड़ी","मोकटेल"] },
    { name: "Premium Wedding Menu", tag: "Grand",
      dishes: ["ब्रोकली क्रीम सूप","पनीर टिक्का 3 तरह का","राज कचोरी","दाल मखनी","पनीर कोरमा","नवरतन कोरमा","स्टफ नान","नवरतन पुलाव","रस मलाई","मोहन भोग","गुलाब जामुन बेक्ड","अनार जूस"] }
  ];
  // 2) "Menu poora karo": agar customer ne in sections me kuch nahi chuna, to 3 popular dishes suggest hongi
  var NEED = [
    { id: "soup",  label: "Soup",         pick: ["टमाटर सूप","ब्रोकली सूप","राजस्थानी राबड़ी"] },
    { id: "chaat", label: "Starter/Chaat",pick: ["मिक्स चाट","आलू टिक्की","पनीर टिक्का 3 तरह का"] },
    { id: "sabzi", label: "Dal/Sabzi",    pick: ["दाल मखनी","मटर पनीर","पनीर कोरमा"] },
    { id: "bread", label: "Roti/Nan",     pick: ["नान","लच्छा पराठा","स्टफ नान"] },
    { id: "rice",  label: "Rice",         pick: ["वेजिटेबल पुलाव","प्लेन चावल","नवरतन पुलाव"] },
    { id: "dahi",  label: "Raita",        pick: ["बुन्दी रायता","दही बड़ा","वेजिटेबल रायता"] },
    { id: "sweet", label: "Sweet",        pick: ["गुलाब जामुन बेक्ड","रस मलाई","गाजर हलवा"] },
    { id: "drink", label: "Drink",        pick: ["मिक्स जूस","अनार जूस","मैंगो शेक"] }
  ];

  function keyOf(dish) {                       // "section|dish" key, jaise menu.js me hota hai
    for (var i = 0; i < MENU.length; i++) if (MENU[i].items.indexOf(dish) !== -1) return MENU[i].id + "|" + dish;
    return null;                               // data.js me nahi mila -> chup-chaap chhod do
  }
  function has(secId) {                        // kya customer ne is section se kuch chuna hai?
    return picked.some(function (k) { return k.split("|")[0] === secId; });
  }
  function el(tag, text, cls) { var e = document.createElement(tag); if (text) e.textContent = text; if (cls) e.className = cls; return e; }

  function addCombo(c) {                       // combo ki saari dishes add (jo pehle se chuni hain unhe chhod kar)
    c.dishes.forEach(function (d) { var k = keyOf(d); if (k && picked.indexOf(k) === -1) toggleDish(k); });
  }

  var box;
  function render() {
    if (!box) return;
    box.innerHTML = "";
    box.appendChild(el("h3", "Suggested menus"));
    box.appendChild(el("p", "Ek tap me poora menu add karo. Baad me dishes hata ya jod sakte ho."));
    var row = el("div", "", "sug-row");
    COMBOS.forEach(function (c) {
      var card = el("div", "", "sug-card");
      var n = c.dishes.filter(function (d) { return keyOf(d); }).length;
      card.appendChild(el("b", c.name)); card.appendChild(el("small", " " + c.tag));
      card.appendChild(el("p", c.dishes.slice(0, 5).join(", ") + " ..."));
      var b = el("button", "Add " + n + " dishes", "quote-btn"); b.onclick = function () { addCombo(c); };
      card.appendChild(b); row.appendChild(card);
    });
    box.appendChild(row);
    // Menu poora karo
    var missing = NEED.filter(function (s) { return !has(s.id); });
    if (picked.length > 0 && missing.length) {
      box.appendChild(el("h3", "Complete your menu"));
      missing.forEach(function (s) {
        var line = el("div", "", "sug-line"); line.appendChild(el("b", s.label + ": "));
        s.pick.forEach(function (d) { var k = keyOf(d); if (!k) return;
          var c = el("button", "+ " + d, "chip"); c.onclick = function () { toggleDish(k); }; line.appendChild(c); });
        box.appendChild(line);
      });
    } else if (picked.length > 0) box.appendChild(el("p", "Your menu has every course. Looks complete!"));
  }

  function start() {
    var tabs = document.getElementById("tabs");
    if (!tabs || typeof MENU === "undefined" || typeof toggleDish !== "function") return;   // kuch gadbad ho to site ko mat todo
    box = el("div", "", "picked-box sug-box"); box.style.textAlign = "left";
    tabs.parentNode.insertBefore(box, tabs);       // "tabs" ke theek upar panel lagao
    var oldRefresh = refresh;                      // menu.js ka refresh() yaad rakho...
    refresh = function () { oldRefresh(); render(); };   // ...aur uske baad apna panel bhi naya karo
    render();
  }
  start();
})();
