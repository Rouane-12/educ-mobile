import { useFocusEffect } from "@react-navigation/native";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Brain,
  CalendarCheck,
  Camera,
  CheckCircle2,
  Crown,
  FileText,
  GraduationCap,
  HandCoins,
  Layers,
  Medal,
  MessageCircle,
  MessageCircleQuestion,
  School,
  Server,
  Sparkles,
  Swords,
  UsersRound,
} from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Easing, RefreshControl, ScrollView, Text, useWindowDimensions, View } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiUrl } from "../api/client";
import { Blob, FadeIn, IconBadge, IMAGES, Photo, PressScale, Pulse } from "../components/brand";
import { Button, Card, H3, T } from "../components/ui";
import { ANNEES, BAC_SERIES } from "../config/curriculum";
import { useApp } from "../context/AppContext";
import { localStore } from "../lib/storage";
import { alpha, GUTTER, radius } from "../theme";

/* ---------- petits blocs ---------- */

function SectionTitle({ eyebrow, title, accent, delay = 0 }) {
  const { colors } = useApp();
  return (
    <FadeIn delay={delay} style={{ gap: 4, marginTop: 10 }}>
      {eyebrow ? <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "800", letterSpacing: 1.2, textTransform: "uppercase" }}>{eyebrow}</Text> : null}
      <Text style={{ color: colors.foreground, fontSize: 22, fontWeight: "800", letterSpacing: -0.3 }}>
        {title} {accent ? <Text style={{ color: colors.primary }}>{accent}</Text> : null}
      </Text>
    </FadeIn>
  );
}

/** Nombre qui défile de 0 à `value`. */
function Counter({ value, suffix = "", delay = 0 }) {
  const { colors } = useApp();
  const [n, setN] = useState(0);
  useEffect(() => {
    const v = new Animated.Value(0);
    const id = v.addListener(({ value: x }) => setN(Math.round(x)));
    const a = Animated.timing(v, { toValue: value, duration: 1100, delay, easing: Easing.out(Easing.cubic), useNativeDriver: false });
    a.start();
    return () => {
      a.stop();
      v.removeListener(id);
    };
  }, [value, delay]);
  return (
    <Text style={{ color: colors.foreground, fontSize: 24, fontWeight: "800" }}>
      {n}
      <Text style={{ color: colors.primary }}>{suffix}</Text>
    </Text>
  );
}

function Stat({ value, suffix, label, delay }) {
  const { colors } = useApp();
  return (
    <FadeIn delay={delay} style={{ flexBasis: "47%", flexGrow: 1 }}>
      <View style={{ padding: 14, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, gap: 2 }}>
        <Counter value={value} suffix={suffix} delay={delay} />
        <T size={12.5} muted numberOfLines={2}>{label}</T>
      </View>
    </FadeIn>
  );
}

function Shortcut({ icon, title, desc, onPress, tone, index }) {
  const { colors } = useApp();
  return (
    <FadeIn delay={80 + index * 55} style={{ flexBasis: "47%", flexGrow: 1 }}>
      <PressScale onPress={onPress} style={{ padding: 14, gap: 10, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, minHeight: 128 }}>
        <IconBadge icon={icon} tone={tone} size={42} />
        <View style={{ gap: 2 }}>
          <T size={15} weight="800" numberOfLines={1}>{title}</T>
          <T size={12.5} muted numberOfLines={2}>{desc}</T>
        </View>
      </PressScale>
    </FadeIn>
  );
}

function Step({ n, icon: Icon, title, text, last, delay }) {
  const { colors } = useApp();
  return (
    <FadeIn delay={delay} axis="x" from={-18} style={{ flexDirection: "row", gap: 14 }}>
      <View style={{ alignItems: "center" }}>
        <LinearGradient colors={[colors.primary, colors.secondary]} style={{ width: 40, height: 40, borderRadius: 14, alignItems: "center", justifyContent: "center" }}>
          <Icon size={19} color="#fff" />
        </LinearGradient>
        {!last ? <View style={{ flex: 1, width: 2, marginVertical: 6, backgroundColor: alpha(colors.primary, 0.3), borderRadius: 1 }} /> : null}
      </View>
      <View style={{ flex: 1, paddingBottom: last ? 0 : 18, gap: 3 }}>
        <T size={12} weight="800" color={colors.primary}>ÉTAPE {n}</T>
        <T size={16} weight="800">{title}</T>
        <T size={13.5} muted>{text}</T>
      </View>
    </FadeIn>
  );
}

