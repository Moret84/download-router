#!/usr/bin/env bash
# Build an unsigned macOS .pkg for the Download Router native host.
# Usage: build-pkg.sh <binary> <version> <output.pkg>
set -euo pipefail

BIN=$1
VERSION=$2
OUTPUT=$3

IDENTIFIER="fr.bosscorp.download-router-host"
INSTALL_DIR="Library/Application Support/download-router"

STAGE=$(mktemp -d)
trap 'rm -rf "$STAGE"' EXIT
PAYLOAD="$STAGE/payload"
SCRIPTS="$STAGE/scripts"
mkdir -p "$PAYLOAD/$INSTALL_DIR" "$SCRIPTS"

cp "$BIN" "$PAYLOAD/$INSTALL_DIR/download-router-host"
chmod +x "$PAYLOAD/$INSTALL_DIR/download-router-host"
# Strip extended attributes so pkgbuild does not emit AppleDouble (._*) files.
xattr -cr "$PAYLOAD"

# Registration runs as root after the files are laid down; the binary writes the
# system-wide native messaging manifest.
cat > "$SCRIPTS/postinstall" <<'EOF'
#!/bin/bash
"/Library/Application Support/download-router/download-router-host" install --system
exit 0
EOF
chmod +x "$SCRIPTS/postinstall"

pkgbuild \
  --root "$PAYLOAD" \
  --scripts "$SCRIPTS" \
  --identifier "$IDENTIFIER" \
  --version "$VERSION" \
  --install-location / \
  "$OUTPUT"

echo "Built $OUTPUT"
