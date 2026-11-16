// Fonctions du site ajoutées à l'application : ajouter une épreuve, rechercher, publier un audio (prof).
import { pick, types } from "@react-native-documents/picker";
import { AlertTriangle, BookOpen, CheckCircle2, FilePlus2, FileText, GraduationCap, Mic, Search, Trash2, Upload } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { Alert, View } from "react-native";
import { audioApi, examsApi } from "../api/endpoints";
import { FadeIn, IconBadge } from "../components/brand";
import { Badge, Button, Card, Chip, ChipRow, EmptyState, Field, Input, PageHero, Screen, Segmented, Skeleton, T, toast } from "../components/ui";
import { ANNEES, BAC_SERIES, DIFFICULTES, matieresFor, SESSIONS } from "../config/curriculum";
import { useApp } from "../context/AppContext";
import { alpha, radius } from "../theme";
import { ExamCard } from "./ExamsScreen";

/* ------------------------------------------------------------------ */
/* Ajouter une épreuve                                                 */
/* ------------------------------------------------------------------ */

const INITIAL = { exam_type: "BAC", serie: "", matiere: "", annee: "", session: "Normale", difficulte: "moyen", titre: "", duree_minutes: "", coefficient: "", fichier: null };

export function AjouterScreen({ navigation }) {
  const { colors } = useApp();
  const [f, setF] = useState(INITIAL);
  const [existing, setExisting] = useState(null);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(null);
  const set = (patch) => setF((s) => ({ ...s, ...patch }));
  const matieres = matieresFor(f.exam_type, f.exam_type === "BAC" ? f.serie || null : null);

  // Anti-doublon : on vérifie si cette épreuve existe déjà.
  useEffect(() => {
    setExisting(null);
    if (!f.matiere || !f.annee || !f.session) return undefined;
    let alive = true;
    const t = setTimeout(() => {
      examsApi
        .list({ type: f.exam_type, serie: f.exam_type === "BAC" ? f.serie : undefined, matiere: f.matiere, annee: f.annee, session: f.session })
        .then((rows) => alive && setExisting(rows.find((r) => (r.serie ?? "") === (f.exam_type === "BAC" ? f.serie : "")) ?? null))
        .catch(() => {});
    }, 300);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [f.exam_type, f.serie, f.matiere, f.annee, f.session]);

  const choosePdf = async () => {
    try {
      const [d] = await pick({ type: [types.pdf] });
      if (d.size && d.size > 25 * 1024 * 1024) return toast.error("25 Mo maximum");
      set({ fichier: { uri: d.uri, name: d.name ?? "epreuve.pdf", type: "application/pdf" } });
    } catch {
      /* annulé */
    }
    return undefined;
  };

  const ready = (f.exam_type === "BEPC" || f.serie) && f.matiere && f.annee && f.session && f.fichier && !existing;

  const submit = async () => {
    setSending(true);
    try {
      const fd = new FormData();
      fd.append("fichier", f.fichier);
      fd.append(
        "meta",
        JSON.stringify({
          exam_type: f.exam_type,
          serie: f.exam_type === "BAC" ? f.serie : null,
          matiere: f.matiere,
          annee: f.annee,
          session: f.session,
          difficulte: f.difficulte,
          coefficient: f.coefficient ? Number(f.coefficient) : null,
          duree_minutes: f.duree_minutes ? Number(f.duree_minutes) : null,
          titre: f.titre || `${f.exam_type} ${f.matiere} ${f.annee}`,
          uploader_fingerprint: "mobile",
        }),
      );
      const data = await examsApi.upload(fd);
      setDone(data.exam ?? true);
      toast.success("Épreuve ajoutée à la bibliothèque !");
    } catch (e) {
      if (e.status === 409 && e.data?.duplicate) setExisting(e.data.existing);
      else toast.error(e.message);
    } finally {
      setSending(false);
    }
  };

  if (done)
    return (
      <Screen contentStyle={{ flexGrow: 1, justifyContent: "center" }}>
        <FadeIn>
          <Card glow style={{ alignItems: "center", gap: 12, paddingVertical: 28 }}>
            <IconBadge icon={CheckCircle2} tone="success" size={64} />
            <T size={21} weight="800" center>Merci pour ta contribution !</T>
            <T muted center>L'épreuve est maintenant disponible pour tous les élèves du Bénin.</T>
            {done.id ? <Button title="Voir l'épreuve" icon={BookOpen} onPress={() => navigation.replace("ExamDetail", { id: done.id })} /> : null}
            <Button title="Ajouter une autre épreuve" variant="secondary" icon={FilePlus2} onPress={() => { setDone(null); setF(INITIAL); }} />
          </Card>
        </FadeIn>
      </Screen>
    );

  return (
    <Screen>
      <PageHero eyebrow="Communauté" icon={FilePlus2} title="Ajouter une épreuve" subtitle="Partage un ancien sujet en PDF. Chaque épreuve est vérifiée pour éviter les doublons." />

      <Card style={{ gap: 14 }}>
        <Segmented
          options={[
            { value: "BAC", label: "BAC", icon: GraduationCap },
            { value: "BEPC", label: "BEPC", icon: BookOpen },
          ]}
          value={f.exam_type}
          onChange={(v) => set({ exam_type: v, serie: "", matiere: "" })}
        />
        {f.exam_type === "BAC" && (
          <Field label="Série">
            <ChipRow>
              {BAC_SERIES.map((s) => (
                <Chip key={s.code} label={s.code} active={f.serie === s.code} onPress={() => set({ serie: s.code, matiere: matieresFor("BAC", s.code).includes(f.matiere) ? f.matiere : "" })} />
              ))}
            </ChipRow>
          </Field>
        )}
        <Field label="Matière">
          <ChipRow>
            {matieres.map((m) => (
              <Chip key={m} label={m} active={f.matiere === m} onPress={() => set({ matiere: m })} />
            ))}
          </ChipRow>
        </Field>
        <Field label="Année">
          <ChipRow>
            {ANNEES.map((a) => (
              <Chip key={a} label={String(a)} active={f.annee === String(a)} onPress={() => set({ annee: String(a) })} />
            ))}
          </ChipRow>
        </Field>
        <Field label="Session">
          <ChipRow>
            {SESSIONS.map((s) => (
              <Chip key={s} label={s} active={f.session === s} onPress={() => set({ session: s })} />
            ))}
          </ChipRow>
        </Field>
        <Field label="Difficulté">
          <ChipRow>
            {DIFFICULTES.map((d) => (
              <Chip key={d.value} label={d.label} active={f.difficulte === d.value} onPress={() => set({ difficulte: d.value })} />
            ))}
          </ChipRow>
        </Field>
        <Field label="Titre (facultatif)">
          <Input value={f.titre} onChangeText={(v) => set({ titre: v })} placeholder="Ex. BAC D Mathématiques 2023" />
        </Field>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Field label="Durée (min)">
              <Input value={f.duree_minutes} onChangeText={(v) => set({ duree_minutes: v.replace(/\D/g, "") })} keyboardType="number-pad" placeholder="240" />
            </Field>
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Coefficient">
              <Input value={f.coefficient} onChangeText={(v) => set({ coefficient: v.replace(/\D/g, "") })} keyboardType="number-pad" placeholder="4" />
            </Field>
          </View>
        </View>
      </Card>

      {existing ? (
        <Card style={{ borderColor: alpha(colors.accent, 0.5), backgroundColor: alpha(colors.accent, 0.08), flexDirection: "row", gap: 12 }}>
          <AlertTriangle size={22} color={colors.accent} />
          <View style={{ flex: 1, gap: 6 }}>
            <T weight="800">Cette épreuve existe déjà</T>
            <T size={13} muted>
              {existing.exam_type} {existing.serie ? `série ${existing.serie} · ` : ""}
              {existing.matiere} · {existing.annee} · session {existing.session}.
            </T>
            <Button title="Voir l'épreuve existante" size="sm" variant="secondary" onPress={() => navigation.navigate("ExamDetail", { id: existing.id })} />
          </View>
        </Card>
      ) : null}

      <Card onPress={choosePdf} style={{ alignItems: "center", gap: 8, paddingVertical: 22, borderStyle: "dashed", borderColor: f.fichier ? colors.success : colors.borderStrong }}>
        <IconBadge icon={f.fichier ? FileText : Upload} tone={f.fichier ? "success" : "primary"} size={52} />
        <T weight="800" center numberOfLines={2}>{f.fichier ? f.fichier.name : "Choisir le PDF de l'épreuve"}</T>
        <T size={12.5} muted center>{f.fichier ? "Touche pour changer de fichier" : "PDF uniquement, 25 Mo maximum"}</T>
      </Card>

      <Button title="Publier l'épreuve" icon={Upload} block size="lg" loading={sending} disabled={!ready} onPress={submit} />
    </Screen>
  );
}

/* ------------------------------------------------------------------ */
/* Rechercher                                                          */
/* ------------------------------------------------------------------ */

export function RechercheScreen({ navigation }) {
  const [all, setAll] = useState(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    examsApi
      .list({})
      .then(setAll)
      .catch(() => setAll([]));
  }, []);

  const results = useMemo(() => {
    const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (!words.length) return [];
    return (all ?? []).filter((e) => {
      const hay = `${e.exam_type} ${e.titre} ${e.matiere} ${e.serie ?? ""} ${e.annee} ${e.session}`.toLowerCase();
      return words.every((w) => hay.includes(w));
    });
  }, [all, q]);

  return (
    <Screen>
      <Input icon={Search} value={q} onChangeText={setQ} placeholder="Ex. maths D 2022, anglais BEPC…" autoFocus returnKeyType="search" />
      {all === null ? (
        [0, 1, 2].map((i) => <Skeleton key={i} height={92} />)
      ) : !q.trim() ? (
        <EmptyState icon={Search} title="Que cherches-tu ?">Tape une matière, une série, une année ou « BAC » / « BEPC ».</EmptyState>
      ) : results.length === 0 ? (
        <EmptyState icon={BookOpen} title="Aucun résultat">Essaie avec d'autres mots.</EmptyState>
      ) : (
        <>
          <T size={13} muted>{results.length} résultat{results.length > 1 ? "s" : ""}</T>
          {results.slice(0, 60).map((e, i) => (
            <ExamCard key={e.id} exam={e} index={i} onPress={() => navigation.navigate("ExamDetail", { id: e.id })} />
          ))}
        </>
      )}
    </Screen>
  );
}

