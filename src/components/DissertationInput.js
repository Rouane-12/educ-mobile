import { ChevronDown, Lightbulb, Maximize2, Minimize2, Plus, Trash2 } from "lucide-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, TextInput, View } from "react-native";
import { KeyboardInset, useKeyboardScroll } from "../lib/keyboard";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApp } from "../context/AppContext";
import { alpha, GUTTER, radius } from "../theme";
import { Button, H2, T } from "./ui";

// Même format que le site : la copie est un texte Markdown avec ### Introduction / Développement / Conclusion.
export const DISSERTATION_MATIERES = ["Français", "Philosophie", "SVT", "Histoire-Géographie"];
const DISSERT_RE =
  /dissert|rédaction|rédige[rz]?\b|production écrite|commentaire (composé|de texte)|essai|sujet de réflexion|argumentez|argumente[rz]?\b|discutez|développe[rz]? (une|un|ta|votre)|exploitation de documents|en une (vingtaine|quinzaine|trentaine) de lignes|introduction.{0,40}conclusion/i;

export function isDissertation({ format, enonce = "", matiere = "" }) {
  if (format === "dissertation") return true;
  if (format && format !== "texte") return false;
  return DISSERTATION_MATIERES.includes(matiere) && DISSERT_RE.test(enonce);
}

const METHODE = {
  Philosophie: {
    intro: "Amène le sujet, pose la problématique, annonce ton plan.",
    dev: "Thèse, antithèse, synthèse : idée directrice, arguments, exemples, auteurs.",
    conclu: "Réponds à la problématique puis ouvre la réflexion.",
    parts: ["Thèse", "Antithèse", "Synthèse"],
  },
  Français: {
    intro: "Amorce, rappel du sujet, problématique, annonce du plan.",
    dev: "Chaque partie : idée directrice, arguments, exemples littéraires précis, transition.",
    conclu: "Bilan et ouverture vers une autre œuvre ou un autre problème.",
    parts: ["Première partie", "Deuxième partie"],
  },
  "Histoire-Géographie": {
    intro: "Contexte (dates, lieux), définitions, problématique, plan.",
    dev: "Parties chronologiques ou thématiques avec dates, chiffres, faits.",
    conclu: "Réponse à la problématique et ouverture.",
    parts: ["Première partie", "Deuxième partie"],
  },
  SVT: {
    intro: "Situe le problème biologique ou géologique, annonce les étapes.",
    dev: "Mécanismes dans l'ordre logique : observations, explications, exemples.",
    conclu: "Synthèse (bilan) et ouverture.",
    parts: ["Première partie", "Deuxième partie"],
  },
};

const H_INTRO = "### Introduction";
const H_CONCLU = "### Conclusion";
const H_PART = /^### Développement\s*(?:—|-)\s*(.*)$/;

function parse(value, defaults) {
  const empty = { intro: "", parts: defaults.map((t) => ({ titre: t, texte: "" })), conclu: "" };
  if (!value?.trim()) return empty;
  if (!value.includes(H_INTRO)) return { ...empty, parts: [{ ...empty.parts[0], texte: value }, ...empty.parts.slice(1)] };
  const out = { intro: "", parts: [], conclu: "" };
  let cur = null;
  for (const line of value.split("\n")) {
    if (line.trim() === H_INTRO) cur = "intro";
    else if (line.trim() === H_CONCLU) cur = "conclu";
    else if (H_PART.test(line)) {
      out.parts.push({ titre: line.match(H_PART)[1].trim(), texte: "" });
      cur = "part";
    } else if (cur === "part") {
      const p = out.parts[out.parts.length - 1];
      p.texte += (p.texte ? "\n" : "") + line;
    } else if (cur) out[cur] += (out[cur] ? "\n" : "") + line;
  }
  const trim = (s) => s.replace(/^\n+|\n+$/g, "");
  return { intro: trim(out.intro), parts: out.parts.length ? out.parts.map((p) => ({ ...p, texte: trim(p.texte) })) : empty.parts, conclu: trim(out.conclu) };
}

function serialize({ intro, parts, conclu }) {
  if (!(intro.trim() || conclu.trim() || parts.some((p) => p.texte.trim()))) return "";
  return [
    H_INTRO,
    intro.trim(),
    "",
    ...parts.flatMap((p, k) => [`### Développement — ${p.titre.trim() || `Partie ${k + 1}`}`, p.texte.trim(), ""]),
    H_CONCLU,
    conclu.trim(),
  ].join("\n");
}

const words = (s) => (s.trim() ? s.trim().split(/\s+/).length : 0);
const ROMAN = ["I", "II", "III", "IV", "V"];

function Area({ value, onChange, placeholder, minHeight }) {
  const { colors, fs } = useApp();
  return (
    <TextInput
      value={value}
      onChangeText={onChange}
      multiline
      scrollEnabled={false}
      textAlignVertical="top"
      placeholder={placeholder}
      placeholderTextColor={colors.mutedForeground}
      style={{
        minHeight,
        color: colors.foreground,
        fontSize: fs(15),
        lineHeight: fs(15) * 1.65,
        padding: 12,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.borderStrong,
        backgroundColor: colors.surface,
      }}
    />
  );
}

