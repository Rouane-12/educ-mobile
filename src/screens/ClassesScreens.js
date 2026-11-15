// Classes des profs, devoirs, profil public du prof et gains (programme Profs partenaires).
import Clipboard from "@react-native-clipboard/clipboard";
import { useFocusEffect } from "@react-navigation/native";
import { Award, CalendarClock, CheckCircle2, ChevronRight, ClipboardList, Coins, Copy, HandCoins, Lock, LogIn, LogOut, Plus, School, Share2, Star, Trash2, UserMinus, Users, XCircle } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { Alert, Linking, Pressable, Share, View } from "react-native";
import { aiApi, classesApi, quizApi } from "../api/endpoints";
import { AnswerInput } from "../components/AnswerInput";
import { ProgressBar, ReportButton, Stars, useCountdownTo } from "../components/espace";
import { Markdown } from "../components/Markdown";
import { Badge, Button, Card, Chip, ChipRow, EmptyState, Field, H1, H2, H3, Input, PageHero, Row, Screen, Segmented, Sheet, Skeleton, T, toast } from "../components/ui";
import { BAC_SERIES, MATIERES_BEPC, epreuveInfo, matieresFor } from "../config/curriculum";
import { WEB_URL } from "../config/env";
import { useApp } from "../context/AppContext";
import { formatDate } from "../lib/format";
import { alpha, radius } from "../theme";
import { EpreuveCorrectionView } from "./EpreuveScreen";

// ---------------------------------------------------------------- Liste des classes
export function ClassesScreen({ navigation, route }) {
  const { isProf, colors } = useApp();
  const [list, setList] = useState(null);
  const [code, setCode] = useState(route.params?.code ?? "");
  const [joining, setJoining] = useState(false);
  const [creating, setCreating] = useState(false);

  useFocusEffect(
    useCallback(() => {
      classesApi.list().then(setList).catch(() => setList((l) => l ?? []));
    }, []),
  );

  const join = async () => {
    setJoining(true);
    try {
      const c = await classesApi.join(code.trim());
      toast.success(`Bienvenue dans ${c.nom} !`);
      navigation.navigate("Classe", { id: c.id });
    } catch (e) {
      toast.error(e.message);
    } finally {
      setJoining(false);
    }
  };

  return (
    <Screen>
      <PageHero eyebrow="Classes" icon={School} title={isProf ? "Tes classes" : "Ta classe en ligne"}
        subtitle={isProf ? "Crée une classe, partage son code, donne des devoirs et suis les résultats." : "Rejoins la classe de ton professeur avec son code."} />
      {isProf ? (
        <Button title="Nouvelle classe" icon={Plus} onPress={() => setCreating(true)} />
      ) : (
        <Card>
          <Field label="Code de la classe">
            <Input icon={LogIn} value={code} onChangeText={(v) => setCode(v.toUpperCase())} placeholder="Ex. K7P2QX" autoCapitalize="characters" maxLength={6} />
          </Field>
          <Button title="Rejoindre" loading={joining} disabled={code.trim().length !== 6} onPress={join} />
        </Card>
      )}
      {list === null ? (
        [0, 1].map((i) => <Skeleton key={i} height={96} />)
      ) : list.length === 0 ? (
        <EmptyState icon={Users} title={isProf ? "Pas encore de classe" : "Aucune classe rejointe"}>
          {isProf ? "Crée ta première classe." : "Demande le code à ton professeur."}
        </EmptyState>
      ) : (
        list.map((c) => (
          <Card key={c.id} onPress={() => navigation.navigate("Classe", { id: c.id })} style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View style={{ width: 42, height: 42, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: alpha(colors.primary, 0.14) }}>
              <School size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
              <H3 numberOfLines={2}>{c.nom}</H3>
              <T size={12.5} muted>{c.matiere} · {c.niveau}{c.serie ? ` ${c.serie}` : ""}{isProf ? "" : ` · ${c.prof.display_name}`}</T>
              <Row gap={6} wrap>
                <Badge label={`${c.members_count} élève${c.members_count > 1 ? "s" : ""}`} />
                {c.code ? <Badge label={`Code ${c.code}`} tone="accent" /> : null}
              </Row>
            </View>
            <ChevronRight size={18} color={colors.mutedForeground} />
          </Card>
        ))
      )}
      {isProf && <CreateClasse open={creating} onClose={() => setCreating(false)} onCreated={(c) => { setCreating(false); navigation.navigate("Classe", { id: c.id }); }} />}
    </Screen>
  );
}

