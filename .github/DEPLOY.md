# Deploy pipeline (EAS + Play Console)

---

## Manual build & publish (no Git / no pipeline)

Use this when the repo is **not** connected to GitHub or you want to build and publish from your machine.

### Prerequisites

- **Node.js** (v18 or v20) and **npm** installed.
- **Expo account** – sign up at [expo.dev](https://expo.dev) if needed.
- **Google Play Console** – app created (you must have created the app in Play Console at least once).

### Step 1: Install EAS CLI and log in

```bash
npm install -g eas-cli
eas login
```

Use your Expo account email/password (or create an account).

### Step 2: Build the Android app

From the project root (`swipewatch`):

**Option A – Production AAB (for Play Store)**

```bash
eas build --platform android --profile production --non-interactive
```

EAS builds in the cloud. When it finishes, you get a link to the build (and the AAB file) on [expo.dev](https://expo.dev).

**Option B – Preview APK (quick local testing only)**

```bash
eas build --platform android --profile preview --non-interactive
```

Use this only for testing; Play Store requires an **AAB**, not an APK.

### Step 3: Publish to Play Console

**Option 1 – Upload AAB manually (easiest, no service account)**

1. Open [expo.dev](https://expo.dev) → your project → **Builds**.
2. Open the latest **Android** build and **download the AAB**.
3. Go to [Google Play Console](https://play.google.com/console) → your app.
4. **Testing** → **Internal testing** (or **Closed testing**).
5. **Create new release** → upload the AAB → add release notes → **Save** → **Review release** → **Start rollout**.

**Option 2 – Submit from terminal (needs service account)**

1. Create a **Google Play service account** and download its JSON key (see section “Google Play service account” below).
2. Save the JSON in the project root as `google-service-account.json` (same folder as `eas.json`).
3. Run:

```bash
# Submit latest build to Internal testing (draft)
eas submit --platform android --latest --profile internal --non-interactive

# Or to Closed testing
eas submit --platform android --latest --profile closed --non-interactive
```

4. In Play Console → **Testing** → **Internal** (or **Closed**) → find the new release → add notes → **Start rollout**.

### Summary (manual, no Git)

| Step | Command / action |
|------|-------------------|
| 1. Login | `eas login` |
| 2. Build AAB | `eas build --platform android --profile production --non-interactive` |
| 3a. Publish | Download AAB from expo.dev → Play Console → Testing → upload AAB → Start rollout |
| 3b. Or submit via CLI | Put `google-service-account.json` in project root → `eas submit --platform android --latest --profile internal --non-interactive` |

When you later connect the repo to GitHub and add secrets, the pipeline will do the build and submit for you on push.

### Fix: "File ./google-service-account.json doesn't exist"

**Option A – Publish without the key (fastest right now)**  
Use **Option 1** above: download the AAB from [expo.dev](https://expo.dev) → Builds → your Android build → Download. Then in [Play Console](https://play.google.com/console) → your app → **Testing** → **Internal testing** → **Create new release** → upload that AAB → **Start rollout**. No service account needed.

**Option B – Use `eas submit` from the terminal**  
1. Create the key: **Play Console** → **Setup** → **API access** → link/create Google Cloud project → create **service account** → create **JSON key** and download it.  
2. Put the key in the project root with the **exact** name `google-service-account.json` (same folder as `eas.json`).  
   - If the downloaded file has another name (e.g. `api-xxxx.json`), copy or rename it:
     - **Windows (CMD):** `copy "C:\Users\Dev Pc\Downloads\your-key.json" "C:\Users\Dev Pc\Desktop\swipewatch\google-service-account.json"`
     - **Git Bash / PowerShell:** `cp "/c/Users/Dev Pc/Downloads/your-key.json" "./google-service-account.json"`  
3. Run again: `eas submit --platform android --latest --profile internal --non-interactive`

---

## What runs when (GitHub pipeline)

| Trigger | Job | Result |
|--------|-----|--------|
| **Push to `main`** | Preview Build (APK) | APK artifact for quick install (no store) |
| **Push to `main`** | Build & Submit to Play (Internal) | Production AAB → **Internal testing** (draft) |
| **Push to `main`** | EAS Update (OTA) | JS bundle pushed to `production` channel |
| **Tag `v*`** (e.g. `v1.0.1`) | Production Build & Submit | AAB → **Internal testing** (draft) |
| **Manual** (Actions → Run workflow) | Manual Build | Choose platform, profile, submit, and **track** (internal / closed / production) |

---

## Play Console testing tiers (Internal → Closed → Production)

Use this order so your app is stable and meets Google’s requirements before going live.

### 1️⃣ Internal Testing (fastest & private)

- Up to **100 testers**, invite by email.
- Review is usually very fast.
- **Use first** to verify: bugs, crashes, login, payments.

**Pipeline:** Every push to `main` submits to Internal testing (draft). In Play Console → **Testing** → **Internal testing** → promote the draft when ready.

### 2️⃣ Closed Testing (important for new accounts)

- **Required for many new developer accounts** before production.
- You need **at least 12 testers** who opt in and actually use the app.
- **Testing period: typically 14 days.** Keep the test active; testers should open and use the app regularly.
- Google may check: stability, functionality, and real usage (not fake installs).

**Pipeline:** When ready for Closed testing:

1. **Actions** → **EAS Build & Deploy** → **Run workflow**.
2. Set **Submit to store** = true, **Submit track** = **closed**.
3. In Play Console → **Testing** → **Closed testing** → create release, upload AAB (or use the one from EAS), add **at least 12 tester emails** (or a Google Group), add release notes → **Start rollout**.
4. Share the **opt-in link** with testers. They must: click link → join test → install from Play Store → **use the app regularly**.
5. **Keep Closed testing active for 14 days**; fix crashes and issues quickly.
6. After 14 days, go to **Production** → **Apply for production** and answer Google’s questions (who tested, how you collected feedback, what you improved). Be detailed.

### 3️⃣ Open Testing (optional)

- Anyone with the link can join. Good for wider beta.
- In `eas.json` you can add a submit profile with `track: "beta"` and use it from the manual workflow if you add an “open” option later.

### 4️⃣ Production

- After approval, release to everyone.
- **Pipeline:** Manual run with **Submit track** = **production** (or promote from Closed/Open in Play Console).

---

## Required GitHub secrets

Add these in **GitHub** → repo → **Settings** → **Secrets and variables** → **Actions**:

| Secret | Description |
|--------|-------------|
| `EXPO_TOKEN` | EAS auth token. Create at [expo.dev/accounts/…/settings/access-tokens](https://expo.dev), then add as repo secret. |
| `GOOGLE_SERVICE_ACCOUNT_KEY` | JSON key for a Google Play service account (see below). Paste the **entire JSON** as the secret value. |

## Google Play service account (for auto-submit)

1. In **Google Play Console** → **Setup** → **API access**, link a Google Cloud project (or create one).
2. Create a **service account** in [Google Cloud Console](https://console.cloud.google.com/) → IAM → Service accounts. Grant a role that can publish (e.g. **Release to production, exclude devices, and use Play App Signing** or “Release apps to testing tracks”).
3. In Play Console → **API access** → open the service account → **Create new key** → JSON. Download the JSON.
4. In Play Console → **Users and permissions** → invite the service account email and give at least **Release to testing tracks**.
5. In **GitHub** → repo **Secrets** → **Actions** → New repository secret: name `GOOGLE_SERVICE_ACCOUNT_KEY`, value = **entire contents** of the JSON file.

## EAS submit config (`eas.json`)

Submit profiles under `submit`:

| Profile     | Play track  | Use case |
|------------|-------------|----------|
| `internal` | internal    | Internal testing (draft). Used on push to `main` and tag `v*`. |
| `closed`   | alpha       | Closed testing (12+ testers, 14 days). Use via **Manual** run with **Submit track** = closed. |
| `production` | production | Production release. Use via **Manual** run with **Submit track** = production after approval. |

- Internal/closed use `releaseStatus: "draft"` so you can review in Play Console before rollout.
- Production uses `releaseStatus: "completed"` for full release.

## Promoting a release in Play Console

After the pipeline submits a build:

1. Open **Play Console** → your app → **Testing** → **Internal testing** (or **Closed testing**).
2. Find the new draft release, add release notes, then **Review release** → **Start rollout**.

## Manual run

**Actions** → **EAS Build & Deploy** → **Run workflow**:

- **Platform**: android / ios / all  
- **Profile**: development / preview / production  
- **Submit to store**: turn on to run `eas submit` after the build (Android only for Play).  
- **Submit track** (when submit is on): **internal** | **closed** | **production** — use **closed** for the 14-day Closed testing phase, **production** only after approval.

---

## Tips to increase approval chances

- No crashes; fix reported issues quickly.
- No policy violations; add a Privacy Policy.
- Professional app icon and screenshots; clear description.
- Functional login and no broken screens.
- Ads placed properly (if any).
- Real testers using the app (not fake installs).
