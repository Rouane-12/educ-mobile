import { ArrowLeft, ArrowRight, CheckCircle2, Lightbulb, RotateCcw, Timer, Trophy, XCircle } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import { quizApi } from "../api/endpoints";
import { AnswerInput } from "../components/AnswerInput";
import { Markdown } from "../components/Markdown";
import { Badge, Button, Card, H2, Row, Screen, T } from "../components/ui";
import { useApp } from "../context/AppContext";
import { formatTime, uid } from "../lib/format";
import { localStore } from "../lib/storage";
import { useStopwatch } from "../lib/useCountdown";
import { alpha, radius } from "../theme";

const norm = (s) => (s ?? "").trim().toLowerCase();
const isCorrect = (q, ans) => !!ans && norm(ans) === norm(q.answer);
const LETTERS = ["A", "B", "C", "D", "E", "F"];

/** Quiz Professeur : mode révision (correction immédiate) ou examen (correction à la fin). */
export default function ProfQuizRunScreen({ route, navigation }) {
  const { questions, mode, matiere, serie, examType, quizId } = route.params;
  const { user, colors } = useApp();
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState({});
  const [reveal, setReveal] = useState({});
  const [done, setDone] = useState(false);
  const [draft, setDraft] = useState("");
  const seconds = useStopwatch(!done);
  const q = questions[i];
  const score = questions.reduce((n, qq) => n + (isCorrect(qq, answers[qq.id]) ? 1 : 0), 0);

  useEffect(() => {
    navigation.setOptions({
      title: done ? "Résultat" : matiere,
      headerRight: () =>
        done ? null : (
          <Row gap={5}>
            <Timer size={15} color={colors.primary} />
            <T weight="800" color={colors.primary}>{formatTime(seconds)}</T>
          </Row>
        ),
    });
  }, [navigation, done, seconds, colors, matiere]);

  useEffect(() => setDraft(answers[q?.id] ?? ""), [i]); // eslint-disable-line react-hooks/exhaustive-deps

  const answer = (val) => {
    if (reveal[q.id]) return;
    setAnswers((a) => ({ ...a, [q.id]: val }));
    if (mode === "revision") setReveal((r) => ({ ...r, [q.id]: true }));
  };

  const finish = () => {
    setDone(true);
    localStore.addQuizResult({ id: uid(), date: new Date().toISOString(), matiere, serie, type: examType, score, total: questions.length, durationSec: seconds, sa: "Quiz Professeur" });
    if (user) quizApi.saveAttempt({ quiz: quizId, matiere, score, total: questions.length, duration_sec: seconds }).catch(() => {});
  };

  if (done)
    return (
      <Screen>
        <Card glow style={{ alignItems: "center", gap: 8, paddingVertical: 24 }}>
          <Trophy size={36} color={colors.accent} />
          <T size={38} weight="900">{score}/{questions.length}</T>
          <H2 center>{score / questions.length >= 0.5 ? "Bravo !" : "Continue tes efforts !"}</H2>
          <Row wrap>
            <Button
              title="Recommencer"
              icon={RotateCcw}
              onPress={() => {
                setAnswers({});
                setReveal({});
                setI(0);
                setDone(false);
              }}
            />
            <Button title="Retour" variant="secondary" icon={ArrowLeft} onPress={() => navigation.goBack()} />
          </Row>
        </Card>
        {questions.map((qq) => {
          const ok = isCorrect(qq, answers[qq.id]);
          return (
            <Card key={qq.id} style={{ borderLeftWidth: 4, borderLeftColor: ok ? colors.success : colors.danger }}>
              <Markdown size={14}>{qq.question}</Markdown>
              {!ok && <T size={13.5} color={colors.danger}>Ta réponse : {answers[qq.id] || "—"}</T>}
              <T size={13.5} weight="700" color={colors.success}>Bonne réponse : {qq.answer}</T>
              {qq.explanation ? <Markdown size={13.5}>{qq.explanation}</Markdown> : null}
            </Card>
          );
        })}
      </Screen>
    );

  const shown = reveal[q.id];
  const given = answers[q.id];
  return (
    <Screen>
      <Row style={{ justifyContent: "space-between" }}>
        <Badge label={`Question ${i + 1}/${questions.length}`} />
        <Badge label={mode === "revision" ? "Révision" : "Examen"} tone="accent" />
      </Row>
      <Card style={{ gap: 12 }}>
        <Markdown size={16}>{q.question}</Markdown>
        {q.kind === "QCM" && q.options?.length ? (
          q.options.filter(Boolean).map((opt, k) => {
            const sel = given === opt;
            const good = shown && norm(opt) === norm(q.answer);
            const bad = shown && sel && !good;
            const border = good ? colors.success : bad ? colors.danger : sel ? colors.primary : colors.border;
            return (
              <Pressable
                key={opt}
                onPress={() => answer(opt)}
                style={{ flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: radius.md, borderWidth: 1.5, borderColor: border, backgroundColor: alpha(border, sel || good ? 0.12 : 0.02) }}
              >
                {good ? <CheckCircle2 size={20} color={colors.success} /> : bad ? <XCircle size={20} color={colors.danger} /> : <T weight="800" color={colors.mutedForeground}>{LETTERS[k]}</T>}
                <T style={{ flex: 1 }}>{opt}</T>
              </Pressable>
            );
          })
        ) : (
          <View style={{ gap: 8 }}>
            <AnswerInput value={draft} onChange={setDraft} question={q.question} minHeight={70} editable={!shown} />
            {!shown && <Button title="Valider" size="sm" onPress={() => answer(draft)} disabled={!draft.trim()} />}
          </View>
        )}
        {shown && (
          <View style={{ gap: 4, padding: 10, borderRadius: radius.md, backgroundColor: alpha(isCorrect(q, given) ? colors.success : colors.danger, 0.1) }}>
            <Row gap={6}>
              <Lightbulb size={15} color={colors.accent} />
              <T weight="700">{isCorrect(q, given) ? "Bonne réponse !" : `Réponse attendue : ${q.answer}`}</T>
            </Row>
            {q.explanation ? <Markdown size={13.5}>{q.explanation}</Markdown> : null}
          </View>
        )}
      </Card>
      <Row style={{ justifyContent: "space-between" }}>
        <Button title="Précédente" variant="secondary" size="sm" icon={ArrowLeft} disabled={i === 0} onPress={() => setI(i - 1)} />
        {i < questions.length - 1 ? (
          <Button title="Suivante" size="sm" iconRight={ArrowRight} onPress={() => setI(i + 1)} />
        ) : (
          <Button title="Terminer" size="sm" icon={CheckCircle2} onPress={finish} />
        )}
      </Row>
    </Screen>
  );
}
