# Local Android production builds (APK & AAB)

Build release **APK** and **AAB** on your machine without EAS cloud.

## Prerequisites

1. **Node.js** (already used by the project)
2. **Java JDK 17** (or 11–21)
   - Install [Android Studio](https://developer.android.com/studio) (includes JDK), or  
   - Install [Eclipse Temurin](https://adoptium.net/) / OpenJDK
3. **JAVA_HOME** set to your JDK root  
   - Example (Windows): `set JAVA_HOME=C:\Program Files\Android\Android Studio\jbr`  
   - Example (macOS/Linux): `export JAVA_HOME=$(/usr/libexec/java_home -v 17)`
4. **Android SDK** (if not using Android Studio, install [command-line tools](https://developer.android.com/studio#command-tools))  
   - **ANDROID_HOME** set to the SDK root (e.g. `C:\Users\<you>\AppData\Local\Android\Sdk`)

The script uses your existing **credentials** (`credentials.json` and `credentials/android/keystore.jks`) for release signing. If those are missing, the release build falls back to debug signing.

## Commands

From the project root:

```bash
# Build release APK (installable .apk)
npm run build:local:apk

# Build release AAB (Play Store .aab)
npm run build:local:aab
```

First run will generate the `android/` folder with `npx expo prebuild` if it does not exist.

## Output locations

- **APK:** `android/app/build/outputs/apk/release/app-release.apk`
- **AAB:** `android/app/build/outputs/bundle/release/app-release.aab`

## Optional: regenerate native project

If you change `app.json` / plugins / native config:

```bash
npm run prebuild
```

Then run `build:local:apk` or `build:local:aab` again.
