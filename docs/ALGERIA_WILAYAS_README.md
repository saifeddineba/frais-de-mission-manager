# Algeria Wilayas — GeoJSON + generation script

This folder contains a script to download the official GeoJSON for Algerian wilayas, simplify it to a balanced level, generate a single SVG with one <path> per wilaya (ids set to `wilaya_<code>`), and produce an optimized/minified SVG.

Files added by this branch:
- scripts/geo2svg.js — Node.js script that converts GeoJSON -> SVG and assigns ids/data-name.
- scripts/generate.sh — Bash script that downloads the GeoJSON, simplifies it (mapshaper), runs the converter, and optimizes the SVG with svgo.

How to generate the SVG locally
1. Install dependencies (requires Node.js and npm):
   - npm install -g mapshaper svgo
2. Run the generation script:
   - bash scripts/generate.sh

Output files will be created in `data/`:
- data/all-wilayas.geojson — raw GeoJSON downloaded from fr33dz/Algeria-geojson (source)
- data/all-wilayas-simplified.geojson — simplified GeoJSON (7% dp simplification)
- data/algeria-wilayas.svg — full SVG (one <path> per wilaya, with ids like `wilaya_16`)
- data/algeria-wilayas.min.svg — optimized/minified SVG (svgo)

Notes
- The simplification level is set to 7% (balanced). Adjust the value in `scripts/generate.sh` (mapshaper `-simplify dp`) if you want more or less detail.
- The generated SVG uses a simple linear lon/lat projection (equirectangular-like) which is visually suitable for app backgrounds. If you need a different projection (Mercator, Lambert), update `scripts/geo2svg.js` to apply a projection (use proj4 or proj4js).
- Each path has an `id` of the form `wilaya_XX` where `XX` is the two-digit city code from the GeoJSON properties (falls back to an index if missing).

Source
- GeoJSON source: https://github.com/fr33dz/Algeria-geojson (all-wilayas.geojson)

License
- The files included in this branch are scripts and instructions. The GeoJSON source license is whatever is declared in the source repo; please verify before redistribution.
