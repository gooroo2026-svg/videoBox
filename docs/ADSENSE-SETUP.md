# VideoBox AdSense setup

The AdSense code is part of VideoBox and must stay in place. The current app has display-ad slots on Home, Cinema, and Watch, an `ads.txt` route, and a fail-closed switch. This guide explains how to turn the existing integration on after the required account and privacy setup.

## What is already in the app

- `app/layout.tsx` loads the AdSense library only when a publisher ID is configured and `NEXT_PUBLIC_ADSENSE_CONSENT_READY=true`.
- `components/ad-slot.tsx` renders configured ad units on Home, Cinema, and Watch.
- `app/ads.txt/route.ts` serves the publisher line when the publisher ID is set.
- `.env.example` lists the publisher ID and the three slot IDs.

Do not delete these files, the `<AdSlot>` components, or the environment settings. Keep the readiness switch `false` until the publisher and privacy setup below is done. The switch turns the code on; by itself it does not ask for or record consent.

## Before turning ads on

1. Deploy VideoBox on its real HTTPS domain and replace test/sample videos with material you own or are licensed to monetize.
2. Apply to AdSense and add the live domain. Wait for Google's site/account approval.
3. Finish and publish the real Privacy Notice, including the actual ad providers, cookie/device storage, data use, user controls, and a monitored privacy contact.
4. In AdSense, open **Privacy & messaging** and create and publish the European regulations message for the site. Google's AdSense European message is a Google-certified TCF CMP; a Google-certified CMP integrated with IAB TCF is required for personalized ads in the EEA, UK, and Switzerland. Review Google's current requirements before serving there.
5. In the same AdSense area, configure the US state regulations message for the states you serve. Review other countries' requirements before accepting traffic or serving ads there.
6. Check the message in a test browser/region where Google provides a preview. Confirm accept, decline/opt-out, manage choices, and the privacy-settings/revocation path work. Google may automatically add the European revocation link after the site is approved and the message is active.
7. Add the values to the deployment host's environment settings:

   ```env
   NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-your-publisher-id
   NEXT_PUBLIC_ADSENSE_CONSENT_READY=true
   NEXT_PUBLIC_ADSENSE_HOME_SLOT=your-home-slot-id
   NEXT_PUBLIC_ADSENSE_CINEMA_SLOT=your-cinema-slot-id
   NEXT_PUBLIC_ADSENSE_WATCH_SLOT=your-watch-slot-id
   ```

   Use the exact publisher and slot IDs shown by AdSense. Do not put the Supabase secret key in any `NEXT_PUBLIC_` setting.

8. Redeploy, then open `/ads.txt` on the live domain and confirm it shows the publisher line. Check the browser's network panel and all three pages to confirm the script and ad units behave correctly with the published consent messages.

Google's consent message is displayed according to its configured region and a visitor's stored choice. For EEA, UK, and Switzerland personalized ads, Google requires a Google-certified CMP integrated with the IAB TCF; Google notes CMP certification itself is not a full legal-compliance review. Confirm VideoBox's age restriction and the countries served before enabling ads. This guide is setup guidance, not legal clearance.

## Official Google instructions

- [Create a European regulations message](https://support.google.com/adsense/answer/10960768?hl=en)
- [Create a US state regulations message](https://support.google.com/adsense/answer/10960771?hl=en)
- [Google CMP overview](https://support.google.com/adsense/answer/16918505?hl=en)
- [Google CMP requirements for EEA, UK, and Switzerland](https://support.google.com/adsense/answer/13554116?hl=en)
- [Revoke consent / privacy settings](https://support.google.com/adsense/answer/10959060?hl=en)

## Limits of the current integration

This is display advertising only. Video pre-roll/mid-roll ads, revenue reporting/import, creator revenue sharing, subscriptions, and withdrawals are not implemented. AdSense approval and serving are controlled by Google and cannot be guaranteed by app code.
