import { Brain, CheckSquare, ChevronRight, Clock, FileText, GraduationCap, Layers, ListChecks, Medal, PenLine, Play, School, Search, ShieldCheck, Sparkles, Swords, Timer, User } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { Pressable, View } from "react-native";
import { aiApi, quizApi } from "../api/endpoints";
import { GeneratingScreen } from "../components/GeneratingScreen";
import { Badge, Button, Card, Chip, ChipRow, EmptyState, Field, H3, Input, PageHero, Row, Screen, Segmented, Skeleton, T, toast } from "../components/ui";
import { ALL_BAC_MATIERES, BAC_SERIES, MATIERES_BEPC, epreuveInfo, formatDuree, groupByCategory, matieresFor, themesFor } from "../config/curriculum";
import { useApp } from "../context/AppContext";
import { alpha, radius } from "../theme";

export const MODES = [
  { value: "epreuve", label: "Quiz Épreuve IA", icon: FileText },
  { value: "questions", label: "Quiz Questions IA", icon: ListChecks },
  { value: "prof", label: "Quiz Professeur", icon: GraduationCap },
];
const MODE_INFO = {
  epreuve: "Générée par l'IA : une épreuve complète au format de l'examen. Tu réponds à chaque question (espace de rédaction structuré pour les dissertations), puis l'IA corrige et note ta copie sur 20.",
  questions: "Générées par l'IA : un maximum de QCM dans le temps choisi. De nouvelles questions arrivent pendant que tu réponds.",
  prof: "Préparés par de vrais professeurs (pas par l'IA). Choisis celui que tu veux.",
};
export const DUREES = [
  { min: 10, target: 40 },
  { min: 15, target: 60 },
  { min: 30, target: 100 },
];

function BigChoice({ icon: Icon, title, sub, active, onPress }) {
  const { colors } = useApp();
  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        minWidth: 92,
        alignItems: "center",
        gap: 4,
        padding: 12,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: active ? colors.primary : colors.border,
        backgroundColor: active ? alpha(colors.primary, 0.12) : colors.surface,
      }}
    >
      <Icon size={18} color={active ? colors.primary : colors.mutedForeground} />
      <T weight="800" size={15}>{title}</T>
      <T size={11.5} muted center>{sub}</T>
    </Pressable>
  );
}

