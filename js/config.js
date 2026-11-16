// config.js - ek hi jagah saari settings. SETUP_GUIDE.md me likha hai ye keys kahan se milti hain.
var SKM_PHONE = "919509907261";          // wa.me links ke liye (91 + number)
var SKM_EMAIL = "ashutoshbeel@gmail.com";   // mailto fallback ke liye

// CHANGE 17: Firebase (free database). Firebase console > Project settings > "Your apps" se copy karo.
var FIREBASE_CONFIG = {
  apiKey: "AIzaSyAW05jKoJ5pE1bsxWuGosQFzrHt1UulNPU", authDomain: "skm-caters.firebaseapp.com", projectId: "skm-caters", appId: "1:177875295165:web:daf4072d6b78a1856310d4"
};
// CHANGE 18: web3forms.com par apna email daalo, wo ek Access Key bhejta hai. Har enquiry/review is mail par aayegi.
var WEB3FORMS_KEY = "99d9ac64-ed00-4ee4-a0c0-8a103fdc9351";

// CHANGE 19: har event ke liye suggested dishes (events.html ke popular dishes). Event chunne par menu me one-tap suggestion dikhta hai.
var EVENT_DISHES = {
  "Wedding": ["दाल मखनी","शाही पनीर","जलेबी रबड़ी","गोलगप्पा 2 तरह का पानी 5 तरह का"],
  "Engagement": ["पनीर टिक्का 3 तरह का","मिक्स चाट","रस मलाई","ब्रोकली सूप"],
  "Corporate Event": ["वेजिटेबल पुलाव","पनीर कोरमा","दही बड़ा","लच्छा पराठा"],
  "Birthday Party": ["पास्ता लाईव","पीजा","हाका नूडल्स","आईस क्रिम फ्राईड"],
  "Housewarming": ["बाटी–3 तरह की","पंचमेला दाल","गाजर हलवा","मीसी रोटी"],
  "Charity Event": ["वेजिटेबल पुलाव","आलू मेथी","बुन्दी रायता","बेसन लड्डू"]
};
