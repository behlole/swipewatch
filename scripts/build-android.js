#!/usr/bin/env node
/**
 * Local Android production build (APK or AAB).
 * - Runs prebuild if android/ is missing
 * - Writes android/keystore.properties from credentials.json for release signing
 * - Runs Gradle assembleRelease (APK) or bundleRelease (AAB)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const projectRoot = path.resolve(__dirname, '..');
const androidDir = path.join(projectRoot, 'android');
const credentialsPath = path.join(projectRoot, 'credentials.json');
const keystorePropsPath = path.join(androidDir, 'keystore.properties');

const task = process.argv[2]; // 'apk' or 'aab'
if (!task || !['apk', 'aab'].includes(task)) {
  console.error('Usage: node scripts/build-android.js <apk|aab>');
  process.exit(1);
}

function run(cmd, opts = {}) {
  console.log('>', cmd);
  execSync(cmd, { stdio: 'inherit', cwd: opts.cwd || projectRoot, ...opts });
}

// 1) Ensure android folder exists
if (!fs.existsSync(path.join(androidDir, 'build.gradle'))) {
  console.log('No android folder found. Running prebuild...');
  run('npx expo prebuild --platform android --clean');
}

// 2) Write keystore.properties for release signing (from credentials.json)
if (fs.existsSync(credentialsPath)) {
  const cred = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
  const ks = cred?.android?.keystore;
  if (ks) {
    const content = [
      'storeFile=../../credentials/android/keystore.jks',
      `storePassword=${ks.keystorePassword}`,
      `keyAlias=${ks.keyAlias}`,
      `keyPassword=${ks.keyPassword}`,
    ].join('\n');
    fs.writeFileSync(keystorePropsPath, content, 'utf8');
    console.log('Wrote android/keystore.properties for release signing.');
  }
} else {
  console.warn('No credentials.json found. Release build will use debug signing.');
}

// 3) Resolve JAVA_HOME (required for Gradle)
function findJavaHome() {
  if (process.env.JAVA_HOME && fs.existsSync(path.join(process.env.JAVA_HOME, 'bin', 'java.exe'))) return process.env.JAVA_HOME;
  if (process.env.JAVA_HOME && fs.existsSync(path.join(process.env.JAVA_HOME, 'bin', 'java'))) return process.env.JAVA_HOME;

  const isWin = process.platform === 'win32';
  const programFiles = process.env['ProgramFiles'] || 'C:\\Program Files';
  const programFilesX86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';
  const localAppData = process.env.LOCALAPPDATA || path.join(process.env.USERPROFILE || '', 'AppData', 'Local');

  const dirsToTry = isWin
    ? [
        path.join(programFiles, 'Android', 'Android Studio', 'jbr'),
        path.join(programFiles, 'Android', 'Android Studio', 'jre'),
        path.join(localAppData, 'Programs', 'Android Studio', 'jbr'),
        path.join(programFiles, 'Microsoft', 'jdk-17.0.13'),
        path.join(programFiles, 'Eclipse Adoptium', 'jdk-17.0.13.101-hotspot'),
        path.join(programFiles, 'Java', 'jdk-17'),
      ]
    : [
        path.join(process.env.HOME || '', 'Android', 'Studio', 'jbr'),
        '/Applications/Android Studio.app/Contents/jbr/Contents/Home',
        '/usr/lib/jvm/java-17-openjdk-amd64',
        '/usr/lib/jvm/java-17-openjdk',
      ];

  for (const dirPath of dirsToTry) {
    if (fs.existsSync(dirPath)) {
      const bin = path.join(dirPath, 'bin', isWin ? 'java.exe' : 'java');
      if (fs.existsSync(bin)) return dirPath;
    }
  }

  if (isWin) {
    const adoptium = path.join(programFiles, 'Eclipse Adoptium');
    const microsoft = path.join(programFiles, 'Microsoft');
    const javaDir = path.join(programFiles, 'Java');
    for (const parent of [adoptium, microsoft, javaDir]) {
      if (!fs.existsSync(parent)) continue;
      const entries = fs.readdirSync(parent);
      const jdk = entries.find((e) => e.startsWith('jdk-17') || e.startsWith('jdk11') || e === 'jdk-17');
      if (jdk) {
        const dirPath = path.join(parent, jdk);
        const bin = path.join(dirPath, 'bin', 'java.exe');
        if (fs.existsSync(bin)) return dirPath;
      }
    }
  }

  try {
    if (!isWin) {
      const out = execSync('/usr/libexec/java_home -v 17 2>/dev/null || true', { encoding: 'utf8' });
      const home = out.trim();
      if (home && fs.existsSync(home)) return home;
    }
  } catch (_) {}

  return null;
}

const javaHome = process.env.JAVA_HOME || findJavaHome();
if (!javaHome) {
  console.error('\nJAVA_HOME is not set and no JDK was found.');
  console.error('Install Android Studio or OpenJDK 17, or set JAVA_HOME to your JDK root.');
  process.exit(1);
}
process.env.JAVA_HOME = javaHome;
console.log('Using JAVA_HOME:', javaHome);

// 4) Resolve Android SDK and write local.properties (Gradle reads sdk.dir from it)
function findAndroidSdk() {
  if (process.env.ANDROID_HOME && fs.existsSync(path.join(process.env.ANDROID_HOME, 'platform-tools'))) return process.env.ANDROID_HOME;
  if (process.env.ANDROID_SDK_ROOT && fs.existsSync(path.join(process.env.ANDROID_SDK_ROOT, 'platform-tools'))) return process.env.ANDROID_SDK_ROOT;

  const isWin = process.platform === 'win32';
  const localAppData = process.env.LOCALAPPDATA || path.join(process.env.USERPROFILE || '', 'AppData', 'Local');
  const candidates = isWin
    ? [
        path.join(localAppData, 'Android', 'Sdk'),
        path.join(process.env.USERPROFILE || '', 'AppData', 'Local', 'Android', 'Sdk'),
      ]
    : [
        path.join(process.env.HOME || '', 'Android', 'Sdk'),
        path.join(process.env.HOME || '', 'Library', 'Android', 'sdk'),
      ];

  for (const dirPath of candidates) {
    if (fs.existsSync(dirPath) && fs.existsSync(path.join(dirPath, 'platform-tools'))) return dirPath;
  }
  return null;
}

const androidSdk = findAndroidSdk();
if (!androidSdk) {
  console.error('\nAndroid SDK not found. Set ANDROID_HOME to your SDK root, or install Android Studio.');
  console.error('Default Windows path: %LOCALAPPDATA%\\Android\\Sdk');
  process.exit(1);
}
process.env.ANDROID_HOME = androidSdk;
const localPropsPath = path.join(androidDir, 'local.properties');
const sdkDirEscaped = androidSdk.replace(/\\/g, '\\\\');
fs.writeFileSync(localPropsPath, 'sdk.dir=' + sdkDirEscaped + '\n', 'utf8');
console.log('Using Android SDK:', androidSdk);

const isWin = process.platform === 'win32';

// 5) Gradle properties: more JVM memory (avoid metaspace/cache errors) + arm64-only build
const gradlePropsPath = path.join(androidDir, 'gradle.properties');
if (fs.existsSync(gradlePropsPath)) {
  let props = fs.readFileSync(gradlePropsPath, 'utf8');
  // Increase heap and metaspace so daemon does not run out (fixes lintVitalAnalyzeRelease / metadata.bin)
  if (props.includes('org.gradle.jvmargs=')) {
    props = props.replace(/org\.gradle\.jvmargs=.*/g, 'org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=1024m');
  } else {
    props = 'org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=1024m\n' + props;
  }
  if (props.includes('reactNativeArchitectures=')) {
    props = props.replace(/reactNativeArchitectures=.*/g, 'reactNativeArchitectures=arm64-v8a');
  } else {
    props = props.trimEnd() + '\nreactNativeArchitectures=arm64-v8a\n';
  }
  fs.writeFileSync(gradlePropsPath, props, 'utf8');
  console.log('Gradle: increased JVM memory; building arm64-v8a only.');
}

