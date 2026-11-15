import {
  ArrowRight,
  BarChart3,
  Brain,
  FileText,
  GraduationCap,
  MessageCircle,
  CalendarCheck,
  HandCoins,
  Layers,
  Medal,
  MessageCircleQuestion,
  School,
  Server,
  Sparkles,
  Swords,
} from "lucide-react-native";
import { useCallback, useState } from "react";
import { Pressable, RefreshControl, View } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { useFocusEffect } from "@react-navigation/native";
import { apiUrl } from "../api/client";
import { Button, Card, FlagBar, H2, H3, Row, Screen, T } from "../components/ui";
import { useApp } from "../context/AppContext";
import { localStore } from "../lib/storage";
import { alpha, radius } from "../theme";

function Shortcut({ icon: Icon, title, desc, onPress, tone }) {
  const { colors } = useApp();
  const c = colors[tone] ?? colors.primary;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexBasis: "47%",
        flexGrow: 1,
        padding: 14,
        gap: 8,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: pressed ? colors.surfaceHover : colors.card,
      })}
    >
      <View style={{ width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: alpha(c, 0.14) }}>
        <Icon size={20} color={c} />
      </View>
      <H3>{title}</H3>
      <T size={12.5} muted numberOfLines={2}>{desc}</T>
    </Pressable>
  );
}

export default function HomeScreen({ navigation }) {
  const { colors, user, isProf } = useApp();
  const [stats, setStats] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [offline, setOffline] = useState(false);

  const load = useCallback(async () => {
    const h = await localStore.quizHistory();
    const avg = h.length ? Math.round((h.reduce((s, r) => s + r.score / r.total, 0) / h.length) * 100) : 0;
    setStats({ total: h.length, avg });
    // Le serveur répond-il ? Sinon on propose de saisir son adresse (Paramètres → Serveur).
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 6000);
      const r = await fetch(apiUrl("/api/health/"), { signal: ctrl.signal });
      clearTimeout(t);
      setOffline(!r.ok);
    } catch {
      setOffline(true);
    }
  }, []);
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const go = (name, params) => navigation.navigate(name, params);
  const first = user?.display_name?.split(" ")[0];

  return (
    <Screen
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          tintColor={colors.primary}
          onRefresh={async () => {
            setRefreshing(true);
            await load();
            setRefreshing(false);
          }}
        />
      }
    >
      {offline && (
        <Card style={{ borderColor: alpha(colors.danger, 0.5), backgroundColor: alpha(colors.danger, 0.08) }}>
          <H3>Serveur EduBénin injoignable</H3>
          <T size={13.5} muted>
            Vérifie ta connexion Internet. En test, saisis l'adresse de ton PC (ex. http://192.168.1.20:8000) dans Paramètres → Serveur.
          </T>
          <Button title="Configurer le serveur" size="sm" icon={Server} onPress={() => go("Parametres")} />
        </Card>
      )}

      <LinearGradient
        colors={[alpha(colors.primary, 0.28), alpha(colors.secondary, 0.1), colors.card]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: radius.xl, padding: 20, gap: 10, borderWidth: 1, borderColor: colors.border }}
      >
        <FlagBar />
        <T size={13} weight="700" color={colors.primary}>
          {user ? `Bonjour ${first} 👋` : "Bienvenue sur EduBénin"}
        </T>
        <T size={26} weight="800" style={{ lineHeight: 32 }}>
          {isProf ? "Prépare et suis tes élèves" : "Réussis ton BAC et ton BEPC"}
        </T>
        <T muted size={14}>
          {isProf
            ? "Crée des quiz, publie des audios et prépare tes cours avec EduIA."
            : "Épreuves officielles, Quiz IA, EduIA et défis entre élèves, selon le programme béninois."}
        </T>
        <Row wrap style={{ marginTop: 4 }}>
          <Button title={isProf ? "Mes quiz" : "Faire un quiz"} icon={Brain} onPress={() => go(isProf ? "ProfQuiz" : "QuizTab")} />
          <Button title="EduIA" variant="secondary" icon={Sparkles} onPress={() => go("IaTab")} />
        </Row>
      </LinearGradient>

      {!isProf && stats && stats.total > 0 && (
        <Card onPress={() => go("Progression")} style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
          <BarChart3 size={26} color={colors.accent} />
          <View style={{ flex: 1 }}>
            <H3>Ta progression</H3>
            <T muted size={13}>
              {stats.total} quiz · score moyen {stats.avg} %
            </T>
          </View>
          <ArrowRight size={18} color={colors.mutedForeground} />
        </Card>
      )}

      <H2>Réviser</H2>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
        <Shortcut icon={GraduationCap} title="Épreuves BAC" desc="Sujets officiels par série" onPress={() => go("ExamsTab", { examType: "BAC" })} />
        <Shortcut icon={School} title="Épreuves BEPC" desc="Tous les sujets du BEPC" tone="secondary" onPress={() => go("ExamsTab", { examType: "BEPC" })} />
        {!isProf && <Shortcut icon={FileText} title="Quiz Épreuve IA" desc="Une épreuve complète corrigée sur 20" tone="accent" onPress={() => go("QuizTab", { mode: "epreuve" })} />}
        {!isProf && <Shortcut icon={Brain} title="Quiz Questions IA" desc="Un max de QCM chronométrés" tone="info" onPress={() => go("QuizTab", { mode: "questions" })} />}
        {!isProf && user && <Shortcut icon={Swords} title="Défis" desc="Affronte un camarade" tone="danger" onPress={() => go("Defis")} />}
        {user && <Shortcut icon={MessageCircle} title="Messages" desc="Tes discussions et groupes" tone="success" onPress={() => go("Messages")} />}
        {user && <Shortcut icon={School} title={isProf ? "Mes classes" : "Ma classe"} desc={isProf ? "Devoirs et résultats" : "Devoirs de ton prof"} tone="primary" onPress={() => go("Classes")} />}
        {!isProf && <Shortcut icon={Medal} title="Examen blanc" desc="National, tous les 2 mois" tone="danger" onPress={() => go("ExamenBlanc")} />}
        <Shortcut icon={Layers} title="Fiches & cartes" desc="Résumés, vocaux, mémorisation" tone="accent" onPress={() => go("Fiches")} />
        <Shortcut icon={MessageCircleQuestion} title={isProf ? "Questions" : "Questions aux profs"} desc={isProf ? "Réponds aux élèves" : "Un prof te répond"} tone="info" onPress={() => go("Questions")} />
        {user && !isProf && <Shortcut icon={CalendarCheck} title="Mon planning" desc="Compte à rebours, objectifs" tone="success" onPress={() => go("Planning")} />}
        {user && isProf && <Shortcut icon={HandCoins} title="Mes gains" desc="Primes et commissions" tone="accent" onPress={() => go("Gains")} />}
      </View>

      {!user && (
        <Card glow>
          <H3>Crée ton compte gratuit</H3>
          <T muted size={13.5}>Garde ton historique EduIA, reçois les notifications de tes profs et défie tes amis.</T>
          <Button title="Se connecter / S'inscrire" iconRight={ArrowRight} onPress={() => go("Auth")} />
        </Card>
      )}
    </Screen>
  );
}
