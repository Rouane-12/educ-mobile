import { useFocusEffect } from "@react-navigation/native";
import { BarChart3, Clock, Flame, Target, Trophy } from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import { View } from "react-native";
import { Button, Card, EmptyState, H2, H3, Row, Screen, T } from "../components/ui";
import { useApp } from "../context/AppContext";
import { formatDate } from "../lib/format";
import { localStore } from "../lib/storage";
import { alpha } from "../theme";

function Stat({ icon: Icon, label, value, tone }) {
  const { colors } = useApp();
  const c = colors[tone] ?? colors.primary;
  return (
    <Card style={{ flexBasis: "47%", flexGrow: 1, gap: 6 }}>
      <View style={{ width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: alpha(c, 0.15) }}>
        <Icon size={17} color={c} />
      </View>
      <T size={22} weight="900" numberOfLines={1} adjustsFontSizeToFit>{value}</T>
      <T size={12} muted>{label}</T>
    </Card>
  );
}

export default function ProgressionScreen({ navigation }) {
  const { colors } = useApp();
  const [history, setHistory] = useState(null);
  useFocusEffect(
    useCallback(() => {
      localStore.quizHistory().then(setHistory);
    }, []),
  );

  const stats = useMemo(() => {
    const h = history ?? [];
    if (!h.length) return null;
    const pct = (r) => (r.score / r.total) * 100;
    const byMat = {};
    for (const r of h) (byMat[r.matiere] ??= []).push(pct(r));
    const mats = Object.entries(byMat)
      .map(([m, l]) => ({ m, avg: Math.round(l.reduce((a, b) => a + b, 0) / l.length), n: l.length }))
      .sort((a, b) => b.avg - a.avg);
    return {
      total: h.length,
      avg: Math.round(h.reduce((s, r) => s + pct(r), 0) / h.length),
      time: Math.round(h.reduce((s, r) => s + (r.durationSec || 0), 0) / 60),
      best: mats[0]?.m ?? "-",
      mats,
    };
  }, [history]);

  if (history && !stats)
    return (
      <Screen>
        <EmptyState icon={BarChart3} title="Pas encore de résultats" action={<Button title="Faire un quiz" onPress={() => navigation.navigate("Tabs", { screen: "QuizTab" })} />}>
          Termine un quiz ou une épreuve : ta progression s'affichera ici.
        </EmptyState>
      </Screen>
    );
  if (!stats) return <Screen />;

  return (
    <Screen>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
        <Stat icon={Trophy} label="Quiz réalisés" value={stats.total} />
        <Stat icon={Target} label="Score moyen" value={`${stats.avg} %`} tone="accent" />
        <Stat icon={Clock} label="Temps total" value={`${stats.time} min`} tone="secondary" />
        <Stat icon={Flame} label="Meilleure matière" value={stats.best} tone="success" />
      </View>

      <H2>Par matière</H2>
      <Card style={{ gap: 12 }}>
        {stats.mats.map((x) => (
          <View key={x.m} style={{ gap: 5 }}>
            <Row style={{ justifyContent: "space-between" }}>
              <T weight="600" numberOfLines={1} style={{ flex: 1 }}>{x.m}</T>
              <T size={13} muted>{x.avg} % · {x.n} quiz</T>
            </Row>
            <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.muted, overflow: "hidden" }}>
              <View style={{ height: 8, width: `${x.avg}%`, backgroundColor: x.avg >= 70 ? colors.success : x.avg >= 50 ? colors.accent : colors.danger }} />
            </View>
          </View>
        ))}
      </Card>

      <H2>Historique</H2>
      {history.slice(0, 40).map((r) => (
        <Card key={r.id} style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <H3 numberOfLines={1}>{r.matiere}</H3>
            <T size={12} muted numberOfLines={1}>{r.sa} · {formatDate(r.date)}</T>
          </View>
          <T weight="900" color={r.score / r.total >= 0.5 ? colors.success : colors.danger}>
            {r.score}/{r.total}
          </T>
        </Card>
      ))}
    </Screen>
  );
}
