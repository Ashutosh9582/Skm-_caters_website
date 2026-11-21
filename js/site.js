/* SKM Caters public site. Vanilla JS, no dependencies. */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var API = window.SKM.api, hasApi = API.indexOf("http") === 0;

  // Mobile navigation
  var toggle = $(".nav-toggle"), nav = $("#nav");
  toggle.addEventListener("click", function () {
    var open = nav.classList.toggle("open"); toggle.setAttribute("aria-expanded", open);
  });
  nav.addEventListener("click", function (e) { if (e.target.tagName === "A") { nav.classList.remove("open"); toggle.setAttribute("aria-expanded", false); } });

  // WhatsApp floating button
  $("#waBtn").href = "https://wa.me/" + window.SKM.phone + "?text=" + encodeURIComponent("Hello SKM Caters, I would like to know more about your catering services.");

  function esc(s) { var d = document.createElement("div"); d.textContent = s == null ? "" : s; return d.innerHTML; }

  // Gallery (Supabase)
  var grid = $("#galleryGrid"), filters = $("#filters"), photos = [], active = "All";
  function drawGallery() {
    var list = photos.filter(function (p) { return active === "All" || p.category === active; });
    grid.innerHTML = list.map(function (p, i) {
      return '<figure data-i="' + photos.indexOf(p) + '"><img loading="lazy" decoding="async" src="' + esc(p.thumb) + '" alt="' + esc(p.caption || p.category + " event by SKM Caters") + '"></figure>';
    }).join("") || '<p class="muted">No photos in this category yet.</p>';
  }
  function drawFilters() {
    var cats = ["All"]; photos.forEach(function (p) { if (cats.indexOf(p.category) < 0) cats.push(p.category); });
    filters.innerHTML = cats.map(function (c) { return '<button type="button" aria-pressed="' + (c === active) + '">' + esc(c) + "</button>"; }).join("");
  }
  filters.addEventListener("click", function (e) {
    if (e.target.tagName !== "BUTTON") return; active = e.target.textContent; drawFilters(); drawGallery();
  });
  // Supabase REST (public anon key; row-level security returns published rows only)
  var SBC = window.SKM.supabase, sbOk = SBC.url.indexOf("http") === 0;
  function sbGet(path) {
    return fetch(SBC.url + "/rest/v1/" + path, { headers: { apikey: SBC.key, Authorization: "Bearer " + SBC.key } })
      .then(function (r) { if (!r.ok) throw new Error("sb"); return r.json(); });
  }

  // Gallery: published items, refreshed every 60s so edits from the V6 app show without a reload.
  function loadGallery() {
    return sbGet("web_gallery?select=*&published=eq.true&order=featured.desc,sort_order.asc").then(function (rows) {
      photos = rows.filter(function (r) { return r.image_url; }).map(function (r) {
        var v = r.updated_at ? "?v=" + Date.parse(r.updated_at) : "";
        return { id: r.id, category: r.category || "Other Events", caption: [r.event_title, r.caption].filter(Boolean).join(": "),
                 thumb: (r.thumb_url || r.image_url) + v, full: r.image_url + v };
      });
      if (!photos.length) throw new Error("empty");
      if (active !== "All" && !photos.some(function (p) { return p.category === active; })) active = "All";
      drawFilters(); drawGallery(); filters.hidden = false;
    });
  }
  function galleryFallback() {
    filters.hidden = true;
    grid.innerHTML = '<p class="muted">Our event gallery is being updated. Please <a href="#quote">contact us</a> to see recent work.</p>';
  }
  if (sbOk) { loadGallery().catch(galleryFallback); setInterval(function () { if (!document.hidden) loadGallery().catch(function () {}); }, 60000); }
  else galleryFallback();

  // Lightbox
  var lb = $("#lightbox"), lbImg = $("img", lb), lbCap = $("p", lb);
  grid.addEventListener("click", function (e) {
    var f = e.target.closest("figure"); if (!f) return;
    var p = photos[+f.dataset.i]; lbImg.src = p.full; lbImg.alt = p.caption || ""; lbCap.textContent = p.caption || ""; lb.hidden = false;
  });
  lb.addEventListener("click", function () { lb.hidden = true; lbImg.src = ""; });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") lb.hidden = true; });

  // Testimonials: published reviews from the V6 app (Supabase), refreshed with the gallery.
  var tg = $("#testimonialGrid");
  function loadTestimonials() {
    return sbGet("web_testimonials?select=*&published=eq.true&order=sort_order.asc").then(function (rows) {
      if (!rows.length) throw new Error("empty");
      tg.innerHTML = rows.map(function (t) {
        return '<article class="card"><p>&ldquo;' + esc(t.review) + '&rdquo;</p><cite>' + esc(t.name) + (t.event_name ? ", " + esc(t.event_name) : "") + "</cite></article>";
      }).join("");
      $("#testimonials").hidden = false;
    });
  }
  if (sbOk) { loadTestimonials().catch(function () { $("#testimonials").hidden = true; }); setInterval(function () { if (!document.hidden) loadTestimonials().catch(function () {}); }, 60000); }
  else $("#testimonials").hidden = true;

  // Enquiry form
  var form = $("#enquiryForm"), msg = $("#formMsg");
  function say(t, ok) { msg.textContent = t; msg.className = "msg " + (ok ? "ok" : "err"); }
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var d = {}; new FormData(form).forEach(function (v, k) { d[k] = String(v).trim(); });
    if (!d.name) return say("Please enter your full name.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email)) return say("Please enter a valid email address.");
    if (!/^(\+?91)?[6-9]\d{9}$/.test(d.phone.replace(/[\s-]/g, ""))) return say("Please enter a valid Indian mobile number.");
    if (!sbOk) return say("The enquiry service is not configured yet. Please call or WhatsApp us.");
    if (d.website) return say("Thank you. Your enquiry has been received and we will contact you shortly.", true); // honeypot
    var btn = $("button", form); btn.disabled = true; say("Sending your enquiry\u2026", true);
    var row = {
      name: d.name, email: d.email, phone: "+91" + d.phone.replace(/[\s-]/g, "").slice(-10),
      event_type: d.eventType || "", event_date: d.eventDate || null, location: d.location || "",
      guests: d.guests ? parseInt(d.guests, 10) : null, message: d.message || ""
    };
    // Saved straight into the V6 database. The server re-validates and ignores same-day duplicates.
    fetch(SBC.url + "/rest/v1/web_enquiries?on_conflict=dedupe_key", {
      method: "POST",
      headers: { apikey: SBC.key, Authorization: "Bearer " + SBC.key, "Content-Type": "application/json", Prefer: "return=minimal,resolution=ignore-duplicates" },
      body: JSON.stringify(row)
    }).then(function (r) {
      if (!r.ok) throw new Error("save");
      // Optional email alert to the owner (Apps Script). Failure here never blocks the customer.
      if (hasApi) fetch(API, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(d) }).catch(function () {});
      form.reset(); say("Thank you. Your enquiry has been received and we will contact you shortly.", true);
    }).catch(function () { say("Sorry, we could not send your enquiry. Please try again or contact us on WhatsApp."); })
      .then(function () { btn.disabled = false; });
  });
})();