function FeatureSlide({ f, width, onPress }) {
  const { colors } = useApp();
  return (
    <PressScale onPress={onPress} style={{ width }}>
      <Photo uri={f.image} radius={24} style={{ height: 230, borderWidth: 1, borderColor: colors.border }}>
        <View style={{ flex: 1, justifyContent: "space-between", padding: 16 }}>
          <View style={{ alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: "rgba(16,13,11,0.72)" }}>
            <f.icon size={13} color={colors[f.tone] ?? colors.primary} />
            <Text style={{ color: "#fff", fontSize: 11.5, fontWeight: "800" }}>{f.tag}</Text>
          </View>
          <View style={{ gap: 4 }}>
            <Text style={{ color: "#fff", fontSize: 19, fontWeight: "800" }} numberOfLines={2}>{f.title}</Text>
            <Text style={{ color: "rgba(255,255,255,0.82)", fontSize: 13 }} numberOfLines={2}>{f.text}</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
              <Text style={{ color: colors.primary, fontWeight: "800", fontSize: 13 }}>Découvrir</Text>
              <ArrowRight size={14} color={colors.primary} />
            </View>
          </View>
        </View>
      </Photo>
    </PressScale>
  );
}

/* ---------- écran ---------- */

export default function HomeScreen({ navigation }) {
  const { colors, user, isProf } = useApp();
  const { width } = useWindowDimensions();
  const [stats, setStats] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [offline, setOffline] = useState(false);
  const [slide, setSlide] = useState(0);
  const scroller = useRef(null);

  const load = useCallback(async () => {
    const h = await localStore.quizHistory();
    const avg = h.length ? Math.round((h.reduce((s, r) => s + r.score / r.total, 0) / h.length) * 100) : 0;
    setStats({ total: h.length, avg });
    // Le serveur répond-il ? Sinon on propose de vérifier la connexion.
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 8000);
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
  const cardW = width - GUTTER * 2 - 28;

  const FEATURES = [
    { image: IMAGES.studyGroup, icon: BookOpen, tone: "info", tag: "Épreuves", title: "Les anciens sujets du BAC et du BEPC", text: "Par série, matière et année, lisibles hors ligne.", to: () => go("ExamsTab", { examType: "BAC" }) },
    { image: IMAGES.phone, icon: Sparkles, tone: "accent", tag: "EduIA", title: "Une IA qui t'explique pas à pas", text: "Questions, photo d'exercice, corrigé en PDF.", to: () => go("IaTab") },
    { image: IMAGES.teacher, icon: UsersRound, tone: "success", tag: "Classes", title: "Ta classe et tes profs en ligne", text: "Devoirs, notes, audios et questions aux profs.", to: () => go(user ? "Classes" : "Auth") },
    { image: IMAGES.classroom, icon: Medal, tone: "danger", tag: "Examen blanc", title: "Le même sujet pour tout le Bénin", text: "Tous les 2 mois, avec ton classement national.", to: () => go(user ? "ExamenBlanc" : "Auth") },
  ];

  const shortcuts = [
    { icon: GraduationCap, title: "Épreuves BAC", desc: "Sujets officiels par série", tone: "primary", on: () => go("ExamsTab", { examType: "BAC" }) },
    { icon: School, title: "Épreuves BEPC", desc: "Tous les sujets du BEPC", tone: "secondary", on: () => go("ExamsTab", { examType: "BEPC" }) },
    !isProf && { icon: FileText, title: "Quiz Épreuve IA", desc: "Une épreuve complète notée sur 20", tone: "accent", on: () => go("QuizTab", { mode: "epreuve" }) },
    !isProf && { icon: Brain, title: "Quiz Questions IA", desc: "Des QCM chronométrés", tone: "info", on: () => go("QuizTab", { mode: "questions" }) },
    { icon: Camera, title: "Photo d'exercice", desc: "EduIA t'explique la photo", tone: "success", on: () => go("IaTab") },
    user && { icon: School, title: isProf ? "Mes classes" : "Ma classe", desc: isProf ? "Devoirs et résultats" : "Les devoirs de ton prof", tone: "primary", on: () => go("Classes") },
    !isProf && { icon: Medal, title: "Examen blanc", desc: "National, tous les 2 mois", tone: "danger", on: () => go(user ? "ExamenBlanc" : "Auth") },
    { icon: Layers, title: "Fiches & cartes", desc: "Résumés et mémorisation", tone: "accent", on: () => go("Fiches") },
    { icon: MessageCircleQuestion, title: isProf ? "Questions" : "Questions aux profs", desc: isProf ? "Réponds aux élèves" : "Un prof te répond", tone: "info", on: () => go("Questions") },
    !isProf && user && { icon: Swords, title: "Défis", desc: "Affronte un camarade", tone: "danger", on: () => go("Defis") },
    user && { icon: MessageCircle, title: "Messages", desc: "Discussions et groupes", tone: "success", on: () => go("Messages") },
    user && !isProf && { icon: CalendarCheck, title: "Mon planning", desc: "Compte à rebours, objectifs", tone: "success", on: () => go("Planning") },
    user && isProf && { icon: HandCoins, title: "Mes gains", desc: "Primes et commissions", tone: "accent", on: () => go("Gains") },
  ].filter(Boolean);

  return (
    <SafeAreaView edges={["bottom"]} style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 48 }}
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
        {/* ---------- Bandeau ---------- */}
        <Photo uri={IMAGES.hero} style={{ minHeight: 400 }}>
          <Blob size={260} color={alpha(colors.primary, 0.35)} style={{ top: -90, right: -100 }} />
          <Blob size={180} color={alpha(colors.secondary, 0.25)} style={{ bottom: 40, left: -80 }} dx={-16} dy={-14} />
          <View style={{ flex: 1, justifyContent: "flex-end", padding: GUTTER, paddingTop: 40, paddingBottom: 30, gap: 12 }}>
            <FadeIn>
              <View style={{ alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: "rgba(16,13,11,0.68)", borderWidth: 1, borderColor: "rgba(255,255,255,0.14)" }}>
                <View style={{ flexDirection: "row", width: 18, height: 10, borderRadius: 2, overflow: "hidden" }}>
                  <View style={{ flex: 1, backgroundColor: colors.beninGreen }} />
                  <View style={{ flex: 1, backgroundColor: colors.beninYellow }} />
                  <View style={{ flex: 1, backgroundColor: colors.beninRed }} />
                </View>
                <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>{user ? `Bonjour ${first} 👋` : "Plateforme béninoise · BAC & BEPC"}</Text>
              </View>
            </FadeIn>
            <FadeIn delay={120}>
              <Text style={{ color: "#fff", fontSize: 34, fontWeight: "800", lineHeight: 39, letterSpacing: -0.6 }}>
                {isProf ? (
                  <>
                    Accompagne <Text style={{ color: colors.primary }}>tes élèves</Text>, même hors de la classe.
                  </>
                ) : (
                  <>
                    Réussis ton <Text style={{ color: colors.primary }}>BAC</Text> et ton <Text style={{ color: colors.accent }}>BEPC</Text>.
                  </>
                )}
              </Text>
            </FadeIn>
            <FadeIn delay={220}>
              <Text style={{ color: "rgba(255,255,255,0.84)", fontSize: 15, lineHeight: 22 }}>
                {isProf
                  ? "Classes en ligne, devoirs corrigés, quiz, audios et EduIA pour préparer tes cours."
                  : "Anciennes épreuves, quiz corrigés, vrais profs et une IA qui t'aide à comprendre."}
              </Text>
            </FadeIn>
            <FadeIn delay={320} style={{ flexDirection: "row", gap: 10, flexWrap: "wrap", marginTop: 4 }}>
              <Button title={isProf ? "Mes classes" : user ? "Faire un quiz" : "Créer mon compte"} iconRight={ArrowRight} onPress={() => go(isProf ? "Classes" : user ? "QuizTab" : "Auth")} />
              <Button title="EduIA" variant="secondary" icon={Sparkles} onPress={() => go("IaTab")} />
            </FadeIn>
            <FadeIn delay={420} style={{ flexDirection: "row", gap: 14, flexWrap: "wrap" }}>
              {["Séries A à G", "BEPC complet", "Sans publicité"].map((t) => (
                <View key={t} style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                  <CheckCircle2 size={14} color={colors.success} />
                  <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 12.5, fontWeight: "600" }}>{t}</Text>
                </View>
              ))}
            </FadeIn>
          </View>
        </Photo>

        <View style={{ paddingHorizontal: GUTTER, gap: 16, marginTop: -14 }}>
          {offline && (
            <Card style={{ borderColor: alpha(colors.danger, 0.5), backgroundColor: alpha(colors.danger, 0.08) }}>
              <H3>Serveur EduBénin injoignable</H3>
              <T size={13.5} muted>Vérifie ta connexion Internet, puis tire l'écran vers le bas pour réessayer.</T>
              <Button title="Paramètres" size="sm" icon={Server} variant="secondary" onPress={() => go("Parametres")} />
            </Card>
          )}

          {/* ---------- Chiffres ---------- */}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            <Stat value={BAC_SERIES.length} label="Séries du BAC couvertes" delay={150} />
            <Stat value={ANNEES.length} label="Années d'épreuves" delay={230} />
            <Stat value={3} label="Modes de quiz" delay={310} />
            <Stat value={100} suffix="%" label="Sujets et quiz gratuits" delay={390} />
          </View>

          {/* ---------- Progression ---------- */}
          {!isProf && stats && stats.total > 0 && (
            <FadeIn delay={200}>
              <PressScale onPress={() => go("Progression")}>
                <LinearGradient colors={[alpha(colors.accent, 0.22), alpha(colors.primary, 0.08)]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flexDirection: "row", alignItems: "center", gap: 14, padding: 16, borderRadius: radius.lg, borderWidth: 1, borderColor: alpha(colors.accent, 0.35) }}>
                  <IconBadge icon={BarChart3} tone="accent" />
                  <View style={{ flex: 1 }}>
                    <T size={16} weight="800">Ta progression</T>
                    <T muted size={13}>{stats.total} quiz · score moyen {stats.avg} %</T>
                  </View>
                  <ArrowRight size={18} color={colors.mutedForeground} />
                </LinearGradient>
              </PressScale>
            </FadeIn>
          )}

          {/* ---------- Accès rapides ---------- */}
          <SectionTitle eyebrow="Réviser" title="Tout pour" accent="réussir" />
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            {shortcuts.map((s, i) => (
              <Shortcut key={s.title} index={i} icon={s.icon} title={s.title} desc={s.desc} tone={s.tone} onPress={s.on} />
            ))}
          </View>

          {/* ---------- Découvrir (carrousel) ---------- */}
          <SectionTitle eyebrow="Découvrir" title="Une seule app," accent="toute ta prépa" />
        </View>
        <ScrollView
          ref={scroller}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={cardW + 12}
          decelerationRate="fast"
          contentContainerStyle={{ paddingHorizontal: GUTTER, gap: 12, paddingTop: 12 }}
          onScroll={(e) => setSlide(Math.round(e.nativeEvent.contentOffset.x / (cardW + 12)))}
          scrollEventThrottle={32}
        >
          {FEATURES.map((f) => (
            <FeatureSlide key={f.tag} f={f} width={cardW} onPress={f.to} />
          ))}
        </ScrollView>
        <View style={{ flexDirection: "row", justifyContent: "center", gap: 6, marginTop: 12 }}>
          {FEATURES.map((f, i) => (
            <View key={f.tag} style={{ width: i === slide ? 22 : 7, height: 7, borderRadius: 4, backgroundColor: i === slide ? colors.primary : colors.borderStrong }} />
          ))}
        </View>

        <View style={{ paddingHorizontal: GUTTER, gap: 16 }}>
          {/* ---------- Comment ça marche ---------- */}
          {!user && (
            <>
              <SectionTitle eyebrow="Comment ça marche" title="Prêt en" accent="3 étapes" />
              <Card style={{ padding: 18 }}>
                <Step n={1} icon={UsersRound} title="Crée ton compte gratuit" text="Choisis Élève ou Professeur, avec ton email ou ton compte Google." delay={100} />
                <Step n={2} icon={BookOpen} title="Choisis tes sujets" text="Ta série, tes matières : épreuves, quiz et fiches s'adaptent à toi." delay={200} />
                <Step n={3} icon={Sparkles} title="Révise et progresse" text="Quiz notés sur 20, EduIA, examen blanc national et suivi de tes progrès." delay={300} last />
              </Card>
            </>
          )}

          {/* ---------- Pass EduIA ---------- */}
          <FadeIn delay={150}>
            <PressScale onPress={() => go(user ? "Pass" : "Auth")}>
              <LinearGradient colors={[colors.primary, colors.secondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: radius.xl, padding: 20, gap: 10, overflow: "hidden" }}>
                <Blob size={180} color="rgba(255,255,255,0.18)" style={{ top: -70, right: -50 }} />
                <Pulse style={{ alignSelf: "flex-start" }}>
                  <View style={{ width: 46, height: 46, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.22)" }}>
                    <Crown size={24} color="#fff" />
                  </View>
                </Pulse>
                <Text style={{ color: "#fff", fontSize: 21, fontWeight: "800" }}>EduIA sans limite</Text>
                <Text style={{ color: "rgba(255,255,255,0.9)", fontSize: 14, lineHeight: 20 }}>
                  Chaque jour, des questions gratuites. Besoin de plus ? Le Pass dès 200 F les 24 h, sans abonnement.
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={{ color: "#fff", fontWeight: "800" }}>Voir le Pass</Text>
                  <ArrowRight size={16} color="#fff" />
                </View>
              </LinearGradient>
            </PressScale>
          </FadeIn>

          {/* ---------- Appel final ---------- */}
          {!user && (
            <FadeIn delay={200}>
              <Card glow style={{ padding: 20, gap: 12, alignItems: "flex-start" }}>
                <IconBadge icon={GraduationCap} />
                <T size={19} weight="800">Prêt à décrocher ton examen ?</T>
                <T muted size={14}>Garde ton historique EduIA, rejoins la classe de ton prof et reçois ses notifications.</T>
                <Button title="Se connecter / S'inscrire" iconRight={ArrowRight} block onPress={() => go("Auth")} />
              </Card>
            </FadeIn>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
