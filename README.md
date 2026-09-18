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

The homepage leads with the customer outcome, a real founder photograph, the service price, and a visible next action. Recognizable business problems come before the optional interactive example. Scope, onboarding, pricing, founder background, objections, and a fit check explain the purchase. The white/charcoal palette and restrained green accents remain.

Mobile layouts use a native expandable navigation menu, readable body copy, a compact founder image, full-width primary action, stacked example controls, and single-column scope at phone widths. The fit checker clears stale results when an answer changes. The illustrative journey sends no messages.

`qa/responsive.html` is an unlinked, noindex browser layout check for the public site at 320, 360, 390, 430, 768, and 1024 CSS pixels. It uses a same-origin iframe to exercise actual media queries, with section navigation and a read-only overflow report. It is not physical-device or Safari testing.

## Positioning evidence, reviewed September 17–18, 2026

- [U.S. Chamber 2025 technology report](https://www.uschamber.com/technology/empowering-small-business-the-impact-of-technology-on-u-s-small-business): 58% of surveyed small businesses self-reported generative AI use, up from 40% in 2024. This is adoption evidence, not demand for FLP or evidence of willingness to pay.
- [Chamber small-business AI guidance, updated April 2026](https://www.uschamber.com/small-business/how-ai-can-help-small-businesses-compete-and-grow): practical uses include scheduling and customer follow-up; barriers include cost, skills, data readiness, and trust. Positioning inference: emphasize the task removed, clear costs, and approved messages.
- [HubSpot homepage](https://www.hubspot.com/): an outcome-led opening, clear actions, explanations, and proof precede deeper product detail. FLP adapts the ordering, using its own identity and only substantiated founder information. No conversion uplift has been measured for this change.
- [Google Trends: lead follow up](https://trends.google.com/trends/explore?geo=US&q=lead%20follow%20up&hl=en-US), U.S., past 12 months: the rising related query “lead follow up software” displayed +80%. [Google Trends: appointment scheduling](https://trends.google.com/trends/explore?geo=US&q=appointment%20scheduling&hl=en-US) displayed “best appointment scheduling software for small business” at +600%, alongside unrelated DMV/BMV appointment queries. These are relative changes in related-query interest and can reflect small bases; they are not absolute monthly volumes, agency demand, or evidence that FLP’s fee is validated. Broad scheduling keywords mix commercial research with consumers booking appointments. Exact keyword-volume and competition estimates still require a connected research provider. Ubersuggest was suggested; it has not been confirmed connected.

Keyword hypotheses to validate: lead follow-up service, automated lead follow-up, booking automation setup, and appointment scheduling setup. Broader AI automation searches may be educational; software searches may come from DIY buyers. The offer remains one managed inquiry/booking workflow. Do not add unrelated services or create thin keyword pages based on unverified volume.

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
