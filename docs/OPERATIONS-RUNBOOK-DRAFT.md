# VideoBox operations runbook (draft)

**Audience:** owner/admins who handle reports, privacy requests, copyright notices, and security incidents.  
**Status:** working procedure; complete the owner fields, train the named backup, and have Nigerian privacy/copyright counsel verify it before public launch. Rules differ by country. This runbook is not legal advice.

## Owners and contacts to fill in before launch

- Primary incident/privacy lead: **[OWNER INPUT: name and monitored contact]**
- Backup lead: **[OWNER INPUT]**
- Copyright notice recipient/designated channel: **[OWNER INPUT; counsel to confirm statutory requirements]**
- User support contact: **gooroo@gmail.com / 09060129459** (owner must monitor both; formal appeal/copyright procedures still need to be established)
- Urgent safety escalation channel: **[OWNER INPUT]**
- Qualified Nigerian privacy/copyright counsel or licensed DPCO: **[OWNER INPUT]**
- Countries publicly enabled and local adviser for each: **[OWNER INPUT; see country rollout register]**

The admin dashboard currently accepts in-app video/comment reports and allows moderation actions and account suspension. The in-app report form is not a formal legal notice system, does not log complete decisions, and has no user appeals route. Never tell a reporter that the current UI by itself completes a statutory notice process.

## 1. User reports and safety moderation

1. Review the admin report queue every day the service is accepting users. Treat threats, child exploitation concerns, doxxing, credible imminent danger, and reports of exposed private video as urgent; do not leave them in the ordinary queue.
2. Open the reported item and assess the claim against the content rules. Do not assume a report proves wrongdoing. Restrict or remove content when necessary to limit immediate harm while review continues; retain the minimum records needed to explain and revisit the decision.
3. Record the report ID, received time, reviewer, content/account IDs, evidence considered, policy/legal reason, decision, action, notice sent, appeal status, and closure date in a restricted-access log. The existing admin UI does not provide this complete audit record; maintain a private log until one is implemented.
4. Give the affected creator a clear explanation and a channel to appeal unless doing so would create a safety or legal risk. Record the appeal and the independent/reconsidering reviewer where available. Do not publish reporter identity or unnecessary reporter details.
5. For credible immediate danger, contact local emergency services or appropriate authorities through a counsel-approved process. Do not promise continuous monitoring or a response time that the owner cannot meet.
6. Set the retention period for reports and moderation logs with privacy counsel. Limit access to reporter emails and remove unnecessary details after the period, subject to legal holds.

## 2. Copyright notices: Nigeria process to confirm with counsel

Nigeria's Copyright Act 2022 contains online-content rules in sections 54–56. If VideoBox is a covered service provider for the relevant content, section 54 specifies written/electronic notice information (including the work, the located material, contact information, an oath declaration of lack of authorization, and an accuracy/authority statement). Section 55 describes prompt subscriber notice, expeditious removal/disablement, and notice to the right owner. It also sets out a counter-notice/restoration pathway: if a counter-notice is forwarded and the owner does not respond within seven days, the provider may restore access. Section 56 addresses repeat-infringer warnings, challenges, and account suspension. **Have Nigerian copyright counsel confirm VideoBox's status, how these provisions apply, current Commission forms/rules, and how the statutory steps interact with any other country's process before relying on this summary.** [Official Copyright Act, ss. 54–56](https://www.copyright.gov.ng/wp-content/uploads/2023/04/CopyrightAct2023FinalPublication1.pdf)

When a copyright complaint arrives through any channel:

1. Time-stamp and preserve the original notice. Route it immediately to the named copyright reviewer; do not let it sit in a general feedback inbox.
2. Check whether it contains the information required by the applicable country's law. If incomplete, ask counsel whether to request missing information and what to do meanwhile; do not invent statutory requirements.
3. Identify each claimed work and exact VideoBox URL/file. Record the claimant's authority/contact and preserve the notice and decision in restricted storage.
4. If applicable law requires action, notify the uploader, disable access/remove the item on the required schedule, and notify the rightsholder. Record each timestamp and message. Do not rely on the in-app report form as the formal notice route.
5. Provide the uploader with the notice and the available counter-notice/challenge route. Forward a valid counter-notice promptly where required; calendar the statutory response period. Under Nigeria section 55, the seven-day period is measured after forwarding the counter-notice to the owner; counsel must confirm the dates and any response received before restoration.
6. Apply repeat-infringer rules only after counsel confirms the statutory trigger and documented notices. Nigeria section 56 describes a warning after repeated notifications and suspension after a second notification for at least one month where no challenge is pending; it also describes a challenge procedure. Do not automatically count an unverified in-app report as a qualifying copyright notice.
7. Record the result, notices, content state, appeal/challenge, restoration decision, and repeat-infringer count. Take effective steps required by applicable law to prevent removed content from being reloaded; the current app does not implement fingerprint matching or a full copyright case system.

