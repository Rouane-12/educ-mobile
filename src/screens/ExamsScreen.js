import { useFocusEffect } from "@react-navigation/native";
import { BookOpen, CalendarDays, ChevronRight, Clock, FilePlus2, GraduationCap, RotateCcw, School, Search, SlidersHorizontal, X } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { examsApi } from "../api/endpoints";
import { FadeIn, IconBadge } from "../components/brand";
import { Badge, Button, Card, Chip, ChipRow, EmptyState, Input, Segmented, Sheet, Skeleton, T } from "../components/ui";
import { ANNEES, BAC_SERIES, formatDuree, matieresFor } from "../config/curriculum";
import { useApp } from "../context/AppContext";
import { alpha, GUTTER, radius } from "../theme";

const cache = new Map();

export function ExamCard({ exam, onPress, index = 0 }) {
  const { colors } = useApp();
  return (
    <FadeIn delay={Math.min(index * 40, 320)} from={12}>
      <Card onPress={onPress} style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 14 }}>
        <IconBadge icon={exam.exam_type === "BEPC" ? School : GraduationCap} tone={exam.exam_type === "BEPC" ? "secondary" : "primary"} size={46} />
        <View style={{ flex: 1, gap: 6, minWidth: 0 }}>
          <T size={15.5} weight="800" numberOfLines={2}>{exam.matiere}</T>
          {exam.titre && exam.titre !== exam.matiere ? (
            <T size={12.5} muted numberOfLines={1}>{exam.titre}</T>
          ) : null}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
            {exam.serie ? <Badge label={`Série ${exam.serie}`} tone="accent" /> : null}
            {exam.session ? <Badge label={exam.session} tone="info" /> : null}
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <CalendarDays size={12} color={colors.mutedForeground} />
              <T size={12.5} muted>{exam.annee}</T>
            </View>
            {exam.duree_minutes ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Clock size={12} color={colors.mutedForeground} />
                <T size={12.5} muted>{formatDuree(exam.duree_minutes)}</T>
              </View>
            ) : null}
          </View>
        </View>
        <ChevronRight size={18} color={colors.mutedForeground} />
      </Card>
    </FadeIn>
  );
}

/** Pastille d'un filtre actif (touchée = filtre retiré). */
function ActiveFilter({ label, onClear }) {
  const { colors } = useApp();
  return (
    <Pressable
      onPress={onClear}
      style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingLeft: 12, paddingRight: 8, paddingVertical: 6, borderRadius: 999, backgroundColor: alpha(colors.primary, 0.14), borderWidth: 1, borderColor: alpha(colors.primary, 0.4), maxWidth: "100%" }}
    >
      <Text numberOfLines={1} style={{ color: colors.primary, fontSize: 12.5, fontWeight: "700", flexShrink: 1 }}>{label}</Text>
      <X size={14} color={colors.primary} />
    </Pressable>
  );
}

