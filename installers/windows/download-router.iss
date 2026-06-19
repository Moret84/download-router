; Inno Setup script for the Download Router native host (per-user, unsigned).
; Build in CI: iscc /DAppVersion=<v> /F"download-router-host-setup-<arch>" \
;   /DBinary=<path-to-download-router-host.exe> download-router.iss

#ifndef AppVersion
  #define AppVersion "0.0.0"
#endif
#ifndef Binary
  #define Binary "download-router-host.exe"
#endif

[Setup]
AppId={{8F2C1A4E-3D9B-4E77-9C21-A1B2C3D4E5F6}
AppName=Download Router Host
AppVersion={#AppVersion}
AppPublisher=Aurelien Rivet
DefaultDirName={userappdata}\download-router
DisableDirPage=yes
DisableProgramGroupPage=yes
PrivilegesRequired=lowest
UninstallDisplayName=Download Router Host
OutputDir=.
OutputBaseFilename=download-router-host-setup

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Files]
Source: "{#Binary}"; DestDir: "{app}"; DestName: "download-router-host.exe"; Flags: ignoreversion

[Run]
; Register the native messaging host (writes the per-user manifest + registry key).
Filename: "{app}\download-router-host.exe"; Parameters: "install"; Flags: runhidden

[UninstallRun]
Filename: "{app}\download-router-host.exe"; Parameters: "uninstall"; Flags: runhidden; RunOnceId: "UnregisterHost"
