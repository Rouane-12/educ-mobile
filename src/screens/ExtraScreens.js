// Examen blanc national, planning, Pass EduIA, pages légales.
import { useFocusEffect } from "@react-navigation/native";
import { CalendarCheck, CheckCircle2, Clock, Crown, Flame, Lock, Medal, PlayCircle, Scale, Sparkles, Target, Trophy, Wand2 } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { AppState, Linking, View } from "react-native";
import { billingApi, communityApi, examBlancApi, planningApi } from "../api/endpoints";
import { ProgressBar, useCountdownTo } from "../components/espace";
import { Markdown } from "../components/Markdown";
import { Badge, Button, Card, Chip, ChipRow, EmptyState, H1, H2, H3, PageHero, Row, Screen, Segmented, Skeleton, Spinner, T, toast } from "../components/ui";
import { BAC_SERIES, formatDuree } from "../config/curriculum";
import { useApp } from "../context/AppContext";
import { formatDate } from "../lib/format";
import { alpha } from "../theme";
import { EpreuveCorrectionView } from "./EpreuveScreen";

const JOURS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const dayLabel = (d) => {
  const x = new Date(d);
  return `${JOURS[x.getDay()]} ${x.getDate()} ${MOIS[x.getMonth()]}`;
};
const hour = (d) => {
  const x = new Date(d);
  return `${String(x.getHours()).padStart(2, "0")}:${String(x.getMinutes()).padStart(2, "0")}`;
};

// ---------------------------------------------------------------- Examen blanc national
export function ExamenBlancScreen({ navigation }) {
  const { user, colors } = useApp();
  const [examType, setExamType] = useState(user?.niveau === "3ème" ? "BEPC" : "BAC");
  const [serie, setSerie] = useState(user?.serie || "D");
  const [data, setData] = useState(null);
  const [scope, setScope] = useState("national");
  const [cl, setCl] = useState(null);

  const load = useCallback(() => {
    examBlancApi.current({ exam_type: examType, serie: examType === "BAC" ? serie : undefined }).then(setData).catch(() => setData({ examen: null }));
  }, [examType, serie]);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  useEffect(() => {
    if (!data?.examen) return;
    examBlancApi.classement(data.examen.id, { scope, exam_type: examType, serie: examType === "BAC" ? serie : undefined }).then(setCl).catch(() => setCl(null));
  }, [data?.examen, scope, examType, serie]); // eslint-disable-line react-hooks/exhaustive-deps

  const days = {};
  for (const c of data?.compositions ?? []) (days[new Date(c.opens_at).toDateString()] ??= []).push(c);

  return (
    <Screen>
      <PageHero eyebrow="Examen blanc national" icon={Medal} title="Le même examen, partout au Bénin" subtitle="Tous les 2 mois, mêmes épreuves aux mêmes heures : le soir après les cours, le week-end et pendant les congés — jamais pendant les heures de classe. Puis classement national, par ville et par établissement." />
      <Segmented options={[{ value: "BAC", label: "BAC" }, { value: "BEPC", label: "BEPC" }]} value={examType} onChange={setExamType} />
      {examType === "BAC" && <ChipRow>{BAC_SERIES.map((s) => <Chip key={s.code} label={s.code} active={serie === s.code} onPress={() => setSerie(s.code)} />)}</ChipRow>}
      {data === null ? <Skeleton height={260} /> : !data.examen ? <EmptyState icon={CalendarCheck} title="Pas de session programmée" /> : (
        <>
          <Card glow>
            <H3>{data.examen.titre}</H3>
            <T muted size={13}>Du {dayLabel(data.examen.start_date)} au {dayLabel(data.examen.end_date)}</T>
          </Card>
          {Object.values(days).map((comps) => (
            <View key={comps[0].id} style={{ gap: 8 }}>
              <T weight="800" muted style={{ textTransform: "capitalize" }}>{dayLabel(comps[0].opens_at)}</T>
              {comps.map((c) => <CompositionRow key={c.id} c={c} onPress={() => navigation.navigate("Composition", { id: c.id })} colors={colors} />)}
            </View>
          ))}
          <Row gap={6}><Trophy size={18} color={colors.accent} /><H2>Classement</H2></Row>
          <Segmented options={[{ value: "national", label: "National" }, { value: "ville", label: "Ma ville" }, { value: "etablissement", label: "Mon école" }]} value={scope} onChange={setScope} />
          {!cl || cl.participants === 0 ? <T muted>Le classement apparaît dès la fin des premières épreuves{scope !== "national" ? " (indique ta ville et ton établissement dans ton profil)" : ""}.</T> : (
            <>
              {cl.moi ? <T>Ton rang : <T weight="900" color={colors.primary}>{cl.moi.rang}e</T> sur {cl.participants} ({cl.moi.moyenne}/20)</T> : null}
              {cl.top.slice(0, 30).map((x) => (
                <Card key={x.eleve_id} style={{ flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: x.eleve_id === user?.id ? alpha(colors.primary, 0.1) : colors.card }}>
                  <T weight="900" style={{ width: 30 }}>{x.rang <= 3 ? ["🥇", "🥈", "🥉"][x.rang - 1] : x.rang}</T>
                  <View style={{ flex: 1, minWidth: 0 }}><T weight="600" numberOfLines={1}>{x.display_name}</T>{x.etablissement ? <T size={12} muted numberOfLines={1}>{x.etablissement}</T> : null}</View>
                  <T weight="900">{x.moyenne}</T>
                </Card>
              ))}
            </>
          )}
        </>
      )}
    </Screen>
  );
}

