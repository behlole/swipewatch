# Export upload certificate to project root for Google Play "Change signing key"
# Uses keystore from credentials.json (credentials/android/keystore.jks)

$Keytool = "C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe"
$Keystore = "credentials\android\keystore.jks"
$Alias = "9a85dfca773c60923a9854bb103f51c9"
$KeystorePassword = "555bd79ec3b02cfeef280737c3a236a3"
$CertOut = "upload_certificate.pem"

if (-not (Test-Path $Keytool)) {
    Write-Error "keytool not found at $Keytool. Install JDK or Android Studio."
    exit 1
}
if (-not (Test-Path $Keystore)) {
    Write-Error "Keystore not found at $Keystore. Run 'npx eas credentials -p android', choose production -> Download credentials from EAS, so the keystore is saved to this path."
    exit 1
}

& $Keytool -exportcert -alias $Alias -keystore $Keystore -rfc -file $CertOut -storepass $KeystorePassword
if ($LASTEXITCODE -eq 0) {
    Write-Host "Certificate exported to: $CertOut (project root)"
} else {
    Write-Error "keytool failed. Check alias and password."
    exit 1
}
