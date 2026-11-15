import { Bell, Moon, Server, Sun, Trash2, Type } from "lucide-react-native";
import { useState } from "react";
import { Alert, Switch, View } from "react-native";
import { getApiBase, setApiBase } from "../api/client";
import { Button, Card, Chip, ChipRow, Field, H3, Input, Row, Screen, Segmented, T, toast } from "../components/ui";
import { DEFAULT_API_URL } from "../config/env";
import { useApp } from "../context/AppContext";
import { showNotification } from "../lib/notifications";
import { localStore } from "../lib/storage";
import { LEGAL } from "./ExtraScreens";

function Toggle({ label, desc, value, onChange }) {
  const { colors } = useApp();
  return (
    <Row style={{ justifyContent: "space-between" }}>
      <View style={{ flex: 1 }}>
        <T weight="600">{label}</T>
        {desc ? <T size={12.5} muted>{desc}</T> : null}
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: colors.primary, false: colors.muted }} thumbColor="#fff" />
    </Row>
  );
}

export default function ParametresScreen({ navigation }) {
  const { settings, setSettings, refreshUser } = useApp();
  const [server, setServer] = useState(getApiBase());

  return (
    <Screen>
      <Card style={{ gap: 14 }}>
        <H3>Apparence</H3>
        <Segmented
          options={[
            { value: "dark", label: "Sombre", icon: Moon },
            { value: "light", label: "Clair", icon: Sun },
          ]}
          value={settings.theme}
          onChange={(theme) => setSettings({ theme })}
        />
        <Field label="Taille du texte">
          <ChipRow>
            {[
              [0.9, "Petit"],
              [1, "Normal"],
              [1.1, "Grand"],
              [1.2, "Très grand"],
            ].map(([v, l]) => (
              <Chip key={v} icon={Type} label={l} active={settings.fontScale === v} onPress={() => setSettings({ fontScale: v })} />
            ))}
          </ChipRow>
        </Field>
      </Card>

      <Card style={{ gap: 14 }}>
        <Row>
          <Bell size={18} color="#ff7a1a" />
          <H3>Notifications</H3>
        </Row>
        <Toggle label="Rappel de révision quotidien" desc={`Chaque jour à ${settings.reminderHour} h`} value={settings.reminder} onChange={(reminder) => setSettings({ reminder })} />
        {settings.reminder && (
          <ChipRow>
            {[7, 12, 17, 18, 19, 20, 21].map((h) => (
              <Chip key={h} label={`${h} h`} active={settings.reminderHour === h} onPress={() => setSettings({ reminderHour: h })} />
            ))}
          </ChipRow>
        )}
        <Toggle label="Nouveaux messages" value={settings.notifMessages} onChange={(notifMessages) => setSettings({ notifMessages })} />
        <Toggle label="Défis" value={settings.notifDuels} onChange={(notifDuels) => setSettings({ notifDuels })} />
        <Toggle label="Nouveaux quiz des profs" value={settings.notifQuiz} onChange={(notifQuiz) => setSettings({ notifQuiz })} />
        <Toggle
          label="Économie de données"
          desc="Moins de vérifications en arrière-plan, données gardées sur le téléphone : idéal avec une petite connexion."
          value={!!settings.dataSaver}
          onChange={(dataSaver) => setSettings({ dataSaver })}
        />
        <Button title="Tester une notification" variant="secondary" size="sm" icon={Bell} onPress={() => showNotification({ title: "EduBénin 🇧🇯", body: "Les notifications fonctionnent sur ce téléphone." })} />
      </Card>

      <Card style={{ gap: 12 }}>
        <Row>
          <Server size={18} color="#3ba9ff" />
          <H3>Serveur</H3>
        </Row>
        <T size={12.5} muted>Adresse du backend EduBénin. Sur un vrai téléphone en développement, mets l'IP de ton PC (ex. http://192.168.1.20:8000).</T>
        <Input value={server} onChangeText={setServer} autoCapitalize="none" keyboardType="url" />
        <Row wrap>
          <Button
            title="Enregistrer"
            size="sm"
            onPress={async () => {
              await setApiBase(server.trim());
              await refreshUser();
              toast.success("Serveur enregistré");
            }}
          />
          <Button
            title="Par défaut"
            size="sm"
            variant="ghost"
            onPress={async () => {
              await setApiBase("");
              setServer(DEFAULT_API_URL);
            }}
          />
        </Row>
      </Card>

      <Card style={{ gap: 6 }}>
        <H3>Informations légales</H3>
        {LEGAL.map(([slug, label]) => (
          <Button key={slug} title={label} size="sm" variant="ghost" onPress={() => navigation.navigate("Legal", { slug })} />
        ))}
      </Card>
      <Button
        title="Effacer les données locales"
        variant="ghost"
        icon={Trash2}
        onPress={() =>
          Alert.alert("Effacer les données du téléphone ?", "Favoris, historique des quiz et réglages seront supprimés.", [
            { text: "Annuler", style: "cancel" },
            {
              text: "Effacer",
              style: "destructive",
              onPress: async () => {
                await localStore.clearAll();
                toast.success("Données effacées");
              },
            },
          ])
        }
      />
    </Screen>
  );
}