function CompositionRow({ c, onPress, colors }) {
  const { label } = useCountdownTo(c.state === "a_venir" ? c.opens_at : c.closes_at);
  const Icon = c.state === "termine" ? CheckCircle2 : c.state === "ouvert" ? PlayCircle : Lock;
  return (
    <Card onPress={onPress} style={{ flexDirection: "row", alignItems: "center", gap: 10, borderColor: c.state === "ouvert" ? colors.danger : colors.border }}>
      <Icon size={20} color={c.state === "ouvert" ? colors.danger : colors.primary} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <T weight="700">{c.matiere}</T>
        <T size={12} muted>{hour(c.opens_at)} – {hour(c.closes_at)} · {formatDuree(c.duree_minutes)} · coef {c.coefficient}</T>
      </View>
      {c.state === "a_venir" && <Badge label={`dans ${label}`} tone="info" />}
      {c.state === "ouvert" && <Badge label={c.submitted ? "Rendue" : `En cours`} tone={c.submitted ? "success" : "danger"} />}
      {c.state === "termine" && <Badge label={c.note != null ? `${c.note}/20` : c.submitted ? "Correction…" : "—"} tone={c.note != null ? "success" : "info"} />}
    </Card>
  );
}

export function CompositionScreen({ route, navigation }) {
  const { id } = route.params;
  const { colors } = useApp();
  const [c, setC] = useState(null);
  const load = useCallback(() => examBlancApi.composition(id).then((x) => { setC(x); navigation.setOptions({ title: x.matiere }); })
    .catch((e) => { toast.error(e.message); navigation.goBack(); }), [id, navigation]);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  useEffect(() => {
    if (!c) return undefined;
    const soon = c.state === "a_venir" && new Date(c.opens_at) - Date.now() < 60000;
    if (!c.preparing && !soon) return undefined;
    const t = setTimeout(load, c.preparing ? 8000 : Math.max(1000, new Date(c.opens_at) - Date.now() + 500));
    return () => clearTimeout(t);
  }, [c, load]);
  const opens = useCountdownTo(c?.opens_at ?? Date.now());
  const closes = useCountdownTo(c?.closes_at ?? Date.now());

  if (!c) return <Screen><Skeleton height={220} /></Screen>;
  return (
    <Screen>
      <T muted size={13}>{c.examen.titre} · {c.exam_type}{c.serie ? ` série ${c.serie}` : ""} · {formatDuree(c.duree_minutes)} · coef {c.coefficient}</T>
      {c.state === "a_venir" && <Card style={{ alignItems: "center" }}><Lock size={32} color={colors.primary} /><H2 center>Ouverture dans {opens.label}</H2><T muted center>Le sujet sera visible le {formatDate(c.opens_at)}.</T></Card>}
      {c.state === "ouvert" && c.preparing && <Card style={{ alignItems: "center" }}><Spinner /><T center>EduIA met la dernière main au sujet…</T></Card>}
      {c.state === "ouvert" && c.epreuve && !c.submitted && (
        <Card glow style={{ alignItems: "center" }}>
          <Clock size={32} color={colors.danger} />
          <H2 center>L'épreuve est ouverte</H2>
          <T center>Fin pour tout le monde dans {closes.label}. Ta copie part automatiquement à la fin.</T>
          <Button title="Composer maintenant" size="lg" onPress={() => navigation.navigate("Epreuve", { epreuve: c.epreuve, timed: true, target: { kind: "blanc", id: c.id, deadline: c.closes_at } })} />
        </Card>
      )}
      {c.state === "ouvert" && c.submitted && <Card style={{ alignItems: "center" }}><Sparkles size={30} color={colors.success} /><H2 center>Copie rendue</H2><T muted center>Résultats dans {closes.label}.</T></Card>}
      {c.state === "termine" && (
        <>
          {c.note != null ? <Card glow style={{ alignItems: "center" }}><Medal size={34} color={colors.accent} /><H1>{c.note}/20</H1></Card>
            : <T muted>{c.submitted ? "Correction en cours : reviens dans quelques minutes." : "Tu n'as pas composé cette épreuve."}</T>}
          {c.correction && c.epreuve ? <EpreuveCorrectionView epreuve={c.epreuve} reponses={c.reponses} result={c.correction} /> : null}
        </>
      )}
    </Screen>
  );
}

