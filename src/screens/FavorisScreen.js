import { useFocusEffect } from "@react-navigation/native";
import { Sparkles, Star, Trash2 } from "lucide-react-native";
import { useCallback, useState } from "react";
import { View } from "react-native";
import { Markdown } from "../components/Markdown";
import { Card, EmptyState, IconButton, Row, Screen, Segmented, T } from "../components/ui";
import { useApp } from "../context/AppContext";
import { formatDate } from "../lib/format";
import { localStore } from "../lib/storage";
import { ExamCard } from "./ExamsScreen";

export default function FavorisScreen({ navigation }) {
  const { colors } = useApp();
  const [tab, setTab] = useState("exams");
  const [exams, setExams] = useState([]);
  const [ai, setAi] = useState([]);

  useFocusEffect(
    useCallback(() => {
      localStore.favorites().then(setExams);
      localStore.aiFavs().then(setAi);
    }, []),
  );

  return (
    <Screen>
      <Segmented
        options={[
          { value: "exams", label: `Épreuves (${exams.length})`, icon: Star },
          { value: "ai", label: `Réponses EduIA (${ai.length})`, icon: Sparkles },
        ]}
        value={tab}
        onChange={setTab}
      />
      {tab === "exams" ? (
        exams.length ? (
          exams.map((e) => <ExamCard key={e.id} exam={e} onPress={() => navigation.navigate("ExamDetail", { id: e.id })} />)
        ) : (
          <EmptyState icon={Star} title="Aucune épreuve en favori">Touche « Ajouter aux favoris » sur une épreuve pour la retrouver ici.</EmptyState>
        )
      ) : ai.length ? (
        ai.map((f) => (
          <Card key={f.id}>
            <Row style={{ alignItems: "flex-start" }}>
              <View style={{ flex: 1 }}>
                <T weight="700">{f.question}</T>
                <T size={11.5} muted>{formatDate(f.date)}</T>
              </View>
              <IconButton icon={Trash2} size={16} color={colors.mutedForeground} label="Supprimer" onPress={async () => setAi(await localStore.removeAiFav(f.id))} />
            </Row>
            <Markdown size={14}>{f.answer}</Markdown>
          </Card>
        ))
      ) : (
        <EmptyState icon={Sparkles} title="Aucune réponse sauvegardée">Touche l'étoile sous une réponse d'EduIA pour la garder.</EmptyState>
      )}
    </Screen>
  );
}