Before launch, publish a monitored copyright contact, notice form, counter-notice/challenge route, repeat-infringer policy, and appeal/complaint explanation after legal review. U.S. DMCA designated-agent requirements are separate and must be assessed if serving U.S. users or relying on Section 512.

## 3. Privacy access, correction, and deletion requests

1. Receive requests at **gooroo@gmail.com** or **09060129459** and record arrival date, request type, requested account, and responsible reviewer in a restricted log. Confirm both channels are monitored before launch.
2. Verify the requester proportionately using the logged-in account or another counsel-approved method. Do not request passwords, full payment-card details, or unnecessary identity documents by email.
3. Locate relevant data in Supabase Auth, profiles, videos and both storage buckets, comments, likes/follows, saved items, watch history, reports, admin records, provider logs, and backups. The app currently permits clearing watch history only; it has no complete account/data deletion workflow.
4. Decide what can be accessed, corrected, restricted, or erased, and document legal-retention exceptions. For deletion, remove database records and media objects, check public direct URLs and copies, and record backup expiry. Do not claim total erasure until every relevant system and provider has been checked.
5. Reply within the deadline required by the law that applies to that person and request. **[PRIVACY COUNSEL: fill in applicable deadlines, extension/identity rules, complaint routes, and retention exceptions by enabled country.]** Do not use an illustrative regulator form deadline as VideoBox's legal deadline.

## 4. Personal-data and security incidents

Treat suspected exposed credentials, account takeover, public access to private drafts, misdirected reports, storage-policy mistakes, lost devices, or provider incidents as an incident. A staff member must promptly alert the primary lead and backup. Keep a private incident register even if the incident is not reportable.

1. Record when VideoBox first became aware, who reported it, systems/data possibly involved, and a timeline. Preserve relevant logs without sharing secrets in chat or public issue trackers.
2. Contain the incident safely: revoke exposed sessions/keys, suspend affected routes/uploads, correct public bucket or RLS rules, and contact the provider. Do not destroy evidence or make unreviewed database changes that could worsen loss.
3. Assess likely risk to people: data types, number of people, access/exposure duration, misuse likelihood, and mitigations. Update the assessment as facts arrive.
4. For processing subject to Nigeria's Data Protection Act, section 40(2) requires notifying the NDPC within 72 hours of becoming aware when the breach is likely to create a risk to people's rights and freedoms. Section 40(3) requires immediate communication to affected people when it is likely to create a high risk. Contact counsel/NDPC promptly; do not wait for a complete forensic report before assessing the deadline. [Official Nigeria Data Protection Act, s. 40](https://ndpc.gov.ng/wp-content/uploads/2024/03/Nigeria_Data_Protection_Act_2023.pdf)
5. Check other enabled-country requirements separately. For example, UK GDPR has its own risk thresholds and notification duties; the ICO says reportable breaches are due without undue delay and, where feasible, within 72 hours, while high-risk cases require notice to affected people without undue delay. Confirm current rules with UK counsel because ICO guidance notes legal changes under review. [ICO breach guidance](https://ico.org.uk/for-organisations/report-a-breach/personal-data-breach/)
6. Record the risk decision, regulator/user notification decision, content of notices, containment, evidence preservation, remediation, and follow-up. If notifying people, use clear language and provide useful protective steps.
7. After containment, rotate credentials, review RLS/Storage and admin access, remediate the cause, and record lessons. Reopen signup/uploads only after a second reviewer verifies the fix.

## 5. Monthly owner review

- Review open user reports, copyright notices, appeals, privacy requests, and incidents.
- Confirm privacy/copyright/urgent contacts still work and someone is assigned for every day the service is open.
- Review admin membership, access to reporter data, pending drafts, and public storage links.
- Check retention/deletion tasks and update the country rollout register.
- Keep ads disabled until consent/vendor/legal gates are met; keep payouts disabled until payment, terms, tax, and accounting controls are ready.

**Pre-launch validation:** run a tabletop walkthrough of one privacy deletion request, one copyright notice/counter-notice, one urgent harmful-content report, and one potential personal-data breach; document gaps and owners. Do not mark this runbook operational until a primary/backup owner is named, contacts are monitored, and the exercises are completed.
