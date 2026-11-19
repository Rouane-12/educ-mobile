// Guide de démarrage : ce que chaque rôle peut faire dans EduBénin, avec un accès direct à chaque page.
// S'ouvre tout seul à la première connexion (élève ou professeur), puis reste accessible (Plus → Guide).
import {
  ArrowRight,
  BarChart3,
  Bell,
  BookOpen,
  Brain,
  CalendarCheck,
  CheckCircle2,
  Compass,
  Crown,
  FilePlus2,
  FileText,
  HandCoins,
  Layers,
  Medal,
  MessageCircle,
  MessageCircleQuestion,
  Mic,
  School,
  Sparkles,
  Star,
  Swords,
  UserRound,
  UsersRound,
} from "lucide-react-native";
import { ScrollView, Text, View } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { Blob, FadeIn, IconBadge, PressScale, Pulse } from "../components/brand";
import { Button, T } from "../components/ui";
import { useApp } from "../context/AppContext";
import { alpha, GUTTER, radius } from "../theme";

const ELEVE = {
  title: "Ton guide d'élève",
  intro: "EduBénin t'accompagne jusqu'au jour de ton BAC ou de ton BEPC. Voici tout ce que tu peux faire, et par où commencer.",
  start: [
    { icon: UserRound, text: "Complète ton profil : ta classe et ta série adaptent les sujets proposés.", to: "Profil" },
    { icon: School, text: "Rejoins la classe de ton prof avec le code qu'il te donne.", to: "Classes" },
    { icon: Brain, text: "Fais un premier quiz pour mesurer ton niveau.", to: "QuizTab" },
  ],
  sections: [
    {
      title: "Réviser",
      items: [
        { icon: BookOpen, tone: "primary", title: "Anciennes épreuves", text: "Les sujets du BAC et du BEPC par série, matière et année. Les corrigés ne sont pas à côté : entraîne-toi d'abord !", to: "ExamsTab" },
        { icon: FileText, tone: "accent", title: "Quiz Épreuve IA", text: "Une épreuve complète, chronométrée comme le jour J, puis corrigée et notée sur 20.", to: "QuizTab", params: { mode: "epreuve" } },
        { icon: Brain, tone: "info", title: "Quiz Questions IA", text: "Une série de QCM chronométrés sur les thèmes de ton choix.", to: "QuizTab", params: { mode: "questions" } },
        { icon: Layers, tone: "success", title: "Fiches & cartes", text: "Les résumés de cours et vocaux de tes profs, avec des cartes de mémorisation.", to: "Fiches" },
      ],
    },
    {
      title: "Te faire aider",
      items: [
        { icon: Sparkles, tone: "accent", title: "EduIA", text: "Pose une question, prends un exercice en photo ou importe un sujet : EduIA explique pas à pas et prépare un corrigé PDF. Gratuit chaque jour, illimité avec le Pass.", to: "IaTab" },
        { icon: MessageCircleQuestion, tone: "info", title: "Questions aux profs", text: "Un vrai professeur te répond, par écrit ou en vocal.", to: "Questions" },
        { icon: MessageCircle, tone: "success", title: "Messages", text: "Discute avec tes profs et révise en groupe.", to: "Messages" },
      ],
    },
    {
      title: "Ta classe",
      items: [
        { icon: School, tone: "primary", title: "Classes en ligne", text: "Rends les devoirs de ton prof avant la date limite ; la correction s'affiche ensuite.", to: "Classes" },
        { icon: Star, tone: "accent", title: "Noter ton prof", text: "Après une semaine et un devoir rendu, donne ton avis : les meilleurs profs sont récompensés.", to: "Classes" },
      ],
    },
    {
      title: "Te motiver",
      items: [
        { icon: Medal, tone: "danger", title: "Examen blanc national", text: "Tous les 2 mois, les mêmes sujets pour tout le Bénin et ton classement.", to: "ExamenBlanc" },
        { icon: Swords, tone: "danger", title: "Défis", text: "Affronte un camarade sur le même quiz, en direct.", to: "Defis" },
        { icon: CalendarCheck, tone: "success", title: "Mon planning", text: "Le compte à rebours jusqu'à l'examen et tes objectifs du jour.", to: "Planning" },
        { icon: BarChart3, tone: "info", title: "Ma progression", text: "Ton score moyen, tes matières fortes et à travailler.", to: "Progression" },
      ],
    },
    {
      title: "Aider les autres",
      items: [{ icon: FilePlus2, tone: "success", title: "Ajouter une épreuve", text: "Tu as un ancien sujet en PDF ? Partage-le. Une même épreuve ne peut pas être ajoutée deux fois.", to: "Ajouter" }],
    },
  ],
};

