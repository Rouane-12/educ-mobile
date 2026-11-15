import { useFocusEffect } from "@react-navigation/native";
import { BookOpen, CheckCircle2, Clock, FileText, RotateCcw, Send, Timer, Trophy } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, BackHandler, KeyboardAvoidingView, Platform, View } from "react-native";
import { aiApi, classesApi, examBlancApi, quizApi } from "../api/endpoints";
import { AnswerInput } from "../components/AnswerInput";
import { DissertationInput, isDissertation } from "../components/DissertationInput";
import { GeneratingScreen } from "../components/GeneratingScreen";
import { Markdown } from "../components/Markdown";
import { Badge, Button, Card, FlagBar, H1, H2, H3, Row, Screen, Sheet, T, toast } from "../components/ui";
import { formatDuree } from "../config/curriculum";
import { useApp } from "../context/AppContext";
import { formatDate, formatTime, uid } from "../lib/format";
import { showNotification } from "../lib/notifications";
import { localStore } from "../lib/storage";
import { useCountdown } from "../lib/useCountdown";
import { alpha, radius } from "../theme";

/** Quiz Épreuve IA : l'élève compose, l'IA corrige et note sur 20. */
export default function EpreuveScreen({ route, navigation }) {
  // `target` : { kind: "devoir" | "blanc", id, deadline } -> copie rendue au serveur, correction plus tard.
  const { epreuve, timed, target } = route.params;
  const { user, colors } = useApp();
  const total = target?.deadline
    ? Math.max(0, Math.round((new Date(target.deadline).getTime() - Date.now()) / 1000))
    : epreuve.duree_minutes * 60;
  const questions = epreuve.parties.flatMap((p) => p.questions);
  const [reponses, setReponses] = useState({});
  const [confirm, setConfirm] = useState(false);
  const [correcting, setCorrecting] = useState(false);
  const [result, setResult] = useState(null);
  const [done, setDone] = useState(null);
  const sent = useRef(false);
  const left = useCountdown(total, timed && !result && !done && !correcting);
  const leftRef = useRef(left);
  leftRef.current = left;

  // Quitter par erreur une épreuve en cours : on demande confirmation.
  useFocusEffect(
    useCallback(() => {
      if (result) return undefined;
      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        Alert.alert("Quitter l'épreuve ?", "Tes réponses seront perdues.", [
          { text: "Continuer", style: "cancel" },
          { text: "Quitter", style: "destructive", onPress: () => navigation.goBack() },
        ]);
        return true;
      });
      return () => sub.remove();
    }, [result, navigation]),
  );

  const submit = useCallback(
    async (auto = false) => {
      if (sent.current) return;
      sent.current = true;
      setConfirm(false);
      if (auto) toast.info("Temps écoulé : ta copie est ramassée");
      setCorrecting(true);
      if (target) {
        try {
          if (target.kind === "devoir") {
            const r = await classesApi.submit(target.id, reponses);
            setDone({ title: "Copie rendue !", message: `Ta note : ${r.score}/${r.total}. La correction détaillée sera visible après le ${formatDate(r.correction_after)}.` });
          } else {
            await examBlancApi.submit(target.id, reponses);
            setDone({ title: "Copie rendue !", message: `Ta note et la correction seront publiées à la fin de l'épreuve (${formatDate(target.deadline)}), en même temps pour tout le monde.` });
          }
        } catch (e) {
          toast.error(e.message);
          sent.current = false;
        } finally {
          setCorrecting(false);
        }
        return;
      }
      try {
        const res = await aiApi.corriger(epreuve, reponses);
        setResult(res);
        const used = total - leftRef.current;
        await localStore.addQuizResult({
          id: uid(),
          date: new Date().toISOString(),
          matiere: epreuve.matiere,
          serie: epreuve.serie ?? undefined,
          type: epreuve.exam_type,
          score: res.note,
          total: 20,
          durationSec: used,
          sa: "Quiz Épreuve IA",
        });
        if (user) quizApi.saveAttempt({ matiere: epreuve.matiere, score: Math.round(res.note), total: 20, duration_sec: used }).catch(() => {});
        // Si l'élève a quitté l'application pendant la correction, il est prévenu.
        showNotification({ title: `Copie corrigée : ${res.note}/20`, body: `${epreuve.matiere} · ${epreuve.titre}`, data: { screen: "Progression" } }).catch(() => {});
      } catch (e) {
        toast.error(e.message);
        sent.current = false;
      } finally {
        setCorrecting(false);
      }
    },
    [epreuve, reponses, total, user, target],
  );

  useEffect(() => {
    if (timed && !result && !done && !correcting && left <= 0) submit(true);
  }, [left, timed, result, done, correcting, submit]);

  useEffect(() => {
    navigation.setOptions({
      title: result ? "Correction" : done ? "Copie rendue" : epreuve.matiere,
      headerRight: () =>
        result || done ? null : timed ? (
          <Row gap={5} style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.full, backgroundColor: alpha(left <= 300 ? colors.danger : colors.primary, 0.15) }}>
            <Timer size={15} color={left <= 300 ? colors.danger : colors.primary} />
            <T weight="800" size={14} color={left <= 300 ? colors.danger : colors.primary} style={{ fontVariant: ["tabular-nums"] }}>
              {formatTime(left)}
            </T>
          </Row>
        ) : (
          <Row gap={5}>
            <Clock size={15} color={colors.mutedForeground} />
            <T size={13} muted>Sans chrono</T>
          </Row>
        ),
    });
  }, [navigation, result, done, timed, left, colors, epreuve.matiere]);

  if (correcting)
    return target ? (
      <GeneratingScreen title="Envoi de ta copie…" steps={["Envoi de tes réponses", "Enregistrement de la copie"]} />
    ) : (
      <GeneratingScreen title="Correction de ta copie…" steps={["Lecture de tes réponses", "Application du barème officiel", "Rédaction de la correction", "Calcul de ta note sur 20"]} />
    );

  if (done)
    return (
      <Screen contentStyle={{ flexGrow: 1, justifyContent: "center" }}>
        <Card glow style={{ alignItems: "center", gap: 12, paddingVertical: 28 }}>
          <CheckCircle2 size={44} color={colors.success} />
          <H2 center>{done.title}</H2>
          <T muted center>{done.message}</T>
          <Button title="Retour" onPress={() => navigation.goBack()} />
        </Card>
      </Screen>
    );

  if (result) {
    return (
      <Screen>
        <Card glow style={{ alignItems: "center", gap: 10, paddingVertical: 24 }}>
          <Trophy size={36} color={colors.accent} />
          <T size={40} weight="900">{result.note}/20</T>
          <H2 center>{result.note >= 14 ? "Très bonne copie !" : result.note >= 10 ? "Épreuve réussie !" : "Encore un effort !"}</H2>
          <T muted center size={13}>{epreuve.titre}</T>
          {result.appreciation ? (
            <View style={{ alignSelf: "stretch" }}>
              <Markdown size={14}>{result.appreciation}</Markdown>
            </View>
          ) : null}
          <Row wrap>
            <Button title="Nouvelle épreuve" icon={RotateCcw} onPress={() => navigation.goBack()} />
          </Row>
        </Card>
        <EpreuveCorrectionView epreuve={epreuve} reponses={reponses} result={result} />
      </Screen>
    );
  }

  return <EpreuveSheet {...{ epreuve, questions, reponses, setReponses, confirm, setConfirm, submit }} />;
}

