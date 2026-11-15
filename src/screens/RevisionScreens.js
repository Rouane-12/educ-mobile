// Réviser : fiches des profs (texte + vocal + cartes), révision espacée, questions aux profs.
import { pick, types } from "@react-native-documents/picker";
import { useFocusEffect } from "@react-navigation/native";
import { BookOpen, Check, Headphones, ImagePlus, Layers, MessageCircleQuestion, Mic, PartyPopper, Play, Plus, RotateCw, Search, Send, Sparkles, ThumbsUp, Trash2, X } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { Alert, Linking, Pressable, View } from "react-native";
import { launchImageLibrary } from "react-native-image-picker";
import { apiUrl } from "../api/client";
import { revisionApi } from "../api/endpoints";
import { ReportButton, SpaceTabs } from "../components/espace";
import { Markdown } from "../components/Markdown";
import { Badge, Button, Card, Chip, ChipRow, EmptyState, Field, H2, H3, Input, PageHero, Row, Screen, Segmented, Sheet, Skeleton, T, toast } from "../components/ui";
import { ALL_BAC_MATIERES, BAC_SERIES, MATIERES_BEPC, matieresFor } from "../config/curriculum";
import { useApp } from "../context/AppContext";
import { formatDate } from "../lib/format";
import { alpha, radius } from "../theme";

export const REVISION_TABS = [
  { key: "Fiches", label: "Fiches & cartes", icon: Layers },
  { key: "Questions", label: "Questions aux profs", icon: MessageCircleQuestion },
  { key: "Audios", label: "Audios", icon: Headphones },
];

const playAudio = (url) => Linking.openURL(apiUrl(url)).catch(() => toast.error("Impossible de lire l'audio"));

