import { ArrowLeft, ArrowRight, CheckCircle2, Flag, RotateCcw, Send, Timer, Trophy, XCircle } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { aiApi, quizApi } from "../api/endpoints";
import { GeneratingScreen } from "../components/GeneratingScreen";
import { Markdown } from "../components/Markdown";
import { Badge, Button, Card, H2, Row, Screen, Sheet, T, toast } from "../components/ui";
import { useApp } from "../context/AppContext";
import { formatTime, uid } from "../lib/format";
import { localStore } from "../lib/storage";
import { useCountdown } from "../lib/useCountdown";
import { alpha, radius } from "../theme";

const FIRST_BATCH = 10;
const NEXT_BATCH = 15;
const LETTERS = ["A", "B", "C", "D", "E", "F"];

/** Quiz Questions IA : démarre avec 10 QCM, la suite arrive pendant que l'élève répond. */
export default function QcmScreen({ route, navigation }) {
  const { params, minutes, target, meta } = route.params;
  const [round, setRound] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const stopped = useRef(false);

  useEffect(() => {
    stopped.current = false;
    setQuestions([]);
    let list = [];
    const fetchBatch = async (count, offset) =>
      (await aiApi.quiz({ ...params, count, offset, exclude: list.map((q) => q.question) })).questions;
    (async () => {
      try {
        list = await fetchBatch(FIRST_BATCH, 0);
        if (stopped.current) return;
        setQuestions(list);
      } catch (e) {
        if (!stopped.current) {
          toast.error(e.message);
          navigation.goBack();
        }
        return;
      }
      let batch = 1;
      while (!stopped.current && list.length < target) {
        setLoadingMore(true);
        try {
          const more = await fetchBatch(Math.min(NEXT_BATCH, target - list.length), batch);
          if (stopped.current || !more.length) break;
          list = [...list, ...more].slice(0, target);
          setQuestions(list);
          batch += 1;
        } catch {
          break;
        }
      }
      if (!stopped.current) setLoadingMore(false);
    })();
    return () => {
      stopped.current = true;
    };
  }, [params, target, round, navigation]);

  if (!questions.length)
    return (
      <GeneratingScreen
        title={`EduIA prépare ton quiz de ${meta.matiere}…`}
        steps={["Choix des notions du programme béninois", "Rédaction des premières questions", "Vérification des réponses", "C'est presque prêt"]}
      />
    );
  return (
    <Runner
      key={round}
      questions={questions}
      target={target}
      loadingMore={loadingMore}
      minutes={minutes}
      meta={meta}
      navigation={navigation}
      onFinish={() => {
        stopped.current = true;
        setLoadingMore(false);
      }}
      onRestart={() => setRound((r) => r + 1)}
    />
  );
}