function Section({ n, title, color, count, children }) {
  const { colors } = useApp();
  return (
    <View style={{ gap: 8, paddingLeft: 12, borderLeftWidth: 3, borderLeftColor: color }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" }}>
          <T size={11} weight="800" color="#fff">{n}</T>
        </View>
        <T size={15} weight="700" style={{ flex: 1 }}>{title}</T>
        <T size={12} muted>{count} mots</T>
      </View>
      {children}
    </View>
  );
}

/** Espace de rédaction structuré : introduction, développement en parties, conclusion. */
export function DissertationInput({ value = "", onChange, matiere = "" }) {
  const { colors } = useApp();
  const methode = METHODE[matiere] ?? METHODE.Français;
  const [doc, setDoc] = useState(() => parse(value, methode.parts));
  const [tips, setTips] = useState(false);
  const [full, setFull] = useState(false);
  const kb = useKeyboardScroll();
  const lastSent = useRef(value);

  useEffect(() => {
    if (value !== lastSent.current) {
      lastSent.current = value;
      setDoc(parse(value, methode.parts));
    }
  }, [value, methode.parts]);

  const update = (next) => {
    setDoc(next);
    const s = serialize(next);
    lastSent.current = s;
    onChange?.(s);
  };
  const setPart = (k, patch) => update({ ...doc, parts: doc.parts.map((p, i) => (i === k ? { ...p, ...patch } : p)) });
  const total = useMemo(() => words(doc.intro) + words(doc.conclu) + doc.parts.reduce((n, p) => n + words(p.texte), 0), [doc]);

  const body = (
    <View style={{ gap: 16 }}>
      <Section n={1} title="Introduction" color={colors.info} count={words(doc.intro)}>
        <Area value={doc.intro} onChange={(v) => update({ ...doc, intro: v })} placeholder="Amorce, problématique, annonce du plan…" minHeight={100} />
      </Section>
      <Section n={2} title="Développement" color={colors.primary} count={doc.parts.reduce((n, p) => n + words(p.texte), 0)}>
        {doc.parts.map((p, k) => (
          <View key={k} style={{ gap: 6 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <T weight="800" color={colors.primary} style={{ minWidth: 26 }}>{ROMAN[k] ?? k + 1}</T>
              <TextInput
                value={p.titre}
                onChangeText={(t) => setPart(k, { titre: t })}
                placeholder={`Idée directrice de la partie ${k + 1}`}
                placeholderTextColor={colors.mutedForeground}
                style={{ flex: 1, minWidth: 0, color: colors.foreground, fontWeight: "600", paddingVertical: 7, paddingHorizontal: 10, borderRadius: radius.sm, borderWidth: 1, borderStyle: "dashed", borderColor: colors.borderStrong }}
              />
              {doc.parts.length > 1 && (
                <Pressable hitSlop={8} onPress={() => update({ ...doc, parts: doc.parts.filter((_, i) => i !== k) })}>
                  <Trash2 size={16} color={colors.mutedForeground} />
                </Pressable>
              )}
            </View>
            <Area value={p.texte} onChange={(v) => setPart(k, { texte: v })} placeholder="Arguments, exemples, références… puis une transition." minHeight={150} />
          </View>
        ))}
        {doc.parts.length < 5 && (
          <Pressable
            onPress={() => update({ ...doc, parts: [...doc.parts, { titre: "", texte: "" }] })}
            style={{ flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.full, borderWidth: 1, borderStyle: "dashed", borderColor: colors.borderStrong }}
          >
            <Plus size={14} color={colors.mutedForeground} />
            <T size={13} weight="600" muted>Ajouter une partie</T>
          </Pressable>
        )}
      </Section>
      <Section n={3} title="Conclusion" color={colors.success} count={words(doc.conclu)}>
        <Area value={doc.conclu} onChange={(v) => update({ ...doc, conclu: v })} placeholder="Bilan, réponse à la problématique, ouverture…" minHeight={100} />
      </Section>
    </View>
  );

  const bar = (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
      <Pressable
        onPress={() => setTips((t) => !t)}
        style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.full, backgroundColor: alpha(colors.accent, 0.15) }}
      >
        <Lightbulb size={14} color={colors.accent} />
        <T size={12.5} weight="600">Méthode</T>
        <ChevronDown size={14} color={colors.mutedForeground} style={{ transform: [{ rotate: tips ? "180deg" : "0deg" }] }} />
      </Pressable>
      <T size={12.5} muted style={{ marginLeft: "auto" }}>{total} mot{total > 1 ? "s" : ""}</T>
      <Pressable hitSlop={8} onPress={() => setFull((f) => !f)} accessibilityLabel={full ? "Quitter le plein écran" : "Plein écran"}>
        {full ? <Minimize2 size={18} color={colors.foreground} /> : <Maximize2 size={18} color={colors.foreground} />}
      </Pressable>
    </View>
  );

  const tipsView = tips ? (
    <View style={{ gap: 4 }}>
      <T size={13} muted><T size={13} weight="700">Introduction : </T>{methode.intro}</T>
      <T size={13} muted><T size={13} weight="700">Développement : </T>{methode.dev}</T>
      <T size={13} muted><T size={13} weight="700">Conclusion : </T>{methode.conclu}</T>
    </View>
  ) : null;

  return (
    <View style={{ gap: 10, padding: 12, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: alpha(colors.muted, 0.35) }}>
      {bar}
      {tipsView}
      {!full && body}
      {full && <T size={13} muted>Rédaction en plein écran…</T>}
      <Modal visible={full} animationType="slide" onRequestClose={() => setFull(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          <KeyboardInset>
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
            <ScrollView contentContainerStyle={{ padding: GUTTER, gap: 12, paddingBottom: 100 }} {...kb}>
              <H2>Ma copie {matiere ? `· ${matiere}` : ""}</H2>
              {bar}
              {tipsView}
              {body}
            </ScrollView>
            <View style={{ padding: GUTTER, borderTopWidth: 1, borderTopColor: colors.border }}>
              <Button title="Revenir à l'épreuve" icon={Minimize2} block onPress={() => setFull(false)} />
            </View>
          </KeyboardAvoidingView>
          </KeyboardInset>
        </SafeAreaView>
      </Modal>
    </View>
  );
}
