import { Calculator, ChevronDown, Delete, FlaskConical, Quote, Type } from "lucide-react-native";
import { useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useApp } from "../context/AppContext";
import { alpha, radius } from "../theme";
import { T } from "./ui";

// Claviers de symboles (même logique que le site, version compacte pour le téléphone).
const KEYPADS = {
  maths: {
    label: "Maths",
    icon: Calculator,
    keys: ["+", "−", "×", "÷", "=", "≠", "≈", "≤", "≥", "²", "³", "ⁿ", "√", "π", "∞", "( )", "[ ]", "a/b", "∈", "∉", "⊂", "∪", "∩", "∅", "ℝ", "ℕ", "ℤ", "∀", "∃", "⇒", "⇔", "α", "β", "θ", "λ", "Δ", "Σ", "∫", "lim", "→", "°", "⊥", "∥"],
  },
  sciences: {
    label: "Sciences",
    icon: FlaskConical,
    keys: ["→", "⇌", "↑", "↓", "+", "−", "=", "Δ", "(s)", "(l)", "(g)", "(aq)", "₁", "₂", "₃", "₄", "⁺", "⁻", "²", "³", "°C", "mol", "mol/L", "g/mol", "m/s", "N", "J", "W", "V", "A", "Ω", "Pa", "Hz", "pH", "µ", "λ"],
  },
  citation: {
    label: "Citation",
    icon: Quote,
    keys: ["« »", "“ ”", "( )", "[ ]", "[…]", "…", "—", "–", "p. ", "l. ", "v. ", "cf. ", "ibid."],
  },
  texte: {
    label: "Texte",
    icon: Type,
    keys: ["« »", "( )", "…", "—", "’", "à", "â", "ç", "é", "è", "ê", "ë", "î", "ï", "ô", "ù", "û", "œ", "→", "⇒"],
  },
};

const SIGNALS = {
  maths: /calcul|résou|démontr|équation|fonction|dériv|primitive|intégral|limite|matrice|vecteur|triangle|logarithme|racine|factoris|probabilité|suite|théorème|montrer que|\$/i,
  sciences: /réaction|molaire|masse|vitesse|force|pression|énergie|intensité|tension|circuit|ion|atome|molécule|titrage|concentration|solution/i,
  citation: /cit[ez]|citation|extrait|relevez|relever|dans le texte|justifie[rz]? par le texte/i,
};

export function detectAnswerType(q = "") {
  for (const [k, re] of Object.entries(SIGNALS)) if (re.test(q)) return k;
  return "texte";
}

// « ( ) » insère les deux signes et place le curseur au milieu.
const pairOf = (k) => (/^(« »|“ ”|\( \)|\[ \])$/.test(k) ? { text: k.replace(" ", ""), caret: 1 } : k === "a/b" ? { text: "()/()", caret: 1 } : { text: k, caret: k.length });

/** Champ de réponse + clavier de symboles adapté au type de question. */
export function AnswerInput({ value = "", onChange, format, question = "", placeholder = "Rédige ta réponse…", minHeight = 110, editable = true }) {
  const { colors, fs } = useApp();
  const detected = useMemo(() => (KEYPADS[format] ? format : detectAnswerType(question)), [format, question]);
  const [picked, setPicked] = useState(null);
  const [open, setOpen] = useState(detected !== "texte");
  const sel = useRef({ start: value.length, end: value.length });
  const type = picked ?? detected;
  const pad = KEYPADS[type];

  const insert = (k) => {
    const { text, caret } = pairOf(k);
    const { start, end } = sel.current;
    const s = Math.min(start, value.length);
    const e = Math.min(end, value.length);
    onChange(value.slice(0, s) + text + value.slice(e));
    sel.current = { start: s + caret, end: s + caret };
  };
  const erase = () => {
    const { start, end } = sel.current;
    if (start !== end) onChange(value.slice(0, start) + value.slice(end));
    else if (start > 0) onChange(value.slice(0, start - 1) + value.slice(start));
    const p = Math.max(0, start === end ? start - 1 : start);
    sel.current = { start: p, end: p };
  };

  return (
    <View style={{ gap: 8 }}>
      <TextInput
        value={value}
        onChangeText={onChange}
        editable={editable}
        multiline
        textAlignVertical="top"
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        onSelectionChange={(e) => (sel.current = e.nativeEvent.selection)}
        style={{
          minHeight,
          color: colors.foreground,
          fontSize: fs(15),
          lineHeight: fs(15) * 1.55,
          padding: 12,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: colors.borderStrong,
          backgroundColor: colors.surface,
        }}
      />
      <View style={{ borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: alpha(colors.muted, 0.5), overflow: "hidden" }}>
        <Pressable onPress={() => setOpen((o) => !o)} style={{ flexDirection: "row", alignItems: "center", gap: 6, padding: 10 }}>
          <pad.icon size={15} color={colors.primary} />
          <T size={12.5} weight="700" muted style={{ flex: 1 }}>
            Clavier {pad.label.toLowerCase()}
          </T>
          <ChevronDown size={16} color={colors.mutedForeground} style={{ transform: [{ rotate: open ? "180deg" : "0deg" }] }} />
        </Pressable>
        {open && (
          <View style={{ paddingHorizontal: 10, paddingBottom: 10, gap: 8 }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
              {Object.entries(KEYPADS).map(([k, p]) => (
                <Pressable
                  key={k}
                  onPress={() => setPicked(k)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 5,
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: radius.full,
                    backgroundColor: type === k ? alpha(colors.primary, 0.16) : "transparent",
                    borderWidth: 1,
                    borderColor: type === k ? colors.primary : colors.border,
                  }}
                >
                  <p.icon size={13} color={type === k ? colors.primary : colors.mutedForeground} />
                  <Text style={{ color: type === k ? colors.primary : colors.foreground, fontSize: fs(12), fontWeight: "600" }}>{p.label}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
              {pad.keys.map((k) => (
                <Pressable
                  key={k}
                  onPress={() => insert(k)}
                  style={({ pressed }) => ({
                    minWidth: 40,
                    height: 38,
                    paddingHorizontal: 8,
                    borderRadius: 9,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: pressed ? alpha(colors.primary, 0.2) : colors.card,
                    borderWidth: 1,
                    borderColor: colors.border,
                  })}
                >
                  <Text style={{ color: colors.foreground, fontSize: fs(15) }}>{k}</Text>
                </Pressable>
              ))}
              <Pressable
                onPress={erase}
                accessibilityLabel="Effacer"
                style={{ minWidth: 52, height: 38, borderRadius: 9, alignItems: "center", justifyContent: "center", backgroundColor: alpha(colors.danger, 0.15) }}
              >
                <Delete size={17} color={colors.danger} />
              </Pressable>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}
