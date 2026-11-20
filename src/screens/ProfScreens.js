// Espace professeur : tableau de bord, mes quiz, création d'un quiz (brouillon proposé par EduIA).
import { useFocusEffect } from "@react-navigation/native";
import { ArrowRight, BookOpen, Brain, CheckCircle2, Compass, FilePlus2, FileText, GraduationCap, HandCoins, Layers, MessageCircleQuestion, Mic, Plus, School, Send, Sparkles, Trash2, Users, Video } from "lucide-react-native";
import { useCallback, useState } from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { Blob, FadeIn, IconBadge, PressScale } from "../components/brand";
import { aiApi, quizApi } from "../api/endpoints";
import { Badge, Button, Card, Chip, ChipRow, EmptyState, Field, H2, H3, IconButton, Input, PageHero, Row, Screen, Segmented, Skeleton, T, toast } from "../components/ui";
import { BAC_SERIES, matieresFor, themesFor } from "../config/curriculum";
import { useApp } from "../context/AppContext";
import { alpha, GUTTER, radius } from "../theme";

function ProfStat({ icon, label, value, tone, delay }) {
  const { colors } = useApp();
  return (
    <FadeIn delay={delay} style={{ flexBasis: "30%", flexGrow: 1 }}>
      <View style={{ alignItems: "center", gap: 4, paddingVertical: 14, paddingHorizontal: 6, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card }}>
        <IconBadge icon={icon} tone={tone} size={36} />
        <T size={22} weight="900">{value ?? "–"}</T>
        <T size={11.5} muted center numberOfLines={1}>{label}</T>
      </View>
    </FadeIn>
  );
}

function ProfAction({ icon, title, desc, tone, onPress, index }) {
  const { colors } = useApp();
  return (
    <FadeIn delay={120 + index * 50} style={{ flexBasis: "47%", flexGrow: 1 }}>
      <PressScale onPress={onPress} style={{ padding: 14, gap: 10, minHeight: 126, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card }}>
        <IconBadge icon={icon} tone={tone} size={42} />
        <View style={{ gap: 2 }}>
          <T size={14.5} weight="800" numberOfLines={1}>{title}</T>
          <T size={12} muted numberOfLines={2}>{desc}</T>
        </View>
      </PressScale>
    </FadeIn>
  );
}

