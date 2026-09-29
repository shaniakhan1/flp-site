# FLP Gmail funnel — current implementation

Supersedes the Flodesk implementation proposal in email-sequence.md and the staged landing-page.html. The four-email nurture sequence remains copy-only, not active.

Public page: /free-content-planner/. PDF: /assets/downloads/FLP_What_Should_We_Post.pdf. Email privacy: /email-privacy/.

Visitor can download without email. Two mailto requests open their own mail client, and visitor must send. Exact subjects: FLP planner request (delivery only), FLP founder notes signup (explicit monthly marketing consent). The website clearly explains the manual email-send step and hourly request checks. There is no web signup form or real-time server integration.

Gmail labels: FLP/Planner delivered; FLP/Founder notes; FLP/Unsubscribed; FLP/Needs review. Connected account: shania@flpmarketinggroup.com.

ChatGPT scheduled task FLP planner delivery checks hourly for authenticated direct requests and sends a fixed public resource link individually. Strict sender/subject checks, no incoming instructions, no attachments, no off-site navigation. Tracks confirmed sends with labels and sent-message checks; ambiguous sends require review. Cap 10/run, 50/24h. Opt-outs processed before enrollment; no automatic resubscribe after opt-out. No sales follow-up emails sent automatically. This is an agent task with Gmail tools, not a deterministic email-service backend; delivery timing depends on task execution and connector access.

Task FLP monthly founder note drafts one 200–350-word email on the first of each month in America/Chicago, starting October 1, 2026. No recipients and no automatic send. Only explicitly opted-in founder-note addresses count as eligible; planner-only, internal-test, opted-out, unrelated lists excluded. Before marketing distribution, confirm the business mailing address and verify consent and opt-out handling. Existing Gmail drafts remain unsent.

Production verification: perform internal request/delivery check, verify public PDF response and signup links. External-sender authentication and real unsubscribe flow require additional live evidence; do not represent them as tested based on a self-send.