const PROF = {
  title: "Ton guide de professeur",
  intro: "EduBénin te permet de suivre tes élèves même hors de la classe, et récompense les profs les mieux notés. Voici tout ce que tu peux faire.",
  start: [
    { icon: School, text: "Crée ta première classe : tu obtiens un code à partager (WhatsApp, tableau…).", to: "Classes" },
    { icon: FileText, text: "Donne un devoir : un de tes quiz ou une épreuve préparée par EduIA.", to: "Classes" },
    { icon: FilePlus2, text: "Ajoute les anciennes épreuves que tu possèdes pour enrichir la bibliothèque.", to: "Ajouter" },
  ],
  sections: [
    {
      title: "Ta classe en ligne",
      items: [
        { icon: School, tone: "primary", title: "Mes classes", text: "Crée tes classes, partage le code d'accès et vois qui a rejoint.", to: "Classes" },
        { icon: FileText, tone: "accent", title: "Devoirs et résultats", text: "Fixe une date limite, suis les copies rendues et les notes ; la correction est envoyée aux élèves après la date.", to: "Classes" },
        { icon: Bell, tone: "info", title: "Notifications", text: "Tes élèves sont prévenus à chaque nouveau devoir ; toi, à chaque question.", to: "Notifications" },
      ],
    },
    {
      title: "Créer du contenu",
      items: [
        { icon: Brain, tone: "accent", title: "Quiz", text: "Crée un quiz en quelques minutes : EduIA te propose un brouillon que tu relis avant de publier.", to: "ProfQuizNew" },
        { icon: Layers, tone: "success", title: "Fiches & cartes", text: "Publie des résumés de cours, un vocal et des cartes de mémorisation.", to: "Fiches" },
        { icon: Mic, tone: "secondary", title: "Audios", text: "Enregistre une explication audio que tes élèves écoutent partout.", to: "ProfAudios" },
        { icon: FilePlus2, tone: "primary", title: "Ajouter une épreuve", text: "Partage un ancien sujet en PDF. Le système refuse automatiquement les doublons (même fichier ou même épreuve).", to: "Ajouter" },
      ],
    },
    {
      title: "Accompagner",
      items: [
        { icon: MessageCircleQuestion, tone: "info", title: "Questions des élèves", text: "Réponds par écrit ou en vocal ; ta réponse aide tous les élèves.", to: "Questions" },
        { icon: MessageCircle, tone: "success", title: "Messages", text: "Discute avec tes élèves et anime des groupes d'étude.", to: "Messages" },
        { icon: Sparkles, tone: "accent", title: "EduIA pour tes cours", text: "Prépare un cours, un exercice ou un corrigé. 20 questions et 5 travaux gratuits par jour.", to: "IaTab" },
      ],
    },
    {
      title: "Être récompensé",
      items: [
        { icon: HandCoins, tone: "accent", title: "Profs partenaires", text: "Tes élèves te notent. Selon ta note et tes élèves actifs, tu reçois une prime chaque mois (Bronze 1 000 F, Argent 2 000 F, Or 5 000 F) et 10 % des Pass achetés par tes élèves.", to: "Gains" },
        { icon: UserRound, tone: "info", title: "Ton profil public", text: "Ta note, tes avis et tes contributions, visibles par les élèves.", to: "ProfProfil", self: true },
      ],
    },
  ],
};

function GuideItem({ item, index, onOpen }) {
  const { colors } = useApp();
  return (
    <FadeIn delay={60 + index * 45}>
      <PressScale onPress={onOpen} style={{ flexDirection: "row", gap: 12, padding: 14, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card }}>
        <IconBadge icon={item.icon} tone={item.tone} size={44} />
        <View style={{ flex: 1, gap: 3, minWidth: 0 }}>
          <T size={15.5} weight="800">{item.title}</T>
          <T size={13} muted>{item.text}</T>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
            <Text style={{ color: colors.primary, fontWeight: "800", fontSize: 13 }}>Ouvrir</Text>
            <ArrowRight size={14} color={colors.primary} />
          </View>
        </View>
      </PressScale>
    </FadeIn>
  );
}