/** Correction détaillée (épreuve IA, devoir, examen blanc). */
export function EpreuveCorrectionView({ epreuve, reponses = {}, result }) {
  const { colors } = useApp();
  const byId = Object.fromEntries((result?.details ?? []).map((d) => [d.id, d]));
  return (
    <>
        <Row gap={8}>
          <BookOpen size={18} color={colors.primary} />
          <H2>Correction question par question</H2>
        </Row>
        {epreuve.parties.map((p) => (
          <View key={p.titre} style={{ gap: 10 }}>
            <H3>{p.titre}</H3>
            {p.questions.map((q) => {
              const d = byId[q.id];
              const ratio = d ? d.points / d.max : 0;
              const tone = ratio >= 0.75 ? colors.success : ratio > 0 ? colors.accent : colors.danger;
              return (
                <Card key={q.id} style={{ borderLeftWidth: 4, borderLeftColor: tone }}>
                  <Row style={{ alignItems: "flex-start" }}>
                    <View style={{ flex: 1 }}>
                      <Markdown size={14}>{q.enonce}</Markdown>
                    </View>
                    <Badge label={`${d?.points ?? 0}/${q.points}`} tone={ratio >= 0.75 ? "success" : ratio > 0 ? "accent" : "danger"} />
                  </Row>
                  <T size={11.5} weight="800" muted>TA RÉPONSE</T>
                  {reponses[q.id]?.includes("### Introduction") ? <Markdown size={14}>{reponses[q.id]}</Markdown> : <T size={14}>{reponses[q.id]?.trim() || "—"}</T>}
                  {d?.commentaire ? (
                    <>
                      <T size={11.5} weight="800" muted>COMMENTAIRE DU CORRECTEUR</T>
                      <Markdown size={14}>{d.commentaire}</Markdown>
                    </>
                  ) : null}
                  {d?.correction ? (
                    <View style={{ gap: 4, padding: 10, borderRadius: radius.md, backgroundColor: alpha(colors.success, 0.1) }}>
                      <Row gap={5}>
                        <CheckCircle2 size={14} color={colors.success} />
                        <T size={11.5} weight="800" color={colors.success}>CORRECTION</T>
                      </Row>
                      <Markdown size={14}>{d.correction}</Markdown>
                    </View>
                  ) : null}
                </Card>
              );
            })}
          </View>
        ))}
    </>
  );
}

