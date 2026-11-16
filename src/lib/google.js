// Connexion avec Google sur le téléphone (compte Google déjà présent sur l'appareil).
import { GoogleSignin, isErrorWithCode, isSuccessResponse, statusCodes } from "@react-native-google-signin/google-signin";
import { GOOGLE_WEB_CLIENT_ID } from "../config/env";

let configured = false;
function configure() {
  if (configured) return;
  GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID, offlineAccess: false });
  configured = true;
}

/**
 * Ouvre le choix du compte Google et renvoie l'« ID token » à envoyer au backend.
 * Renvoie null si l'utilisateur annule. Lève une erreur au message clair sinon.
 */
export async function googleIdToken() {
  configure();
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    // Toujours proposer le choix du compte (utile si plusieurs comptes Google sur le téléphone).
    await GoogleSignin.signOut().catch(() => {});
    const res = await GoogleSignin.signIn();
    if (!isSuccessResponse(res)) return null;
    const token = res.data?.idToken;
    if (!token) throw new Error("Google n'a pas renvoyé d'identifiant. Réessaie.");
    return token;
  } catch (e) {
    if (isErrorWithCode(e)) {
      if (e.code === statusCodes.SIGN_IN_CANCELLED) return null;
      if (e.code === statusCodes.IN_PROGRESS) return null;
      if (e.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) throw new Error("Les services Google Play sont absents ou trop anciens sur ce téléphone.");
      if (String(e.code) === "10" || /DEVELOPER_ERROR/i.test(String(e.message))) {
        throw new Error("Connexion Google pas encore activée pour l'application. Utilise ton email et ton mot de passe en attendant.");
      }
    }
    throw new Error(e?.message || "Connexion Google impossible pour le moment.");
  }
}
