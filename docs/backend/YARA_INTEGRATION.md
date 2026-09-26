# SentinelX — YARA Malware Scanner Integration

## 1. Architecture

SentinelX integrates **YARA v4.5.5** via CLI invocation (`scripts/scanYara.js`) and precompiled Docker container environments (`backend/Dockerfile`).

The scanning pipeline inspects file system targets against curated rule definitions at `yara/rules/malware_rules.yar`.

---

## 2. Integrated Signatures

1. **`Webshell_PHP_Generic`** (T1505.003):
   Detects PHP webshell backdoors using regexes for `eval(base64_decode())`, `system($_GET)`, and known backdoor identifiers (c99shell, r57shell, WSO).
2. **`Ransomware_ShadowCopy_Deletion`** (T1490):
   Detects commands inhibiting system recovery (`vssadmin delete shadows`, `wbadmin delete catalog`, `bcdedit /set recoveryenabled no`).
3. **`Mimikatz_Credential_Dumping`** (T1003.001):
   Detects commands and memory manipulation signatures for credential dumping (`sekurlsa::logonpasswords`, `lsadump::sam`).
4. **`PowerShell_Suspicious_Execution`** (T1059.001):
   Detects obfuscated download cradles and bypass arguments (`-EncodedCommand`, `-enc`, `Net.WebClient DownloadString`, `IEX`).
