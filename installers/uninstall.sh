#!/usr/bin/env sh
# Remove the Download Router native messaging host on macOS or Linux.
set -eu

HOST_NAME="download_router"

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
    echo "Unsupported OS: $(uname -s)." >&2
    exit 1
    ;;
esac

rm -f "$MANIFEST_DIR/$HOST_NAME.json"
rm -rf "$INSTALL_DIR"

echo "Removed the native host manifest and install directory."
echo "Your config.json (if customized) was inside $INSTALL_DIR and is now gone."