export default function QuizScreen({ navigation, route }) {
  const { user } = useApp();
  const [mode, setMode] = useState(route.params?.mode ?? "epreuve");
  const [examType, setExamType] = useState(user?.niveau === "3ème" ? "BEPC" : "BAC");
  const [serie, setSerie] = useState(user?.serie || "D");
  const [matiere, setMatiere] = useState("");
  const [themes, setThemes] = useState([]);
  const [duree, setDuree] = useState(15);
  const [timed, setTimed] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (route.params?.mode) setMode(route.params.mode);
  }, [route.params?.mode]);

  const matieres = useMemo(() => matieresFor(examType, examType === "BAC" ? serie : null), [examType, serie]);
  const allThemes = matiere ? themesFor(examType, matiere) : [];
  const official = matiere ? epreuveInfo(examType, serie, matiere) : null;
  useEffect(() => {
    if (matiere && !matieres.includes(matiere)) setMatiere("");
  }, [matieres, matiere]);
  useEffect(() => setThemes([]), [matiere, examType]);

  const params = { exam_type: examType, serie: examType === "BAC" ? serie : "", matiere, themes: themes.length ? themes : allThemes };
  const meta = { matiere, serie: examType === "BAC" ? serie : undefined, examType };

  const startEpreuve = async () => {
    setGenerating(true);
    try {
      const ep = await aiApi.epreuve({
        exam_type: params.exam_type,
        serie: params.serie,
        matiere,
        duree: official?.duree ?? 120,
        coefficient: official?.coefficient ?? null,
        theme: themes.length === 1 ? themes[0] : "",
      });
      navigation.navigate("Epreuve", { epreuve: ep, timed });
    } catch (e) {
      toast.error(e.message);
    } finally {
      setGenerating(false);
    }
  };

  if (generating)
    return (
      <GeneratingScreen
        title={`EduIA rédige ton épreuve de ${matiere}…`}
        steps={["Choix des situations d'apprentissage", "Rédaction du sujet au format de l'examen", "Répartition du barème sur 20", "Mise en page de la copie"]}
      />
    );

  return (
    <Screen>
      <PageHero
        eyebrow="Quiz"
        icon={Brain}
        title="Entraîne-toi comme le jour J"
        subtitle="Épreuves complètes, séries de QCM chronométrées et quiz de tes professeurs, selon le programme officiel béninois."
      />
      <Segmented options={MODES} value={mode} onChange={setMode} />
      <T size={13.5} muted>{MODE_INFO[mode]}</T>
      <ChipRow>
        <Chip label="Examen blanc national" icon={Medal} onPress={() => navigation.navigate("ExamenBlanc")} />
        <Chip label="Défier un camarade" icon={Swords} onPress={() => navigation.navigate("Defis")} />
        <Chip label="Devoirs de ma classe" icon={School} onPress={() => navigation.navigate("Classes")} />
      </ChipRow>

      {mode === "prof" ? (
        <ProfQuizzes navigation={navigation} defaultExam={examType} />
      ) : (
        <Card style={{ gap: 16 }}>
          <Field label="1. Examen">
            <Segmented
              options={[
                { value: "BAC", label: "BAC" },
                { value: "BEPC", label: "BEPC" },
              ]}
              value={examType}
              onChange={setExamType}
            />
          </Field>
          {examType === "BAC" && (
            <Field label="Série">
              <ChipRow>
                {BAC_SERIES.map((s) => (
                  <Chip key={s.code} label={s.code} active={serie === s.code} onPress={() => setSerie(s.code)} />
                ))}
              </ChipRow>
            </Field>
          )}
          <Field label={`2. Matière ${examType === "BAC" ? `(série ${serie})` : "(BEPC)"}`}>
            <View style={{ gap: 10 }}>
              {groupByCategory(matieres).map((g) => (
                <View key={g.key} style={{ gap: 6 }}>
                  <T size={11.5} weight="700" muted>{g.label.toUpperCase()}</T>
                  <ChipRow>
                    {g.items.map((m) => (
                      <Chip
                        key={m}
                        label={m}
                        small={examType === "BAC" ? `coef ${epreuveInfo("BAC", serie, m)?.coefficient ?? "-"}` : undefined}
                        active={matiere === m}
                        onPress={() => setMatiere(m)}
                      />
                    ))}
                  </ChipRow>
                </View>
              ))}
            </View>
          </Field>

          {matiere && allThemes.length > 0 && (
            <Field label={`3. Thèmes ${themes.length ? `(${themes.length} choisi${themes.length > 1 ? "s" : ""})` : "(tous)"}`}>
              <ChipRow>
                <Chip label="Tout le programme" icon={Layers} active={!themes.length} onPress={() => setThemes([])} />
                {allThemes.map((t) => (
                  <Chip
                    key={t}
                    label={t}
                    icon={themes.includes(t) ? CheckSquare : undefined}
                    active={themes.includes(t)}
                    onPress={() => setThemes((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]))}
                  />
                ))}
              </ChipRow>
            </Field>
          )}

          {mode === "questions" ? (
            <Field label="4. Durée">
              <Row wrap gap={8}>
                {DUREES.map((d) => (
                  <BigChoice key={d.min} icon={Timer} title={`${d.min} min`} sub={`jusqu'à ${d.target} QCM`} active={duree === d.min} onPress={() => setDuree(d.min)} />
                ))}
              </Row>
            </Field>
          ) : (
            <Field label="4. Conditions">
              <Row wrap gap={8}>
                <BigChoice icon={Timer} title={official?.duree ? formatDuree(official.duree) : "2 h"} sub="Durée officielle" active={timed} onPress={() => setTimed(true)} />
                <BigChoice icon={Clock} title="Libre" sub="Sans chrono" active={!timed} onPress={() => setTimed(false)} />
              </Row>
              {official?.coefficient ? (
                <T size={12.5} muted>
                  Au BAC {serie}, l'épreuve de {matiere} est au coefficient {official.coefficient} et dure {formatDuree(official.duree)}.
                </T>
              ) : null}
            </Field>
          )}

          <Button
            size="lg"
            block
            icon={mode === "questions" ? Play : Sparkles}
            disabled={!matiere}
            title={!matiere ? "Choisis une matière" : mode === "questions" ? `Commencer · ${duree} min de QCM` : `Générer mon épreuve de ${matiere}`}
            onPress={() =>
              mode === "questions"
                ? navigation.navigate("Qcm", { params, minutes: duree, target: DUREES.find((d) => d.min === duree).target, meta })
                : startEpreuve()
            }
          />
        </Card>
      )}
    </Screen>
  );
}

