// Copie l'APK Android compilé dans le site web (page /application, bouton « Télécharger »).
// Usage : npm run android:release   puis   npm run android:publish
//
// Un seul APK (processeurs ARM 64 bits ET 32 bits) : il s'installe sur tous les téléphones,
// sans que l'utilisateur ait à choisir une version (un mauvais choix donnait « pas compatible »).
const fs = require("fs");
const path = require("path");

const outDir = path.join(__dirname, "..", "android", "app", "build", "outputs", "apk", "release");
const destDir = path.join(__dirname, "..", "..", "frontend", "public", "downloads");
const src = path.join(outDir, "app-release.apk");

if (!fs.existsSync(src)) {
  console.error("APK introuvable. Lance d'abord : npm run android:release");
  process.exit(1);
}
fs.mkdirSync(destDir, { recursive: true });
fs.copyFileSync(src, path.join(destDir, "edubenin.apk"));
// L'ancienne version 32 bits séparée n'est plus proposée.
const legacy = path.join(destDir, "edubenin-ancien.apk");
if (fs.existsSync(legacy)) fs.unlinkSync(legacy);

const mo = (fs.statSync(src).size / 1024 / 1024).toFixed(1);
console.log(`edubenin.apk (64 et 32 bits, ${mo} Mo) copié dans frontend/public/downloads/`);