export function ProfDashboardScreen({ navigation }) {
  const { user, colors } = useApp();
  const [stats, setStats] = useState(null);
  useFocusEffect(
    useCallback(() => {
      quizApi.profStats().then(setStats).catch(() => setStats({}));
    }, []),
  );
  const go = (name, params) => navigation.navigate(name, params);
  const first = user?.display_name?.split(" ")[0] ?? "";
  const actions = [
    { icon: School, title: "Mes classes", desc: "Créer une classe, partager le code", tone: "primary", on: () => go("Classes") },
    { icon: FileText, title: "Donner un devoir", desc: "Quiz ou épreuve EduIA, avec date limite", tone: "accent", on: () => go("Classes") },
    { icon: FilePlus2, title: "Ajouter une épreuve", desc: "Partager un ancien sujet (PDF)", tone: "success", on: () => go("Ajouter") },
    { icon: Plus, title: "Créer un quiz", desc: "EduIA te propose un brouillon", tone: "info", on: () => go("ProfQuizNew") },
    { icon: Layers, title: "Fiches & cartes", desc: "Résumés, vocal, mémorisation", tone: "secondary", on: () => go("Fiches") },
    { icon: MessageCircleQuestion, title: "Questions", desc: "Répondre aux élèves", tone: "info", on: () => go("Questions") },
    { icon: Mic, title: "Mes audios", desc: "Publier une explication", tone: "danger", on: () => go("ProfAudios") },
    { icon: Brain, title: "Mes quiz", desc: "Tes quiz publiés", tone: "accent", on: () => go("ProfQuiz") },
    { icon: Video, title: "Cours en ligne", desc: "Heures de cours, vidéos, présence", tone: "danger", on: () => go("Classes") },
    { icon: GraduationCap, title: "Épreuves du BAC", desc: "Toutes les séries", tone: "primary", on: () => go("Bac") },
    { icon: BookOpen, title: "Épreuves du BEPC", desc: "Toutes les matières", tone: "secondary", on: () => go("Bepc") },
    { icon: Sparkles, title: "EduIA", desc: "Préparer un cours, un corrigé", tone: "accent", on: () => go("Tabs", { screen: "IaTab" }) },
  ];
  return (
    <SafeAreaView edges={["bottom"]} style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 44 }}>
        <LinearGradient colors={[alpha(colors.primary, 0.34), alpha(colors.secondary, 0.12), colors.background]} style={{ padding: GUTTER, paddingTop: 24, paddingBottom: 26, gap: 10, overflow: "hidden" }}>
          <Blob size={260} color={alpha(colors.primary, 0.3)} style={{ top: -100, right: -90 }} />
          <Blob size={160} color={alpha(colors.accent, 0.2)} style={{ bottom: -50, left: -60 }} dx={-14} />
          <FadeIn>
            <View style={{ alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 11, paddingVertical: 5, borderRadius: 999, backgroundColor: alpha(colors.primary, 0.16), borderWidth: 1, borderColor: alpha(colors.primary, 0.35) }}>
              <GraduationCap size={14} color={colors.primary} />
              <T size={12} weight="800" color={colors.primary}>Espace professeur</T>
            </View>
          </FadeIn>
          <FadeIn delay={90}>
            <T size={29} weight="800" style={{ lineHeight: 35 }}>
              {`Bonjour ${first} 👋`}
            </T>
          </FadeIn>
          <FadeIn delay={160}>
            <T muted size={14.5}>Tes classes, tes devoirs et tes contenus au même endroit. Plus tes élèves progressent, plus tu es récompensé.</T>
          </FadeIn>
          <FadeIn delay={230} style={{ flexDirection: "row", gap: 10, flexWrap: "wrap", marginTop: 6 }}>
            <Button title="Mes classes" icon={School} onPress={() => go("Classes")} />
            <Button title="Ajouter une épreuve" icon={FilePlus2} variant="secondary" onPress={() => go("Ajouter")} />
          </FadeIn>
        </LinearGradient>

        <View style={{ paddingHorizontal: GUTTER, gap: 16 }}>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            <ProfStat icon={Brain} label="Quiz créés" value={stats?.quizzes} tone="accent" delay={120} />
            <ProfStat icon={Mic} label="Audios" value={stats?.audios} tone="secondary" delay={180} />
            <ProfStat icon={FileText} label="Épreuves" value={stats?.exams} tone="success" delay={240} />
          </View>

          <FadeIn delay={150}>
            <PressScale onPress={() => go("Guide")}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: radius.lg, borderWidth: 1, borderColor: alpha(colors.info, 0.4), backgroundColor: alpha(colors.info, 0.08) }}>
                <IconBadge icon={Compass} tone="info" />
                <View style={{ flex: 1 }}>
                  <T size={15} weight="800">Guide du professeur</T>
                  <T size={12.5} muted>Tout ce que tu peux faire, étape par étape.</T>
                </View>
                <ArrowRight size={18} color={colors.mutedForeground} />
              </View>
            </PressScale>
          </FadeIn>

          <T size={20} weight="800" style={{ marginTop: 4 }}>Actions rapides</T>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            {actions.map((a, i) => (
              <ProfAction key={a.title} index={i} icon={a.icon} title={a.title} desc={a.desc} tone={a.tone} onPress={a.on} />
            ))}
          </View>

          <FadeIn delay={200}>
            <PressScale onPress={() => go("Gains")}>
              <LinearGradient colors={[colors.primary, colors.secondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: radius.xl, padding: 18, gap: 8, overflow: "hidden" }}>
                <Blob size={170} color="rgba(255,255,255,0.18)" style={{ top: -60, right: -50 }} />
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <HandCoins size={22} color="#fff" />
                  <T size={17} weight="800" color="#fff">Programme Profs partenaires</T>
                </View>
                <T size={13.5} color="rgba(255,255,255,0.92)">
                  Prime mensuelle selon ta note et tes élèves actifs (Bronze 1 000 F · Argent 2 000 F · Or 5 000 F) + 10 % des Pass achetés par tes élèves.
                </T>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <T weight="800" color="#fff">Voir mes gains</T>
                  <ArrowRight size={16} color="#fff" />
                </View>
              </LinearGradient>
            </PressScale>
          </FadeIn>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export function ProfQuizScreen({ navigation }) {
  const { colors } = useApp();
  const [mine, setMine] = useState(null);
  const load = useCallback(() => quizApi.list({ mine: 1 }).then(setMine).catch(() => setMine([])), []);
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );
  const remove = (qz) =>
    Alert.alert("Supprimer ce quiz ?", qz.titre, [
      { text: "Annuler", style: "cancel" },
      { text: "Supprimer", style: "destructive", onPress: () => quizApi.remove(qz.id).then(load).catch((e) => toast.error(e.message)) },
    ]);
  return (
    <Screen>
      <Button title="Créer un quiz" icon={Plus} block onPress={() => navigation.navigate("ProfQuizNew")} />
      {mine === null ? (
        [0, 1].map((i) => <Skeleton key={i} height={80} />)
      ) : mine.length === 0 ? (
        <EmptyState icon={Brain} title="Aucun quiz publié">Crée ton premier quiz : EduIA peut te proposer un brouillon.</EmptyState>
      ) : (
        mine.map((qz) => (
          <Card key={qz.id} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <H3 numberOfLines={2}>{qz.titre}</H3>
              <T size={12.5} muted>
                {qz.matiere} · {qz.niveau}
                {qz.serie ? ` ${qz.serie}` : ""} · {qz.question_count} questions
              </T>
              {qz.attempts != null ? <T size={12} muted>{qz.attempts} tentative(s)</T> : null}
            </View>
            <IconButton icon={Trash2} color={colors.danger} label="Supprimer" onPress={() => remove(qz)} />
          </Card>
        ))
      )}
    </Screen>
  );
}

