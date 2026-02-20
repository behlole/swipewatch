#!/usr/bin/env node
/**
 * Prints the SHA1 (and SHA256) fingerprint of the release keystore.
 * Use this to verify which key you're signing with. Play Console expects
 * the fingerprint shown under "App signing" → "Upload key certificate".
 */
const path = require('path');
const { execSync } = require('child_process');

const fs = require('fs');
const projectRoot = path.resolve(__dirname, '..');
const credentialsPath = path.join(projectRoot, 'credentials.json');
const cred = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
const ks = cred?.android?.keystore;
if (!ks) {
  console.error('No android.keystore in credentials.json');
  process.exit(1);
}

const keystorePath = path.resolve(projectRoot, ks.keystorePath || 'credentials/android/keystore.jks');
if (!fs.existsSync(keystorePath)) {
  console.error('Keystore not found:', keystorePath);
  process.exit(1);
}

const alias = ks.keyAlias;
const storePass = ks.keystorePassword;
const keyPass = ks.keyPassword || ks.keystorePassword;

try {
  const out = execSync(
    `keytool -list -v -keystore "${keystorePath}" -alias "${alias}" -storepass "${storePass}" -keypass "${keyPass}"`,
    { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
  );
  console.log(out);
  const sha1Match = out.match(/SHA1:\s*([\dA-F:]+)/i);
  if (sha1Match) {
    const current = sha1Match[1].replace(/\s/g, '').toUpperCase();
    const expected = '84:58:BB:4E:F8:38:2A:D8:EB:C9:21:D3:09:77:94:89:89:3C:6B:84'.replace(/\s/g, '').toUpperCase();
    console.log('\n>>> Current upload key SHA1:', sha1Match[1]);
    console.log('>>> Play Console expects:  84:58:BB:4E:F8:38:2A:D8:EB:C9:21:D3:09:77:94:89:89:3C:6B:84');
    if (current !== expected) {
      console.log('>>> MISMATCH – see SIGNING.md for how to fix.');
    } else {
      console.log('>>> Match – this keystore is the one Play expects.');
    }
  }
} catch (e) {
  if (e.stderr) process.stderr.write(e.stderr);
  console.error('keytool failed. Check keystore path, alias, and store password in credentials.json');
  process.exit(1);
}