/* ------------------------------------------------------------------ */
/* Mes audios (professeur)                                             */
/* ------------------------------------------------------------------ */

export function ProfAudiosScreen() {
  const { colors } = useApp();
  const [mine, setMine] = useState(null);
  const [form, setForm] = useState({ titre: "", description: "", niveau: "BAC", serie: "", matiere: "" });
  const [file, setFile] = useState(null);
  const [sending, setSending] = useState(false);
  const set = (patch) => setForm((s) => ({ ...s, ...patch }));
  const matieres = matieresFor(form.niveau, form.niveau === "BAC" ? form.serie || null : null);

  const load = () => audioApi.list(true).then(setMine).catch(() => setMine([]));
  useEffect(() => {
    load();
  }, []);

  const chooseAudio = async () => {
    try {
      const [d] = await pick({ type: [types.audio] });
      setFile({ uri: d.uri, name: d.name ?? "audio.m4a", type: d.type ?? "audio/mpeg" });
    } catch {
      /* annulé */
    }
  };

  const publish = async () => {
    if (!form.titre.trim() || !form.matiere || !file) return toast.error("Titre, matière et fichier audio sont obligatoires.");
    setSending(true);
    try {
      const fd = new FormData();
      fd.append("fichier", file);
      fd.append("titre", form.titre.trim());
      fd.append("description", form.description);
      fd.append("niveau", form.niveau);
      fd.append("serie", form.niveau === "BAC" ? form.serie : "");
      fd.append("matiere", form.matiere);
      await audioApi.upload(fd);
      toast.success("Audio publié");
      setForm((s) => ({ ...s, titre: "", description: "" }));
      setFile(null);
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSending(false);
    }
    return undefined;
  };

  const remove = (a) =>
    Alert.alert("Supprimer cet audio ?", a.titre, [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: () =>
          audioApi
            .remove(a.id)
            .then(() => {
              toast.success("Audio supprimé");
              load();
            })
            .catch((e) => toast.error(e.message)),
      },
    ]);

  return (
    <Screen>
      <PageHero eyebrow="Professeur" icon={Mic} title="Mes audios" subtitle="Publie une explication audio : tes élèves l'écoutent depuis le site et l'application." />
      <Card style={{ gap: 12 }}>
        <Input value={form.titre} onChangeText={(v) => set({ titre: v })} placeholder="Titre (ex. Les dérivées en 10 minutes)" />
        <Input value={form.description} onChangeText={(v) => set({ description: v })} placeholder="Description (facultatif)" multiline />
        <Segmented
          options={[
            { value: "BAC", label: "BAC" },
            { value: "BEPC", label: "BEPC" },
          ]}
          value={form.niveau}
          onChange={(v) => set({ niveau: v, serie: "", matiere: "" })}
        />
        {form.niveau === "BAC" && (
          <Field label="Série">
            <ChipRow>
              {BAC_SERIES.map((s) => (
                <Chip key={s.code} label={s.code} active={form.serie === s.code} onPress={() => set({ serie: s.code })} />
              ))}
            </ChipRow>
          </Field>
        )}
        <Field label="Matière">
          <ChipRow>
            {matieres.map((m) => (
              <Chip key={m} label={m} active={form.matiere === m} onPress={() => set({ matiere: m })} />
            ))}
          </ChipRow>
        </Field>
        <Card onPress={chooseAudio} style={{ alignItems: "center", gap: 6, borderStyle: "dashed", borderColor: file ? colors.success : colors.borderStrong }}>
          <IconBadge icon={file ? Mic : Upload} tone={file ? "success" : "primary"} />
          <T weight="700" center numberOfLines={2}>{file ? file.name : "Choisir un fichier audio"}</T>
        </Card>
        <Button title="Publier l'audio" icon={Upload} block loading={sending} onPress={publish} />
      </Card>

      <T size={18} weight="800">Mes publications</T>
      {mine === null ? (
        [0, 1].map((i) => <Skeleton key={i} height={80} />)
      ) : mine.length === 0 ? (
        <EmptyState icon={Mic} title="Aucun audio publié" />
      ) : (
        mine.map((a) => (
          <Card key={a.id} style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View style={{ flex: 1, gap: 4, minWidth: 0 }}>
              <T weight="800" numberOfLines={2}>{a.titre}</T>
              <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
                <Badge label={a.matiere} />
                <Badge label={`${a.niveau}${a.serie ? ` ${a.serie}` : ""}`} tone="accent" />
              </View>
            </View>
            <Button title="" icon={Trash2} variant="outline" size="sm" onPress={() => remove(a)} style={{ borderRadius: radius.md }} />
          </Card>
        ))
      )}
    </Screen>
  );
}
