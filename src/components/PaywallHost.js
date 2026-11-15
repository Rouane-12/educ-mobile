import { Crown, Sparkles } from "lucide-react-native";
import { useEffect, useState } from "react";
import { DeviceEventEmitter } from "react-native";
import { useApp } from "../context/AppContext";
import { Button, Row, Sheet, T } from "./ui";

/** S'ouvre partout quand le quota gratuit d'EduIA est atteint (réponse 402 du serveur). */
export function PaywallHost({ navigationRef }) {
  const { colors } = useApp();
  const [info, setInfo] = useState(null);

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener("edubenin:paywall", (data) => setInfo(data ?? {}));
    return () => sub.remove();
  }, []);

  return (
    <Sheet
      open={!!info}
      onClose={() => setInfo(null)}
      title="Passe en illimité"
      footer={
        <>
          <Button title="Plus tard" variant="ghost" onPress={() => setInfo(null)} />
          <Button
            title="Voir le Pass EduIA"
            icon={Crown}
            onPress={() => {
              setInfo(null);
              if (navigationRef.isReady()) navigationRef.navigate("Pass");
            }}
          />
        </>
      }
    >
      <Row style={{ alignItems: "flex-start" }}>
        <Sparkles size={18} color={colors.primary} />
        <T style={{ flex: 1 }}>{info?.error ?? "Ton quota gratuit du jour est atteint."}</T>
      </Row>
      <T size={13} muted>Ton quota gratuit revient demain. Les sujets, quiz des profs, fiches, classes, défis et l'examen blanc restent gratuits.</T>
    </Sheet>
  );
}
