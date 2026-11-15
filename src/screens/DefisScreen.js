import { useFocusEffect } from "@react-navigation/native";
import { ChevronRight, LogIn, Swords, Trophy } from "lucide-react-native";
import { useCallback, useState } from "react";
import { View } from "react-native";
import { duelApi } from "../api/endpoints";
import { Badge, Button, Card, Chip, ChipRow, Field, H2, H3, Input, PageHero, Row, Screen, Segmented, T, toast } from "../components/ui";
import { BAC_SERIES, matieresFor } from "../config/curriculum";
import { useApp } from "../context/AppContext";
import { formatDate } from "../lib/format";

export default function DefisScreen({ navigation }) {
  const { user, colors } = useApp();
  const [examType, setExamType] = useState(user?.niveau === "3ème" ? "BEPC" : "BAC");
  const [serie, setSerie] = useState(user?.serie || "D");
  const [matiere, setMatiere] = useState("");
  const [count, setCount] = useState(10);
  const [seconds, setSeconds] = useState(20);
  const [code, setCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [history, setHistory] = useState([]);

  useFocusEffect(
    useCallback(() => {
      duelApi.list().then(setHistory).catch(() => {});
    }, []),
  );

  const matieres = matieresFor(examType, examType === "BAC" ? serie : null);

  const create = async () => {
    setCreating(true);
    try {
      const d = await duelApi.create({ exam_type: examType, serie: examType === "BAC" ? serie : "", matiere, count, seconds });
      navigation.navigate("Duel", { code: d.code });
    } catch (e) {
      toast.error(e.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <Screen>
      <PageHero eyebrow="Défis" icon={Swords} title="Défie un camarade" subtitle="Le même quiz, au même moment : le plus rapide et le plus juste gagne." />

      <Card style={{ gap: 10 }}>
        <H3>Rejoindre avec un code</H3>
        <Row>
          <View style={{ flex: 1 }}>
            <Input value={code} onChangeText={(v) => setCode(v.toUpperCase())} placeholder="Ex. K7P2QX" autoCapitalize="characters" maxLength={6} />
          </View>
          <Button title="Rejoindre" icon={LogIn} disabled={code.trim().length !== 6} onPress={() => navigation.navigate("Duel", { code: code.trim() })} />
        </Row>
      </Card>

      <Card style={{ gap: 14 }}>
        <H3>Créer un défi</H3>
        <Segmented options={[{ value: "BAC", label: "BAC" }, { value: "BEPC", label: "BEPC" }]} value={examType} onChange={(v) => { setExamType(v); setMatiere(""); }} />
        {examType === "BAC" && (
          <Field label="Série">
            <ChipRow>
              {BAC_SERIES.map((s) => (
                <Chip key={s.code} label={s.code} active={serie === s.code} onPress={() => { setSerie(s.code); setMatiere(""); }} />
              ))}
            </ChipRow>
          </Field>
        )}
        <Field label="Matière">
          <ChipRow>
            {matieres.map((m) => (
              <Chip key={m} label={m} active={matiere === m} onPress={() => setMatiere(m)} />
            ))}
          </ChipRow>
        </Field>
        <Field label="Nombre de questions">
          <ChipRow>
            {[5, 10, 15, 20].map((n) => (
              <Chip key={n} label={String(n)} active={count === n} onPress={() => setCount(n)} />
            ))}
          </ChipRow>
        </Field>
        <Field label="Temps par question">
          <ChipRow>
            {[10, 20, 30, 45].map((n) => (
              <Chip key={n} label={`${n} s`} active={seconds === n} onPress={() => setSeconds(n)} />
            ))}
          </ChipRow>
        </Field>
        <Button title={matiere ? `Créer le défi de ${matiere}` : "Choisis une matière"} icon={Swords} block size="lg" disabled={!matiere} loading={creating} onPress={create} />
      </Card>

      {history.length > 0 && (
        <>
          <H2>Mes défis</H2>
          {history.map((d) => {
            const me = d.players.find((p) => p.is_me);
            const best = Math.max(...d.players.map((p) => p.score));
            return (
              <Card key={d.code} onPress={() => navigation.navigate("Duel", { code: d.code })} style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <Trophy size={20} color={d.status === "finished" && me?.score === best ? colors.accent : colors.mutedForeground} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <H3 numberOfLines={1}>{d.matiere}</H3>
                  <T size={12.5} muted numberOfLines={1}>
                    {d.players.map((p) => `${p.name} ${p.score}`).join(" · ")} · {formatDate(d.created_at, false)}
                  </T>
                </View>
                <Badge label={d.status === "finished" ? "Terminé" : d.status === "playing" ? "En cours" : "En attente"} tone={d.status === "finished" ? "success" : "accent"} />
                <ChevronRight size={16} color={colors.mutedForeground} />
              </Card>
            );
          })}
        </>
      )}
    </Screen>
  );
}