function CreateClasse({ open, onClose, onCreated }) {
  const { user } = useApp();
  const [f, setF] = useState({ nom: "", niveau: "BAC", serie: "D", matiere: "", etablissement: user?.etablissement ?? "" });
  const [saving, setSaving] = useState(false);
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }));
  const matieres = f.niveau === "BAC" ? matieresFor("BAC", f.serie) : MATIERES_BEPC;
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Nouvelle classe"
      footer={<Button title="Créer" icon={Plus} loading={saving} disabled={!f.nom.trim() || !f.matiere} onPress={async () => {
        setSaving(true);
        try {
          onCreated(await classesApi.create(f));
        } catch (e) {
          toast.error(e.message);
        } finally {
          setSaving(false);
        }
      }} />}
    >
      <Field label="Nom"><Input value={f.nom} onChangeText={set("nom")} placeholder="Ex. Tle D1 — SVT" /></Field>
      <Segmented options={[{ value: "BAC", label: "BAC" }, { value: "BEPC", label: "BEPC" }]} value={f.niveau} onChange={set("niveau")} />
      {f.niveau === "BAC" && (
        <ChipRow>{BAC_SERIES.map((s) => <Chip key={s.code} label={s.code} active={f.serie === s.code} onPress={() => set("serie")(s.code)} />)}</ChipRow>
      )}
      <ChipRow>{matieres.map((m) => <Chip key={m} label={m} active={f.matiere === m} onPress={() => set("matiere")(m)} />)}</ChipRow>
      <Field label="Établissement (facultatif)"><Input value={f.etablissement} onChangeText={set("etablissement")} /></Field>
    </Sheet>
  );
}

