# EduBénin — application mobile (React Native CLI)

Le même EduBénin que le site, pensé pour le téléphone (Android et iOS), branché sur le **même backend Django**.
Même design (palette orange / nuit chaude, thème sombre et clair), mêmes pages, plus :

- **Notifications** : page dédiée + push (messages, défis, nouveaux quiz des profs, copie corrigée) et rappel de révision quotidien.
- **Historique EduIA** partagé avec le site (un élève connecté retrouve ses conversations partout).
- **Quiz Épreuve IA** avec chrono fiable et espace de rédaction structuré pour les dissertations.
- **Classes** (devoirs, correction après la date limite, note du prof), **fiches et cartes de révision**,
  **questions aux profs**, **examen blanc national**, **planning**, **Pass EduIA** (paiement Kkiapay dans le navigateur),
  **import d'épreuve / photo d'exercice** dans EduIA, **mode économie de données** et lecture hors ligne des derniers écrans vus.

## Structure

```
mobile/
├── App.js                  navigation (onglets + écrans) et ouverture des notifications
├── index.js                point d'entrée + notifications en arrière-plan
├── src/
│   ├── api/                client HTTP (JWT) + routes du backend, flux EduIA (SSE)
│   ├── components/         kit d'interface, Markdown, clavier de symboles, dissertation
│   ├── config/             curriculum.js (copie de frontend/src/config) et adresse du serveur
│   ├── context/            session + réglages, notifications
│   ├── lib/                stockage local, chrono, notifications, historique EduIA
│   └── screens/            un fichier par écran
├── android/  ios/          projets natifs
└── scripts/publish-apk.js  copie l'APK dans le site (bouton « Télécharger »)
```

> `src/config/curriculum.js` est une copie de `frontend/src/config/curriculum.js` : quand le programme change, recopie-le.

## Prérequis

- Node 22.11+, JDK 17 à 21, Android Studio (SDK + un émulateur) — voir https://reactnative.dev/docs/set-up-your-environment
- iOS : un Mac avec Xcode et CocoaPods (impossible depuis Windows).

## Lancer en développement

```bash
cd mobile
npm install
npm start            # Metro, dans un terminal
npm run android      # dans un 2e terminal (émulateur ouvert ou téléphone branché en USB)
```

Le backend doit tourner (`python manage.py runserver 0.0.0.0:8000`).
- L'émulateur Android joint le PC via `http://10.0.2.2:8000` (déjà configuré).
- Sur un vrai téléphone : **Plus → Paramètres → Serveur**, saisis l'IP du PC (ex. `http://192.168.1.20:8000`) et ajoute cette IP à `DJANGO_ALLOWED_HOSTS` dans `backend/.env`.

En production, mets l'adresse publique du backend dans `src/config/env.js` (`PROD_API_URL`, en **https**).

## Tester sans téléphone

```bash
npm test
```

Démarre l'application en mémoire (stockage, notifications et serveur simulés) et ouvre chaque écran
en visiteur, élève et professeur. À lancer avant chaque nouvel APK : c'est ce test qui a révélé le blocage au démarrage
(API de stockage `@react-native-async-storage` v3) et deux écrans qui plantaient.

## Compiler l'APK Android et le proposer sur le site

```bash
cd mobile
npm run android:release     # → un APK par processeur dans android/app/build/outputs/apk/release/
npm run android:publish     # copie edubenin.apk (arm64) et edubenin-ancien.apk (32 bits) dans le site
```

La page **/application** du site propose alors « Télécharger pour Android ».
Pour héberger l'APK ailleurs ou pointer vers le Play Store / l'App Store : variables `VITE_ANDROID_APK_URL`,
`VITE_PLAY_STORE_URL`, `VITE_IOS_URL` dans `frontend/.env`.

### Signer avec la clé EduBénin (obligatoire avant de distribuer)

Sans configuration, l'APK release est signé avec la clé de debug (bien pour tester, pas pour publier).

```bash
keytool -genkeypair -v -storetype PKCS12 -keystore android/app/edubenin-release.keystore -alias edubenin -keyalg RSA -keysize 2048 -validity 10000
```

Puis crée `android/keystore.properties` (jamais versionné) :

```
storeFile=edubenin-release.keystore
storePassword=…
keyAlias=edubenin
keyPassword=…
```

Garde ce fichier et le keystore en lieu sûr : sans eux, impossible de publier une mise à jour.

## iOS

```bash
cd mobile/ios && pod install && cd ..
npm run ios
```

Pour l'App Store / TestFlight : ouvrir `ios/EduBenin.xcworkspace` dans Xcode, choisir l'équipe Apple Developer, puis *Product → Archive*.

## Notifications push (application fermée)

Sans Firebase, tout marche déjà : notifications enregistrées sur le serveur, affichées quand l'application est ouverte
ou revient au premier plan, page Notifications, rappel de révision quotidien (local).
Pour recevoir les notifications **application fermée** :

1. Crée un projet sur https://console.firebase.google.com et ajoute :
   - une app Android `com.edubenin.app` → télécharge `google-services.json` dans `mobile/android/app/` ;
   - une app iOS → `GoogleService-Info.plist` à ajouter dans Xcode (cible EduBenin), et la clé APNs dans Firebase.
2. Backend : *Paramètres du projet → Comptes de service → Générer une clé privée*, enregistre le JSON sur le serveur, puis
   dans `backend/.env` : `FIREBASE_CREDENTIALS=/chemin/vers/cle.json` et `pip install firebase-admin`.
3. Recompile l'application.

Le backend crée les notifications ici : nouveau message (`apps/chat`), adversaire qui rejoint / revanche (`apps/duels`),
quiz publié par un prof (`apps/learning`). Pour en ajouter : `from apps.notifications.push import notify`.
