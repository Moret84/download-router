# Native host installers

The Download Router extension talks to a native helper that moves finished
downloads. The browser never installs this helper, so it must be registered
separately with these scripts.

## macOS / Linux

```sh
# from the repo, after building the binary:
cd host && go build -o download-router-host . && cd ..
installers/install.sh host/download-router-host
```

Or, from a release archive where the binary sits next to the script:

```sh
./install.sh
```

Uninstall: `installers/uninstall.sh`.

## Windows

```powershell
powershell -ExecutionPolicy Bypass -File installers\install.ps1 path\to\download-router-host.exe
```

Uninstall: `installers\uninstall.ps1`.

## What the installer does

- Copies the binary into a per-user app directory.
- Writes a default `config.json` (allowed root: home) next to the binary, only
  if one does not already exist. Edit it to restrict where downloads may be
  moved.
- Writes the native messaging host manifest where Firefox looks for it
  (a JSON file on macOS/Linux, a registry key on Windows), pointing at the
  binary and allowing this extension's id.
