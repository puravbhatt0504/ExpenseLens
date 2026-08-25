/**
 * build-icons.js — Generate the category icon artwork used by both clients
 * from a single manifest, so the Flutter app and the Next.js web app can
 * never drift from each other.
 *
 * Reads server/icons/manifest.json, resolves each entry to an SVG body
 * (either fetched from the fluent-emoji-flat set on Iconify, or read from
 * server/icons/custom/*.svg), and writes:
 *   - app/lib/utils/category_icons.dart  (const Map<String, String>)
 *   - web/src/lib/categoryIcons.js       (exported plain object)
 *
 * Usage: node scripts/build-icons.js
 */
const fs = require('fs');
const path = require('path');

const ICONS_DIR = path.resolve(__dirname, '..', 'icons');
const MANIFEST_PATH = path.join(ICONS_DIR, 'manifest.json');
const DART_OUT = path.resolve(__dirname, '..', '..', 'app', 'lib', 'utils', 'category_icons.dart');
const JS_OUT = path.resolve(__dirname, '..', '..', 'web', 'src', 'lib', 'categoryIcons.js');
const ICONIFY_SET_URL = 'https://raw.githubusercontent.com/iconify/icon-sets/master/json/fluent-emoji-flat.json';

function escapeForDartTripleQuote(svg) {
  // Dart triple-quoted strings only need $ and backslash escaped; the SVG
  // markup itself never contains an unescaped triple-quote.
  return svg.replace(/\\/g, '\\\\').replace(/\$/g, '\\$');
}

function escapeForJsTemplateLiteral(svg) {
  return svg.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
}

function normalizeSvg(rawSvg, width, height) {
  // Strip any existing outer <svg ...>...</svg> wrapper and re-wrap with a
  // consistent viewBox/width/height so every icon — fluent or custom —
  // shares the same coordinate system.
  const bodyMatch = rawSvg.match(/<svg[^>]*>([\s\S]*)<\/svg>/i);
  const body = bodyMatch ? bodyMatch[1].trim() : rawSvg.trim();
  const viewBoxMatch = rawSvg.match(/viewBox="([^"]+)"/i);
  const viewBox = viewBoxMatch ? viewBoxMatch[1] : `0 0 ${width} ${height}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${width}" height="${height}">${body}</svg>`;
}

async function resolveIcon(key, entry) {
  if (entry.source === 'custom') {
    const filePath = path.join(ICONS_DIR, entry.file);
    const raw = fs.readFileSync(filePath, 'utf8');
    return normalizeSvg(raw, 32, 32);
  }

  if (entry.source === 'iconify') {
    if (!resolveIcon._setCache) {
      console.log(`Fetching fluent-emoji-flat icon set...`);
      const res = await fetch(ICONIFY_SET_URL);
      if (!res.ok) throw new Error(`Failed to fetch icon set: ${res.status}`);
      resolveIcon._setCache = await res.json();
    }
    const set = resolveIcon._setCache;
    const icon = set.icons[entry.id];
    if (!icon) throw new Error(`Icon "${entry.id}" not found in fluent-emoji-flat for key ${key}`);
    const width = icon.width || set.width || 32;
    const height = icon.height || set.height || 32;
    return normalizeSvg(`<svg>${icon.body}</svg>`, width, height);
  }

  throw new Error(`Unknown icon source "${entry.source}" for key ${key}`);
}

async function main() {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  const entries = Object.entries(manifest);
  const resolved = {};

  for (const [key, entry] of entries) {
    resolved[key] = await resolveIcon(key, entry);
    console.log(`  resolved ${key} (${entry.label})`);
  }

  // --- Dart ---
  const dartLines = entries.map(([key]) =>
    `  '${key}': '''${escapeForDartTripleQuote(resolved[key])}''',`
  );
  const dartContent = `// GENERATED FILE — do not edit by hand.
// Regenerate with: node server/scripts/build-icons.js
// Source of truth: server/icons/manifest.json

const Map<String, String> categoryIcons = {
${dartLines.join('\n')}
};

const Map<String, String> categoryIconChips = {
${entries.map(([key, entry]) => `  '${key}': '${entry.chip}',`).join('\n')}
};
`;
  fs.mkdirSync(path.dirname(DART_OUT), { recursive: true });
  fs.writeFileSync(DART_OUT, dartContent);
  console.log(`Wrote ${path.relative(process.cwd(), DART_OUT)}`);

  // --- JS ---
  const jsLines = entries.map(([key]) =>
    `  '${key}': \`${escapeForJsTemplateLiteral(resolved[key])}\`,`
  );
  const jsContent = `// GENERATED FILE — do not edit by hand.
// Regenerate with: node server/scripts/build-icons.js
// Source of truth: server/icons/manifest.json

export const categoryIcons = {
${jsLines.join('\n')}
};

export const categoryIconChips = {
${entries.map(([key, entry]) => `  '${key}': '${entry.chip}',`).join('\n')}
};
`;
  fs.mkdirSync(path.dirname(JS_OUT), { recursive: true });
  fs.writeFileSync(JS_OUT, jsContent);
  console.log(`Wrote ${path.relative(process.cwd(), JS_OUT)}`);
}

main().catch(err => {
  console.error('build-icons failed:', err);
  process.exit(1);
});