// ---------------------------------------------------------------- Liste des fiches
export function FichesScreen({ navigation }) {
  const { isProf } = useApp();
  const [niveau, setNiveau] = useState("");
  const [matiere, setMatiere] = useState("");
  const [q, setQ] = useState("");
  const [list, setList] = useState(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(() => {
    revisionApi.fiches({ niveau, matiere, q: q.trim() }).then(setList).catch(() => setList((l) => l ?? []));
  }, [niveau, matiere, q]);
  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const matieres = niveau === "BEPC" ? MATIERES_BEPC : ALL_BAC_MATIERES;
  return (
    <Screen>
      <PageHero eyebrow="Réviser" icon={Layers} title="Fiches et cartes" subtitle="Résumés de cours des profs, explications en vocal et cartes à retourner pour tout mémoriser." />
      <SpaceTabs items={REVISION_TABS} current="Fiches" onPress={(it) => it.key !== "Fiches" && navigation.navigate(it.key)} />
      <Segmented options={[{ value: "", label: "Tout" }, { value: "BAC", label: "BAC" }, { value: "BEPC", label: "BEPC" }]} value={niveau} onChange={(v) => { setNiveau(v); setMatiere(""); }} />
      <ChipRow>
        <Chip label="Toutes" active={!matiere} onPress={() => setMatiere("")} />
        {matieres.map((m) => <Chip key={m} label={m} active={matiere === m} onPress={() => setMatiere(m)} />)}
      </ChipRow>
      <Input icon={Search} value={q} onChangeText={setQ} placeholder="Chapitre, notion…" />
      {isProf && <Button title="Nouvelle fiche" icon={Plus} onPress={() => setCreating(true)} />}
      {list === null ? (
        [0, 1].map((i) => <Skeleton key={i} height={96} />)
      ) : list.length === 0 ? (
        <EmptyState icon={BookOpen} title="Aucune fiche pour ces critères" />
      ) : (
        list.map((f) => (
          <Card key={f.id} onPress={() => navigation.navigate("Fiche", { id: f.id })}>
            <H3 numberOfLines={2}>{f.titre}</H3>
            <T size={12.5} muted>{f.matiere} · {f.niveau}{f.serie ? ` ${f.serie}` : ""}{f.chapitre ? ` · ${f.chapitre}` : ""}</T>
            <Row gap={6} wrap>
              {f.cards_count ? <Badge label={`${f.cards_count} cartes`} /> : null}
              {f.has_audio ? <Badge label="Vocal" tone="accent" /> : null}
              <T size={12} muted>{f.author.display_name}</T>
            </Row>
          </Card>
        ))
      )}
      {isProf && <CreateFiche open={creating} onClose={() => setCreating(false)} onCreated={(f) => { setCreating(false); navigation.navigate("Fiche", { id: f.id }); }} />}
    </Screen>
  );
}

function CreateFiche({ open, onClose, onCreated }) {
  const [f, setF] = useState({ titre: "", niveau: "BAC", serie: "", matiere: "", chapitre: "", contenu: "" });
  const [audio, setAudio] = useState(null);
  const [cards, setCards] = useState([]);
  const [busy, setBusy] = useState(null);
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }));
  const matieres = f.niveau === "BAC" ? (f.serie ? matieresFor("BAC", f.serie) : ALL_BAC_MATIERES) : MATIERES_BEPC;

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Nouvelle fiche"
      footer={<Button title="Publier" icon={Plus} loading={busy === "save"} disabled={!f.titre.trim() || !f.matiere} onPress={async () => {
        setBusy("save");
        const fd = new FormData();
        Object.entries(f).forEach(([k, v]) => fd.append(k, v));
        fd.append("cards", JSON.stringify(cards));
        if (audio) fd.append("audio", { uri: audio.uri, name: audio.name ?? "vocal.m4a", type: audio.type ?? "audio/mp4" });
        try {
          onCreated(await revisionApi.createFiche(fd));
        } catch (e) {
          toast.error(e.message);
        } finally {
          setBusy(null);
        }
      }} />}
    >
      <Field label="Titre"><Input value={f.titre} onChangeText={set("titre")} /></Field>
      <Segmented options={[{ value: "BAC", label: "BAC" }, { value: "BEPC", label: "BEPC" }]} value={f.niveau} onChange={set("niveau")} />
      {f.niveau === "BAC" && <ChipRow>{BAC_SERIES.map((s) => <Chip key={s.code} label={s.code} active={f.serie === s.code} onPress={() => set("serie")(f.serie === s.code ? "" : s.code)} />)}</ChipRow>}
      <ChipRow>{matieres.map((m) => <Chip key={m} label={m} active={f.matiere === m} onPress={() => set("matiere")(m)} />)}</ChipRow>
      <Field label="Chapitre"><Input value={f.chapitre} onChangeText={set("chapitre")} /></Field>
      <Field label="Résumé du cours"><Input value={f.contenu} onChangeText={set("contenu")} multiline /></Field>
      <Button title={audio ? `Vocal : ${audio.name}` : "Joindre un vocal (fichier audio)"} variant="secondary" icon={Mic} onPress={async () => {
        try {
          const [a] = await pick({ type: [types.audio] });
          setAudio(a);
        } catch {
          /* annulé */
        }
      }} />
      <Button title="Cartes proposées par EduIA" variant="secondary" icon={Sparkles} loading={busy === "ai"} disabled={f.contenu.trim().length < 80} onPress={async () => {
        setBusy("ai");
        try {
          const r = await revisionApi.generateCards(f.contenu, 12);
          setCards((c) => [...c, ...r.cards]);
        } catch (e) {
          if (e.status !== 402) toast.error(e.message);
        } finally {
          setBusy(null);
        }
      }} />
      {cards.map((c, i) => (
        <Row key={i} style={{ alignItems: "flex-start" }}>
          <View style={{ flex: 1 }}><T weight="700" size={13.5}>{c.q}</T><T size={13} muted>{c.a}</T></View>
          <Pressable onPress={() => setCards((cs) => cs.filter((_, j) => j !== i))} hitSlop={8}><Trash2 size={16} color="#b3a798" /></Pressable>
        </Row>
      ))}
    </Sheet>
  );
}

