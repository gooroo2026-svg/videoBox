# VideoBox country rollout register

**Last reviewed:** 14 October 2026  
**Operator location:** Nigeria  
**Audience decision:** adults aged 18+ for phase one; child accounts deferred  
**Product goal:** worldwide availability after staged country review  
**Current state:** no country is marked legally cleared; the app has no country allowlist. Do not interpret this register as legal clearance.

## Country/region gates

| Market | Review status | Items to resolve before enabling public signups |
|---|---|---|
| Nigeria | **Open — first priority** | Confirm NDPC DCPMI registration category and current registration/CAR/DPO/DPIA duties; identify Supabase region and every processor; choose and document lawful cross-border safeguards; complete adult-access, privacy-rights, breach, copyright, moderation, consumer and payment assessments. Use `docs/NDPC-CLASSIFICATION-QUESTIONS-DRAFT.md` for the regulator inquiry after legal/provider facts are confirmed. |
| United Kingdom | **Not reviewed for launch** | Obtain UK privacy and online-safety review for an adult-only user-upload service; assess Children's Code scope and effective, proportionate age assurance; determine UK GDPR, cookie/advertising, Online Safety Act, copyright, and consumer duties; document moderation notice and appeal processes. ICO's 2026 age-assurance statement says age-restricted services need effective action to prevent underage access. [ICO statement](https://ico.org.uk/about-the-ico/media-centre/news-and-blogs/2026/05/ico-statement-on-age-assurance/) |
| EU/EEA (each country) | **Not reviewed for launch** | Obtain country-aware GDPR/ePrivacy and DSA scope review; determine whether platform duties apply at VideoBox's role/size; build required notice/action, decision explanations and complaint routes; assess national copyright/consumer requirements; use a compliant consent flow before personalized ads. For personalized AdSense in the EEA, UK, or Switzerland, Google's current CMP requirement applies. |
| United States (federal and state) | **Not reviewed for launch** | Obtain COPPA and state privacy/consumer review for the product and actual data practices; decide whether to serve each state; if relying on DMCA Section 512 safe harbors, register/publish a designated agent and implement a complete notice/counter-notice and repeat-infringer process; assess ads and relevant state online-safety rules. |
| Other countries | **Not reviewed for launch** | Add one row per country before enabling access. Review age threshold and age assurance, privacy and transfers, hosting, user-content/intermediary rules, copyright notices, consumer terms, ads, taxes, and payments. Do not treat a region-level note as a country's approval. |

## Approval record required for each country

Do not mark a country **Cleared** until the owner records all of the following:

1. Country, review date, reviewer name/qualification, sources, and a written conclusion on the service's legal role.
2. Adult-access age and assurance method, including how public pages, direct video links, APIs, and existing sessions are gated.
3. Privacy notice localization, lawful bases, processors/locations, international-transfer mechanism, retention, rights request process, and regulator contact.
4. User-generated content, illegal-content notice/action, copyright takedown/counter-notice, moderation decision notices, appeals, and urgent safety steps.
5. Ads, cookies/device access, consent state, age treatment, and publishers/providers that may load.
6. Terms/consumer disclosures, complaint route, payments/payouts/tax if enabled.
7. Technical configuration that blocks registration/service access where the country is not cleared; tests confirming the restriction.

## Operational decision

Worldwide is a staged rollout objective, not a current compliance status. Keep public marketing and open registration off until the initial markets have documented approval and effective technical restrictions are in place for markets still under review. Expand only after the owner records the country review and updates the server-enforced allowlist.

The actual release country list is an owner decision; no specific launch country beyond the operator's presence in Nigeria has been legally approved. Qualified local legal/privacy review is required for the operator's actual business structure and markets.
