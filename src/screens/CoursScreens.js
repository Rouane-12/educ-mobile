// Cours en ligne d'une classe : séances à heure fixe, vidéos (lecteur intégré), fiches, exercices,
// présence, cadenas après la fin pour les absents, demande d'accès, téléchargement en ZIP.
import { pick, types } from "@react-native-documents/picker";
import { CalendarClock, CalendarPlus, Check, Download, FileText, Lock, PlayCircle, Radio, Send, Trash2, Upload, UserCheck, Users, Video as VideoIcon, X } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Linking, Pressable, Text, View } from "react-native";
import Video from "react-native-video";
import { coursApi } from "../api/endpoints";
import { FadeIn, IconBadge, Pulse } from "../components/brand";
import { useCountdownTo } from "../components/espace";
import { Badge, Button, Card, Chip, ChipRow, EmptyState, Field, H2, Input, Screen, Segmented, Sheet, Skeleton, T, toast } from "../components/ui";
import { useApp } from "../context/AppContext";
import { formatDate } from "../lib/format";
import { alpha, radius } from "../theme";

const JOURS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MOIS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
const pad = (n) => String(n).padStart(2, "0");
const hhmm = (d) => `${pad(new Date(d).getHours())}:${pad(new Date(d).getMinutes())}`;
const dayLabel = (d) => {
  const x = new Date(d);
  return `${JOURS[(x.getDay() + 6) % 7]} ${x.getDate()} ${MOIS[x.getMonth()]}`;
};

export function CoursBadge({ c }) {
  if (c.state === "en_cours") return <Badge label="● En direct" tone="danger" />;
  if (c.state === "a_venir") return <Badge label="À venir" tone="accent" />;
  if (c.locked) return <Badge label="Terminé · verrouillé" tone="secondary" />;
  return <Badge label="Terminé" tone="success" />;
}

/* ------------------------------------------------------------------ */
/* Section « Cours en ligne » de la page d'une classe                   */
/* ------------------------------------------------------------------ */

