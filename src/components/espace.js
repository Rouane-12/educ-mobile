// Composants partagés des nouveaux espaces (classes, révisions, examen blanc, Pass).
import { Flag, Star } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import { communityApi } from "../api/endpoints";
import { useApp } from "../context/AppContext";
import { alpha, radius } from "../theme";
import { Button, Chip, ChipRow, Field, Input, Sheet, T, toast } from "./ui";

export function Stars({ value = 0, onChange, size = 18 }) {
  const { colors } = useApp();
  return (
    <View style={{ flexDirection: "row", gap: 3 }}>
      {[1, 2, 3, 4, 5].map((n) => {
        const on = n <= Math.round(value);
        const icon = <Star size={size} color={on ? colors.accent : colors.borderStrong} fill={on ? colors.accent : "transparent"} />;
        return onChange ? (
          <Pressable key={n} onPress={() => onChange(n)} hitSlop={6} accessibilityLabel={`${n} étoiles`}>{icon}</Pressable>
        ) : (
          <View key={n}>{icon}</View>
        );
      })}
    </View>
  );
}

const REASONS = [
  ["harcelement", "Harcèlement"],
  ["insulte", "Insulte"],
  ["contenu_choquant", "Contenu choquant"],
  ["danger_mineur", "Danger pour un élève"],
  ["spam", "Spam / arnaque"],
  ["triche", "Triche"],
  ["erreur", "Erreur"],
  ["autre", "Autre"],
];

/** Bouton « Signaler » + feuille de signalement (modération). */
export function ReportButton({ type, id, label = "Signaler", defaultReason = "autre" }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(defaultReason);
  const [details, setDetails] = useState("");
  const [sending, setSending] = useState(false);
  return (
    <>
      <Button title={label} size="sm" variant="ghost" icon={Flag} onPress={() => setOpen(true)} />
      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title="Signaler"
        footer={
          <Button
            title="Envoyer"
            icon={Flag}
            loading={sending}
            onPress={async () => {
              setSending(true);
              try {
                const r = await communityApi.report({ target_type: type, target_id: String(id), reason, details });
                toast.success(r.message);
                setOpen(false);
              } catch (e) {
                toast.error(e.message);
              } finally {
                setSending(false);
              }
            }}
          />
        }
      >
        <ChipRow>
          {REASONS.map(([v, l]) => (
            <Chip key={v} label={l} active={reason === v} onPress={() => setReason(v)} />
          ))}
        </ChipRow>
        <Field label="Détails (facultatif)">
          <Input value={details} onChangeText={setDetails} multiline maxLength={2000} />
        </Field>
        <T size={12} muted>Ton signalement est confidentiel.</T>
      </Sheet>
    </>
  );
}

/** Compte à rebours lisible jusqu'à une date. */
export function useCountdownTo(target) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const s = Math.max(0, Math.floor((new Date(target).getTime() - now) / 1000));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  return { s, label: d ? `${d} j ${h} h` : h ? `${h} h ${m} min` : `${m} min ${s % 60} s` };
}

/** Rangée d'onglets d'un espace (ex. Réviser). */
export function SpaceTabs({ items, current, onPress }) {
  const { colors } = useApp();
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      {items.map((it) => {
        const on = it.key === current;
        return (
          <Pressable
            key={it.key}
            onPress={() => onPress(it)}
            style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.full, borderWidth: 1, borderColor: on ? colors.primary : colors.border, backgroundColor: on ? alpha(colors.primary, 0.12) : colors.surface }}
          >
            {it.icon ? <it.icon size={14} color={on ? colors.primary : colors.mutedForeground} /> : null}
            <T size={13} weight="700" color={on ? colors.primary : colors.mutedForeground}>{it.label}</T>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Barre de progression simple (gains, matières). */
export function ProgressBar({ value, max = 100, tone }) {
  const { colors } = useApp();
  const pct = Math.min(100, Math.round((value / Math.max(1, max)) * 100));
  return (
    <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.muted, overflow: "hidden" }}>
      <View style={{ height: 8, width: `${pct}%`, backgroundColor: tone ?? colors.primary }} />
    </View>
  );
}