// 6) Stop Gradle daemon so next run uses new jvmargs and avoids corrupted cache
try {
  run(`${isWin ? 'gradlew.bat' : './gradlew'} --stop`, { cwd: androidDir });
} catch (_) {}

// 7) Clear corrupted Gradle transforms cache (fixes "Could not read workspace metadata from ... metadata.bin")
const gradleUserHome = process.env.GRADLE_USER_HOME || path.join(process.env.USERPROFILE || process.env.HOME || '', '.gradle');
let gradleVersion = '8.14.3';
const wrapperPropsPath = path.join(androidDir, 'gradle', 'wrapper', 'gradle-wrapper.properties');
if (fs.existsSync(wrapperPropsPath)) {
  const match = fs.readFileSync(wrapperPropsPath, 'utf8').match(/gradle-(\d+\.\d+\.\d+)/);
  if (match) gradleVersion = match[1];
}
const transformsDir = path.join(gradleUserHome, 'caches', gradleVersion, 'transforms');
if (fs.existsSync(transformsDir)) {
  fs.rmSync(transformsDir, { recursive: true });
  console.log('Cleared Gradle transforms cache to fix metadata errors.');
}

// 8) Clean native/cxx cache to avoid MalformedJsonException from stale CMake metadata
const dirsToClean = [
  path.join(projectRoot, 'node_modules', 'expo-modules-core', 'android', '.cxx'),
  path.join(androidDir, '.cxx'),
  path.join(androidDir, 'app', '.cxx'),
];
for (const d of dirsToClean) {
  if (fs.existsSync(d)) {
    fs.rmSync(d, { recursive: true });
    console.log('Cleaned', path.relative(projectRoot, d));
  }
}
console.log('Running Gradle clean...');
run(`${isWin ? 'gradlew.bat' : './gradlew'} clean`, { cwd: androidDir });

// 9) Run release build
const gradlew = isWin ? 'gradlew.bat' : './gradlew';
const gradleTask = task === 'apk' ? 'assembleRelease' : 'bundleRelease';

run(`${gradlew} app:${gradleTask}`, { cwd: androidDir });

// 10) Print output paths
if (task === 'apk') {
  const apkPath = path.join(androidDir, 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');
  console.log('\nAPK built:', apkPath);
} else {
  const aabPath = path.join(androidDir, 'app', 'build', 'outputs', 'bundle', 'release', 'app-release.aab');
  console.log('\nAAB built:', aabPath);
}
