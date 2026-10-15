# VideoBox launch checklist

## Current launch blockers

The first release is adults-first (18+); children are planned for a separate later release with parent safeguards. New signups and existing signed-in accounts now see the adult age screen and must accept the Terms and Privacy Notice. The flow stores its age flag and policy-version label in user metadata, which users can edit; it is not strong age assurance or a tamper-proof acceptance record. New video uploads now use a private review bucket in code, but the updated `supabase/core-feature-setup.sql` must be run before that flow works. Older drafts already uploaded to the public bucket may still be directly accessible and must be inventoried, migrated, or removed. Users can clear their watch-history rows from Home once the current core setup SQL is applied, but there is still no complete self-service account/data deletion workflow. Video and comment reporting are implemented, but existing databases need the latest `supabase/legal-readiness-update.sql` before those report fields work. Keep public invitations and AdSense disabled until the remaining items are resolved for the launch countries and the policies have been completed and reviewed. Under-18 accounts require a separate later child-safety and parent-consent release.

## Owner operations to prepare before launch

- **Review reports every day the service is open.** For each report, record its ID, date, reviewer, decision, reason, any content/account action, and whether the affected creator was notified. The current screen lets an admin hide a video/comment or mark/dismiss a report, but it does not create this complete decision log or notify creators.
- **Prepare urgent-harm escalation.** Set an owner/on-call contact and a written path for credible threats, child-safety concerns, and illegal content. Limit access to report details, preserve only what is necessary, and get local legal advice on when/how to contact authorities. VideoBox has no automated escalation or duty roster.
- **Create separate copyright-notice and appeal routes.** The in-app report form is not a complete copyright notice/counter-notice process. Publish a monitored copyright contact and a reviewed notice checklist for the countries served; log notices, removals, creator notices, counter-notices, repeat-infringer decisions, and appeals. Do not promise fixed deadlines until they are checked against applicable law.
- **Handle privacy requests.** Verify the request using the account session or another proportionate method; record the date, request, data systems checked, decision, response, and deletion/retention reason. Inventory Supabase Auth, profiles, videos/storage, comments, reports, logs, and backups before promising deletion. The app currently has no self-service deletion or request queue.
- **Prepare an incident response.** Keep a private, current list of service providers and admin contacts; know how to disable uploads/ads, rotate exposed credentials, preserve relevant logs, and obtain advice on regulator/user notices for Nigeria and each country served. VideoBox does not currently have a tested incident-response procedure.
- **Lock down administration.** Verify in the deployed Supabase project that only the owner can grant/revoke `admin_users` membership, RLS is enabled, and an ordinary account cannot make itself an admin. The UI's `is_admin()` checks are not a substitute for verifying the deployed database policies.
- **Review Nigeria registration and data location.** Ask the NDPC or a licensed DPCO whether VideoBox's public video-sharing/social features fit a DCPMI category; do not rely only on the user-count threshold. Confirm the Supabase project region and processors, then get advice on Nigeria's cross-border transfer safeguards and list the real locations/providers in the Privacy Notice.
- **Make the Nigeria classification question concrete.** NDPC's published guidance lists public social-media app developers/proprietors in UHL, and its FAQ's under-200 CAR exception is specifically for OHL. VideoBox's public uploads, creator profiles, follows, and comments require an explicit classification answer before launch; do not assume its two test accounts create an exemption. Use `docs/NDPC-CLASSIFICATION-QUESTIONS-DRAFT.md` as an inquiry draft after filling in the operator identity and confirmed provider/region facts. Do not send it until reviewed; obtain current registration, fees, renewal/CAR, DPO/DPIA, and data-transfer advice.
- **Track each release country.** No market has completed legal clearance and the app currently has no country allowlist. Use `docs/COUNTRY-ROLLOUT-REGISTER.md` to record reviews and technical restrictions. Worldwide remains the goal, but do not enable markets whose required review and enforcement controls are still open.
- **Use and validate the operations runbook.** `docs/OPERATIONS-RUNBOOK-DRAFT.md` covers user reports, Nigeria copyright notices, privacy requests, and breach response. It is not operational until contacts/owners are filled in, counsel confirms the country-specific steps, and the listed tabletop exercises are completed.
- **Finalize the data inventory and retention.** `docs/DATA-INVENTORY-AND-RETENTION-DRAFT.md` maps the current code/schema to account, user activity, video, report, cookie, and provider data. Confirm it against live Supabase and hosting settings, choose justified retention/deletion periods, identify subprocessors and locations, and obtain privacy counsel review before publishing the final Privacy Notice.
- **Review the legacy credentials table.** A Supabase screenshot shared during development showed a `users` table with a `password_hash` column. The current app source does not query `users` or `password_hash`; it signs users in through Supabase Auth. Verify in Supabase whether the table contains rows or credential data, who can read/write it, and whether it is needed by the `videos.user_id` foreign key. Never store or compare account passwords in this table. If real password material was collected or exposed, treat that as a security incident and get qualified security advice before launch; do not paste password values or secret keys into chat.
- **Worldwide availability needs country review.** Before enabling signups in a country, check age rules, privacy/data transfers, consumer terms, copyright takedown rules, online-platform duties, and ad consent for that country. If that review is not complete, use a restricted country list while you work through it; one global policy does not establish compliance worldwide.
- **Keep policy versions aligned.** The signup and existing-account flow currently stores `videobox-2026-10-07-v1` in user metadata and the proxy gates on that value. When the policies change, update the version in both `app/signup/page.tsx` and `proxy.ts`; before launch, replace this editable metadata marker with a server-controlled versioned acceptance record and decide whether existing users must accept updated terms again.

