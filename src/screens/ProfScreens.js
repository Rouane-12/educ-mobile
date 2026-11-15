// Espace professeur : tableau de bord, mes quiz, création d'un quiz (brouillon proposé par EduIA).
import { useFocusEffect } from "@react-navigation/native";
import { Brain, CheckCircle2, FileText, HandCoins, Layers, MessageCircleQuestion, Mic, Plus, School, Send, Sparkles, Trash2, Users } from "lucide-react-native";
import { useCallback, useState } from "react";
import { Alert, Pressable, View } from "react-native";
import { aiApi, quizApi } from "../api/endpoints";
import { Badge, Button, Card, Chip, ChipRow, EmptyState, Field, H2, H3, IconButton, Input, PageHero, Row, Screen, Segmented, Skeleton, T, toast } from "../components/ui";
import { BAC_SERIES, matieresFor, themesFor } from "../config/curriculum";
import { useApp } from "../context/AppContext";
import { alpha, radius } from "../theme";

export function ProfDashboardScreen({ navigation }) {
  const { user, colors } = useApp();
  const [stats, setStats] = useState(null);
  useFocusEffect(
    useCallback(() => {
      quizApi.profStats().then(setStats).catch(() => setStats({}));
    }, []),
  );
  const Stat = ({ icon: Icon, label, value, tone }) => (
    <Card style={{ flexBasis: "30%", flexGrow: 1, alignItems: "center", gap: 4 }}>
      <Icon size={20} color={colors[tone] ?? colors.primary} />
      <T size={24} weight="900">{value ?? "–"}</T>
      <T size={11.5} muted center>{label}</T>
    </Card>
  );
  return (
    <Screen>
      <PageHero eyebrow="Espace professeur" icon={Users} title={`Bonjour ${user?.display_name?.split(" ")[0] ?? ""}`} subtitle="Tes classes, tes devoirs, tes fiches et les questions de tes élèves. Plus tu les fais progresser, plus tu gagnes." />
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
        <Stat icon={Brain} label="Quiz créés" value={stats?.quizzes} tone="accent" />
        <Stat icon={Mic} label="Audios" value={stats?.audios} />
        <Stat icon={FileText} label="Épreuves" value={stats?.exams} tone="secondary" />
      </View>
      <Button title="Mes classes" icon={School} block size="lg" onPress={() => navigation.navigate("Classes")} />
      <Button title="Créer un quiz" icon={Plus} variant="secondary" block onPress={() => navigation.navigate("ProfQuizNew")} />
      <Button title="Mes quiz" icon={Brain} variant="secondary" block onPress={() => navigation.navigate("ProfQuiz")} />
      <Button title="Questions des élèves" icon={MessageCircleQuestion} variant="secondary" block onPress={() => navigation.navigate("Questions")} />
      <Button title="Fiches de révision" icon={Layers} variant="secondary" block onPress={() => navigation.navigate("Fiches")} />
      <Button title="Mes gains" icon={HandCoins} variant="secondary" block onPress={() => navigation.navigate("Gains")} />
    </Screen>
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