// ---------------------------------------------------------------- Planning
export function PlanningScreen({ navigation }) {
  const { colors } = useApp();
  const [p, setP] = useState(null);
  useFocusEffect(useCallback(() => { planningApi.get().then(setP).catch(() => setP(false)); }, []));
  if (p === null) return <Screen><Skeleton height={260} /></Screen>;
  if (!p) return <Screen><T muted>Planning indisponible.</T></Screen>;
  const D = ["D", "L", "M", "M", "J", "V", "S"];
  return (
    <Screen>
      <Card glow style={{ alignItems: "center", gap: 2 }}>
        <T muted>{p.exam_type} dans</T>
        <T size={64} weight="900" color={colors.primary} style={{ lineHeight: 70 }}>{p.jours_restants ?? "—"}</T>
        <T>jours</T>
      </Card>
      <Card style={{ alignItems: "center" }}>
        <Flame size={34} color={p.actif_aujourdhui ? colors.secondary : colors.mutedForeground} />
        <H2>{p.serie} jour{p.serie > 1 ? "s" : ""} de suite</H2>
        <T muted center size={13}>{p.actif_aujourdhui ? "Série validée aujourd'hui 💪" : "Révise aujourd'hui pour garder ta série !"}</T>
        <Row gap={6}>
          {p.semaine.map((d) => (
            <View key={d.date} style={{ width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: d.active ? colors.primary : colors.muted }}>
              <T size={11} weight="800" color={d.active ? "#fff" : colors.mutedForeground}>{D[new Date(d.date).getDay()]}</T>
            </View>
          ))}
        </Row>
      </Card>
      <Row gap={6}><Target size={18} color={colors.primary} /><H2>Objectifs du jour</H2></Row>
      {p.objectifs.map((o, i) => (
        <Card key={i} onPress={() => navigation.navigate(o.type === "fiches" ? "Fiches" : "Tabs", o.type === "fiches" ? undefined : { screen: "QuizTab" })}>
          <T weight="600">{o.texte}</T>
        </Card>
      ))}
      <H2>Tes matières</H2>
      {p.matieres.length === 0 ? <T muted>Fais quelques quiz connectés : tes points forts et faibles apparaîtront ici.</T> : p.matieres.map((m) => (
        <View key={m.matiere} style={{ gap: 4 }}>
          <T size={13}>{m.matiere} · {m.moyenne} % ({m.quiz} quiz)</T>
          <ProgressBar value={m.moyenne} tone={m.moyenne < 50 ? colors.danger : m.moyenne < 70 ? colors.accent : colors.success} />
        </View>
      ))}
    </Screen>
  );
}

