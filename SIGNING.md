# Android signing

## Fix "Signed in debug mode"

If Play Console says: **"You uploaded an APK or Android App Bundle that was signed in debug mode"**, the release build was not signed with your release keystore.

**Do this:**

1. **Build with the release script** (it writes `android/keystore.properties` and requires `credentials.json`):
   ```bash
   npm run build:local:aab
   ```
2. **Use the new AAB** from `android/app/build/outputs/bundle/release/app-release.aab`. Do not upload an AAB produced by `npx expo run:android` (that is a debug build).
3. **Keep release signing in Gradle:** `android/app/build.gradle` must load `keystore.properties` and use `signingConfigs.release` for the `release` build type. If you run `npx expo prebuild --clean`, that file is regenerated and you must re-apply the release signing block (see the current `android/app/build.gradle` for the `hasReleaseKeystore` / `signingConfigs.release` section).

---

## Fix "Your Android App Bundle is signed with the wrong key"

Play Console expects this **upload key** certificate:
- **SHA1:** `84:58:BB:4E:F8:38:2A:D8:EB:C9:21:D3:09:77:94:89:89:3C:6B:84`

Your current **local** AAB is signed with a different key:
- **SHA1:** `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25`

So you must either use the keystore that has the expected key, or reset the upload key in Play Console.

---

## Option 1: Use the keystore that has SHA1 `84:58:BB:4E:...` (recommended if you have it)

The first AAB you ever uploaded to this app was signed with that key. That key lives in **some** keystore.

- If you **built with EAS** the first time, EAS holds that key. Use **Option 2** (build with EAS) and upload that AAB.
- If you **built locally** with a different machine or a different keystore file, find that file (e.g. `keystore.jks` or `upload-keystore.jks` and the alias/passwords). Then:
  1. Replace `credentials/android/keystore.jks` with that keystore file.
  2. Update `credentials.json` with the **correct** `keyAlias`, `keystorePassword`, and `keyPassword` for that keystore.
  3. Run `node scripts/keystore-fingerprint.js` and confirm it prints SHA1 `84:58:BB:4E:...`.
  4. Run `npm run build:local:aab` and upload the new AAB.

---

## Option 2: Build with EAS and upload that AAB

If the app was first uploaded with **EAS Build**, the correct upload key is managed by EAS. In that case **do not** use your local keystore for Play uploads.

1. Build on EAS:
   ```bash
   eas build --platform android --profile production
   ```
2. Download the AAB from the EAS build page (or use `eas submit`).
3. Upload **that** AAB to Play Console (Closed testing or Production). It will be signed with the key Play expects.

---

## Option 3: Request upload key reset in Play Console (if you lost the old key)

If you **no longer have** the keystore with SHA1 `84:58:BB:4E:...` and you are not using EAS, you can ask Google to accept a **new** upload key (the one you have now).

1. In **Play Console**: your app → **Setup** → **App signing** (under "App integrity").
2. Find **Upload key** and choose **Request upload key reset** (or similar).
3. Follow Google’s steps; you’ll need to sign a new key (e.g. with your current `credentials/android/keystore.jks`) and provide the certificate.
4. After the reset is approved, Play will expect **your current** key (SHA1 `5E:8F:16:06:...`). Then:
   - Run `npm run build:local:aab`
   - Upload the new AAB again.

Reset can take a few days. Use this only if you cannot use Option 1 or 2.

---

## Check which key your current keystore has

From the project root:

```bash
node scripts/keystore-fingerprint.js
```

This prints the SHA1 of the key in `credentials.json` / `credentials/android/keystore.jks`. It must match `84:58:BB:4E:F8:38:2A:D8:EB:C9:21:D3:09:77:94:89:89:3C:6B:84` for Play to accept your AAB (unless you’ve done an upload key reset).