// ---------------------------------------------------------------- Une classe
export function ClasseScreen({ route, navigation }) {
  const { id } = route.params;
  const { colors } = useApp();
  const [c, setC] = useState(null);
  const [newDevoir, setNewDevoir] = useState(false);

  const load = useCallback(() => classesApi.get(id).then((x) => { setC(x); navigation.setOptions({ title: x.nom }); })
    .catch((e) => { toast.error(e.message); navigation.goBack(); }), [id, navigation]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (!c) return <Screen><Skeleton height={220} /></Screen>;
  const owner = c.is_owner;
  const invite = `Rejoins ma classe « ${c.nom} » sur EduBénin : code ${c.code}\n${WEB_URL}/classes?code=${c.code}`;

  return (
    <Screen>
      <T muted size={13.5}>
        {c.matiere} · {c.niveau}{c.serie ? ` série ${c.serie}` : ""}{c.etablissement ? ` · ${c.etablissement}` : ""}
      </T>
      <Pressable onPress={() => navigation.navigate("ProfProfil", { id: c.prof.id })}>
        <T size={14} color={colors.primary} weight="700">Prof : {c.prof.display_name} ›</T>
      </Pressable>

      {owner && (
        <Card glow style={{ alignItems: "center" }}>
          <T muted size={13}>Code de la classe</T>
          <T size={30} weight="900" color={colors.primary} style={{ letterSpacing: 6 }}>{c.code}</T>
          <Row wrap style={{ justifyContent: "center" }}>
            <Button title="Copier" size="sm" variant="secondary" icon={Copy} onPress={() => { Clipboard.setString(c.code); toast.success("Code copié"); }} />
            <Button title="Partager" size="sm" variant="secondary" icon={Share2} onPress={() => Share.share({ message: invite })} />
          </Row>
        </Card>
      )}

      <Row style={{ justifyContent: "space-between" }} wrap>
        <H2>Devoirs</H2>
        {owner && <Button title="Nouveau devoir" size="sm" icon={Plus} onPress={() => setNewDevoir(true)} />}
      </Row>
      {c.devoirs.length === 0 ? (
        <EmptyState icon={ClipboardList} title="Aucun devoir pour l'instant" />
      ) : (
        c.devoirs.map((d) => (
          <Card key={d.id} onPress={() => navigation.navigate("Devoir", { id: d.id })} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
              <H3 numberOfLines={2}>{d.titre}</H3>
              <Row gap={5}>
                <CalendarClock size={13} color={colors.mutedForeground} />
                <T size={12.5} muted>{d.closed ? "Terminé le" : "Avant le"} {formatDate(d.due_at)}</T>
              </Row>
            </View>
            {owner ? <Badge label={`${d.submissions} copie(s)`} /> : d.submitted ? <Badge label={`Rendu${d.score != null ? ` ${d.score}/${d.total}` : ""}`} tone="success" />
              : d.closed ? <Badge label="Non rendu" tone="danger" /> : <Badge label="À faire" tone="accent" />}
          </Card>
        ))
      )}

      {owner ? (
        <>
          <H2>Élèves ({c.members.length})</H2>
          {c.members.map((m) => (
            <Card key={m.id} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <T style={{ flex: 1 }} weight="600">{m.display_name}</T>
              <Button title="Retirer" size="sm" variant="ghost" icon={UserMinus} onPress={() => Alert.alert("Retirer cet élève ?", m.display_name, [
                { text: "Annuler", style: "cancel" },
                { text: "Retirer", style: "destructive", onPress: () => classesApi.removeMember(c.id, m.id).then(load) },
              ])} />
            </Card>
          ))}
          <Button title="Archiver la classe" variant="ghost" icon={Trash2} onPress={() => Alert.alert("Archiver la classe ?", "Les élèves ne pourront plus la rejoindre.", [
            { text: "Annuler", style: "cancel" },
            { text: "Archiver", style: "destructive", onPress: () => classesApi.leaveOrArchive(c.id).then(() => navigation.goBack()) },
          ])} />
          <NewDevoir classe={c} open={newDevoir} onClose={() => setNewDevoir(false)} onCreated={() => { setNewDevoir(false); load(); }} />
        </>
      ) : (
        <>
          <RateProf classe={c} onRated={load} />
          <Button title="Quitter la classe" variant="ghost" icon={LogOut} onPress={() => Alert.alert("Quitter cette classe ?", "", [
            { text: "Annuler", style: "cancel" },
            { text: "Quitter", style: "destructive", onPress: () => classesApi.leaveOrArchive(c.id).then(() => navigation.goBack()) },
          ])} />
        </>
      )}
    </Screen>
  );
}

function RateProf({ classe, onRated }) {
  const [v, setV] = useState(classe.my_rating ?? { clarte: 0, disponibilite: 0, qualite: 0, commentaire: "" });
  const [saving, setSaving] = useState(false);
  return (
    <Card>
      <Row gap={6}><Star size={18} color="#ffc531" /><H3>Noter {classe.prof.display_name}</H3></Row>
      {!classe.can_rate ? (
        <T muted size={13.5}>{classe.rate_reason}</T>
      ) : (
        <>
          {[["clarte", "Clarté"], ["disponibilite", "Disponibilité"], ["qualite", "Qualité des devoirs"]].map(([k, l]) => (
            <Row key={k} style={{ justifyContent: "space-between" }} wrap>
              <T>{l}</T>
              <Stars value={v[k]} size={24} onChange={(n) => setV((s) => ({ ...s, [k]: n }))} />
            </Row>
          ))}
          <Input value={v.commentaire} onChangeText={(t) => setV((s) => ({ ...s, commentaire: t }))} placeholder="Un mot pour ton prof (facultatif)" maxLength={500} />
          <Button title={classe.my_rating ? "Modifier ma note" : "Envoyer ma note"} loading={saving} disabled={!(v.clarte && v.disponibilite && v.qualite)} onPress={async () => {
            setSaving(true);
            try {
              await classesApi.rate(classe.id, v);
              toast.success("Merci pour ta note !");
              onRated();
            } catch (e) {
              toast.error(e.message);
            } finally {
              setSaving(false);
            }
          }} />
        </>
      )}
    </Card>
  );
}

function NewDevoir({ classe, open, onClose, onCreated }) {
  const [kind, setKind] = useState("quiz");
  const [titre, setTitre] = useState("");
  const [days, setDays] = useState(3);
  const [quizzes, setQuizzes] = useState(null);
  const [quizId, setQuizId] = useState("");
  const [epreuve, setEpreuve] = useState(null);
  const [busy, setBusy] = useState(null);

  useEffect(() => {
    if (open && quizzes === null) quizApi.list({ mine: 1 }).then(setQuizzes).catch(() => setQuizzes([]));
  }, [open, quizzes]);

  const due = () => {
    const d = new Date(Date.now() + days * 86400000);
    d.setHours(20, 0, 0, 0);
    return d.toISOString();
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Nouveau devoir"
      footer={<Button title="Donner le devoir" icon={Plus} loading={busy === "save"} disabled={!titre.trim() || (kind === "quiz" ? !quizId : !epreuve)} onPress={async () => {
        setBusy("save");
        try {
          await classesApi.createDevoir(classe.id, { titre, kind, due_at: due(), ...(kind === "quiz" ? { quiz_id: quizId } : { epreuve }) });
          toast.success("Devoir donné : tes élèves sont prévenus.");
          onCreated();
        } catch (e) {
          toast.error(e.message);
        } finally {
          setBusy(null);
        }
      }} />}
    >
      <Segmented options={[{ value: "quiz", label: "Un de mes quiz" }, { value: "epreuve", label: "Épreuve EduIA" }]} value={kind} onChange={setKind} />
      {kind === "quiz" ? (
        <ChipRow>
          {(quizzes ?? []).map((q) => <Chip key={q.id} label={q.titre} active={quizId === q.id} onPress={() => { setQuizId(q.id); if (!titre) setTitre(q.titre); }} />)}
          {quizzes?.length === 0 ? <T muted size={13}>Crée d'abord un quiz dans « Mes quiz ».</T> : null}
        </ChipRow>
      ) : (
        <View style={{ gap: 6 }}>
          <Button title={epreuve ? "Rédiger une autre épreuve" : "Rédiger l'épreuve avec EduIA"} variant="secondary" loading={busy === "ai"} onPress={async () => {
            setBusy("ai");
            try {
              const info = epreuveInfo(classe.niveau, classe.serie, classe.matiere);
              const ep = await aiApi.epreuve({ exam_type: classe.niveau, serie: classe.serie ?? "", matiere: classe.matiere, duree: info?.duree ?? 120, coefficient: info?.coefficient ?? null });
              setEpreuve(ep);
              if (!titre) setTitre(ep.titre);
            } catch (e) {
              if (e.status !== 402) toast.error(e.message);
            } finally {
              setBusy(null);
            }
          }} />
          {epreuve ? <T size={13}>{epreuve.titre} · {epreuve.parties.length} parties · /20</T> : null}
        </View>
      )}
      <Field label="Titre"><Input value={titre} onChangeText={setTitre} /></Field>
      <Field label="À rendre dans" hint="La correction n'est visible qu'après la date limite.">
        <ChipRow>{[1, 2, 3, 7, 14].map((n) => <Chip key={n} label={`${n} j`} active={days === n} onPress={() => setDays(n)} />)}</ChipRow>
      </Field>
    </Sheet>
  );
}

// ---------------------------------------------------------------- Un devoir
export function DevoirScreen({ route, navigation }) {
  const { id } = route.params;
  const { colors } = useApp();
  const [d, setD] = useState(null);
  const load = useCallback(() => classesApi.devoir(id).then((x) => { setD(x); navigation.setOptions({ title: x.titre }); })
    .catch((e) => { toast.error(e.message); navigation.goBack(); }), [id, navigation]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (!d) return <Screen><Skeleton height={220} /></Screen>;
  if (d.submissions !== undefined) return <DevoirResults devoir={d} navigation={navigation} />;

  return (
    <Screen>
      <Row gap={5}>
        <CalendarClock size={14} color={colors.mutedForeground} />
        <T muted size={13.5}>{d.closed ? "Terminé le" : "À rendre avant le"} {formatDate(d.due_at)}</T>
      </Row>
      {d.consigne ? <T>{d.consigne}</T> : null}
      {d.submitted ? <Badge label={`Rendu · ${d.score}/${d.total}`} tone="success" /> : null}

      {!d.submitted && !d.closed && d.kind === "quiz" && <DevoirQuiz devoir={d} onDone={load} />}
      {!d.submitted && !d.closed && d.kind === "epreuve" && (
        <Card style={{ alignItems: "center" }}>
          <T center>Épreuve de {d.epreuve.matiere} · notée sur 20. Le chrono s'arrête à la date limite.</T>
          <Button title="Commencer l'épreuve" onPress={() => navigation.navigate("Epreuve", { epreuve: d.epreuve, timed: true, target: { kind: "devoir", id: d.id, deadline: d.due_at } })} />
        </Card>
      )}
      {!d.submitted && d.closed && <T muted>Ce devoir est terminé : tu ne l'as pas rendu.</T>}
      {d.submitted && !d.correction && (
        <Card style={{ alignItems: "center" }}>
          <Lock size={30} color={colors.primary} />
          <T center>Correction disponible après la date limite ({formatDate(d.correction_after)}). Elle reste cachée jusque-là pour que chacun travaille par lui-même.</T>
        </Card>
      )}
      {d.correction && d.kind === "quiz" && d.questions.map((q, i) => {
        const c = (d.correction.details ?? []).find((x) => x.id === q.id);
        return (
          <Card key={q.id} style={{ borderLeftWidth: 4, borderLeftColor: c?.ok ? colors.success : colors.danger }}>
            <Row style={{ alignItems: "flex-start" }}>
              {c?.ok ? <CheckCircle2 size={18} color={colors.success} /> : <XCircle size={18} color={colors.danger} />}
              <View style={{ flex: 1 }}><Markdown size={14}>{`${i + 1}. ${q.question}`}</Markdown></View>
            </Row>
            <T size={13.5}>Ta réponse : {d.my_answers?.[q.id] || "—"}</T>
            <T size={13.5} weight="700" color={colors.success}>Bonne réponse : {q.answer}</T>
            {q.explanation ? <Markdown size={13.5}>{q.explanation}</Markdown> : null}
          </Card>
        );
      })}
      {d.correction && d.kind === "epreuve" && <EpreuveCorrectionView epreuve={d.epreuve} reponses={d.my_answers} result={d.correction} />}
    </Screen>
  );
}

function DevoirQuiz({ devoir, onDone }) {
  const { colors } = useApp();
  const [answers, setAnswers] = useState({});
  const [sending, setSending] = useState(false);
  const { label } = useCountdownTo(devoir.due_at);
  return (
    <View style={{ gap: 12 }}>
      <T muted size={13}>Temps restant : {label} · une seule copie.</T>
      {devoir.questions.map((q, i) => (
        <Card key={q.id}>
          <Markdown size={15}>{`**${i + 1}.** ${q.question}`}</Markdown>
          {q.kind === "QCM" && q.options?.length ? (
            q.options.filter(Boolean).map((o) => (
              <Pressable key={o} onPress={() => setAnswers((a) => ({ ...a, [q.id]: o }))}
                style={{ padding: 12, borderRadius: radius.md, borderWidth: 1.5, borderColor: answers[q.id] === o ? colors.primary : colors.border, backgroundColor: answers[q.id] === o ? alpha(colors.primary, 0.12) : colors.surface }}>
                <T>{o}</T>
              </Pressable>
            ))
          ) : (
            <AnswerInput value={answers[q.id] ?? ""} onChange={(v) => setAnswers((a) => ({ ...a, [q.id]: v }))} question={q.question} minHeight={60} />
          )}
        </Card>
      ))}
      <Button title="Rendre ma copie" size="lg" block loading={sending} onPress={() => {
        const missing = devoir.questions.filter((q) => !String(answers[q.id] ?? "").trim()).length;
        const go = async () => {
          setSending(true);
          try {
            const r = await classesApi.submit(devoir.id, answers);
            toast.success(`Copie rendue : ${r.score}/${r.total}`);
            onDone();
          } catch (e) {
            toast.error(e.message);
          } finally {
            setSending(false);
          }
        };
        if (missing) Alert.alert("Rendre quand même ?", `${missing} question(s) sans réponse.`, [{ text: "Continuer", style: "cancel" }, { text: "Rendre", onPress: go }]);
        else go();
      }} />
    </View>
  );
}

function DevoirResults({ devoir, navigation }) {
  const [r, setR] = useState(null);
  useEffect(() => {
    classesApi.results(devoir.id).then(setR).catch((e) => toast.error(e.message));
  }, [devoir.id]);
  return (
    <Screen>
      <T muted size={13.5}>{devoir.closed ? "Terminé le" : "À rendre avant le"} {formatDate(devoir.due_at)}</T>
      {!r ? <Skeleton height={160} /> : (
        <>
          <Row wrap>
            <Badge label={`${r.rows.filter((x) => x.submitted).length}/${r.rows.length} copies`} />
            <Badge label={`Moyenne ${r.moyenne_sur_20 ?? "—"}/20`} tone="accent" />
          </Row>
          <Button title="Partager sur WhatsApp" icon={Share2} onPress={() => Linking.openURL(`whatsapp://send?text=${encodeURIComponent(r.share_text)}`).catch(() => Share.share({ message: r.share_text }))} />
          {r.rows.map((x) => (
            <Card key={x.eleve.id} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <T style={{ flex: 1 }} weight="600">{x.eleve.display_name}</T>
              {x.submitted ? <T weight="800">{x.score}/{x.total}</T> : <T muted size={13}>non rendu</T>}
            </Card>
          ))}
        </>
      )}
      <Button title="Supprimer le devoir" variant="ghost" icon={Trash2} onPress={() => Alert.alert("Supprimer ce devoir ?", "Les copies seront supprimées.", [
        { text: "Annuler", style: "cancel" },
        { text: "Supprimer", style: "destructive", onPress: () => classesApi.deleteDevoir(devoir.id).then(() => navigation.goBack()) },
      ])} />
    </Screen>
  );
}

// ---------------------------------------------------------------- Profil public d'un prof
function Stat({ v, l }) {
  return (
    <Card style={{ flexBasis: "30%", flexGrow: 1, alignItems: "center", gap: 2 }}>
      <T size={22} weight="900">{v}</T><T size={11.5} muted center>{l}</T>
    </Card>
  );
}

export function ProfProfilScreen({ route }) {
  const { id } = route.params;
  const { colors } = useApp();
  const [p, setP] = useState(undefined);
  useEffect(() => {
    classesApi.prof(id).then(setP).catch(() => setP(null));
  }, [id]);
  if (p === undefined) return <Screen><Skeleton height={220} /></Screen>;
  if (!p) return <Screen><EmptyState icon={Users} title="Professeur introuvable" /></Screen>;
  return (
    <Screen>
      <H1>{p.display_name}</H1>
      <T muted>{p.matieres.length ? p.matieres.join(" · ") : "Professeur"}{p.etablissement ? ` · ${p.etablissement}` : ""}{p.ville ? ` · ${p.ville}` : ""}</T>
      <Row wrap>
        <Stars value={p.note ?? 0} />
        <T weight="800">{p.note ?? "—"}</T>
        <T muted size={13}>({p.notes} notes)</T>
        {p.niveau ? <Badge label={`Prof ${p.niveau.label}`} tone="accent" /> : null}
      </Row>
      {p.bio ? <T>{p.bio}</T> : null}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
        <Stat v={p.eleves} l="élèves" /><Stat v={p.classes} l="classes" /><Stat v={p.quiz} l="quiz" />
        <Stat v={p.fiches} l="fiches" /><Stat v={p.reponses} l="réponses" />
      </View>
      {p.avis.map((a, i) => (
        <Card key={i} style={{ borderLeftWidth: 3, borderLeftColor: colors.primary }}>
          <T style={{ fontStyle: "italic" }}>« {a.commentaire} »</T>
          <T size={12} muted>— un élève, {formatDate(a.date, false)}</T>
        </Card>
      ))}
      <ReportButton type="user" id={p.id} label="Signaler ce profil" />
    </Screen>
  );
}

// ---------------------------------------------------------------- Gains du prof
export function GainsScreen() {
  const { colors } = useApp();
  const [g, setG] = useState(null);
  const [phone, setPhone] = useState("");
  useEffect(() => {
    classesApi.gains().then((r) => { setG(r); setPhone(r.telephone_paiement ?? ""); }).catch((e) => toast.error(e.message));
  }, []);
  if (!g) return <Screen><Skeleton height={260} /></Screen>;
  const m = g.mois;
  const target = m.prochain ? g.niveaux.find((l) => l.key === m.prochain.key) : null;
  return (
    <Screen>
      <PageHero eyebrow="Profs partenaires" icon={HandCoins} title="Tes gains"
        subtitle={`Prime mensuelle selon ton niveau, plus ${Math.round(g.commission * 100)} % des Pass achetés par les élèves de tes classes.`} />
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
        <Card style={{ flexBasis: "47%", flexGrow: 1 }}><Coins size={18} color={colors.primary} /><T size={22} weight="900">{g.a_verser} F</T><T size={12} muted>à recevoir</T></Card>
        <Card style={{ flexBasis: "47%", flexGrow: 1 }}><HandCoins size={18} color={colors.success} /><T size={22} weight="900">{g.verse} F</T><T size={12} muted>déjà versés</T></Card>
      </View>
      <Card>
        <Row gap={6}><Award size={18} color={colors.accent} /><H3>Ce mois-ci</H3></Row>
        <T>{m.niveau ? `Niveau ${m.niveau.label} : prime de ${m.niveau.prime} F.` : "Pas encore de niveau ce mois-ci."}</T>
        <T size={13} muted>{m.eleves_actifs} élèves actifs · note {m.note ?? "—"} ({m.notes} notes)</T>
        {target ? (
          <View style={{ gap: 6 }}>
            <T weight="700">Prochain : {target.label} ({target.prime} F / mois)</T>
            <T size={12.5} muted>Élèves actifs {m.eleves_actifs}/{target.eleves}</T>
            <ProgressBar value={m.eleves_actifs} max={target.eleves} />
            <T size={12.5} muted>Notes {m.notes}/{target.notes} · note minimale {target.note}</T>
            <ProgressBar value={m.notes} max={target.notes} tone={colors.accent} />
          </View>
        ) : null}
        {g.niveaux.map((l) => <T key={l.key} size={12.5} muted>{l.label} : {l.eleves} élèves actifs, note ≥ {l.note}, {l.notes} notes → {l.prime} F/mois</T>)}
      </Card>
      <Card>
        <H3>Numéro Mobile Money</H3>
        <Input value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+229 01 00 00 00 00" />
        <Button title="Enregistrer" size="sm" onPress={async () => {
          try {
            setG(await classesApi.setPhone(phone));
            toast.success("Numéro enregistré");
          } catch (e) {
            toast.error(e.message);
          }
        }} />
      </Card>
      <H2>Historique</H2>
      {g.historique.length === 0 ? <T muted>Tes primes et commissions apparaîtront ici.</T> : g.historique.map((e) => (
        <Card key={e.id} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <T size={13.5}>{e.label}</T>
            <Badge label={e.status === "paid" ? "Versé" : "À verser"} tone={e.status === "paid" ? "success" : "accent"} />
          </View>
          <T weight="900">{e.amount} F</T>
        </Card>
      ))}
    </Screen>
  );
}

