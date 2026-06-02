// build.js — assembles src/ + lib/ into a single distributable parity-compare.html
// Usage: node build.js
// Output: parity-compare.html (overwritten in place)

const fs   = require('fs');
const path = require('path');

const VERSION = '1.2.0';

const ROOT = __dirname;
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

// ── Libraries (escape </script> so the HTML parser doesn't close early) ───
const libs = ['papaparse.min.js', 'plotly-cartesian.min.js', 'jszip.min.js']
  .map(name => {
    const content = read(`lib/${name}`).replace(/<\/script>/g, '<\\/script>');
    return `<script>${content}</script>`;
  })
  .join('\n');

// ── CSS ───────────────────────────────────────────────────────────────────
const style = `<style>\n${read('src/style.css')}\n</style>`;

// ── App JS — concatenated in dependency order ─────────────────────────────
const appJs = [
  'src/js/state.js',
  'src/js/data.js',
  'src/js/ui.js',
  'src/js/chart.js',
  'src/js/saves.js',
  'src/js/stats.js',
  'src/js/wiring.js',
].map(read).join('\n\n');

// ── Assemble ──────────────────────────────────────────────────────────────
// Use function replacements so $ characters in Plotly's minified code are
// not misinterpreted as backreference patterns by String.replace.
let html = read('src/index.html');
html = html.replace(/%%VERSION%%/g,           () => VERSION);
html = html.replace('<!-- INJECT:LIBS -->',   () => libs);
html = html.replace('<!-- INJECT:STYLE -->',  () => style);
html = html.replace('/* INJECT:SCRIPT */',    () => appJs);

// ── Write ─────────────────────────────────────────────────────────────────
const out = path.join(ROOT, 'parity-compare.html');
fs.writeFileSync(out, html, 'utf8');

const kb = (fs.statSync(out).size / 1024).toFixed(0);
console.log(`Built parity-compare.html  (${kb} KB)  v${VERSION}`);
