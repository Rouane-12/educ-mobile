import { CheckCircle2, Copy, Crown, Play, RotateCcw, Share2, Swords, Timer, Trophy, Users, XCircle } from "lucide-react-native";
import Clipboard from "@react-native-clipboard/clipboard";
import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, Share, View } from "react-native";
import { duelApi } from "../api/endpoints";
import { Markdown } from "../components/Markdown";
import { Badge, Button, Card, EmptyState, H1, H2, H3, Row, Screen, Spinner, T, toast } from "../components/ui";
import { useApp } from "../context/AppContext";
import { alpha, radius } from "../theme";

const POLL_MS = 1500;
const LETTERS = ["A", "B", "C", "D"];

export default function DuelScreen({ route, navigation }) {
  const { code } = route.params;
  const { colors } = useApp();
  const [state, setState] = useState(null);
  const [error, setError] = useState(null);
  const [offset, setOffset] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [feedback, setFeedback] = useState(null);
  const [sending, setSending] = useState(false);
  const qStart = useRef(null);

  const load = useCallback(async () => {
    try {
      const s = await duelApi.get(code);
      setOffset(Date.parse(s.server_now) - Date.now());
      setState((prev) => (prev?.me && s.me && prev.me.current > s.me.current ? { ...s, me: prev.me } : s));
    } catch (e) {
      setError(e.message);
    }
  }, [code]);

  useEffect(() => {
    navigation.setOptions({ title: `Défi ${code}` });
    duelApi
      .get(code)
      .then(async (s) => {
        if (!s.is_member && s.status === "waiting") {
          try {
            s = await duelApi.join(code);
          } catch (e) {
            toast.error(e.message);
          }
        }
        setOffset(Date.parse(s.server_now) - Date.now());
        setState(s);
      })
      .catch((e) => setError(e.message));
  }, [code, navigation]);

  useEffect(() => {
    if (!state || state.status === "finished") return undefined;
    const t = setInterval(load, POLL_MS);
    return () => clearInterval(t);
  }, [state?.status, load]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (state?.status !== "playing") return undefined;
    const t = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(t);
  }, [state?.status]);

  const serverNow = now + offset;
  const startsIn = state?.started_at ? Math.ceil((Date.parse(state.started_at) - serverNow) / 1000) : null;
  const index = state?.me?.current ?? 0;
  const playing = state?.status === "playing" && startsIn !== null && startsIn <= 0 && !state.me?.finished;
  const question = playing && state.questions ? state.questions[index] : null;

  useEffect(() => {
    if (question && !feedback) qStart.current = Date.now();
  }, [index, question?.question, feedback]); // eslint-disable-line react-hooks/exhaustive-deps

  const left = question && qStart.current ? Math.max(0, state.seconds_per_question - (now - qStart.current) / 1000) : state?.seconds_per_question ?? 0;

  const submit = useCallback(
    async (answer) => {
      if (sending || feedback || !question) return;
      setSending(true);
      try {
        const r = await duelApi.answer(code, index, answer);
        setFeedback({ ...r, given: answer });
        setTimeout(() => {
          setFeedback(null);
          setState((s) => (s ? { ...s, me: { current: index + 1, finished: r.finished } } : s));
          load();
        }, 1300);
      } catch (e) {
        if (e.status === 409) load();
        else toast.error(e.message);
      } finally {
        setSending(false);
      }
    },
    [sending, feedback, question, code, index, load],
  );

  useEffect(() => {
    if (question && !feedback && !sending && left <= 0) submit("");
  }, [left, question, feedback, sending, submit]);

  if (error) return <Screen><EmptyState icon={Swords} title="Défi introuvable">{error}</EmptyState></Screen>;
  if (!state) return <Screen contentStyle={{ flexGrow: 1, alignItems: "center", justifyContent: "center" }}><Spinner /></Screen>;

  const players = [...state.players].sort((a, b) => b.score - a.score);
  const me = state.players.find((p) => p.is_me);
  const Scores = () => (
    <Card style={{ gap: 8 }}>
      {players.map((p, k) => (
        <Row key={p.user_id}>
          {state.status === "finished" && k === 0 ? <Crown size={18} color={colors.accent} /> : <Users size={16} color={colors.mutedForeground} />}
          <T weight={p.is_me ? "800" : "500"} style={{ flex: 1 }} numberOfLines={1}>
            {p.name}
            {p.is_me ? " (toi)" : ""}
          </T>
          <T size={12.5} muted>{p.answered}/{state.n_questions}</T>
          <T weight="800" color={colors.primary}>{p.score}</T>
        </Row>
      ))}
    </Card>
  );

  // Salon d'attente
  if (state.status === "waiting")
    return (
      <Screen>
        <Card glow style={{ alignItems: "center", gap: 10, paddingVertical: 22 }}>
          <T muted>Code du défi</T>
          <H1 style={{ letterSpacing: 6 }}>{state.code}</H1>
          <T muted center size={13.5}>{state.matiere} · {state.n_questions} questions · {state.seconds_per_question} s par question</T>
          <Row wrap>
            <Button title="Copier" size="sm" variant="secondary" icon={Copy} onPress={() => { Clipboard.setString(state.code); toast.success("Code copié"); }} />
            <Button title="Partager" size="sm" variant="secondary" icon={Share2} onPress={() => Share.share({ message: `⚔️ Je te défie en ${state.matiere} sur EduBénin ! Code : ${state.code}` })} />
          </Row>
        </Card>
        <H2>Joueurs ({state.players.length}/{state.max_players})</H2>
        <Scores />
        {me?.is_host ? (
          <Button title={state.players.length < 2 ? "En attente d'un adversaire…" : "Lancer la partie"} icon={Play} size="lg" block disabled={state.players.length < 2} onPress={() => duelApi.start(code).then(setState).catch((e) => toast.error(e.message))} />
        ) : (
          <T muted center>L'hôte va lancer la partie…</T>
        )}
      </Screen>
    );

  // Compte à rebours
  if (state.status === "playing" && startsIn > 0)
    return (
      <Screen contentStyle={{ flexGrow: 1, alignItems: "center", justifyContent: "center" }}>
        <T muted>La partie commence dans</T>
        <T size={80} weight="900" color={colors.primary}>{startsIn}</T>
      </Screen>
    );

  // Partie terminée (ou en attente de l'adversaire)
  if (state.status === "finished" || state.me?.finished) {
    const won = state.status === "finished" && players[0]?.is_me;
    return (
      <Screen>
        <Card glow style={{ alignItems: "center", gap: 8, paddingVertical: 22 }}>
          <Trophy size={36} color={colors.accent} />
          <H2 center>{state.status !== "finished" ? "Bien joué ! En attente de ton adversaire…" : won ? "Victoire ! 🎉" : "Défaite… revanche ?"}</H2>
          {me ? <T muted>{me.correct}/{state.n_questions} bonnes réponses · {me.score} points</T> : null}
        </Card>
        <Scores />
        {state.status === "finished" && (
          <Button
            title={state.rematch_code ? "Rejoindre la revanche" : "Proposer une revanche"}
            icon={RotateCcw}
            block
            onPress={async () => {
              if (state.rematch_code) return navigation.replace("Duel", { code: state.rematch_code });
              try {
                const d = await duelApi.create({ exam_type: state.exam_type, serie: state.serie ?? "", matiere: state.matiere, theme: state.theme ?? "", count: state.n_questions, seconds: state.seconds_per_question, rematch_of: state.code });
                navigation.replace("Duel", { code: d.code });
              } catch (e) {
                toast.error(e.message);
              }
            }}
          />
        )}
        {state.status === "finished" && state.questions?.map((q, k) => {
          const mine = me?.answers?.[String(k)];
          return (
            <Card key={k} style={{ borderLeftWidth: 4, borderLeftColor: mine?.ok ? colors.success : colors.danger }}>
              <Markdown size={14}>{q.question}</Markdown>
              <T size={13.5} weight="700" color={colors.success}>Bonne réponse : {q.answer}</T>
            </Card>
          );
        })}
      </Screen>
    );
  }

  // Question en cours
  if (!question) return <Screen contentStyle={{ flexGrow: 1, alignItems: "center", justifyContent: "center" }}><Spinner /></Screen>;
  const pct = left / state.seconds_per_question;
  return (
    <Screen>
      <Row style={{ justifyContent: "space-between" }}>
        <Badge label={`Question ${index + 1}/${state.n_questions}`} />
        <Row gap={5}>
          <Timer size={16} color={pct < 0.3 ? colors.danger : colors.primary} />
          <T weight="800" color={pct < 0.3 ? colors.danger : colors.primary}>{Math.ceil(left)} s</T>
        </Row>
      </Row>
      <View style={{ height: 6, borderRadius: 3, backgroundColor: colors.muted, overflow: "hidden" }}>
        <View style={{ height: 6, width: `${pct * 100}%`, backgroundColor: pct < 0.3 ? colors.danger : colors.primary }} />
      </View>
      <Card style={{ gap: 10 }}>
        <Markdown size={16}>{question.question}</Markdown>
        {question.options.map((opt, k) => {
          const isGiven = feedback?.given === opt;
          const isGood = feedback && opt === feedback.correct_answer;
          const border = isGood ? colors.success : isGiven ? colors.danger : colors.border;
          return (
            <Pressable
              key={opt}
              disabled={!!feedback || sending}
              onPress={() => submit(opt)}
              style={{ flexDirection: "row", alignItems: "center", gap: 10, padding: 13, borderRadius: radius.md, borderWidth: 1.5, borderColor: border, backgroundColor: feedback && (isGood || isGiven) ? alpha(border, 0.12) : colors.surface }}
            >
              {isGood ? <CheckCircle2 size={20} color={colors.success} /> : isGiven ? <XCircle size={20} color={colors.danger} /> : <T weight="800" color={colors.mutedForeground}>{LETTERS[k]}</T>}
              <T style={{ flex: 1 }}>{opt}</T>
            </Pressable>
          );
        })}
        {feedback ? (
          <T weight="800" center color={feedback.ok ? colors.success : colors.danger}>
            {feedback.ok ? `+${feedback.points} points !` : feedback.timeout ? "Temps écoulé" : "Raté !"}
          </T>
        ) : null}
      </Card>
      <H3>Scores</H3>
      <Scores />
    </Screen>
  );
}
