#!/usr/bin/env sh
# Install the Download Router native messaging host on macOS or Linux.
# Usage: install.sh [path-to-host-binary]
set -eu

HOST_NAME="download_router"
EXTENSION_ID="download-router@bosscorp.fr"

SCRIPT_DIR=$(CDPATH= cd "$(dirname "$0")" && pwd)
BIN_SRC=${1:-"$SCRIPT_DIR/download-router-host"}

if [ ! -f "$BIN_SRC" ]; then
  echo "Native host binary not found: $BIN_SRC" >&2
  echo "Build it first (cd host && go build -o download-router-host .)" >&2
  echo "or pass its path as the first argument." >&2
  exit 1
fi

case "$(uname -s)" in
  Darwin)
    MANIFEST_DIR="$HOME/Library/Application Support/Mozilla/NativeMessagingHosts"
    INSTALL_DIR="$HOME/Library/Application Support/download-router"
    ;;
  Linux)
    MANIFEST_DIR="$HOME/.mozilla/native-messaging-hosts"
    INSTALL_DIR="${XDG_DATA_HOME:-$HOME/.local/share}/download-router"
    ;;
  *)
    echo "Unsupported OS: $(uname -s). Use installers/install.ps1 on Windows." >&2
    exit 1
    ;;
esac

mkdir -p "$INSTALL_DIR" "$MANIFEST_DIR"

BIN_DEST="$INSTALL_DIR/download-router-host"
cp "$BIN_SRC" "$BIN_DEST"
chmod +x "$BIN_DEST"

CONFIG="$INSTALL_DIR/config.json"
if [ ! -f "$CONFIG" ]; then
  printf '{\n  "allowedRoots": ["~"]\n}\n' > "$CONFIG"
  echo "Wrote default config (allowed root: home). Edit $CONFIG to restrict it."
fi

MANIFEST="$MANIFEST_DIR/$HOST_NAME.json"
cat > "$MANIFEST" <<EOF
{
  "name": "$HOST_NAME",
  "description": "Download Router native messaging host",
  "path": "$BIN_DEST",
  "type": "stdio",
  "allowed_extensions": ["$EXTENSION_ID"]
}
EOF

echo "Installed native host:"
echo "  binary:   $BIN_DEST"
echo "  manifest: $MANIFEST"
