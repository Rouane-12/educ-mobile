import { Headphones, Mic, Play, User } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Linking, View } from "react-native";
import { apiUrl } from "../api/client";
import { audioApi } from "../api/endpoints";
import { Badge, Button, Card, Chip, ChipRow, EmptyState, H3, Row, Screen, Skeleton, T, toast } from "../components/ui";
import { useApp } from "../context/AppContext";

export default function AudiosScreen() {
  const { colors } = useApp();
  const [audios, setAudios] = useState(null);
  const [matiere, setMatiere] = useState("");

  useEffect(() => {
    audioApi.list().then(setAudios).catch(() => setAudios([]));
  }, []);

  const matieres = [...new Set((audios ?? []).map((a) => a.matiere))];
  const shown = (audios ?? []).filter((a) => !matiere || a.matiere === matiere);

  return (
    <Screen>
      {matieres.length > 1 && (
        <ChipRow>
          <Chip label="Toutes" active={!matiere} onPress={() => setMatiere("")} />
          {matieres.map((m) => (
            <Chip key={m} label={m} active={matiere === m} onPress={() => setMatiere(m)} />
          ))}
        </ChipRow>
      )}
      {audios === null ? (
        [0, 1, 2].map((i) => <Skeleton key={i} height={110} />)
      ) : shown.length === 0 ? (
        <EmptyState icon={Mic} title="Aucun audio pour le moment">Tes professeurs publient leurs explications audio depuis le site.</EmptyState>
      ) : (
        shown.map((a) => (
          <Card key={a.id}>
            <Row gap={6} wrap>
              <Badge label={a.matiere} />
              <Badge label={`${a.niveau}${a.serie ? ` ${a.serie}` : ""}`} tone="accent" />
            </Row>
            <H3>{a.titre}</H3>
            {a.description ? <T size={13.5} muted>{a.description}</T> : null}
            <Row style={{ justifyContent: "space-between" }} wrap>
              <Row gap={5}>
                <User size={13} color={colors.mutedForeground} />
                <T size={12.5} muted>{a.author}</T>
              </Row>
              <Button title="Écouter" size="sm" icon={Play} onPress={() => Linking.openURL(apiUrl(a.audio_url)).catch(() => toast.error("Impossible de lire l'audio"))} />
            </Row>
          </Card>
        ))
      )}
      <View style={{ alignItems: "center" }}>
        <Headphones size={16} color={colors.mutedForeground} />
      </View>
    </Screen>
  );
}
