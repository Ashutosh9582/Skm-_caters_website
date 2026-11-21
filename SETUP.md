# SKM Caters: Setup and Test Guide

## Setup (about 10 minutes)
1. **Supabase**: Dashboard > SQL Editor > New query. Paste all of `supabase/setup.sql`, press Run. (Safe to run again.)
   It creates the gallery table + image bucket, the enquiries table, the security rules and live notifications.
2. **V6 app**: in your GitHub repo replace `index.html` with the one from `skm-v6-updated.zip`. Open the app, tap the cloud button, log in as a partner.
3. **Website**: put the files inside `website/` at the root of a new GitHub repo, Settings > Pages > main / root. The domain skmcatters.com is already set in `CNAME`, `index.html`, `robots.txt`, `sitemap.xml`. In Hostinger DNS: 4 A records for `@` (185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153) and CNAME `www` to `ashutosh9582.github.io`; then tick Enforce HTTPS in Pages. (Netlify also works.)
4. **Owner email alert (optional, 3 minutes)**: Supabase alone does not send emails.
   a. Open script.google.com, sign in with ashutoshbeel@gmail.com, New project, paste `apps-script/Code.gs`.
   b. Deploy > New deployment > Web app. Execute as **Me**, Who has access **Anyone**. Authorize when asked.
   c. Copy the Web App URL, paste it in `js/config.js` as `api`, and deploy the website again.
   Without this step enquiries still reach V6 with the bell notification. Testimonials (optional) come from a "Testimonials" Sheet tab only if this script is created from a Google Sheet; otherwise that section stays hidden.

## Test everything together (in this order)
1. V6 > More > **Website Gallery**: upload 2 photos (publish on). Within about 1 minute both appear on the website gallery.
2. In V6 tap **Hide** on one photo. It disappears from the website. Tap **Publish**, it returns. Try Feature, up/down, Edit caption, then Delete (the file is removed too).
3. Website > Request a Quotation: send an enquiry with your own email and a mobile number.
   Expected: success message on the site, and an email to ashutoshbeel@gmail.com if step 4 is done. In V6 a **bell** with the unread count appears (live if V6 is open, else within a minute) and More > **Website Enquiries** lists it.
4. Send the exact same enquiry again the same day: it is not stored twice.
5. In V6 tap **WhatsApp**: WhatsApp opens with the customer's number and a pre-filled message, status becomes Contacted. Try Confirmed and Closed.
6. Try invalid email or mobile on the website: it is blocked with a clear message.
7. Phone check: website menu, gallery lightbox, form.

## Security notes
- The website holds only the Supabase **publishable** key. Visitors can only *submit* enquiries and *read published* photos. Only active partners (V6 login) can read enquiries or manage media.
- Never put a `service_role` key in the website or the V6 repo.
- Spam protection: hidden honeypot field, server-side validation and same-day duplicate blocking. If spam still appears, add Cloudflare Turnstile.

## Not verified yet / limits
- Everything above passed in a simulated test only. My environment cannot reach your Supabase, so step 1 to 6 on your live project is the real test. Send me any error text and I will fix it.
- Albums are a text field per photo; the website filters by category.
- V6 enquiry screen is English/Hinglish like the rest of V6.
