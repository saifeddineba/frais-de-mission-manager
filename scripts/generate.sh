#!/usr/bin/env bash
# scripts/generate.sh
# Usage: bash scripts/generate.sh
set -euo pipefail

# Create data directory
mkdir -p data

# Download official GeoJSON from fr33dz/Algeria-geojson
echo "Downloading all-wilayas.geojson..."
curl -L -o data/all-wilayas.geojson https://raw.githubusercontent.com/fr33dz/Algeria-geojson/master/all-wilayas.geojson

# Check dependencies
command -v mapshaper >/dev/null 2>&1 || { echo "mapshaper not found. Install with: npm install -g mapshaper"; exit 1; }
command -v svgo >/dev/null 2>&1 || { echo "svgo not found. Install with: npm install -g svgo"; exit 1; }
command -v node >/dev/null 2>&1 || { echo "node not found. Install Node.js"; exit 1; }

# Simplify GeoJSON to an "equilibré" level (adjust percent if needed)
echo "Simplifying GeoJSON (7%)..."
mapshaper data/all-wilayas.geojson -simplify dp 7% -o format=geojson precision=0.0001 data/all-wilayas-simplified.geojson

# Convert simplified GeoJSON -> SVG using the provided node script (adds ids/data-name)
echo "Generating SVG from simplified GeoJSON..."
node scripts/geo2svg.js data/all-wilayas-simplified.geojson > data/algeria-wilayas.svg

# Optimize SVG
echo "Optimizing SVG with svgo..."
svgo data/algeria-wilayas.svg -o data/algeria-wilayas.min.svg

echo "Done. Output: data/algeria-wilayas.svg and data/algeria-wilayas.min.svg"
