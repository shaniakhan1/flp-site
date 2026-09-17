# FLP website concept

Review branch for a single managed inquiry-to-booking funnel offer.

## State

This is a **concept**, not an operational checkout or customer automation platform. The existing production site remains unchanged until this branch is merged and deployed. The page has a visible concept banner and `noindex,nofollow` while under review.

- All demonstration data is fictional and local. No messages are sent.
- The fit checker runs locally, collects no personal information, and creates only a user-initiated mailto link.
- Price and delivery assumptions must be validated before accepting orders.
- The founder photograph comes from the founder's existing public site, https://shaniakhan.com/hero.jpg. It was reused without identity edits.
- No generated cartoon imagery is used.

## Local preview

Run `python3 -m http.server 8080` in this directory, then open http://localhost:8080.

## Before production enrollment

1. Assign a delivery operator, qualify the supported stack, price software usage, and validate capacity.
2. Finalize the service agreement, payment/refund terms, scope, handover, support hours, and privacy disclosures.
3. Implement actual server-verified payments and onboarding. Do not accept a client-supplied payment success flag as proof of payment.
4. Test the complete customer workflow, duplicate webhook delivery, incomplete intake, email bounce, unsubscribe, reply and booking stops, failed payment, cancellation, and deletion/access removal.
5. Publish the total required cost and available start dates. Remove the concept banner and noindex only when appropriate. Add canonical service pages, sitemap, and accurate Organization/Service structured data.
6. Measure inquiry-to-sale conversion and founder delivery hours. Do not equate activity with incremental revenue.
