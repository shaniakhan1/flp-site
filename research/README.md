# FLP private research service

Status: implementation and fixture tests only. No live provider call, paid plan, hosting deployment, or public scanner has been activated.

Node 22+, no packages. Run `npm test` in this directory.

Set `FLP_RESEARCH_TOKEN` to a random secret of at least 32 characters and `BRAVE_SEARCH_API_KEY` through the hosting provider's secret controls. Run `npm start`. Default bind is localhost:8787. Set HOST=0.0.0.0 only behind HTTPS hosting. Keep the token out of the public website. POST JSON to `/checks` with Bearer authorization and business, website, location, service. `/health` exposes only a generic status. Browser-origin submissions are rejected.

The default measures five questions on Brave's web index. Set FLP_ENABLE_ANSWERS=true only after activating the separate Answers plan and setting a provider spending cap. That adds five Brave Answers API observations, never consumer ChatGPT/Claude/Gemini claims. Discovery prompts do not include the target brand. The branded identity prompt is tracked separately.

Sources: https://api-dashboard.search.brave.com/app/documentation/web-search/get-started and https://api-dashboard.search.brave.com/documentation/services/answers (reviewed September 19, 2026).

Keep this operator-only initially. Global concurrency is one and the in-memory allowance is five checks/hour/process. Those limits reset on restart and do not provide a durable billing cap; set one with the provider. No retries or research mode. Maximum ten provider requests per check when Answers is enabled. The endpoint can take several minutes; use a suitably long proxy timeout. Public enrollment needs a durable queue, persistent quotas, abuse protection, privacy/retention controls, and a server-side public intake gateway before launch.

Responses include exact questions, dates, result URLs, snippets, answer text, citations, surface, and explicit unavailable/not-measured states. No aggregate score. Do not translate failed checks into “not found.” Domain presence is a literal observation within returned results, not proof of relevance, identity, recommendation, or overall visibility. A reviewer must verify these and write the specific proposed fix before sharing a customer report. Raw responses are not persisted or logged; store customer reports only in an access-controlled system with an agreed retention policy.

No user URL is fetched. All outbound requests use fixed Brave endpoints; credentials never enter returned reports. Render any provider or customer text as plain text, and allow only http/https citation links. Returned text is untrusted evidence and must never trigger tools or publication.