## One Supabase setup step

If you already ran the core setup, run `supabase/monetization-ledger.sql` once to add the protected admin money ledger without rerunning the full setup. It is safe to rerun.

1. Open the Supabase project SQL Editor.
2. Open the updated `supabase/core-feature-setup.sql` from this project, copy the complete file, and run it as one query. If you already ran an earlier version, run this updated version again; the setup uses repeatable `create or replace`, `if not exists`, and drop/recreate policy statements.
3. This adds the private `video-drafts` bucket and its owner/admin access policies, aggregate like/follower-count RPCs, tables and policies for video/viewer features, per-account watch history, and the admin-only append-only `money_entries` ledger for manually recorded income/expenses. Watch-history rows are user-private and the Home page's Clear history action deletes only the signed-in user's rows. Keep the existing `videos` bucket public for approved published videos; only admins should be able to insert or delete files there.
4. Before launch, verify a normal signed-in account cannot upload to or delete from the public `videos` bucket; cannot read other users' raw like/follow rows or commenter IDs; can still see public counts, published comments, and their own like/follow state; cannot open a draft from a signed-out browser; and admins can preview, approve, and reject drafts. Approval should make the public playback URL work; rejection should remove the private file. Existing public drafts need separate cleanup. Check deployed Storage grants and all table policies too, because other permissive grants/policies could override restrictions in this script.


The updated SQL also creates `money_entries`. It remains a manual ledger; it does not import AdSense revenue or allow withdrawals. Re-run the complete updated setup file to add the table and admin-only policies.

## Supabase Auth settings

In **Authentication → URL Configuration**, allow these redirect URLs for local development:

- `http://localhost:3000/auth/callback`
- `http://localhost:3000/reset-password`

After deployment, add the same two paths using the live HTTPS domain and set the Supabase Site URL to that domain. The app's email-confirmation and password-reset flows return through these routes.

## AdSense (only after account approval)

The AdSense loader and Home/Cinema/Watch slots are retained. See `docs/ADSENSE-SETUP.md` for setup and activation steps.

1. Apply for AdSense and add the deployed VideoBox domain. Google must review the site before ads can serve.
2. Confirm the site's videos are yours or licensed for display and monetization. Replace the sample items with original content and complete the public Privacy, Terms and Content Guidelines pages; monitor the published support contact and get the draft policies reviewed.
3. Keep `NEXT_PUBLIC_ADSENSE_CONSENT_READY=false`. The app now requires both that flag and the publisher ID to load ads, but it has no consent manager or child/teen ad treatment. First choose and configure a suitable consent-management provider, implement and test the region/age handling and the required disclosures, and obtain legal review. Only then set the consent-ready flag to `true`, add the AdSense values to `.env.local`, and redeploy. The flag alone is not consent.
4. Visit `https://your-domain/ads.txt` and confirm it shows the publisher line. The app generates that line from the configured publisher ID.

The code supports **display ads** on Home, Cinema and Watch. Video pre-roll/mid-roll ads are a separate integration and are not enabled here.

## Publish the app

Deploy the project to a host that supports Next.js, add the Supabase and (when approved) AdSense environment variables in the host dashboard, then register the live domain in Supabase Auth's redirect URL allowlist. Keep `SUPABASE_SECRET_KEY` server-only; never rename it with a `NEXT_PUBLIC_` prefix.

## Payments and creator payouts

No payment processor, subscription checkout, ad-revenue import or withdrawal system is connected yet. Before adding those, choose the country where VideoBox will operate and the payment provider available there, then complete its business and bank/payout verification. Do not enter secret keys in chat.

## Final owner review

- Replace sample/demo content with videos you own or have permission to use.
- Review the draft Privacy, Terms and Content Guidelines pages. The support contact is set to gooroo@gmail.com / 09060129459; a formal copyright/appeal process and legal review are still required.
- Test signup email links on the deployed domain; the local development server must be running to use `localhost` links.
- Submit the live site to AdSense and wait for approval before expecting ad income.




