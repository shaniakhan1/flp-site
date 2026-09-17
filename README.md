# FLP Marketing Group website

Static marketing site with two clearly separated routes:

- **Inquiry and booking follow-up:** one landing page, inquiry and booking path, approved email follow-up, and defined ongoing management. Published service fees are $1,500 setup + $1,500/month from launch, with required software costs, compatibility, and setup availability confirmed individually before payment. Visitors can explore the local demo, check fit, and express interest by email. The website accepts inquiries by email; there is no checkout or payment collection.
- **Private advisory & implementation:** new engagements start at $10,000/month, with final scope, deliverables, working cadence, access, resources, and price agreed individually. The inquiry link opens the visitor's email app with a brief to complete.

New engagements do not include ongoing social media posting. Existing clients retain their agreed scope and pricing. The public site does not disclose any existing client's fees or workload.

## Technical state

- Static HTML, CSS, and JavaScript, deployed through the repository's existing GitHub Pages configuration and CNAME.
- Indexable public marketing content, canonical URL, robots.txt, and sitemap.xml.
- No checkout, payment collection, customer accounts, automated client delivery, tracking cookies, or submitted form data.
- The fit checker runs locally; custom requests link to the private engagement section. Inquiry links require the visitor to send an email themselves.
- The customer journey uses fictional sample data. It does not send messages or imply actual client results.
- Founder photograph reused from https://shaniakhan.com/hero.jpg without identity edits.

## Design and interaction

The approved first-interaction concept leads the page: a calm white and charcoal interface, restrained green accents, and three customer situations. Each situation changes the example email and explains FLP’s role. Public marketing uses service and setup-availability wording rather than internal pilot terminology. The fit checker clears stale results after an answer changes.

## Local preview

Run `python3 -m http.server 8080` in this directory, then open http://localhost:8080.

## Before opening funnel enrollment

1. Validate customer demand and ongoing value with scoped pilots. Assign a delivery operator and validate capacity, the supported stack, and all required software costs.
2. Finalize scope, support, payment/refund terms, privacy disclosures, cancellation, ownership, and handover.
3. Implement server-verified payments and onboarding. Never treat a browser success flag as payment confirmation.
4. Test the end-to-end workflow, duplicate webhooks, incomplete intake, email failures, opt-outs, reply and booking stops, failed payments, cancellation, and access removal.
5. Publish the complete required cost, supported connections, and available start dates before activating checkout. Update availability copy consistently across the site.
6. Measure delivery costs, founder hours, retention, and observable outcomes. Activity is not proof of incremental revenue.

Private engagements also require an agreed scope and terms before payment or work begins. The starting price does not create an unlimited service obligation.
