# FLP client journey

Working Node 24 application: crawl one public HTTPS page, generate an evidence-based private report, review fit, create a one-time Stripe Checkout, confirm payment by signed webhook, and collect onboarding. The existing public marketing website stays unchanged until this separate backend is provisioned.

## Run

`npm ci` then set `FLP_OPERATOR_TOKEN` to a random secret of 32+ characters through the host's secret settings. Run `npm start`. Local default: http://127.0.0.1:8790. Use Operator access at the bottom to create checks and view the work queue. Never embed the operator token in the public site.

## Production configuration

- Node 24, one instance/replica. Persistent mounted volume, backed up, with `DATA_PATH=/data/flp.sqlite`. Container-only disk is not sufficient. Configure deletion and backup retention with the host.
- `NODE_ENV=production`, `HOST=0.0.0.0`, `PORT` from host, `PUBLIC_ORIGIN=https://your-portal-host`.
- `FLP_OPERATOR_TOKEN`: random secret, at least 32 characters.
- Public submissions default CLOSED. Configure `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`, allowed hostname, and `PUBLIC_SCANS=true` only after verifying protection on the actual domain.
- `STRIPE_RESTRICTED_KEY`: server-only FLP account key with Checkout Sessions write/read and inline product/price permissions as needed. Test in a sandbox first.
- `STRIPE_WEBHOOK_SECRET`: signature secret for `/api/stripe-webhook`, subscribed to `checkout.session.completed` and `checkout.session.async_payment_succeeded`. Register on the same Stripe account and mode as the key. Production activation requires an end-to-end sandbox test first; fixture tests alone do not validate the connected account.
- No Brave/OpenAI key required for this website audit. The separate existing research service can measure Brave results when provisioned. Consumer AI platforms remain explicitly unmeasured.

## Client flow and operations

1. Submit business, location, service and website. Public users pass a server-validated challenge. Operator bypass requires the secret token.
2. SQLite queue runs one audit at a time. Reports contain five HTML observations and next actions, never an invented visibility score. Robots restrictions, blocked pages and timeouts produce an unavailable result, not a bad score.
3. Customer receives an unguessable bearer link. It expires in 30 days; the key moves from fragment to sessionStorage and never appears in server URL logs. Anyone holding the link can read the report. This is link-based access, not verified customer identity. No email delivery yet. Customer must copy/save their link.
4. Customer emails FLP through their own mail client. Operator reviews fit, capacity, access, and timing, then approves the report in the portal. This human review remains intentional.
5. Customer accepts scope and goes to hosted checkout: $2,000 USD one-time. No subscription starts. Tax is not configured; review relevant tax treatment before enabling live payments. Expired checkout sessions currently require operator assistance.
6. Signed, matching paid checkout events unlock onboarding. Browser redirects do not prove payment. Paid records retained for 180 days. Queue shows onboarding to the operator; no email or fulfillment automation is claimed.
7. Deliver the scoped work and record time. Optional $1,500/month service remains a separate agreement and billing setup. Do not automatically subscribe setup customers.

## Controls

Public IPv4-only HTTPS requests, validated DNS pinned to TLS connection, no IP literals/credentials/ports, redirect validation and per-destination robots checks, 750 KB response cap, 8-second request deadline, no script execution. Paid provider request spend: zero for this audit. Host resource costs still apply.

Durable global quota 50 audits/day, domain quota 3/day, max queue 10, worker concurrency 1. Counters persist across restart. Failed attempts may consume quota. Request throttle uses socket addresses and trusts no forwarded headers; shared reverse-proxy addresses may cause conservative global throttling. This is not a replacement for edge DDoS protection. No public report listing or crawling; CSP/no-store/noindex headers. No user data, real reports, keys or database belong in GitHub. `research/` is excluded from the marketing site's Pages build.

## Tests

`npm test`: network target restrictions, evidence semantics, robots behavior, durable quotas/access across restart, private-report isolation, checkout reuse, webhook signature and idempotency, payment-gated onboarding, challenge binding and failures. Stripe tests use local signed fixtures, not live charges.

## Remaining activation work

Attach durable host storage, configure hosting origin and operator secret, resolve Cloudflare challenge loop, provision Turnstile, install a Stripe restricted key and webhook in sandbox then production, and test actual public-domain rendering and payment flow. Public scans and payment are disabled without these settings. Do not point the homepage CTA at an unconfigured backend.

## First supported fact correction

`identity-cli.mjs` runs a controlled capture → plan → review/apply → recapture/verify cycle for a confirmed founding year. It only changes an existing Organization with the matching business name and website origin, updates the associated CSP hash, and refuses conflicting facts, unsupported CSP, stale source, or modified drafts. No claimed ranking benefit.

Provide a private facts JSON with `business`, `website`, `foundingYear`, `confirmed: true`, and a source describing owner confirmation. Keep this and all captures/plans/reports outside the public repository. Run `node identity-cli.mjs` for commands. Publication to the business's host is still a separate authorized step. This is the first narrow correction engine, not a completed WordPress connector or autonomous publishing product.


## Service-page drafting workflow

The public `/page-draft/` tool uses the shared `/assets/service-page.mjs` module to assemble a page from owner-confirmed details. It runs entirely in the browser, stores no answers, requires a separate approval for HTML export, and explicitly does not publish or research the business. Editing the input invalidates the approval. No paid provider is involved.

`page-workflow.mjs` is an operator adapter for existing FLP-style article pages in this repository. It prepares an exact-source draft, updates title, description, copy, WebPage metadata and CSP hashes, requires approval, and verifies the published HTML against the approved draft. Run it from a full repository checkout; it imports the shared asset outside the portal Docker context and is not exposed by the portal server. GitHub publication remains an authorized operator step, not a customer self-service connection. WordPress and other platform connectors are not implemented.
