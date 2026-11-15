import { useFocusEffect } from "@react-navigation/native";
import { BookOpen, ChevronRight, Clock, RotateCcw, Search } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, RefreshControl, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { examsApi } from "../api/endpoints";
import { Badge, Button, Card, Chip, EmptyState, H3, Input, Row, Segmented, Skeleton, T } from "../components/ui";
import { ANNEES, BAC_SERIES, formatDuree, matieresFor } from "../config/curriculum";
import { useApp } from "../context/AppContext";
import { GUTTER } from "../theme";

const cache = new Map();

function HScroll({ children }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: GUTTER }}>
      {children}
    </ScrollView>
  );
}

export function ExamCard({ exam, onPress }) {
  const { colors } = useApp();
  return (
    <Card onPress={onPress} style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
      <View style={{ flex: 1, gap: 6, minWidth: 0 }}>
        <Row gap={6} wrap>
          <Badge label={exam.exam_type} />
          {exam.serie ? <Badge label={`Série ${exam.serie}`} tone="accent" /> : null}
          {exam.session ? <Badge label={exam.session} tone="info" /> : null}
        </Row>
        <H3 numberOfLines={2}>{exam.titre || exam.matiere}</H3>
        <Row gap={12} wrap>
          <T size={12.5} muted>
            {exam.matiere} · {exam.annee}
          </T>
          {exam.duree_minutes ? (
            <Row gap={4}>
              <Clock size={12} color={colors.mutedForeground} />
              <T size={12.5} muted>{formatDuree(exam.duree_minutes)}</T>
            </Row>
          ) : null}
        </Row>
      </View>
      <ChevronRight size={18} color={colors.mutedForeground} />
    </Card>
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
  const hasFilter = q || serie || matiere || annee;

  const header = (
    <View style={{ gap: 12, paddingBottom: 6 }}>
      <Segmented
        options={[
          { value: "BAC", label: "BAC" },
          { value: "BEPC", label: "BEPC" },
        ]}
        value={examType}
        onChange={setExamType}
      />
      <Input icon={Search} value={q} onChangeText={setQ} placeholder={`Rechercher une épreuve ${examType}…`} returnKeyType="search" />
      {examType === "BAC" && (
        <HScroll>
          <Chip label="Toutes les séries" active={!serie} onPress={() => setSerie("")} />
          {BAC_SERIES.map((s) => (
            <Chip key={s.code} label={`Série ${s.code}`} active={serie === s.code} onPress={() => setSerie(s.code)} />
          ))}
        </HScroll>
      )}
      <HScroll>
        <Chip label="Toutes les matières" active={!matiere} onPress={() => setMatiere("")} />
        {matieres.map((m) => (
          <Chip key={m} label={m} active={matiere === m} onPress={() => setMatiere(m)} />
        ))}
      </HScroll>
      <HScroll>
        <Chip label="Toutes les années" active={!annee} onPress={() => setAnnee("")} />
        {ANNEES.map((a) => (
          <Chip key={a} label={String(a)} active={annee === String(a)} onPress={() => setAnnee(String(a))} />
        ))}
      </HScroll>
      <Row style={{ justifyContent: "space-between" }}>
        <T size={13} muted>
          {data ? `${filtered.length} épreuve${filtered.length > 1 ? "s" : ""}` : "Chargement…"}
        </T>
        {hasFilter ? (
          <Button
            title="Réinitialiser"
            size="sm"
            variant="ghost"
            icon={RotateCcw}
            onPress={() => {
              setQ("");
              setSerie("");
              setMatiere("");
              setAnnee("");
            }}
          />
        ) : null}
      </Row>
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
        renderItem={({ item }) => <ExamCard exam={item} onPress={() => navigation.navigate("ExamDetail", { id: item.id })} />}
        ListEmptyComponent={
          data === null ? (
            <View style={{ gap: 10 }}>
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} height={92} />
              ))}
            </View>
          ) : (
            <EmptyState icon={BookOpen} title="Aucune épreuve trouvée">
              Change les filtres, ou ajoute une épreuve depuis le site.
            </EmptyState>
          )
        }
      />
    </SafeAreaView>
  );
}
