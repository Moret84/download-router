# Native host installers

The Download Router extension talks to a native helper that moves finished
downloads. The browser never installs this helper, so it must be installed and
registered separately. Released builds are **unsigned**, so the OS will warn
before letting them run.

The registration logic lives in the binary itself
(`download-router-host install` / `uninstall`); the packages below are thin
wrappers around it.

## macOS (.pkg)

Install the `download-router-host-macos.pkg` from the release. Because it is
unsigned, right-click it in Finder and choose **Open**, or allow it in
**System Settings → Privacy & Security**. The package installs the binary under
`/Library/Application Support/download-router` and registers it system-wide.

To remove it:

```sh
"/Library/Application Support/download-router/download-router-host" uninstall --system
sudo rm -rf "/Library/Application Support/download-router"
```

## Windows (.exe)

Run `download-router-host-setup-windows-amd64.exe` from the release. SmartScreen
will warn about an unknown publisher: choose **More info → Run anyway**. It
installs per-user and registers the host. Uninstall from
**Settings → Apps**.

## Linux (tarball)

```sh
tar xzf download-router-host-linux-amd64.tar.gz
cd download-router-host-linux-amd64
./download-router-host install
```

Uninstall with `./download-router-host uninstall`.

## Configuration

On install the binary seeds a `config.json` next to itself with a default
allowlist (`"allowedRoots": ["~"]`, i.e. anywhere in your home). Edit it to
restrict where downloads may be moved:

```json
{
  "allowedRoots": ["~/Downloads", "~/Documents"]
}
```

## Building from source

```sh
cd host && go build -o download-router-host . && ./download-router-host install
```