/** Quiz préparés par les professeurs. */
function ProfQuizzes({ navigation, defaultExam }) {
  const { colors } = useApp();
  const [examType, setExamType] = useState(defaultExam);
  const [serie, setSerie] = useState("");
  const [matiere, setMatiere] = useState("");
  const [q, setQ] = useState("");
  const [runMode, setRunMode] = useState("revision");
  const [list, setList] = useState(null);
  const [starting, setStarting] = useState(null);

  useEffect(() => {
    let alive = true;
    setList(null);
    quizApi
      .list({ niveau: examType, serie: examType === "BAC" ? serie : undefined, matiere })
      .then((d) => alive && setList(d))
      .catch(() => alive && setList([]));
    return () => {
      alive = false;
    };
  }, [examType, serie, matiere]);

  const matieres = examType === "BAC" ? (serie ? matieresFor("BAC", serie) : ALL_BAC_MATIERES) : MATIERES_BEPC;
  const shown = (list ?? []).filter((qz) => !q.trim() || `${qz.titre} ${qz.chapitre ?? ""} ${qz.author} ${qz.matiere}`.toLowerCase().includes(q.trim().toLowerCase()));

  const start = async (quiz) => {
    setStarting(quiz.id);
    try {
      const detail = await quizApi.get(quiz.id);
      if (!detail.questions?.length) return toast.error("Ce quiz ne contient pas encore de questions.");
      navigation.navigate("ProfQuizRun", {
        mode: runMode,
        quizId: quiz.id,
        matiere: quiz.matiere,
        serie: quiz.serie ?? undefined,
        examType: quiz.niveau === "BEPC" ? "BEPC" : "BAC",
        questions: detail.questions.map((r) => ({
          id: r.id,
          kind: r.kind,
          question: r.question,
          options: r.options ?? undefined,
          answer: r.answer,
          explanation: r.explanation ?? "",
        })),
      });
    } catch (e) {
      toast.error(e.message);
    } finally {
      setStarting(null);
    }
  };

  return (
    <View style={{ gap: 12 }}>
      <Card style={{ gap: 12 }}>
        <Segmented
          options={[
            { value: "BAC", label: "BAC" },
            { value: "BEPC", label: "BEPC" },
          ]}
          value={examType}
          onChange={(v) => {
            setExamType(v);
            setMatiere("");
          }}
        />
        <Segmented
          options={[
            { value: "revision", label: "Révision", icon: Brain },
            { value: "examen", label: "Examen", icon: PenLine },
          ]}
          value={runMode}
          onChange={setRunMode}
        />
        {examType === "BAC" && (
          <ChipRow>
            <Chip label="Toutes séries" active={!serie} onPress={() => setSerie("")} />
            {BAC_SERIES.map((s) => (
              <Chip key={s.code} label={s.code} active={serie === s.code} onPress={() => setSerie(s.code)} />
            ))}
          </ChipRow>
        )}
        <ChipRow>
          <Chip label="Toutes matières" active={!matiere} onPress={() => setMatiere("")} />
          {matieres.map((m) => (
            <Chip key={m} label={m} active={matiere === m} onPress={() => setMatiere(m)} />
          ))}
        </ChipRow>
        <Input icon={Search} value={q} onChangeText={setQ} placeholder="Titre, chapitre, prof…" />
      </Card>

      {list === null ? (
        [0, 1, 2].map((i) => <Skeleton key={i} height={84} />)
      ) : shown.length === 0 ? (
        <EmptyState icon={GraduationCap} title="Aucun quiz de professeur pour ces critères">
          Les professeurs publient leurs quiz depuis leur espace. Change les filtres ou reviens bientôt.
        </EmptyState>
      ) : (
        shown.map((qz) => (
          <Card key={qz.id} onPress={() => !starting && start(qz)} style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View style={{ width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: alpha(colors.success, 0.14) }}>
              <ShieldCheck size={20} color={colors.success} />
            </View>
            <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
              <H3 numberOfLines={2}>{qz.titre}</H3>
              <T size={12.5} muted numberOfLines={1}>
                {qz.matiere} · {qz.niveau}
                {qz.serie ? ` ${qz.serie}` : ""}
                {qz.chapitre ? ` · ${qz.chapitre}` : ""}
              </T>
              <Row gap={4}>
                <User size={12} color={colors.mutedForeground} />
                <T size={12.5} muted>{qz.author}</T>
              </Row>
            </View>
            <View style={{ alignItems: "flex-end", gap: 6 }}>
              <Badge label={`${qz.question_count} Q`} />
              <ChevronRight size={18} color={starting === qz.id ? colors.primary : colors.mutedForeground} />
            </View>
          </Card>
        ))
      )}
    </View>
  );
}
