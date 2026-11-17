import { Platform } from "react-native";

/**
 * Adresse du backend Django.
 * - En production : le backend hébergé sur Render.
 * - En développement : l'émulateur Android joint ton PC via 10.0.2.2, le simulateur iOS via localhost.
 * - Sur un vrai téléphone : Paramètres → « Serveur » permet de saisir l'adresse IP du PC (ex. http://192.168.1.20:8000).
 */
export const PROD_API_URL = "https://educ-back.onrender.com";

export const DEV_API_URL = Platform.select({ android: "http://10.0.2.2:8000", default: "http://localhost:8000" });

export const DEFAULT_API_URL = __DEV__ ? DEV_API_URL : PROD_API_URL;

/** Site web (liens « ouvrir sur le site »). */
export const WEB_URL = __DEV__ ? DEV_API_URL.replace(":8000", ":5173") : "https://educ-front-one.vercel.app";

export const APP_VERSION = "1.2.1";

/**
 * Connexion Google : identifiant client « Web » (le même que le site). Le jeton reçu sur le téléphone
 * est vérifié par le backend avec cet identifiant. Il faut aussi un client « Android » dans la même
 * console Google Cloud (package com.edubenin.app + empreinte SHA-1 de la clé de signature).
 */
export const GOOGLE_WEB_CLIENT_ID = "262811503749-lrprlllih7qdfu74hvadvuekdu00gisi.apps.googleusercontent.com";