export default function ExamsScreen({ navigation, route }) {
  const { colors } = useApp();
  const [examType, setExamType] = useState(route.params?.examType ?? "BAC");
  const [data, setData] = useState(() => cache.get(examType) ?? null);
  const [refreshing, setRefreshing] = useState(false);
  const [q, setQ] = useState("");
  const [serie, setSerie] = useState("");
  const [matiere, setMatiere] = useState("");
  const [annee, setAnnee] = useState("");
  const [sheet, setSheet] = useState(false);

  useEffect(() => {
    if (route.params?.examType) setExamType(route.params.examType);
  }, [route.params?.examType]);

  const load = useCallback(async () => {
    try {
      const d = await examsApi.list({ type: examType });
      cache.set(examType, d);
      setData(d);
    } catch {
      setData((x) => x ?? []);
    }
  }, [examType]);

  useEffect(() => {
    setData(cache.get(examType) ?? null);
    setSerie("");
    setMatiere("");
    load();
  }, [examType, load]);
  useFocusEffect(
    useCallback(() => {
      navigation.setOptions({ title: `Épreuves ${examType}` });
    }, [navigation, examType]),
  );

  const matieres = matieresFor(examType, serie || null);
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (data ?? []).filter(
      (e) =>
        (!serie || e.serie === serie) &&
        (!matiere || e.matiere === matiere) &&
        (!annee || String(e.annee) === annee) &&
        (!needle || `${e.titre} ${e.matiere} ${e.serie ?? ""} ${e.annee}`.toLowerCase().includes(needle)),
    );
  }, [data, q, serie, matiere, annee]);
  const nbFilters = [serie, matiere, annee].filter(Boolean).length;
  const reset = () => {
    setQ("");
    setSerie("");
    setMatiere("");
    setAnnee("");
  };

  const header = (
    <View style={{ gap: 12, paddingBottom: 6 }}>
      <Segmented
        options={[
          { value: "BAC", label: "BAC", icon: GraduationCap },
          { value: "BEPC", label: "BEPC", icon: School },
        ]}
        value={examType}
        onChange={setExamType}
      />
      <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Input icon={Search} value={q} onChangeText={setQ} placeholder={`Rechercher (${examType})…`} returnKeyType="search" />
        </View>
        <Pressable
          onPress={() => setSheet(true)}
          accessibilityLabel="Filtres"
          style={({ pressed }) => ({ height: 48, paddingHorizontal: 14, borderRadius: radius.md, flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderColor: nbFilters ? colors.primary : colors.borderStrong, backgroundColor: pressed ? colors.surfaceHover : nbFilters ? alpha(colors.primary, 0.12) : colors.surface })}
        >
          <SlidersHorizontal size={18} color={nbFilters ? colors.primary : colors.foreground} />
          <Text style={{ color: nbFilters ? colors.primary : colors.foreground, fontWeight: "700", fontSize: 14 }}>Filtres</Text>
          {nbFilters ? (
            <View style={{ minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 5, alignItems: "center", justifyContent: "center", backgroundColor: colors.primary }}>
              <Text style={{ color: "#fff", fontSize: 11, fontWeight: "800" }}>{nbFilters}</Text>
            </View>
          ) : null}
        </Pressable>
      </View>

      {nbFilters ? (
        <ChipRow>
          {serie ? <ActiveFilter label={`Série ${serie}`} onClear={() => setSerie("")} /> : null}
          {matiere ? <ActiveFilter label={matiere} onClear={() => setMatiere("")} /> : null}
          {annee ? <ActiveFilter label={annee} onClear={() => setAnnee("")} /> : null}
        </ChipRow>
      ) : null}

      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <T size={13} muted style={{ flexShrink: 1 }}>
          {data ? `${filtered.length} épreuve${filtered.length > 1 ? "s" : ""}` : "Chargement…"}
        </T>
        <View style={{ flexDirection: "row", gap: 6 }}>
          {q || nbFilters ? <Button title="Effacer" size="sm" variant="ghost" icon={RotateCcw} onPress={reset} /> : null}
          <Button title="Ajouter" size="sm" variant="secondary" icon={FilePlus2} onPress={() => navigation.navigate("Ajouter")} />
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView edges={["bottom"]} style={{ flex: 1, backgroundColor: colors.background }}>
      <FlatList
        data={data ? filtered : []}
        keyExtractor={(e) => String(e.id)}
        contentContainerStyle={{ padding: GUTTER, gap: 10, paddingBottom: 40 }}
        ListHeaderComponent={header}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={colors.primary}
            onRefresh={async () => {
              setRefreshing(true);
              await load();
              setRefreshing(false);
            }}
          />
        }
        renderItem={({ item, index }) => <ExamCard exam={item} index={index} onPress={() => navigation.navigate("ExamDetail", { id: item.id })} />}
        ListEmptyComponent={
          data === null ? (
            <View style={{ gap: 10 }}>
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} height={96} />
              ))}
            </View>
          ) : (
            <EmptyState icon={BookOpen} title="Aucune épreuve trouvée">
              {q || nbFilters ? "Change les filtres ou la recherche." : "La bibliothèque se remplit grâce à la communauté. Ajoute une épreuve depuis le menu Plus."}
            </EmptyState>
          )
        }
      />

      {/* Panneau des filtres : les puces passent à la ligne, rien ne déborde. */}
      <Sheet
        open={sheet}
        onClose={() => setSheet(false)}
        title="Filtrer les épreuves"
        footer={
          <>
            <Button title="Effacer" variant="ghost" icon={RotateCcw} onPress={() => { setSerie(""); setMatiere(""); setAnnee(""); }} />
            <Button title={`Voir ${filtered.length} épreuve${filtered.length > 1 ? "s" : ""}`} onPress={() => setSheet(false)} />
          </>
        }
      >
        {examType === "BAC" && (
          <View style={{ gap: 8 }}>
            <T size={13} weight="800" muted>SÉRIE</T>
            <ChipRow>
              <Chip label="Toutes" active={!serie} onPress={() => setSerie("")} />
              {BAC_SERIES.map((s) => (
                <Chip
                  key={s.code}
                  label={s.code}
                  active={serie === s.code}
                  onPress={() => {
                    setSerie(s.code);
                    if (matiere && !matieresFor(examType, s.code).includes(matiere)) setMatiere("");
                  }}
                />
              ))}
            </ChipRow>
          </View>
        )}
        <View style={{ gap: 8 }}>
          <T size={13} weight="800" muted>MATIÈRE</T>
          <ChipRow>
            <Chip label="Toutes" active={!matiere} onPress={() => setMatiere("")} />
            {matieres.map((m) => (
              <Chip key={m} label={m} active={matiere === m} onPress={() => setMatiere(m)} />
            ))}
          </ChipRow>
        </View>
        <View style={{ gap: 8 }}>
          <T size={13} weight="800" muted>ANNÉE</T>
          <ChipRow>
            <Chip label="Toutes" active={!annee} onPress={() => setAnnee("")} />
            {ANNEES.map((a) => (
              <Chip key={a} label={String(a)} active={annee === String(a)} onPress={() => setAnnee(String(a))} />
            ))}
          </ChipRow>
        </View>
      </Sheet>
    </SafeAreaView>
  );
}
