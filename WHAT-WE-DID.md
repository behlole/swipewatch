# Swipewatch – What we did

Summary of setup and fixes done for the app and store release.

---

## 1. App icon and splash

- **Use logo for everything:** App icon, splash screen, adaptive icon, and web favicon now use `./assets/images/logo.png`.
- **Generated logo.png from logo.svg:** Added `scripts/generate-logo-png.js` (and `npm run generate-logo`) to build a 1024×1024 PNG from `assets/images/logo.svg` for Expo.
- **app.json** updated so `icon`, `splash.image`, `android.adaptiveIcon.foregroundImage`, and `web.favicon` all point to `./assets/images/logo.png`.

---

## 2. AdMob / app-ads.txt

- **app-ads.txt:** Added `public/app-ads.txt` with the line:  
  `google.com, pub-8017092196734683, DIRECT, f08c47fec0942fa0`  
  So when you deploy the web build, `yourdomain.com/app-ads.txt` is available for AdMob. Set the same domain as “Developer website” in Play Console.
- **Advertising ID:** App already had `com.google.android.gms.permission.AD_ID` in `app.json`. In Play Console we declared: app uses advertising ID → **Yes**, and use case **Advertising or marketing**.

---

## 3. SEO (web)

- **Metadata in `app/+html.tsx`:** Added title, description, keywords, theme-color, canonical URL, Open Graph tags, and Twitter Card tags for Swipewatch so search and social sharing use the right name and description.
- **Base URL:** Uses `EXPO_PUBLIC_WEB_URL` (default `https://swipewatch.app`) for OG image and canonical URL.

---

## 4. Release and build

- **RELEASE.md:** Added a release checklist (version, versionCode, store listing, content rating, etc.), when the app can go live (2–4 days after production submit), how much testing time is needed (e.g. 15–30 min internal, 2–4 days buffer for production), and sample release notes for Play Console.
- **Prebuild vs build:** Clarified: you don’t run prebuild for every code change; only when native config or plugins change. Normal app code changes are picked up by the next build without prebuild.
- **AAB = latest code:** Confirmed that `npm run build:local:aab` bundles the latest JS/code at build time; no need to prebuild again for code-only changes.

---

## 5. Production (release) signing

- **Debug vs release:** The AAB was being rejected because the release build type in `android/app/build.gradle` was using `signingConfigs.debug`. Fixed so release uses the keystore from `android/keystore.properties` when that file exists.
- **android/app/build.gradle:** Added loading of `keystore.properties`, a `signingConfigs.release` block, and set the release build type to use it when the file is present.
- **scripts/build-android.js:** Now requires `credentials.json` and a valid keystore; exits with a clear error if missing so we never accidentally build a store AAB in debug mode. Always writes `android/keystore.properties` before running Gradle.
- **SIGNING.md:** Documents how to fix “signed in debug mode” and “wrong key”, and what to do if you run prebuild again (re-apply release signing in `build.gradle` if needed).

---

## 6. Upload key (wrong key) and keystore check

- **Wrong key error:** Play expected SHA1 `84:58:BB:4E:...` but the local AAB was signed with a different key. Documented in SIGNING.md: use the keystore that matches the expected key, or use EAS Build, or request an upload key reset in Play Console.
- **keystore-fingerprint:** Added `scripts/keystore-fingerprint.js` and `npm run keystore-fingerprint` to print the SHA1 of the current keystore so you can confirm it matches what Play expects.

---

## 7. Package.json scripts

- **android:release** – Run the app in release variant: `npx expo run:android --variant release`.
- **release:apk** – Prebuild then build release APK: `npm run prebuild && npm run build:local:apk`.
- **release:aab** – Prebuild then build release AAB: `npm run prebuild && npm run build:local:aab`.
- **keystore-fingerprint** – Print current keystore SHA1 for comparison with Play Console.

---

## 8. Play Console / store

- **Add AAB to release:** If the release had “no app bundles” or “doesn’t add any app bundles”, we made sure to upload the AAB (or add from library) in the release before rolling out.
- **Production access:** To apply for production you need: a published closed testing release, at least 12 testers opted-in, and the closed test run for at least 14 days.
- **AdMob ↔ Google Play:** To connect the app in AdMob, package name must be exactly `com.swipewatch.app`, and the app must have a rolled-out release (e.g. closed testing). It can take up to 24–48 hours after first rollout for the link to appear.
- **“(Unreviewed)”:** The temporary name “com.swipewatch.app (unreviewed)” goes away after Google reviews and approves a release on that track (e.g. closed or production). Ensure main store listing app name is set to “SwipeWatch.”

---

## 9. Files created or updated

| File | Purpose |
|------|--------|
| `public/app-ads.txt` | AdMob app-ads.txt for developer website root. |
| `app/+html.tsx` | SEO meta (title, description, OG, Twitter). |
| `app.json` | Logo paths; version/versionCode; AD_ID permission. |
| `android/app/build.gradle` | Release signing from keystore.properties. |
| `scripts/build-android.js` | Require credentials, write keystore.properties, never debug for store. |
| `scripts/keystore-fingerprint.js` | Print keystore SHA1. |
| `scripts/generate-logo-png.js` | Generate logo.png from logo.svg. |
| `package.json` | Scripts: android:release, release:apk, release:aab, keystore-fingerprint, generate-logo. |
| `RELEASE.md` | Release checklist, timeline, testing time, release notes. |
| `SIGNING.md` | Fix “debug mode” and “wrong key”; what to do after prebuild. |
| `WHAT-WE-DID.md` | This summary. |

---

You can use this list as a checklist or handover for what’s been done and what to do next (e.g. 12 testers, 14 days, then apply for production and link AdMob).
