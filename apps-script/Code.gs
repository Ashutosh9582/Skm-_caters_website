/**
 * SKM Caters backend (Google Apps Script Web App).
 * Serves: owner email alert for website enquiries, and optional testimonials from a Sheet tab.
 * Runs as the owner, so no keys or secrets ever appear in the website code.
 * Setup: see SETUP.md (step 4)
 */
var CFG = {
  OWNER_EMAIL: "ashutoshbeel@gmail.com",
  CACHE_SECONDS: 600
};

function doGet(e) {
  var a = (e.parameter.action || "");
  try {
    if (a === "testimonials") return json(cached("testi", listTestimonials));
    if (a === "refresh") { CacheService.getScriptCache().removeAll(["testi"]); return json({ ok: true }); }
  } catch (err) { return json({ ok: false, error: String(err) }); }
  return json({ ok: false, error: "Unknown action" });
}

function cached(key, fn) {
  var c = CacheService.getScriptCache(), hit = c.get(key);
  if (hit) return JSON.parse(hit);
  var data = fn(); c.put(key, JSON.stringify(data), CFG.CACHE_SECONDS); return data;
}

// Testimonials live in the Sheet tab "Testimonials": Name | Event | Text | Approved (TRUE/FALSE)
function listTestimonials() {
  var sh = sheet_("Testimonials", ["Name", "Event", "Text", "Approved"]);
  var rows = sh.getDataRange().getValues().slice(1), items = [];
  rows.forEach(function (r) { if (r[3] === true && r[2]) items.push({ name: r[0], event: r[1], text: r[2] }); });
  return { ok: true, items: items };
}

/**
 * Enquiry email alert. The enquiry itself is saved by the website straight into V6 (Supabase);
 * this only emails the owner. Validates again and limits to 30 emails per hour against spam.
 */
function doPost(e) {
  try {
    var d = JSON.parse(e.postData.contents);
    if (d.website) return json({ ok: true });                       // honeypot
    var c = {};
    ["name", "email", "phone", "eventType", "eventDate", "location", "guests", "message"].forEach(function (k) { c[k] = String(d[k] || "").trim().slice(0, 1000); });
    if (!c.name || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(c.email)) return json({ ok: false, error: "Invalid" });
    var ph = c.phone.replace(/[\s-]/g, "");
    if (!/^(\+?91)?[6-9]\d{9}$/.test(ph)) return json({ ok: false, error: "Invalid" });
    var num = "91" + ph.slice(-10);

    var cache = CacheService.getScriptCache(), n = Number(cache.get("mails") || 0);
    if (n >= 30) return json({ ok: false, error: "Busy" });
    cache.put("mails", String(n + 1), 3600);

    var key = "d" + Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, c.email.toLowerCase() + num + c.eventType + c.eventDate + new Date().toDateString()));
    if (cache.get(key)) return json({ ok: true, duplicate: true });  // same enquiry today: no second email
    cache.put(key, "1", 21600);

    var wa = "https://wa.me/" + num + "?text=" + encodeURIComponent("Hello " + c.name + ", thank you for your enquiry with SKM Caters. We would be happy to help plan your event.");
    MailApp.sendEmail({ to: CFG.OWNER_EMAIL, replyTo: c.email, subject: "New website enquiry: " + c.name + (c.eventType ? " (" + c.eventType + ")" : ""),
      body: ["Name: " + c.name, "Email: " + c.email, "WhatsApp: +" + num, "Event: " + c.eventType, "Date: " + c.eventDate, "Location: " + c.location, "Guests: " + c.guests, "", c.message, "", "Reply on WhatsApp: " + wa, "", "Manage it in the V6 app: More > Website Enquiries"].join("\n") });
    return json({ ok: true });
  } catch (err) { return json({ ok: false, error: "Server error" }); }
}

function sheet_(name, header) {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name); sh.appendRow(header); sh.setFrozenRows(1);
    if (name === "Enquiries") sh.getRange("B2:B1000").setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(["New", "Read", "Contacted", "Confirmed", "Closed"], true).build());
    if (name === "Testimonials") sh.getRange("D2:D1000").insertCheckboxes();
  }
  return sh;
}
function json(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