function Runner({ questions, target, loadingMore, minutes, meta, navigation, onFinish, onRestart }) {
  const { user, colors } = useApp();
  const total = minutes * 60;
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState({});
  const [flags, setFlags] = useState({});
  const [maxSeen, setMaxSeen] = useState(0);
  const [done, setDone] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const finishing = useRef(false);
  const left = useCountdown(total, !done);
  const q = questions[i];
  const goal = target ?? questions.length;

  const treated = useMemo(
    () => questions.slice(0, Math.max(maxSeen + 1, ...Object.keys(answers).map((k) => Number(k) + 1))),
    [questions, maxSeen, answers],
  );
  const go = (k) => {
    setI(k);
    setMaxSeen((m) => Math.max(m, k));
  };

  const finish = useCallback(
    (auto = false) => {
      if (finishing.current) return;
      finishing.current = true;
      setConfirm(false);
      setDone(true);
      onFinish?.();
      const used = total - left;
      const good = treated.filter((qq, k) => answers[k] === qq.answer).length;
      if (auto) toast.info("Temps écoulé : ta copie a été ramassée");
      localStore.addQuizResult({
        id: uid(),
        date: new Date().toISOString(),
        matiere: meta.matiere,
        serie: meta.serie,
        type: meta.examType,
        score: good,
        total: treated.length,
        durationSec: used,
        sa: "Quiz Questions IA",
      });
      if (user) quizApi.saveAttempt({ matiere: meta.matiere, score: good, total: treated.length, duration_sec: used }).catch(() => {});
    },
    [answers, left, meta, treated, total, user, onFinish],
  );

  useEffect(() => {
    if (!done && left <= 0) finish(true);
  }, [left, done, finish]);

  useEffect(() => {
    navigation.setOptions({
      title: done ? "Résultat" : meta.matiere,
      headerRight: () =>
        done ? null : (
          <Row gap={5} style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.full, backgroundColor: alpha(left <= 60 ? colors.danger : colors.primary, 0.15) }}>
            <Timer size={15} color={left <= 60 ? colors.danger : colors.primary} />
            <T weight="800" size={14} color={left <= 60 ? colors.danger : colors.primary}>{formatTime(left)}</T>
          </Row>
        ),
    });
  }, [navigation, done, left, colors, meta.matiere]);

  if (done) {
    const good = treated.filter((qq, k) => answers[k] === qq.answer).length;
    const pct = treated.length ? Math.round((good / treated.length) * 100) : 0;
    return (
      <Screen>
        <Card glow style={{ alignItems: "center", gap: 8, paddingVertical: 24 }}>
          <Trophy size={36} color={colors.accent} />
          <T size={38} weight="900">{good}/{treated.length}</T>
          <H2 center>{pct >= 75 ? "Excellent !" : pct >= 50 ? "Bien joué !" : "Continue tes efforts !"}</H2>
          <T muted>{pct} % de bonnes réponses · {meta.matiere}</T>
          <Row wrap>
            <Button title="Nouveau quiz" icon={RotateCcw} onPress={onRestart} />
            <Button title="Retour" variant="secondary" icon={ArrowLeft} onPress={() => navigation.goBack()} />
          </Row>
        </Card>
        <H2>Correction</H2>
        {treated.map((qq, k) => {
          const ok = answers[k] === qq.answer;
          return (
            <Card key={k} style={{ borderLeftWidth: 4, borderLeftColor: ok ? colors.success : colors.danger }}>
              <Row style={{ alignItems: "flex-start" }}>
                {ok ? <CheckCircle2 size={18} color={colors.success} /> : <XCircle size={18} color={colors.danger} />}
                <View style={{ flex: 1 }}>
                  <Markdown size={14}>{qq.question}</Markdown>
                </View>
              </Row>
              {!ok && <T size={13.5} color={colors.danger}>Ta réponse : {answers[k] ?? "—"}</T>}
              <T size={13.5} color={colors.success} weight="700">Bonne réponse : {qq.answer}</T>
              {qq.explanation ? <Markdown size={13.5}>{qq.explanation}</Markdown> : null}
            </Card>
          );
        })}
      </Screen>
    );
  }

  const answered = Object.keys(answers).length;
  return (
    <Screen>
      <Row style={{ justifyContent: "space-between" }} wrap>
        <Badge label={`Question ${i + 1}/${Math.max(goal, questions.length)}`} />
        <T size={12.5} muted>
          {answered} répondue{answered > 1 ? "s" : ""}
          {loadingMore ? " · suite en préparation…" : ""}
        </T>
      </Row>
      <View style={{ height: 6, borderRadius: 3, backgroundColor: colors.muted, overflow: "hidden" }}>
        <View style={{ height: 6, width: `${Math.min(100, (answered / goal) * 100)}%`, backgroundColor: colors.primary }} />
      </View>

      <Card style={{ gap: 12 }}>
        {q.theme ? <T size={12} weight="700" color={colors.primary}>{q.theme}</T> : null}
        <Markdown size={16}>{q.question}</Markdown>
        <View style={{ gap: 8 }}>
          {q.options.map((opt, k) => {
            const sel = answers[i] === opt;
            return (
              <Pressable
                key={opt}
                onPress={() => setAnswers((a) => ({ ...a, [i]: opt }))}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                  padding: 12,
                  borderRadius: radius.md,
                  borderWidth: 1.5,
                  borderColor: sel ? colors.primary : colors.border,
                  backgroundColor: sel ? alpha(colors.primary, 0.12) : pressed ? colors.surfaceHover : colors.surface,
                })}
              >
                <View style={{ width: 28, height: 28, borderRadius: 9, alignItems: "center", justifyContent: "center", backgroundColor: sel ? colors.primary : colors.muted }}>
                  <T size={13} weight="800" color={sel ? "#fff" : colors.mutedForeground}>{LETTERS[k]}</T>
                </View>
                <T style={{ flex: 1 }} size={14.5}>{opt}</T>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Row style={{ justifyContent: "space-between" }} wrap>
        <Button title="Précédente" variant="secondary" size="sm" icon={ArrowLeft} disabled={i === 0} onPress={() => go(i - 1)} />
        <Button
          title={flags[i] ? "Marquée" : "Marquer"}
          variant="ghost"
          size="sm"
          icon={Flag}
          onPress={() => setFlags((f) => ({ ...f, [i]: !f[i] }))}
        />
        {i < questions.length - 1 ? (
          <Button title="Suivante" size="sm" iconRight={ArrowRight} onPress={() => go(i + 1)} />
        ) : (
          <Button title="Terminer" size="sm" icon={Send} onPress={() => setConfirm(true)} />
        )}
      </Row>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
        {questions.map((_, k) => (
          <Pressable
            key={k}
            onPress={() => go(k)}
            style={{
              width: 34,
              height: 34,
              borderRadius: 9,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: k === i ? 2 : 1,
              borderColor: k === i ? colors.primary : flags[k] ? colors.accent : colors.border,
              backgroundColor: answers[k] ? alpha(colors.primary, 0.18) : colors.surface,
            }}
          >
            <T size={12} weight="700">{k + 1}</T>
          </Pressable>
        ))}
      </ScrollView>

      <Button title="Rendre ma copie" variant="outline" block icon={Send} onPress={() => setConfirm(true)} />

      <Sheet
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Terminer le quiz ?"
        footer={
          <>
            <Button title="Continuer" variant="ghost" onPress={() => setConfirm(false)} />
            <Button title="Terminer" icon={Send} onPress={() => finish(false)} />
          </>
        }
      >
        <T muted>
          Tu as répondu à {answered} question(s). Les questions vues sans réponse comptent comme fausses.
        </T>
      </Sheet>
    </Screen>
  );
}
