# SentinelX — YARA Malware Scanning Setup

## 1. Overview

SentinelX integrates **YARA v4.5.5** for static signature analysis, webshell detection, ransomware command detection, and credential dumping tool identification.

Rule definitions are maintained at: `yara/rules/malware_rules.yar`.

---

## 2. Installing YARA

### Linux (Ubuntu / Debian):
```bash
sudo apt-get update
sudo apt-get install -y yara
```

### macOS (Homebrew):
```bash
brew install yara
```

### Windows:
1. Download precompiled binary from [VirusTotal YARA GitHub Releases](https://github.com/VirusTotal/yara/releases).
2. Extract `yara64.exe` to `C:\Program Files\yara\yara.exe`.
3. Add `C:\Program Files\yara` to your System `PATH`.

---

## 3. Running Scans via SentinelX Utility

The Node.js scanner utility (`scripts/scanYara.js`) executes YARA against target files or directories:

```bash
# Scan a specific file or directory
node scripts/scanYara.js yara/rules/malware_rules.yar
```

Expected output for benign files:
```
==================================================
       SENTINELX YARA MALWARE SCAN UTILITY        
==================================================
Rule definitions : D:\SentinelX\yara\rules\malware_rules.yar
Scanning target  : D:\SentinelX\yara\rules\malware_rules.yar

[CLEAN] No malware signatures detected.
```

---

## 4. Included YARA Signatures

The rule file contains the following production rules:
1. `Webshell_PHP_Generic`: Detects `eval(base64_decode())`, `system($_GET)`, `c99shell`, `r57shell`, `WSO` (MITRE T1505.003).
2. `Ransomware_ShadowCopy_Deletion`: Detects `vssadmin delete shadows`, `wbadmin delete catalog`, `bcdedit recoveryenabled no` (MITRE T1490).
3. `Mimikatz_Credential_Dumping`: Detects `sekurlsa::logonpasswords`, `lsadump::sam`, `privilege::debug` (MITRE T1003.001).
4. `PowerShell_Suspicious_Execution`: Detects `-EncodedCommand`, `-enc`, `DownloadString`, `IEX` download cradles (MITRE T1059.001).
