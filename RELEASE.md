# Swipewatch – Release checklist and timeline

## Pre-release checklist

- [ ] **Version**  
  In `app.json`: `version` (e.g. `1.0.0`) and `android.versionCode` (increment for each upload). Current: version `1.0.0`, versionCode `3`.
- [ ] **Build AAB**  
  `npm run build:local:aab` (or EAS: `eas build --platform android --profile production`)
- [ ] **Store listing**  
  Play Console: short description, full description, screenshots, feature graphic, privacy policy URL.
- [ ] **Content rating**  
  Questionnaire done and rating received.
- [ ] **App content**  
  Ads declaration (yes, AdMob), data safety form, target audience.
- [ ] **Developer account**  
  One-time $25 registration; allow up to 24–48 hours if new.

---

## When will it be released?

| Step | What happens | Typical time |
|------|----------------|-------------|
| **Upload AAB** | You upload the bundle in Play Console (Production or a testing track). | Same day |
| **Google review** | Google checks policy, security, and content. | **~1–3 days** (often 24–48 hours); can be up to **7 days** in busy periods. |
| **Live on Play Store** | After approval, the app goes live (or to the chosen testing track). | Right after approval |

**Practical answer:**  
- **Earliest:** Next day after upload, if review is fast.  
- **Safe estimate:** **2–4 days** from the day you submit for production.  
- **Worst case:** Up to **7 days** (Google’s stated max).

Submit as early as possible to avoid deadline pressure.

---

## How much testing time do you need in Play Console?

You don’t *have* to use internal/closed testing; you can go straight to production. If you do use testing tracks:

| Track | Purpose | Typical testing time |
|-------|---------|----------------------|
| **Internal testing** | Quick install for up to 100 testers; almost no review. | **~15–30 min** (after first upload). Use it to confirm the AAB installs and runs. |
| **Closed testing** | Limited testers; light review. | **A few hours to 1 day** after upload. Optional; use if you want a small group to test before production. |
| **Open testing** | Public opt-in; full review. | Same as production (**1–7 days**). |
| **Production** | Live to everyone. | **1–7 days** review after you submit. |

**Recommendation:**

- **If the deadline is tight:**  
  - Do a quick **internal test** (15–30 min) to confirm install and basic flow.  
  - Then submit to **Production**.  
  - Plan for **at least 2–3 days** before your deadline for Google’s review.

- **If you want more confidence:**  
  - Put the build in **closed testing** for **~1 day**, fix any critical issues, then promote the same (or updated) AAB to **Production**.  
  - Still allow **2–3 days** for production review after that.

So: **minimum testing in Play Console: ~30 minutes (internal).**  
**Buffer for going live: 2–4 days** from production submission.

---

## After release

- **app-ads.txt**  
  Host at your developer website root (e.g. `https://yoursite.com/app-ads.txt`). Set that exact URL as the “Developer website” in Play Console. Allow 24+ hours for AdMob to verify.
- **SEO (web)**  
  Meta tags and Open Graph are in `app/+html.tsx`. Set `EXPO_PUBLIC_WEB_URL` to your live web URL when you deploy the site.

---

## Release notes (paste into Play Console)

**What's new in this release (e.g. 1.0.0):**

- First release of Swipewatch
- Discover movies and TV shows with a simple swipe
- Watch trailers, build your watchlist, and share with groups
- Sign in and sync your taste across devices
