#!/bin/bash
# Upload a photo to Cloudflare R2 and generate a content markdown file.
#
# Usage: ./scripts/upload-photo.sh <image-path> [title]
#
# Prerequisites:
#   - wrangler configured with your Cloudflare account
#   - R2 bucket named "portol-media" (change BUCKET below if different)
#
# This script:
#   1. Uploads the image to R2
#   2. Creates a markdown file in src/content/photography/

set -e

BUCKET="portol-assets"
CUSTOM_DOMAIN="assets.joenoseph.co.uk"  # Change to your R2 custom domain or public URL

IMAGE_PATH="$1"
TITLE="${2:-$(basename "$IMAGE_PATH" | sed 's/\.[^.]*$//' | tr '-_' '  ')}"

if [ -z "$IMAGE_PATH" ]; then
  echo "Usage: $0 <image-path> [title]"
  exit 1
fi

if [ ! -f "$IMAGE_PATH" ]; then
  echo "Error: File not found: $IMAGE_PATH"
  exit 1
fi

FILENAME=$(basename "$IMAGE_PATH")
SLUG=$(echo "$FILENAME" | sed 's/\.[^.]*$//' | tr ' ' '-' | tr '[:upper:]' '[:lower:]')
R2_KEY="photography/$FILENAME"

echo "Uploading $FILENAME to R2..."
npx wrangler r2 object put "$BUCKET/$R2_KEY" --file "$IMAGE_PATH"

IMAGE_URL="https://$CUSTOM_DOMAIN/$R2_KEY"
DATE=$(date +%Y-%m-%d)
MD_FILE="src/content/photography/$SLUG.md"

cat > "$MD_FILE" << EOF
---
title: "$TITLE"
alt: "$TITLE"
src: "$IMAGE_URL"
date: $DATE
order: 0
---
EOF

echo "Created $MD_FILE"
echo "Image URL: $IMAGE_URL"
echo ""
echo "Edit $MD_FILE to add caption, camera, lens, collection, etc."
