#!/usr/bin/env node
// scripts/geo2svg.js
// Usage: node scripts/geo2svg.js <input-geojson-file> > output.svg
// Reads a GeoJSON FeatureCollection and outputs an SVG with one <path> per feature.

const fs = require('fs');
if (process.argv.length < 3) {
  console.error('Usage: node scripts/geo2svg.js <input-geojson-file>');
  process.exit(2);
}
const inputPath = process.argv[2];
let geojson;
try {
  geojson = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
} catch (e) {
  console.error('Error reading or parsing GeoJSON:', e.message);
  process.exit(3);
}

const features = geojson.features || [];
if (!features.length) {
  console.error('No features found in GeoJSON.');
  process.exit(4);
}

// Compute bbox of all coordinates
let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
function updateBBox(pt) {
  const [x, y] = pt;
  if (x < minX) minX = x;
  if (y < minY) minY = y;
  if (x > maxX) maxX = x;
  if (y > maxY) maxY = y;
}

features.forEach(f => {
  const geom = f.geometry;
  if (!geom) return;
  if (geom.type === 'Polygon') {
    geom.coordinates.forEach(ring => ring.forEach(pt => updateBBox(pt)));
  } else if (geom.type === 'MultiPolygon') {
    geom.coordinates.forEach(poly => poly.forEach(ring => ring.forEach(pt => updateBBox(pt))));
  }
});

if (!isFinite(minX)) {
  console.error('Could not compute bbox from coordinates.');
  process.exit(5);
}

const padding = 10; // px
const widthLon = maxX - minX || 1;
const heightLat = maxY - minY || 1;
const viewW = 1200; // svg width in px
const scaleX = (viewW - 2 * padding) / widthLon;
const scaleY = scaleX; // keep aspect
const viewH = Math.round(heightLat * scaleY) + 2 * padding;

function proj(pt) {
  const [x, y] = pt;
  const X = (x - minX) * scaleX + padding;
  const Y = viewH - ((y - minY) * scaleY + padding); // flip Y for SVG
  return [X, Y];
}

function ringToPath(ring) {
  return ring.map((pt, i) => {
    const [X, Y] = proj(pt);
    return (i === 0 ? ('M' + X.toFixed(2) + ' ' + Y.toFixed(2)) : ('L' + X.toFixed(2) + ' ' + Y.toFixed(2)));
  }).join('');
}

function polygonToPath(coords) {
  return coords.map(ring => ringToPath(ring)).join(' ' ) + ' Z';
}

let svg = '';
svg += '<?xml version="1.0" encoding="UTF-8"?>\n';
svg += `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewW} ${viewH}" width="${viewW}" height="${viewH}">\n`;
svg += '  <defs>\n    <style>path.wilaya{fill:#e6eef8;stroke:#2b4f77;stroke-width:0.5px}</style>\n  </defs>\n';
svg += '  <g id="wilayas">\n';

features.forEach((f, idx) => {
  const props = f.properties || {};
  // Prefer city_code, then code, then assign sequential code if missing
  let code = '';
  if (props.city_code) code = props.city_code.toString();
  else if (props.code) code = props.code.toString();
  else if (props.CC) code = props.CC.toString();
  else code = String(idx + 1).padStart(2, '0');
  code = code.padStart(2, '0');
  const name = (props.name || props.NAME || '').toString().replace(/"/g, "'");

  const geom = f.geometry;
  if (!geom) return;
  let d = '';
  if (geom.type === 'Polygon') {
    d = polygonToPath(geom.coordinates);
  } else if (geom.type === 'MultiPolygon') {
    d = geom.coordinates.map(poly => polygonToPath(poly)).join(' ');
  }
  if (!d) return;
  svg += `    <path id="wilaya_${code}" class="wilaya" data-name="${name}" d="${d.trim()}"/>\n`;
});

svg += '  </g>\n</svg>\n';

process.stdout.write(svg);