export function ProfQuizNewScreen({ navigation }) {
  const { colors } = useApp();
  const [niveau, setNiveau] = useState("BAC");
  const [serie, setSerie] = useState("D");
  const [matiere, setMatiere] = useState("");
  const [titre, setTitre] = useState("");
  const [chapitre, setChapitre] = useState("");
  const [count, setCount] = useState(10);
  const [questions, setQuestions] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const matieres = matieresFor(niveau, niveau === "BAC" ? serie : null);

  const propose = async () => {
    setAiLoading(true);
    try {
      const res = await aiApi.quiz({
        exam_type: niveau,
        serie: niveau === "BAC" ? serie : "",
        matiere,
        themes: chapitre.trim() ? [chapitre.trim()] : themesFor(niveau, matiere),
        count,
        exclude: questions.map((q) => q.question),
      });
      setQuestions((qs) => [...qs, ...res.questions.map((q) => ({ kind: "QCM", question: q.question, options: q.options, answer: q.answer, explanation: q.explanation }))]);
      toast.success(`${res.questions.length} questions proposées : relis-les avant de publier`);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setAiLoading(false);
    }
  };

  const publish = async () => {
    if (!titre.trim()) return toast.error("Donne un titre au quiz");
    if (!questions.length) return toast.error("Ajoute au moins une question");
    setSaving(true);
    try {
      await quizApi.create({ titre: titre.trim(), matiere, niveau, serie: niveau === "BAC" ? serie : "", chapitre, duree_minutes: null, questions });
      toast.success("Quiz publié : tes élèves sont prévenus");
      navigation.goBack();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <Card style={{ gap: 14 }}>
        <Segmented options={[{ value: "BAC", label: "BAC" }, { value: "BEPC", label: "BEPC" }]} value={niveau} onChange={(v) => { setNiveau(v); setMatiere(""); }} />
        {niveau === "BAC" && (
          <Field label="Série">
            <ChipRow>
              {BAC_SERIES.map((s) => (
                <Chip key={s.code} label={s.code} active={serie === s.code} onPress={() => { setSerie(s.code); setMatiere(""); }} />
              ))}
            </ChipRow>
          </Field>
        )}
        <Field label="Matière">
          <ChipRow>
            {matieres.map((m) => (
              <Chip key={m} label={m} active={matiere === m} onPress={() => setMatiere(m)} />
            ))}
          </ChipRow>
        </Field>
        <Field label="Titre">
          <Input value={titre} onChangeText={setTitre} placeholder="Ex. Révision : les nombres complexes" />
        </Field>
        <Field label="Chapitre / SA (facultatif)">
          <Input value={chapitre} onChangeText={setChapitre} placeholder="Ex. Génétique humaine" />
        </Field>
      </Card>

      <Card style={{ gap: 10, backgroundColor: alpha(colors.primary, 0.06) }}>
        <Row>
          <Sparkles size={18} color={colors.primary} />
          <H3>Brouillon proposé par EduIA</H3>
        </Row>
        <ChipRow>
          {[5, 10, 15, 20].map((n) => (
            <Chip key={n} label={`${n} questions`} active={count === n} onPress={() => setCount(n)} />
          ))}
        </ChipRow>
        <Button title="Proposer des questions" icon={Sparkles} disabled={!matiere} loading={aiLoading} onPress={propose} />
      </Card>

      {questions.length > 0 && <H2>Questions ({questions.length})</H2>}
      {questions.map((q, i) => (
        <Card key={i} style={{ gap: 6 }}>
          <Row style={{ alignItems: "flex-start" }}>
            <Badge label={`Q${i + 1}`} />
            <T style={{ flex: 1 }} weight="600">{q.question}</T>
            <IconButton icon={Trash2} size={16} color={colors.mutedForeground} label="Retirer" onPress={() => setQuestions((qs) => qs.filter((_, j) => j !== i))} />
          </Row>
          {q.options?.map((o) => (
            <Row key={o} gap={6}>
              {o === q.answer ? <CheckCircle2 size={14} color={colors.success} /> : <View style={{ width: 14 }} />}
              <T size={13.5} color={o === q.answer ? colors.success : undefined}>{o}</T>
            </Row>
          ))}
        </Card>
      ))}
      <Button title="Publier le quiz" icon={Send} size="lg" block disabled={!matiere || !questions.length} loading={saving} onPress={publish} />
    </Screen>
  );
}