function EpreuveSheet({ epreuve, questions, reponses, setReponses, confirm, setConfirm, submit }) {
  const { colors } = useApp();
  const answered = questions.filter((q) => reponses[q.id]?.trim()).length;
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={90}>
      <Screen>
        <Card style={{ gap: 8 }}>
          <FlagBar />
          <T size={12} weight="700" muted>
            RÉPUBLIQUE DU BÉNIN · {epreuve.exam_type}
            {epreuve.serie ? ` SÉRIE ${epreuve.serie}` : ""}
          </T>
          <H1 style={{ fontSize: 22, lineHeight: 28 }}>{epreuve.titre}</H1>
          <Row gap={6} wrap>
            <FileText size={14} color={colors.mutedForeground} />
            <T size={13} muted>
              {epreuve.matiere} · {formatDuree(epreuve.duree_minutes)} · 20 points
            </T>
          </Row>
          <Badge label={`${answered}/${questions.length} réponses`} tone="info" />
          {epreuve.consignes ? <Markdown size={13.5}>{epreuve.consignes}</Markdown> : null}
        </Card>

        {epreuve.parties.map((p) => (
          <View key={p.titre} style={{ gap: 12 }}>
            <H2>{p.titre}</H2>
            {p.texte ? (
              <Card style={{ backgroundColor: colors.card2 }}>
                <Markdown size={14.5}>{p.texte}</Markdown>
              </Card>
            ) : null}
            {p.questions.map((q, k) => (
              <View key={q.id} style={{ gap: 8 }}>
                <Row style={{ alignItems: "flex-start" }}>
                  <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: alpha(colors.primary, 0.15), alignItems: "center", justifyContent: "center" }}>
                    <T size={12} weight="800" color={colors.primary}>{k + 1}</T>
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Markdown size={14.5}>{q.enonce}</Markdown>
                  </View>
                  <Badge label={`${q.points} pt${q.points > 1 ? "s" : ""}`} tone="accent" />
                </Row>
                {isDissertation({ format: q.format, enonce: q.enonce, matiere: epreuve.matiere }) ? (
                  <DissertationInput value={reponses[q.id] ?? ""} onChange={(v) => setReponses((r) => ({ ...r, [q.id]: v }))} matiere={epreuve.matiere} />
                ) : (
                  <AnswerInput
                    value={reponses[q.id] ?? ""}
                    onChange={(v) => setReponses((r) => ({ ...r, [q.id]: v }))}
                    format={q.format}
                    question={`${p.texte ?? ""} ${q.enonce}`}
                    placeholder="Rédige ta réponse (détaille tes calculs ou ton raisonnement)…"
                  />
                )}
              </View>
            ))}
          </View>
        ))}

        <Button size="lg" block icon={Send} title="Rendre ma copie" onPress={() => setConfirm(true)} />
      </Screen>

      <Sheet
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Rendre ta copie ?"
        footer={
          <>
            <Button title="Continuer" variant="ghost" onPress={() => setConfirm(false)} />
            <Button title="Envoyer" icon={Send} onPress={() => submit(false)} />
          </>
        }
      >
        <T muted>
          Tu as répondu à {answered} question(s) sur {questions.length}. EduIA va corriger ta copie et te donner ta note sur 20 avec la correction détaillée.
        </T>
      </Sheet>
    </KeyboardAvoidingView>
  );
}
