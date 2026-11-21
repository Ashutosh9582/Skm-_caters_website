/* SKM Caters public site. Vanilla JS, no libraries.
   Gallery + testimonials + enquiries use the same Supabase project as the V6 app (public key, row-level security). */
(function () {
  "use strict";
  document.documentElement.classList.add("js");
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var API = window.SKM.api, hasApi = API.indexOf("http") === 0;
  var SBC = window.SKM.supabase, sbOk = SBC.url.indexOf("http") === 0;
  function esc(s) { var d = document.createElement("div"); d.textContent = s == null ? "" : s; return d.innerHTML; }

  // Header: solid after scrolling, mobile menu, active link
  var hdr = $("#hdr"), nav = $("#nav"), burger = $(".burger");
  function onScroll() { hdr.classList.toggle("solid", window.scrollY > 40); }
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();
  burger.addEventListener("click", function () { var o = nav.classList.toggle("open"); burger.setAttribute("aria-expanded", o); });
  nav.addEventListener("click", function (e) { if (e.target.tagName === "A") { nav.classList.remove("open"); burger.setAttribute("aria-expanded", false); } });
  if ("IntersectionObserver" in window) {
    var links = {}; $$("#nav a[href^='#']").forEach(function (a) { links[a.getAttribute("href")] = a; });
    var spy = new IntersectionObserver(function (es) { es.forEach(function (e) { var a = links["#" + e.target.id]; if (a && e.isIntersecting) { $$("#nav a").forEach(function (x) { x.classList.remove("on"); }); a.classList.add("on"); } }); }, { rootMargin: "-45% 0px -50% 0px" });
    $$("main section[id]").forEach(function (s) { spy.observe(s); });
    var rv = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); rv.unobserve(e.target); } }); }, { threshold: .12 });
    $$(".rv").forEach(function (n) { rv.observe(n); });
  } else { $$(".rv").forEach(function (n) { n.classList.add("in"); }); }

  // WhatsApp floating button
  var PH = window.SKM.phone;
  $("#waBtn").href = "https://wa.me/" + PH + "?text=" + encodeURIComponent("Hello SKM Caters, I would like to know more about your catering services.");

  // Supabase REST (publishable key goes in "apikey" only; it is not a JWT)
  function sbHeaders(extra) {
    var h = { apikey: SBC.key };
    if (SBC.key.indexOf("sb_") !== 0) h.Authorization = "Bearer " + SBC.key;
    for (var k in extra) h[k] = extra[k];
    return h;
  }
  function sbGet(path) {
    return fetch(SBC.url + "/rest/v1/" + path, { headers: sbHeaders() }).then(function (r) { if (!r.ok) throw new Error("sb"); return r.json(); });
  }

  // Gallery: default theme photos first, replaced by published photos from the V6 app when there are any
  var grid = $("#galleryGrid"), filters = $("#filters"), photos = [], active = "All", custom = false;
  var DEFAULTS = []; for (var i = 1; i <= 10; i++) { var n = ("0" + i).slice(-2); DEFAULTS.push({ id: "d" + n, category: "", caption: "", thumb: "images/thumb_" + n + ".jpg", full: "images/gallery_" + n + ".jpg" }); }
  function drawFilters() {
    var cats = ["All"]; photos.forEach(function (p) { if (p.category && cats.indexOf(p.category) < 0) cats.push(p.category); });
    filters.hidden = !custom || cats.length < 3;
    filters.innerHTML = cats.map(function (c) { return '<button type="button" aria-pressed="' + (c === active) + '">' + esc(c) + "</button>"; }).join("");
  }
  function drawGallery() {
    var list = photos.filter(function (p) { return active === "All" || p.category === active; });
    grid.innerHTML = list.map(function (p) {
      return '<figure tabindex="0" data-i="' + photos.indexOf(p) + '"><img loading="lazy" decoding="async" width="560" height="420" src="' + esc(p.thumb) + '" alt="' + esc(p.caption || "SKM Caters food and event presentation") + '"></figure>';
    }).join("");
  }
  function setPhotos(list, isCustom) { photos = list; custom = isCustom; if (active !== "All" && !photos.some(function (p) { return p.category === active; })) active = "All"; drawFilters(); drawGallery(); }
  setPhotos(DEFAULTS, false);
  filters.addEventListener("click", function (e) { if (e.target.tagName === "BUTTON") { active = e.target.textContent; drawFilters(); drawGallery(); } });
  function loadGallery() {
    return sbGet("web_gallery?select=*&published=eq.true&order=featured.desc,sort_order.asc").then(function (rows) {
      var list = rows.filter(function (r) { return r.image_url; }).map(function (r) {
        var v = r.updated_at ? "?v=" + Date.parse(r.updated_at) : "";
        return { id: r.id, category: r.category || "Other Events", caption: [r.event_title, r.caption].filter(Boolean).join(": "), thumb: (r.thumb_url || r.image_url) + v, full: r.image_url + v };
      });
      setPhotos(list.length ? list : DEFAULTS, list.length > 0);
    });
  }
  if (sbOk) { loadGallery().catch(function () {}); setInterval(function () { if (!document.hidden) loadGallery().catch(function () {}); }, 60000); }

  // Lightbox
  var lb = $("#lightbox"), lbImg = $("img", lb), lbCap = $("p", lb);
  function open(f) { var p = photos[+f.dataset.i]; if (!p) return; lbImg.src = p.full; lbImg.alt = p.caption || ""; lbCap.textContent = p.caption || ""; lb.hidden = false; $(".lb-x", lb).focus(); }
  grid.addEventListener("click", function (e) { var f = e.target.closest("figure"); if (f) open(f); });
  grid.addEventListener("keydown", function (e) { if ((e.key === "Enter" || e.key === " ") && e.target.matches("figure")) { e.preventDefault(); open(e.target); } });
  function closeLb() { lb.hidden = true; lbImg.src = ""; }
  lb.addEventListener("click", function (e) { if (e.target !== lbImg) closeLb(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !lb.hidden) closeLb(); });

  // Testimonials (managed in the V6 app). The section is hidden until at least one is published.
  var tg = $("#testimonialGrid"), tsec = $("#reviews"), tlink = $("#nav a[href='#reviews']");
  function showReviews(on) { tsec.hidden = !on; if (tlink) tlink.hidden = !on; }
  showReviews(false);
  function loadTestimonials() {
    return sbGet("web_testimonials?select=*&published=eq.true&order=sort_order.asc").then(function (rows) {
      if (!rows.length) throw new Error("empty");
      tg.innerHTML = rows.map(function (t) { return '<article class="quote-card"><p>&ldquo;' + esc(t.review) + '&rdquo;</p><cite>' + esc(t.name) + (t.event_name ? ", " + esc(t.event_name) : "") + "</cite></article>"; }).join("");
      showReviews(true);
    });
  }
  if (sbOk) { loadTestimonials().catch(function () { showReviews(false); }); setInterval(function () { if (!document.hidden) loadTestimonials().catch(function () { showReviews(false); }); }, 60000); }

  // Enquiry form
  var form = $("#enquiryForm"), msg = $("#formMsg"), sel = form.elements.eventType;
  function say(t, ok) { msg.textContent = t; msg.className = "msg " + (ok ? "ok" : "err"); }
  $$(".plan").forEach(function (a) { a.addEventListener("click", function () { sel.value = a.dataset.event; }); });
  function values() { var d = {}; new FormData(form).forEach(function (v, k) { d[k] = String(v).trim(); }); return d; }
  function check(d) {
    if (!d.name) return "Please enter your full name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email)) return "Please enter a valid email address.";
    if (!/^(\+?91)?[6-9]\d{9}$/.test(d.phone.replace(/[\s-]/g, ""))) return "Please enter a valid Indian mobile number.";
    return "";
  }
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var d = values(), bad = check(d); if (bad) return say(bad);
    if (!sbOk) return say("The enquiry service is not configured yet. Please call or WhatsApp us.");
    if (d.hp_check) return say("Thank you. Your enquiry has been received and we will contact you shortly.", true); // spam trap
    var btn = $("button[type=submit]", form); btn.disabled = true; say("Sending your enquiry\u2026", true);
    var row = { name: d.name, email: d.email, phone: "+91" + d.phone.replace(/[\s-]/g, "").slice(-10), event_type: d.eventType || "", event_date: d.eventDate || null, location: d.location || "", guests: d.guests ? parseInt(d.guests, 10) : null, message: d.message || "" };
    // Saved straight into the V6 database. The server re-validates and ignores same-day duplicates.
    fetch(SBC.url + "/rest/v1/web_enquiries?on_conflict=dedupe_key", { method: "POST", headers: sbHeaders({ "Content-Type": "application/json", Prefer: "return=minimal,resolution=ignore-duplicates" }), body: JSON.stringify(row) })
      .then(function (r) {
        if (!r.ok) { return r.text().then(function (x) { var c = ""; try { c = JSON.parse(x).code || ""; } catch (e) {} console.error("Enquiry save failed", r.status, x); throw new Error(r.status + (c ? " " + c : "")); }); }
        if (hasApi) fetch(API, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(d) }).catch(function () {}); // optional owner email
        form.reset(); say("Thank you. Your enquiry has been received and we will contact you shortly.", true);
      })
      .catch(function (e) { say("Sorry, we could not send your enquiry. Please try again or contact us on WhatsApp. (Ref: " + (e && e.message && e.message.length < 30 ? e.message : "network") + ")"); })
      .then(function () { btn.disabled = false; });
  });
  // "Send on WhatsApp": opens WhatsApp with the form details; nothing is sent automatically
  $("#waSend").addEventListener("click", function () {
    var d = values(), L = ["Hello SKM Caters, I would like a quotation."];
    [["Name", d.name], ["Event", d.eventType], ["Date", d.eventDate], ["City", d.location], ["Guests", d.guests], ["Details", d.message]].forEach(function (x) { if (x[1]) L.push(x[0] + ": " + x[1]); });
    window.open("https://wa.me/" + PH + "?text=" + encodeURIComponent(L.join("\n")), "_blank", "noopener");
  });
})();