export default function GuideScreen({ navigation, route }) {
  const { colors, user, isProf } = useApp();
  const g = isProf ? PROF : ELEVE;
  const first = route.params?.first;
  const name = user?.display_name?.split(" ")[0];

  const open = (it) => {
    const params = it.self ? { id: user?.id } : it.params;
    if (["HomeTab", "ExamsTab", "QuizTab", "IaTab", "MoreTab"].includes(it.to)) navigation.navigate("Tabs", { screen: it.to, params });
    else navigation.navigate(it.to, params);
  };

  let n = 0;
  return (
    <SafeAreaView edges={["bottom"]} style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* En-tête */}
        <LinearGradient colors={[alpha(colors.primary, 0.32), alpha(colors.secondary, 0.12), colors.background]} style={{ padding: GUTTER, paddingTop: 26, paddingBottom: 28, gap: 12, overflow: "hidden" }}>
          <Blob size={240} color={alpha(colors.primary, 0.3)} style={{ top: -90, right: -90 }} />
          <FadeIn>
            <Pulse style={{ alignSelf: "flex-start" }}>
              <LinearGradient colors={[colors.primary, colors.secondary]} style={{ width: 56, height: 56, borderRadius: 18, alignItems: "center", justifyContent: "center" }}>
                <Compass size={28} color="#fff" />
              </LinearGradient>
            </Pulse>
          </FadeIn>
          <FadeIn delay={100}>
            <Text style={{ color: colors.primary, fontSize: 12.5, fontWeight: "800", letterSpacing: 1.2, textTransform: "uppercase" }}>
              {first ? `Bienvenue${name ? ` ${name}` : ""} !` : "Guide"}
            </Text>
          </FadeIn>
          <FadeIn delay={160}>
            <Text style={{ color: colors.foreground, fontSize: 28, fontWeight: "800", lineHeight: 34 }}>{g.title}</Text>
          </FadeIn>
          <FadeIn delay={220}>
            <T muted size={14.5}>{g.intro}</T>
          </FadeIn>
        </LinearGradient>

        <View style={{ paddingHorizontal: GUTTER, gap: 14 }}>
          {/* Pour bien démarrer */}
          <FadeIn delay={260}>
            <View style={{ borderRadius: radius.xl, borderWidth: 1, borderColor: alpha(colors.primary, 0.4), backgroundColor: alpha(colors.primary, 0.07), padding: 16, gap: 12 }}>
              <T size={17} weight="800">Pour bien démarrer</T>
              {g.start.map((s, i) => {
                const Icon = s.icon;
                return (
                  <PressScale key={s.text} onPress={() => open(s)} style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                    <LinearGradient colors={[colors.primary, colors.secondary]} style={{ width: 34, height: 34, borderRadius: 11, alignItems: "center", justifyContent: "center" }}>
                      <Text style={{ color: "#fff", fontWeight: "800" }}>{i + 1}</Text>
                    </LinearGradient>
                    <T size={14} style={{ flex: 1 }}>{s.text}</T>
                    <Icon size={18} color={colors.primary} />
                  </PressScale>
                );
              })}
            </View>
          </FadeIn>

          {/* Toutes les fonctionnalités */}
          {g.sections.map((sec) => (
            <View key={sec.title} style={{ gap: 10 }}>
              <Text style={{ color: colors.mutedForeground, fontSize: 12, fontWeight: "800", letterSpacing: 1.2, textTransform: "uppercase", marginTop: 8 }}>{sec.title}</Text>
              {sec.items.map((it) => (
                <GuideItem key={it.title} item={it} index={n++} onOpen={() => open(it)} />
              ))}
            </View>
          ))}

          {!isProf && (
            <FadeIn delay={200}>
              <PressScale onPress={() => navigation.navigate("Pass")}>
                <LinearGradient colors={[colors.primary, colors.secondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: radius.xl, padding: 18, gap: 6, flexDirection: "row", alignItems: "center" }}>
                  <Crown size={26} color="#fff" />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: "#fff", fontWeight: "800", fontSize: 16 }}>Gratuit pour réviser</Text>
                    <Text style={{ color: "rgba(255,255,255,0.9)", fontSize: 13 }}>Seule EduIA illimitée est payante (Pass dès 200 F, sans abonnement).</Text>
                  </View>
                </LinearGradient>
              </PressScale>
            </FadeIn>
          )}

          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 }}>
            <CheckCircle2 size={16} color={colors.success} />
            <T size={13} muted style={{ flex: 1 }}>Tu retrouves ce guide à tout moment dans « Plus », puis « Guide ».</T>
          </View>
          <Button title={first ? "C'est parti !" : "Retour"} iconRight={ArrowRight} block size="lg" onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate("Tabs"))} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