export function CoursSection({ classe, owner, navigation, onNew }) {
  const { colors } = useApp();
  const list = classe.cours ?? [];
  const upcoming = list.filter((c) => c.state !== "termine");
  const past = list.filter((c) => c.state === "termine").reverse();
  const [showPast, setShowPast] = useState(upcoming.length === 0);

  const row = (c) => (
    <Card key={c.id} onPress={() => navigation.navigate("Cours", { id: c.id })}
      style={{ flexDirection: "row", alignItems: "center", gap: 12, borderColor: c.state === "en_cours" ? alpha(colors.danger, 0.6) : colors.border }}>
      <IconBadge icon={c.locked ? Lock : c.state === "en_cours" ? PlayCircle : VideoIcon} tone={c.state === "en_cours" ? "danger" : c.state === "a_venir" ? "accent" : "secondary"} size={42} />
      <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
        <T size={15} weight="800" numberOfLines={2}>{c.titre}</T>
        <T size={12.5} muted numberOfLines={1}>{dayLabel(c.starts_at)} · {hhmm(c.starts_at)} – {hhmm(c.ends_at)} · {c.ressources_count} ressource(s)</T>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
          <CoursBadge c={c} />
          {owner && c.demandes ? <Badge label={`${c.demandes} demande(s)`} /> : null}
        </View>
      </View>
    </Card>
  );

  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <H2>Cours en ligne</H2>
        {owner && <Button title="Programmer" size="sm" icon={CalendarPlus} onPress={onNew} />}
      </View>
      <View style={{ flexDirection: "row", gap: 8, alignItems: "flex-start" }}>
        <Lock size={14} color={colors.mutedForeground} style={{ marginTop: 3 }} />
        <T size={12.5} muted style={{ flex: 1 }}>
          Les vidéos et fiches s'ouvrent au début du cours. Après la fin, seuls les élèves présents les gardent.
        </T>
      </View>
      {list.length === 0 ? (
        <EmptyState icon={VideoIcon} title="Aucun cours programmé">
          {owner ? "Programme tes heures de cours (soir de semaine, week-end) et dépose tes vidéos, fiches et exercices." : "Ton professeur n'a pas encore programmé de cours."}
        </EmptyState>
      ) : (
        <>
          {upcoming.map(row)}
          {past.length > 0 && (
            <Pressable onPress={() => setShowPast((v) => !v)} style={{ paddingVertical: 6 }}>
              <T weight="700" color={colors.primary}>{showPast ? "▾" : "▸"} Cours passés ({past.length})</T>
            </Pressable>
          )}
          {showPast && past.map(row)}
        </>
      )}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Programmer un cours                                                  */
/* ------------------------------------------------------------------ */

const PRESETS = [
  { label: "Soir semaine 20 h – 22 h", start: 20, mins: 120, days: [0, 1, 2, 3, 4] },
  { label: "Soir 19 h – 21 h", start: 19, mins: 120, days: [0, 2, 4] },
  { label: "Samedi 9 h – 11 h", start: 9, mins: 120, days: [5] },
  { label: "Week-end 15 h – 17 h", start: 15, mins: 120, days: [5, 6] },
];
const HOURS = [7, 8, 9, 10, 11, 14, 15, 16, 17, 18, 19, 20, 21];
const DURATIONS = [
  { v: 60, l: "1 h" },
  { v: 90, l: "1 h 30" },
  { v: 120, l: "2 h" },
  { v: 180, l: "3 h" },
];
const WEEKS = [1, 2, 4, 8, 12];

export function NewCoursSheet({ classe, open, onClose, onCreated }) {
  const days14 = useMemo(() => {
    const out = [];
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    for (let i = 0; i < 14; i += 1) out.push(new Date(d.getTime() + i * 86400000));
    return out;
  }, []);
  const [f, setF] = useState({ titre: "", description: "", day: 0, hour: 20, minute: 0, mins: 120, days: [], weeks: 1 });
  const [saving, setSaving] = useState(false);
  const set = (p) => setF((s) => ({ ...s, ...p }));

  const submit = async () => {
    const start = new Date(days14[f.day]);
    start.setHours(f.hour, f.minute, 0, 0);
    if (start.getTime() + f.mins * 60000 <= Date.now()) return toast.error("Ce créneau est déjà passé : choisis une autre heure ou un autre jour.");
    setSaving(true);
    try {
      const created = await coursApi.create(classe.id, {
        titre: f.titre.trim(),
        description: f.description,
        starts_at: start.toISOString(),
        ends_at: new Date(start.getTime() + f.mins * 60000).toISOString(),
        repeat_days: f.days,
        repeat_weeks: f.weeks,
      });
      toast.success(created.length > 1 ? `${created.length} séances programmées` : "Cours programmé, les élèves sont prévenus");
      onCreated();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
    return undefined;
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Programmer un cours"
      footer={
        <>
          <Button title="Annuler" variant="ghost" onPress={onClose} />
          <Button title="Programmer" icon={CalendarPlus} loading={saving} disabled={!f.titre.trim()} onPress={submit} />
        </>
      }
    >
      <Input value={f.titre} onChangeText={(v) => set({ titre: v })} placeholder="Titre (ex. La méiose — partie 1)" />
      <Input value={f.description} onChangeText={(v) => set({ description: v })} placeholder="Ce que les élèves vont apprendre (facultatif)" multiline />
      <Field label="Créneau rapide">
        <ChipRow>
          {PRESETS.map((p) => (
            <Chip key={p.label} label={p.label} active={f.hour === p.start && f.mins === p.mins && f.days.join() === p.days.join()} onPress={() => set({ hour: p.start, minute: 0, mins: p.mins, days: p.days })} />
          ))}
        </ChipRow>
      </Field>
      <Field label="Premier jour">
        <ChipRow>
          {days14.map((d, i) => (
            <Chip key={d.toISOString()} label={i === 0 ? "Aujourd'hui" : i === 1 ? "Demain" : dayLabel(d)} active={f.day === i} onPress={() => set({ day: i })} />
          ))}
        </ChipRow>
      </Field>
      <Field label="Heure de début">
        <ChipRow>
          {HOURS.map((h) => (
            <Chip key={h} label={`${h} h`} active={f.hour === h} onPress={() => set({ hour: h })} />
          ))}
        </ChipRow>
        <ChipRow>
          {[0, 15, 30, 45].map((m) => (
            <Chip key={m} label={`:${pad(m)}`} active={f.minute === m} onPress={() => set({ minute: m })} />
          ))}
        </ChipRow>
      </Field>
      <Field label="Durée">
        <ChipRow>
          {DURATIONS.map((d) => (
            <Chip key={d.v} label={d.l} active={f.mins === d.v} onPress={() => set({ mins: d.v })} />
          ))}
        </ChipRow>
      </Field>
      <Field label="Répéter ces jours-là (facultatif)">
        <ChipRow>
          {JOURS.map((j, i) => (
            <Chip key={j} label={j} active={f.days.includes(i)} onPress={() => set({ days: f.days.includes(i) ? f.days.filter((x) => x !== i) : [...f.days, i] })} />
          ))}
        </ChipRow>
      </Field>
      <Field label="Pendant">
        <ChipRow>
          {WEEKS.map((w) => (
            <Chip key={w} label={w === 1 ? "1 semaine" : `${w} semaines`} active={f.weeks === w} onPress={() => set({ weeks: w })} />
          ))}
        </ChipRow>
      </Field>
      <T size={12.5} muted>Astuce : des vidéos d'environ 10 minutes (100 Mo max.). Pour 2 h de cours, 5 ou 6 vidéos, une fiche et un exercice suffisent.</T>
    </Sheet>
  );
}

/* ------------------------------------------------------------------ */
/* Page d'un cours                                                      */
/* ------------------------------------------------------------------ */

const KINDS = [
  { value: "video", label: "Vidéo" },
  { value: "fiche", label: "Fiche" },
  { value: "exercice", label: "Exercice" },
  { value: "document", label: "Document" },
];
const KIND_LABEL = Object.fromEntries(KINDS.map((k) => [k.value, k.label]));

function Countdown({ to, prefix, live }) {
  const { colors } = useApp();
  const { label } = useCountdownTo(to);
  const c = live ? colors.danger : colors.primary;
  return (
    <View style={{ alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: alpha(c, 0.14) }}>
      {live ? <Radio size={14} color={c} /> : <CalendarClock size={14} color={c} />}
      <T size={13.5} weight="800" color={c}>{prefix} {label}</T>
    </View>
  );
}

function UploadCard({ cours, onDone }) {
  const { colors } = useApp();
  const [kind, setKind] = useState("video");
  const [titre, setTitre] = useState("");
  const [progress, setProgress] = useState(null);

  const choose = async () => {
    try {
      const [d] = await pick({ type: kind === "video" ? [types.video] : [types.pdf, types.doc, types.docx, types.ppt, types.pptx, types.images] });
      const max = kind === "video" ? 100 : 25;
      if (d.size && d.size > max * 1024 * 1024) {
        toast.error(`${max} Mo maximum.${kind === "video" ? " Coupe ta vidéo en parties de 10 minutes." : ""}`);
        return;
      }
      const fd = new FormData();
      fd.append("fichier", { uri: d.uri, name: d.name ?? (kind === "video" ? "video.mp4" : "document.pdf"), type: d.type ?? (kind === "video" ? "video/mp4" : "application/pdf") });
      fd.append("kind", kind);
      fd.append("titre", titre.trim() || (d.name ?? "").replace(/\.[^.]+$/, ""));
      setProgress(0);
      await coursApi.upload(cours.id, fd, setProgress);
      toast.success("Ressource ajoutée");
      setTitre("");
      onDone();
    } catch (e) {
      if (e?.message && !/cancel/i.test(e.message)) toast.error(e.message);
    } finally {
      setProgress(null);
    }
  };

  return (
    <Card style={{ gap: 12 }}>
      <T size={16} weight="800">Ajouter une ressource</T>
      <Segmented options={KINDS} value={kind} onChange={setKind} />
      <Input value={titre} onChangeText={setTitre} placeholder="Titre (facultatif, ex. Partie 2 : la prophase)" />
      {progress != null ? (
        <View style={{ height: 46, borderRadius: radius.md, overflow: "hidden", backgroundColor: colors.muted, justifyContent: "center" }}>
          <View style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${Math.round(progress * 100)}%`, backgroundColor: colors.primary }} />
          <T center weight="800">Envoi… {Math.round(progress * 100)} %</T>
        </View>
      ) : (
        <Button title={kind === "video" ? "Choisir une vidéo (100 Mo max.)" : "Choisir un fichier (25 Mo max.)"} icon={Upload} block onPress={choose} />
      )}
      <T size={12} muted>Tu peux déposer à l'avance : les élèves ne voient rien avant le début du cours.</T>
    </Card>
  );
}

export function CoursScreen({ route, navigation }) {
  const { id } = route.params;
  const { colors } = useApp();
  const [c, setC] = useState(null);
  const [current, setCurrent] = useState(null);
  const [msg, setMsg] = useState("");

  const load = useCallback(
    () =>
      coursApi
        .get(id)
        .then((d) => {
          setC(d);
          navigation.setOptions({ title: d.titre });
          setCurrent((cur) => cur ?? d.ressources?.find((r) => r.kind === "video" && r.url)?.id ?? null);
        })
        .catch((e) => {
          toast.error(e.message);
          navigation.goBack();
        }),
    [id, navigation],
  );
  useEffect(() => {
    load();
  }, [load]);
  // Début ou fin du cours pendant que l'écran est ouvert : on recharge au bon moment.
  useEffect(() => {
    if (!c) return undefined;
    const target = c.state === "a_venir" ? c.starts_at : c.state === "en_cours" ? c.ends_at : null;
    if (!target) return undefined;
    const ms = new Date(target).getTime() - Date.now() + 1500;
    if (ms > 2 ** 31 - 1) return undefined;
    const t = setTimeout(load, Math.max(1000, ms));
    return () => clearTimeout(t);
  }, [c, load]);

  if (!c) return <Screen><Skeleton height={260} /></Screen>;
  const owner = c.is_owner;
  const videos = c.ressources.filter((r) => r.kind === "video");
  const docs = c.ressources.filter((r) => r.kind !== "video");
  const playing = videos.find((v) => v.id === current && v.url);
  const open = (url) => url && Linking.openURL(url).catch(() => toast.error("Impossible d'ouvrir le lien"));

  return (
    <Screen>
      <FadeIn>
        <Card style={{ gap: 8, borderColor: c.state === "en_cours" ? alpha(colors.danger, 0.6) : colors.border, backgroundColor: c.state === "en_cours" ? alpha(colors.danger, 0.06) : colors.card }}>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
            <CoursBadge c={c} />
            {!owner && c.present ? <Badge label="Présent ✓" tone="success" /> : null}
          </View>
          <T size={22} weight="800">{c.titre}</T>
          <T size={13} muted>{dayLabel(c.starts_at)} · {hhmm(c.starts_at)} – {hhmm(c.ends_at)} · {c.classe.matiere} · {c.classe.prof.display_name}</T>
          {c.description ? <T size={14}>{c.description}</T> : null}
          {c.state === "a_venir" ? <Countdown to={c.starts_at} prefix="Début dans" /> : null}
          {c.state === "en_cours" ? <Countdown to={c.ends_at} prefix="Fin dans" live /> : null}
        </Card>
      </FadeIn>

      {!owner && c.locked && (
        <Card style={{ alignItems: "center", gap: 10, paddingVertical: 24 }}>
          <Pulse>
            <IconBadge icon={Lock} size={60} />
          </Pulse>
          <T size={18} weight="800" center>Ce cours est terminé</T>
          <T muted center size={13.5}>Tu n'étais pas présent : les vidéos et fiches sont réservées aux élèves présents. Tu peux demander l'accès à ton professeur.</T>
          {c.my_request?.status === "pending" ? (
            <Badge label="Demande envoyée, en attente" tone="accent" />
          ) : c.my_request?.status === "refused" ? (
            <Badge label="Demande refusée par le professeur" tone="danger" />
          ) : (
            <View style={{ alignSelf: "stretch", gap: 10 }}>
              <Input value={msg} onChangeText={setMsg} placeholder="Pourquoi tu n'as pas pu suivre (facultatif)" multiline />
              <Button title="Demander l'accès" icon={Send} block onPress={() => coursApi.requestAccess(c.id, msg).then(() => { toast.success("Demande envoyée"); load(); }).catch((e) => toast.error(e.message))} />
            </View>
          )}
        </Card>
      )}

      {!owner && c.state === "a_venir" && (
        <Card style={{ alignItems: "center", gap: 8, paddingVertical: 22 }}>
          <IconBadge icon={CalendarClock} tone="accent" size={56} />
          <T size={17} weight="800" center>Le cours n'a pas encore commencé</T>
          <T muted center size={13.5}>
            {c.ressources_count} ressource(s) prévue(s). Reviens à l'heure : ta présence s'enregistre quand tu ouvres le cours, et c'est elle qui te garde les vidéos après la fin.
          </T>
        </Card>
      )}

      {c.access && (
        <>
          {c.zip_url ? (
            <Button title="Tout télécharger (ZIP)" icon={Download} block size="lg" onPress={() => open(c.zip_url)} />
          ) : null}

          {videos.length > 0 && (
            <>
              <H2>Vidéos ({videos.length})</H2>
              <View style={{ borderRadius: radius.lg, overflow: "hidden", backgroundColor: "#000", aspectRatio: 16 / 9 }}>
                {playing ? (
                  <Video key={playing.id} source={{ uri: playing.url }} style={{ flex: 1 }} controls resizeMode="contain" paused={false}
                    onError={() => toast.error("Lecture impossible. Vérifie ta connexion ou télécharge la vidéo.")} />
                ) : (
                  <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                    <PlayCircle size={40} color="#fff" />
                  </View>
                )}
              </View>
              {videos.map((v, i) => (
                <Card key={v.id} onPress={() => setCurrent(v.id)} style={{ flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderColor: v.id === current ? colors.primary : colors.border }}>
                  <View style={{ width: 28, height: 28, borderRadius: 9, alignItems: "center", justifyContent: "center", backgroundColor: v.id === current ? colors.primary : colors.muted }}>
                    <Text style={{ color: v.id === current ? "#fff" : colors.foreground, fontWeight: "800" }}>{i + 1}</Text>
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <T weight="700" numberOfLines={1}>{v.titre}</T>
                    {v.duration_sec ? <T size={12} muted>{Math.round(v.duration_sec / 60)} min</T> : null}
                  </View>
                  <Pressable onPress={() => open(v.download_url)} hitSlop={8} accessibilityLabel="Télécharger"><Download size={19} color={colors.mutedForeground} /></Pressable>
                  {owner ? (
                    <Pressable hitSlop={8} accessibilityLabel="Supprimer" onPress={() => Alert.alert("Supprimer cette vidéo ?", v.titre, [{ text: "Annuler", style: "cancel" }, { text: "Supprimer", style: "destructive", onPress: () => coursApi.removeRessource(v.id).then(load) }])}>
                      <Trash2 size={19} color={colors.danger} />
                    </Pressable>
                  ) : null}
                </Card>
              ))}
            </>
          )}

          {docs.length > 0 && (
            <>
              <H2>Fiches et exercices ({docs.length})</H2>
              {docs.map((d) => (
                <Card key={d.id} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <IconBadge icon={FileText} tone="info" size={40} />
                  <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
                    <T weight="700" numberOfLines={2}>{d.titre}</T>
                    <Badge label={KIND_LABEL[d.kind] ?? d.kind} />
                  </View>
                  <Pressable onPress={() => open(d.url)} hitSlop={8} accessibilityLabel="Ouvrir"><FileText size={19} color={colors.primary} /></Pressable>
                  <Pressable onPress={() => open(d.download_url)} hitSlop={8} accessibilityLabel="Télécharger"><Download size={19} color={colors.mutedForeground} /></Pressable>
                  {owner ? (
                    <Pressable hitSlop={8} onPress={() => Alert.alert("Supprimer ce fichier ?", d.titre, [{ text: "Annuler", style: "cancel" }, { text: "Supprimer", style: "destructive", onPress: () => coursApi.removeRessource(d.id).then(load) }])}>
                      <Trash2 size={19} color={colors.danger} />
                    </Pressable>
                  ) : null}
                </Card>
              ))}
            </>
          )}

          {c.ressources.length === 0 ? (
            <EmptyState icon={VideoIcon} title="Pas encore de ressource">{owner ? "Ajoute tes vidéos, fiches et exercices ci-dessous." : "Ton professeur n'a encore rien déposé."}</EmptyState>
          ) : null}
        </>
      )}

      {owner && (
        <>
          <UploadCard cours={c} onDone={load} />
          <H2>{`Présence (${c.presents}/${c.members_count})`}</H2>
          {c.presences.length === 0 ? (
            <T muted size={13}>La présence s'enregistre quand un élève ouvre le cours pendant le créneau.</T>
          ) : (
            c.presences.map((p) => (
              <Card key={p.eleve.id} style={{ flexDirection: "row", alignItems: "center", gap: 10, padding: 12 }}>
                <UserCheck size={18} color={p.source === "live" ? colors.success : colors.info} />
                <T weight="700" style={{ flex: 1 }}>{p.eleve.display_name}</T>
                <T size={12} muted>{p.source === "live" ? `à ${hhmm(p.at)}` : "accès ouvert"}</T>
                {p.source === "prof" ? (
                  <Pressable hitSlop={8} onPress={() => coursApi.manageAccess(c.id, p.eleve.id, "revoke").then(setC)}><X size={18} color={colors.danger} /></Pressable>
                ) : null}
              </Card>
            ))
          )}
          {c.demandes_list.length > 0 && (
            <>
              <H2>Demandes d'accès</H2>
              {c.demandes_list.map((d) => (
                <Card key={d.id} style={{ gap: 8 }}>
                  <T weight="800">{d.eleve.display_name}</T>
                  {d.message ? <T size={13} muted>« {d.message} »</T> : null}
                  {d.status === "pending" ? (
                    <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                      <Button title="Ouvrir l'accès" size="sm" icon={Check} onPress={() => coursApi.manageAccess(c.id, d.eleve.id, "accept").then(setC)} />
                      <Button title="Refuser" size="sm" variant="ghost" icon={X} onPress={() => coursApi.manageAccess(c.id, d.eleve.id, "refuse").then(setC)} />
                    </View>
                  ) : (
                    <Badge label={d.status === "accepted" ? "Acceptée" : "Refusée"} tone={d.status === "accepted" ? "success" : "danger"} />
                  )}
                </Card>
              ))}
            </>
          )}
          <Button title="Supprimer le cours" variant="ghost" icon={Trash2} onPress={() => Alert.alert("Supprimer ce cours ?", "Les vidéos et fichiers seront supprimés.", [
            { text: "Annuler", style: "cancel" },
            { text: "Supprimer", style: "destructive", onPress: () => coursApi.remove(c.id).then(() => navigation.goBack()) },
          ])} />
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Users size={14} color={colors.mutedForeground} />
            <T size={12} muted>{formatDate(c.starts_at)}</T>
          </View>
        </>
      )}
    </Screen>
  );
}
