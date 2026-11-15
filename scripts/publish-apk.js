// Copie les APK Android compilés dans le site web (page /application, bouton « Télécharger »).
// Usage : npm run android:release   puis   npm run android:publish
//
// Un APK par type de processeur (plus léger qu'un APK universel) :
//   edubenin.apk         <- arm64-v8a  (quasi tous les téléphones récents)
//   edubenin-ancien.apk  <- armeabi-v7a (anciens téléphones 32 bits)
const fs = require("fs");
const path = require("path");

const outDir = path.join(__dirname, "..", "android", "app", "build", "outputs", "apk", "release");
const destDir = path.join(__dirname, "..", "..", "frontend", "public", "downloads");
const files = [
  ["app-arm64-v8a-release.apk", "edubenin.apk"],
  ["app-armeabi-v7a-release.apk", "edubenin-ancien.apk"],
];

fs.mkdirSync(destDir, { recursive: true });
let copied = 0;
for (const [src, dest] of files) {
  const from = path.join(outDir, src);
  if (!fs.existsSync(from)) {
    console.warn(`Absent : ${src}`);
    continue;
  }
  fs.copyFileSync(from, path.join(destDir, dest));
  const mo = (fs.statSync(from).size / 1024 / 1024).toFixed(1);
  console.log(`${dest} (${mo} Mo) copié dans frontend/public/downloads/`);
  copied += 1;
}
if (!copied) {
  console.error("Aucun APK trouvé. Lance d'abord : npm run android:release");
  process.exit(1);
}
console.log("Le site les propose sur /application. Rebuild le frontend (npm run build) avant de déployer.");