// ---------------------------------------------------------------- Une fiche + révision des cartes
export function FicheScreen({ route, navigation }) {
  const { id } = route.params;
  const { user, colors } = useApp();
  const [f, setF] = useState(undefined);
  const load = useCallback(() => revisionApi.fiche(id).then((x) => { setF(x); navigation.setOptions({ title: x.titre }); }).catch(() => setF(null)), [id, navigation]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (f === undefined) return <Screen><Skeleton height={240} /></Screen>;
  if (!f) return <Screen><EmptyState icon={Layers} title="Fiche introuvable" /></Screen>;
  return (
    <Screen>
      <T muted size={13}>{f.matiere} · {f.niveau}{f.serie ? ` ${f.serie}` : ""}{f.chapitre ? ` · ${f.chapitre}` : ""}</T>
      <Pressable onPress={() => navigation.navigate("ProfProfil", { id: f.author.id })}><T color={colors.primary} weight="700">par {f.author.display_name} ›</T></Pressable>
      {f.cards_count > 0 && (
        <Card glow>
          <Badge label={f.progress?.due ? `${f.progress.due} carte(s) à revoir` : "Tout est à jour"} tone={f.progress?.due ? "accent" : "success"} />
          {user ? <Button title="Réviser les cartes" icon={Layers} onPress={() => navigation.navigate("Cartes", { id: f.id, titre: f.titre })} /> : <Button title="Connecte-toi pour réviser" variant="secondary" onPress={() => navigation.navigate("Auth")} />}
        </Card>
      )}
      {f.audio_url ? <Button title="Écouter l'explication du prof" variant="secondary" icon={Play} onPress={() => playAudio(f.audio_url)} /> : null}
      {f.contenu ? <Card><Markdown>{f.contenu}</Markdown></Card> : null}
      {f.cards_count > 0 && (
        <>
          <H2>Les cartes</H2>
          {f.cards.map((c, i) => <Card key={i}><T weight="700">{c.q}</T><T muted>{c.a}</T></Card>)}
        </>
      )}
      <Row wrap>
        <ReportButton type="fiche" id={f.id} />
        {f.is_mine && <Button title="Supprimer" size="sm" variant="ghost" icon={Trash2} onPress={() => Alert.alert("Supprimer cette fiche ?", "", [
          { text: "Annuler", style: "cancel" },
          { text: "Supprimer", style: "destructive", onPress: () => revisionApi.deleteFiche(f.id).then(() => navigation.goBack()) },
        ])} />}
      </Row>
    </Screen>
  );
}

export function CartesScreen({ route, navigation }) {
  const { id } = route.params;
  const { colors } = useApp();
  const [data, setData] = useState(null);
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [score, setScore] = useState({ ok: 0, ko: 0 });
  useEffect(() => {
    revisionApi.review(id).then(setData).catch((e) => toast.error(e.message));
  }, [id]);
  if (!data) return <Screen><Skeleton height={260} /></Screen>;
  const card = data.due[i];
  const answer = (ok) => {
    setScore((s) => ({ ok: s.ok + (ok ? 1 : 0), ko: s.ko + (ok ? 0 : 1) }));
    revisionApi.answerCard(id, card.index, ok).catch(() => {});
    setFlipped(false);
    setI((n) => n + 1);
  };
  if (!card)
    return (
      <Screen contentStyle={{ flexGrow: 1, justifyContent: "center" }}>
        <Card style={{ alignItems: "center", gap: 10, paddingVertical: 28 }}>
          <PartyPopper size={40} color={colors.primary} />
          <H2 center>{data.due.length ? "Séance terminée !" : "Rien à revoir aujourd'hui"}</H2>
          {data.due.length ? <T>{score.ok} sue(s) · {score.ko} à revoir</T> : null}
          <T muted center size={13}>Les cartes bien sues reviennent dans 2, 4, 8 puis 16 jours.</T>
          <Button title="Terminer" onPress={() => navigation.goBack()} />
        </Card>
      </Screen>
    );
  return (
    <Screen contentStyle={{ flexGrow: 1, justifyContent: "center", gap: 16 }}>
      <T muted center>Carte {i + 1} / {data.due.length}</T>
      <Pressable onPress={() => setFlipped((v) => !v)} style={{ minHeight: 280, borderRadius: radius.xl, borderWidth: 1, borderColor: flipped ? colors.success : colors.borderStrong, backgroundColor: colors.card, padding: 24, alignItems: "center", justifyContent: "center", gap: 14 }}>
        <T size={11.5} weight="800" muted>{flipped ? "RÉPONSE" : "QUESTION"}</T>
        <T size={20} weight="700" center>{flipped ? card.a : card.q}</T>
        {!flipped && <Row gap={6}><RotateCw size={14} color={colors.mutedForeground} /><T size={12.5} muted>Toucher pour retourner</T></Row>}
      </Pressable>
      {flipped && (
        <Row>
          <Button title="À revoir" variant="secondary" icon={X} style={{ flex: 1 }} block onPress={() => answer(false)} />
          <Button title="Je savais" icon={Check} style={{ flex: 1 }} block onPress={() => answer(true)} />
        </Row>
      )}
    </Screen>
  );
}

// ---------------------------------------------------------------- Questions aux profs
export function QuestionsScreen({ navigation }) {
  const { user, isProf } = useApp();
  const [scope, setScope] = useState(isProf ? "a_repondre" : "all");
  const [list, setList] = useState(null);
  const [asking, setAsking] = useState(false);
  const load = useCallback(() => revisionApi.questions({ scope }).then(setList).catch(() => setList((l) => l ?? [])), [scope]);
  useFocusEffect(useCallback(() => { if (user) load(); }, [load, user]));

  const scopes = isProf ? [{ value: "a_repondre", label: "À répondre" }, { value: "all", label: "Répondues" }]
    : [{ value: "all", label: "Répondues" }, { value: "mine", label: "Mes questions" }];
  return (
    <Screen>
      <PageHero eyebrow="Réviser" icon={MessageCircleQuestion} title="Questions aux profs" subtitle={isProf ? "Réponds par écrit, en vocal ou avec une fiche." : "Un point pas clair ? Des professeurs te répondent."} />
      <SpaceTabs items={REVISION_TABS} current="Questions" onPress={(it) => it.key !== "Questions" && navigation.navigate(it.key)} />
      {!user ? (
        <EmptyState icon={MessageCircleQuestion} title="Connecte-toi pour poser tes questions" action={<Button title="Se connecter" onPress={() => navigation.navigate("Auth")} />} />
      ) : (
        <>
          {!isProf && <Button title="Poser une question" icon={Plus} onPress={() => setAsking(true)} />}
          <Segmented options={scopes} value={scope} onChange={setScope} />
          {list === null ? <Skeleton height={120} /> : list.length === 0 ? <EmptyState icon={MessageCircleQuestion} title="Aucune question ici" /> : list.map((x) => (
            <Card key={x.id} onPress={() => navigation.navigate("Question", { id: x.id })}>
              <T weight="700" numberOfLines={3}>{x.texte}</T>
              <T size={12} muted>{x.matiere} · {x.eleve.display_name} · {formatDate(x.created_at, false)}</T>
              <Row gap={6}>
                <Badge label={`👍 ${x.votes}`} tone="info" />
                <Badge label={x.status === "answered" ? `${x.answers_count} réponse(s)` : "En attente"} tone={x.status === "answered" ? "success" : "accent"} />
              </Row>
            </Card>
          ))}
          {!isProf && <AskSheet open={asking} onClose={() => setAsking(false)} onAsked={() => { setAsking(false); setScope("mine"); load(); }} />}
        </>
      )}
    </Screen>
  );
}

function AskSheet({ open, onClose, onAsked }) {
  const { user } = useApp();
  const [niveau, setNiveau] = useState(user?.niveau === "3ème" ? "BEPC" : "BAC");
  const [matiere, setMatiere] = useState("");
  const [texte, setTexte] = useState("");
  const [image, setImage] = useState(null);
  const [sending, setSending] = useState(false);
  const matieres = niveau === "BEPC" ? MATIERES_BEPC : user?.serie ? matieresFor("BAC", user.serie) : ALL_BAC_MATIERES;
  return (
    <Sheet open={open} onClose={onClose} title="Ta question"
      footer={<Button title="Envoyer" icon={Send} loading={sending} disabled={!matiere || texte.trim().length < 10} onPress={async () => {
        setSending(true);
        const fd = new FormData();
        fd.append("niveau", niveau);
        fd.append("matiere", matiere);
        fd.append("texte", texte);
        if (image) fd.append("image", { uri: image.uri, name: image.fileName ?? "photo.jpg", type: image.type ?? "image/jpeg" });
        try {
          await revisionApi.ask(fd);
          toast.success("Question envoyée : tu seras prévenu de la réponse.");
          setTexte("");
          setImage(null);
          onAsked();
        } catch (e) {
          toast.error(e.message);
        } finally {
          setSending(false);
        }
      }} />}
    >
      <Segmented options={[{ value: "BAC", label: "BAC" }, { value: "BEPC", label: "BEPC" }]} value={niveau} onChange={setNiveau} />
      <ChipRow>{matieres.map((m) => <Chip key={m} label={m} active={matiere === m} onPress={() => setMatiere(m)} />)}</ChipRow>
      <Input value={texte} onChangeText={setTexte} multiline placeholder="Explique ce que tu ne comprends pas…" maxLength={3000} />
      <Button title={image ? "Photo ajoutée ✓" : "Ajouter une photo"} variant="secondary" icon={ImagePlus} onPress={async () => {
        const r = await launchImageLibrary({ mediaType: "photo", quality: 0.7, maxWidth: 1600, maxHeight: 1600 });
        if (r.assets?.[0]) setImage(r.assets[0]);
      }} />
    </Sheet>
  );
}

export function QuestionScreen({ route, navigation }) {
  const { id } = route.params;
  const { isProf, colors } = useApp();
  const [q, setQ] = useState(undefined);
  const [texte, setTexte] = useState("");
  const [audio, setAudio] = useState(null);
  const [sending, setSending] = useState(false);
  const load = useCallback(() => revisionApi.question(id).then(setQ).catch(() => setQ(null)), [id]);
  useEffect(() => { load(); }, [load]);

  if (q === undefined) return <Screen><Skeleton height={200} /></Screen>;
  if (!q) return <Screen><EmptyState icon={MessageCircleQuestion} title="Question introuvable" /></Screen>;
  return (
    <Screen>
      <T size={12.5} muted>{q.matiere} · {q.niveau} · {q.eleve.display_name} · {formatDate(q.created_at)}</T>
      <H3>{q.texte}</H3>
      {q.image_url ? <Button title="Voir la photo" size="sm" variant="secondary" icon={ImagePlus} onPress={() => Linking.openURL(apiUrl(q.image_url))} /> : null}
      <Row wrap>
        {!isProf && !q.is_mine && <Button title={`Moi aussi (${q.votes})`} size="sm" variant={q.voted ? "primary" : "secondary"} icon={ThumbsUp} onPress={async () => setQ({ ...q, ...(await revisionApi.vote(q.id)) })} />}
        <ReportButton type="question" id={q.id} />
      </Row>
      <H2>{q.answers.length ? `Réponses (${q.answers.length})` : "Pas encore de réponse"}</H2>
      {q.answers.map((a) => (
        <Card key={a.id} style={{ borderLeftWidth: 3, borderLeftColor: colors.primary }}>
          <Pressable onPress={() => navigation.navigate("ProfProfil", { id: a.prof.id })}><T weight="800" color={colors.primary}>{a.prof.display_name} · Professeur</T></Pressable>
          {a.texte ? <Markdown size={14.5}>{a.texte}</Markdown> : null}
          {a.audio_url ? <Button title="Écouter la réponse" size="sm" variant="secondary" icon={Play} onPress={() => playAudio(a.audio_url)} /> : null}
          {a.fiche ? <Button title={`Fiche : ${a.fiche.titre}`} size="sm" variant="ghost" icon={BookOpen} onPress={() => navigation.navigate("Fiche", { id: a.fiche.id })} /> : null}
        </Card>
      ))}
      {isProf && (
        <Card style={{ backgroundColor: alpha(colors.primary, 0.05) }}>
          <H3>Ta réponse</H3>
          <Input value={texte} onChangeText={setTexte} multiline placeholder="Explique simplement…" />
          <Button title={audio ? `Vocal : ${audio.name}` : "Joindre un vocal"} size="sm" variant="secondary" icon={Mic} onPress={async () => {
            try {
              const [x] = await pick({ type: [types.audio] });
              setAudio(x);
            } catch {
              /* annulé */
            }
          }} />
          <Button title="Répondre" icon={Send} loading={sending} disabled={!texte.trim() && !audio} onPress={async () => {
            setSending(true);
            const fd = new FormData();
            fd.append("texte", texte);
            if (audio) fd.append("audio", { uri: audio.uri, name: audio.name ?? "vocal.m4a", type: audio.type ?? "audio/mp4" });
            try {
              setQ(await revisionApi.answer(q.id, fd));
              setTexte("");
              setAudio(null);
              toast.success("Réponse envoyée");
            } catch (e) {
              toast.error(e.message);
            } finally {
              setSending(false);
            }
          }} />
        </Card>
      )}
    </Screen>
  );
}

