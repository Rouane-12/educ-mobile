import { Bell, BellOff, Brain, CheckCheck, MessageCircle, Settings, Sparkles, Swords, Trash2, Trophy } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { Alert, FlatList, RefreshControl, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Card, EmptyState, H3, IconButton, Row, Skeleton, T } from "../components/ui";
import { useApp } from "../context/AppContext";
import { useNotifications } from "../context/NotificationsContext";
import { timeAgo } from "../lib/format";
import { usesPush } from "../lib/notifications";
import { alpha, GUTTER } from "../theme";

const KIND = {
  message: { icon: MessageCircle, tone: "success", label: "Message" },
  duel: { icon: Swords, tone: "danger", label: "Défi" },
  quiz: { icon: Brain, tone: "info", label: "Nouveau quiz" },
  result: { icon: Trophy, tone: "accent", label: "Résultat" },
  reminder: { icon: Bell, tone: "primary", label: "Rappel" },
  system: { icon: Sparkles, tone: "primary", label: "EduBénin" },
};

/** Écran Notifications : tout ce que l'application t'a envoyé, lu ou non. */
export default function NotificationsScreen({ navigation, openTarget }) {
  const { user, colors } = useApp();
  const { items, unread, refresh, markRead, clear } = useNotifications();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    refresh(false);
  }, [refresh]);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Row gap={2}>
          {unread > 0 ? <IconButton icon={CheckCheck} label="Tout marquer comme lu" onPress={() => markRead()} /> : null}
          <IconButton icon={Settings} label="Réglages des notifications" onPress={() => navigation.navigate("Parametres")} />
        </Row>
      ),
    });
  }, [navigation, unread, markRead]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh(false);
    setRefreshing(false);
  }, [refresh]);

  if (!user)
    return (
      <SafeAreaView edges={["bottom"]} style={{ flex: 1, backgroundColor: colors.background, padding: GUTTER }}>
        <EmptyState icon={BellOff} title="Connecte-toi pour recevoir tes notifications" action={<Button title="Se connecter" onPress={() => navigation.navigate("Auth")} />}>
          Messages, défis de tes camarades, nouveaux quiz de tes professeurs… Le rappel de révision quotidien marche même sans compte.
        </EmptyState>
      </SafeAreaView>
    );

  return (
    <SafeAreaView edges={["bottom"]} style={{ flex: 1, backgroundColor: colors.background }}>
      <FlatList
        data={items ?? []}
        keyExtractor={(n) => String(n.id)}
        contentContainerStyle={{ padding: GUTTER, gap: 10, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListHeaderComponent={
          !usesPush() ? (
            <Card style={{ backgroundColor: alpha(colors.info, 0.08), marginBottom: 4 }}>
              <T size={12.5} muted>
                Les notifications arrivent quand l'application est ouverte ou revient au premier plan. Pour les recevoir application fermée, le serveur doit avoir Firebase activé.
              </T>
            </Card>
          ) : null
        }
        ListEmptyComponent={
          items === null ? (
            <View>{[0, 1, 2].map((i) => <Skeleton key={i} height={74} style={{ marginBottom: 10 }} />)}</View>
          ) : (
            <EmptyState icon={Bell} title="Aucune notification">
              Tu seras prévenu ici des nouveaux messages, défis et quiz.
            </EmptyState>
          )
        }
        renderItem={({ item: n }) => {
          const k = KIND[n.kind] ?? KIND.system;
          const c = colors[k.tone];
          return (
            <Card
              onPress={() => {
                if (!n.read) markRead([n.id]);
                openTarget?.(n.data ?? {});
              }}
              style={{ flexDirection: "row", gap: 12, alignItems: "flex-start", backgroundColor: n.read ? colors.card : alpha(colors.primary, 0.07) }}
            >
              <View style={{ width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: alpha(c, 0.15) }}>
                <k.icon size={19} color={c} />
              </View>
              <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                <Row style={{ justifyContent: "space-between" }}>
                  <T size={11.5} weight="700" color={c}>{k.label}</T>
                  <T size={11.5} muted>{timeAgo(n.created_at)}</T>
                </Row>
                <H3 numberOfLines={2}>{n.title}</H3>
                {n.body ? <T size={13.5} muted numberOfLines={3}>{n.body}</T> : null}
              </View>
              {!n.read ? <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: colors.primary, marginTop: 4 }} /> : null}
            </Card>
          );
        }}
        ListFooterComponent={
          items?.length ? (
            <Button
              title="Tout effacer"
              variant="ghost"
              icon={Trash2}
              style={{ alignSelf: "center", marginTop: 10 }}
              onPress={() =>
                Alert.alert("Effacer toutes les notifications ?", "", [
                  { text: "Annuler", style: "cancel" },
                  { text: "Effacer", style: "destructive", onPress: clear },
                ])
              }
            />
          ) : null
        }
      />
    </SafeAreaView>
  );
}
