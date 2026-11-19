import { BarChart3, Bell, Compass, FilePlus2, Search, CalendarCheck, ChevronRight, Crown, Globe, HandCoins, Layers, LayoutDashboard, LogIn, LogOut, Medal, MessageCircle, MessageCircleQuestion, Mic, Scale, School, Settings, ShieldCheck, Star, Swords, User, UserRound } from "lucide-react-native";
import { Alert, Linking, Pressable, View } from "react-native";
import { Card, H2, Row, Screen, T } from "../components/ui";
import { APP_VERSION, WEB_URL } from "../config/env";
import { useApp } from "../context/AppContext";
import { useNotifications } from "../context/NotificationsContext";
import { unregisterPush } from "../lib/notifications";
import { alpha, radius } from "../theme";

function Item({ icon: Icon, label, onPress, tone, badge }) {
  const { colors } = useApp();
  const c = colors[tone] ?? colors.primary;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, paddingHorizontal: 4, borderRadius: radius.sm, backgroundColor: pressed ? colors.surfaceHover : "transparent" })}>
      <View style={{ width: 36, height: 36, borderRadius: 11, alignItems: "center", justifyContent: "center", backgroundColor: alpha(c, 0.14) }}>
        <Icon size={18} color={c} />
      </View>
      <T size={15} weight="600" style={{ flex: 1 }}>{label}</T>
      {badge ? (
        <View style={{ minWidth: 22, height: 22, borderRadius: 11, paddingHorizontal: 6, alignItems: "center", justifyContent: "center", backgroundColor: colors.danger }}>
          <T size={11} weight="800" color="#fff">{badge}</T>
        </View>
      ) : null}
      <ChevronRight size={18} color={colors.mutedForeground} />
    </Pressable>
  );
}

export default function MoreScreen({ navigation }) {
  const { user, isProf, isAdmin, signOut, colors } = useApp();
  const { unread } = useNotifications();
  const go = (n) => navigation.navigate(n);

  return (
    <Screen>
      <Card onPress={() => go(user ? "Profil" : "Auth")} style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <View style={{ width: 52, height: 52, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: alpha(colors.primary, 0.16) }}>
          {user ? <T size={22} weight="800" color={colors.primary}>{user.display_name?.[0]?.toUpperCase()}</T> : <User size={24} color={colors.primary} />}
        </View>
        <View style={{ flex: 1 }}>
          <H2 numberOfLines={1}>{user ? user.display_name : "Visiteur"}</H2>
          <T size={13} muted numberOfLines={1}>
            {user ? `${isAdmin ? "Administrateur" : isProf ? "Professeur" : "Élève"}${!isAdmin && user.niveau ? ` · ${user.niveau}` : ""}${!isAdmin && user.serie ? ` ${user.serie}` : ""}` : "Connecte-toi pour tout débloquer"}
          </T>
        </View>
        <ChevronRight size={18} color={colors.mutedForeground} />
      </Card>

      <Card style={{ gap: 0, paddingVertical: 6 }}>
        {user && <Item icon={Compass} label={isProf ? "Guide du professeur" : "Guide de l'élève"} tone="info" onPress={() => go("Guide")} />}
        <Item icon={Bell} label="Notifications" badge={unread} onPress={() => go("Notifications")} />
        {isAdmin && <Item icon={ShieldCheck} label="Supervision (admin)" tone="danger" onPress={() => go("Admin")} />}
        {isProf && <Item icon={LayoutDashboard} label="Tableau de bord" tone="info" onPress={() => go("ProfDashboard")} />}
        {user && <Item icon={School} label={isProf ? "Mes classes" : "Ma classe"} tone="primary" onPress={() => go("Classes")} />}
        {user && <Item icon={MessageCircle} label="Messages" tone="success" onPress={() => go("Messages")} />}
        {isProf && <Item icon={HandCoins} label="Mes gains" tone="accent" onPress={() => go("Gains")} />}
        {isProf && user && <Item icon={UserRound} label="Mon profil public" tone="info" onPress={() => navigation.navigate("ProfProfil", { id: user.id })} />}
      </Card>

      <Card style={{ gap: 0, paddingVertical: 6 }}>
        <Item icon={Layers} label="Fiches & cartes de révision" tone="primary" onPress={() => go("Fiches")} />
        <Item icon={MessageCircleQuestion} label={isProf ? "Questions des élèves" : "Questions aux profs"} tone="info" onPress={() => go("Questions")} />
        {user && <Item icon={Mic} label="Audios des profs" tone="secondary" onPress={() => go("Audios")} />}
        {!isProf && <Item icon={Medal} label="Examen blanc national" tone="danger" onPress={() => go("ExamenBlanc")} />}
        {user && !isProf && <Item icon={Swords} label="Défis" tone="danger" onPress={() => go("Defis")} />}
        {user && !isProf && <Item icon={CalendarCheck} label="Mon planning" tone="success" onPress={() => go("Planning")} />}
        {!isProf && <Item icon={BarChart3} label="Ma progression" tone="info" onPress={() => go("Progression")} />}
        <Item icon={Star} label="Favoris" tone="accent" onPress={() => go("Favoris")} />
        <Item icon={Search} label="Rechercher une épreuve" tone="info" onPress={() => go("Recherche")} />
        <Item icon={FilePlus2} label="Ajouter une épreuve" tone="success" onPress={() => go("Ajouter")} />
        {isProf && <Item icon={Mic} label="Mes audios (publier)" tone="secondary" onPress={() => go("ProfAudios")} />}
      </Card>

      <Card style={{ gap: 0, paddingVertical: 6 }}>
        {user && <Item icon={Crown} label="Pass EduIA" tone="accent" onPress={() => go("Pass")} />}
        {user && <Item icon={User} label="Profil" onPress={() => go("Profil")} />}
        <Item icon={Settings} label="Paramètres" tone="secondary" onPress={() => go("Parametres")} />
        <Item icon={Scale} label="Informations légales" tone="secondary" onPress={() => go("Legal")} />
        <Item icon={Globe} label="Ouvrir le site EduBénin" tone="success" onPress={() => Linking.openURL(WEB_URL)} />
      </Card>

      <Card style={{ gap: 0, paddingVertical: 6 }}>
        {user ? (
          <Item
            icon={LogOut}
            label="Se déconnecter"
            tone="danger"
            onPress={() =>
              Alert.alert("Se déconnecter ?", "", [
                { text: "Annuler", style: "cancel" },
                {
                  text: "Déconnexion",
                  style: "destructive",
                  onPress: async () => {
                    await unregisterPush();
                    await signOut();
                  },
                },
              ])
            }
          />
        ) : (
          <Item icon={LogIn} label="Se connecter / S'inscrire" onPress={() => go("Auth")} />
        )}
      </Card>
      <Row style={{ justifyContent: "center" }}>
        <T size={12} muted>EduBénin mobile · version {APP_VERSION}</T>
      </Row>
    </Screen>
  );
}
