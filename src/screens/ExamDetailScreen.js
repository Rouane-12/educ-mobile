import { CalendarDays, Clock, Download, FileText, Hash, Share2, Star } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Linking, Share, View } from "react-native";
import { apiUrl } from "../api/client";
import { examsApi } from "../api/endpoints";
import { Badge, Button, Card, EmptyState, H1, Row, Screen, Skeleton, T, toast } from "../components/ui";
import { formatDuree } from "../config/curriculum";
import { useApp } from "../context/AppContext";
import { localStore } from "../lib/storage";

export default function ExamDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const { colors } = useApp();
  const [exam, setExam] = useState(undefined);
  const [fav, setFav] = useState(false);

  useEffect(() => {
    examsApi
      .get(id)
      .then((e) => {
        setExam(e);
        navigation.setOptions({ title: `${e.matiere} ${e.annee}` });
      })
      .catch(() => setExam(null));
    localStore.favorites().then((f) => setFav(f.some((e) => e.id === id)));
  }, [id, navigation]);

  if (exam === undefined)
    return (
      <Screen>
        <Skeleton height={34} />
        <Skeleton height={18} style={{ width: "50%" }} />
        <Skeleton height={220} />
      </Screen>
    );
  if (!exam)
    return (
      <Screen>
        <EmptyState icon={FileText} title="Épreuve introuvable" />
      </Screen>
    );

  const pdf = apiUrl(exam.pdf_url);
  const Info = ({ icon: Icon, label }) => (
    <Row gap={6}>
      <Icon size={15} color={colors.mutedForeground} />
      <T size={13.5} muted>{label}</T>
    </Row>
  );

  return (
    <Screen>
      <Row gap={6} wrap>
        <Badge label={exam.exam_type} />
        {exam.serie ? <Badge label={`Série ${exam.serie}`} tone="accent" /> : null}
        {exam.session ? <Badge label={exam.session} tone="info" /> : null}
      </Row>
      <H1>{exam.titre || exam.matiere}</H1>
      <View style={{ gap: 8 }}>
        <Info icon={FileText} label={exam.matiere} />
        <Info icon={CalendarDays} label={`Session ${exam.annee}`} />
        {exam.duree_minutes ? <Info icon={Clock} label={`Durée : ${formatDuree(exam.duree_minutes)}`} /> : null}
        {exam.coefficient ? <Info icon={Hash} label={`Coefficient ${exam.coefficient}`} /> : null}
      </View>

      <Card glow style={{ alignItems: "center", gap: 12, paddingVertical: 24 }}>
        <FileText size={40} color={colors.primary} />
        <T center muted size={14}>Le sujet s'ouvre dans le lecteur PDF de ton téléphone.</T>
        <Button title="Ouvrir le sujet (PDF)" icon={Download} block onPress={() => Linking.openURL(pdf).catch(() => toast.error("Impossible d'ouvrir le PDF"))} />
      </Card>

      <Row wrap>
        <Button
          title={fav ? "Dans mes favoris" : "Ajouter aux favoris"}
          variant="secondary"
          icon={Star}
          onPress={async () => {
            const on = await localStore.toggleFavorite({
              id: exam.id,
              titre: exam.titre,
              matiere: exam.matiere,
              annee: exam.annee,
              exam_type: exam.exam_type,
              serie: exam.serie,
              session: exam.session,
              duree_minutes: exam.duree_minutes,
            });
            setFav(on);
            toast.success(on ? "Ajouté aux favoris" : "Retiré des favoris");
          }}
        />
        <Button title="Partager" variant="outline" icon={Share2} onPress={() => Share.share({ message: `${exam.titre} — ${pdf}` })} />
      </Row>
    </Screen>
  );
}