// ---------------------------------------------------------------- Pass EduIA
export function PassScreen() {
  const { colors } = useApp();
  const [st, setSt] = useState(null);
  const [paying, setPaying] = useState(null);
  const load = useCallback(() => billingApi.status().then(setSt).catch(() => setSt(false)), []);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  // Retour dans l'application après le paiement (page Kkiapay ouverte dans le navigateur) : on revérifie.
  useEffect(() => {
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active" && paying) {
        load();
        setPaying(null);
      }
    });
    return () => sub.remove();
  }, [paying, load]);

  if (st === null) return <Screen><Skeleton height={260} /></Screen>;
  if (!st) return <Screen><EmptyState icon={Crown} title="Pass indisponible">Vérifie ta connexion.</EmptyState></Screen>;
  return (
    <Screen>
      <PageHero eyebrow="Pass EduIA" icon={Crown} title="EduIA sans limite" subtitle="Sujets, quiz des profs, classes, fiches, défis et examen blanc restent gratuits. Le Pass débloque l'IA en illimité, sans abonnement." />
      {st.pass.active ? (
        <Card glow><Row gap={6}><Crown size={18} color={colors.success} /><T weight="700" color={colors.success}>Pass actif jusqu'au {formatDate(st.pass.expires_at)}</T></Row></Card>
      ) : (
        <Card>
          <T>Questions gratuites aujourd'hui : <T weight="800">{st.free.chat.left}/{st.free.chat.limit}</T></T>
          <Row gap={6}><Wand2 size={14} color={colors.primary} /><T>Générations gratuites : <T weight="800">{st.free.generation.left}/{st.free.generation.limit}</T></T></Row>
          <T size={12} muted>Remise à zéro chaque nuit à minuit.</T>
        </Card>
      )}
      {st.plans.map((plan) => (
        <Card key={plan.key} glow={plan.key === "semaine"} style={{ alignItems: "center" }}>
          {plan.key === "semaine" ? <Badge label="Populaire" tone="primary" /> : plan.key === "mois" ? <Badge label="Meilleur prix" tone="accent" /> : null}
          <H3>{plan.label}</H3>
          <T size={30} weight="900" color={colors.primary}>{plan.price} F</T>
          {plan.key !== "jour" ? <T size={12} muted>soit {Math.round(plan.price / (plan.hours / 24))} F / jour</T> : null}
          <Button title="Payer par Mobile Money" block loading={paying === plan.key} disabled={!st.payments_enabled || !!paying} onPress={async () => {
            try {
              const p = await billingApi.checkout(plan.key);
              setPaying(plan.key);
              await Linking.openURL(p.pay_url);
            } catch (e) {
              setPaying(null);
              toast.error(e.message);
            }
          }} />
        </Card>
      ))}
      <T size={12} muted center>Le paiement s'ouvre dans ton navigateur (Kkiapay : MTN, Moov, Celtiis, carte). Reviens ensuite dans l'application : ton Pass s'active tout seul.</T>
    </Screen>
  );
}

// ---------------------------------------------------------------- Pages légales
export const LEGAL = [
  ["conditions-utilisation", "Conditions d'utilisation"],
  ["confidentialite", "Confidentialité"],
  ["conditions-vente", "Conditions de vente"],
  ["regles-communaute", "Règles de la communauté"],
  ["mentions-legales", "Mentions légales"],
];

export function LegalScreen({ route, navigation }) {
  const [slug, setSlug] = useState(route.params?.slug ?? "conditions-utilisation");
  const [page, setPage] = useState(undefined);
  useEffect(() => {
    setPage(undefined);
    communityApi.legal(slug).then((p) => { setPage(p); navigation.setOptions({ title: p.title }); }).catch(() => setPage(null));
  }, [slug, navigation]);
  return (
    <Screen>
      <ChipRow>{LEGAL.map(([s, l]) => <Chip key={s} label={l} active={slug === s} onPress={() => setSlug(s)} />)}</ChipRow>
      {page === undefined ? <Skeleton height={300} /> : !page ? <EmptyState icon={Scale} title="Page indisponible" /> : <Card><Markdown size={14}>{page.body}</Markdown></Card>}
    </Screen>
  );
}
