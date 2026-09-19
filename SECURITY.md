# Deployment security status

The public site is a static GitHub Pages deployment. Its planner computes a brief locally and opens the visitor's email app; it does not POST to a backend, take payments, or invoke paid search providers. Optional local browser storage is controlled by the visitor. The public contact email can still receive spam through email independently of the site.

All seven public HTML pages contain a restrictive meta Content Security Policy: scripts from this site and approved inline script hashes only, no inline event handlers, no fetch/XHR/WebSocket connections, no embedded objects/frames, no base changes, no native form submissions, and HTTPS upgrades. Existing Google Fonts are allowed for the two legacy guides. Referrer policy is strict-origin-when-cross-origin. This is browser resource control, not DDoS protection. The current static host does not supply our own frame-ancestors, Permissions-Policy, HSTS, or WAF configuration. Meta CSP cannot enforce frame-ancestors. Verify HTTP response headers at the future edge host rather than treating an unused headers file as deployed protection.

FLP internal observations were removed from the homepage and the linked report was deleted. The site build excludes research source, the QA harness, and repository documentation. Exclusion from the published site is not repository privacy: this repository and its history remain public. Do not commit private client information, credentials, or internal audit reports here. Old search caches and Git history may retain previous public versions. No history rewrite or repository-visibility change has been performed.

Research remains operator-only and not deployed. It requires a long private token; rejects browser-origin calls; bounds headers, bodies, provider responses, concurrency, connections, and requests per process; uses fixed external destinations; and never sends credentials back. Its hourly quota resets on restart and is not a durable financial cap. Provider account spending caps are required.

Before enabling public checks:

1. Use an application host and DNS/edge account that supports traffic filtering, rate limits, and security response headers. Verify TLS and origin protection.
2. Validate a bot challenge on the server, including expected hostname and action. A widget by itself provides no server protection. Fail closed on validation errors.
3. Put admitted jobs in a durable queue. Enforce persistent per-IP, per-business, and global quotas, a maximum queue depth, concurrency limits, deduplication, timeouts, and a provider spending cap. Do not trust arbitrary forwarded-IP headers.
4. Keep keys server-side and put reports behind authorization. Set retention/deletion rules. Rate-limit signup, verification, and email sends separately.
5. Test rejection, replay, invalid input, provider failure, overload, and authorization across accounts before advertising instant checks.

Provider strategy: FLP can own its question generation, website checks, normalization, relevance review, reporting, and task execution. External search/answer APIs are data sources. Never present our own generated answer or a proprietary crawl as proof that ChatGPT, Claude, Gemini, or Google recommends a business.

References reviewed September 19, 2026:
- https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy
- https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
