import { useFocusEffect } from "@react-navigation/native";
import { MessageCircle, Plus, Search, Users, X } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, RefreshControl, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { authApi, chatApi } from "../api/endpoints";
import { Button, Card, EmptyState, H3, IconButton, Input, Row, Sheet, Skeleton, T, toast } from "../components/ui";
import { useApp } from "../context/AppContext";
import { timeAgo } from "../lib/format";
import { alpha, GUTTER } from "../theme";

export const convTitle = (c, meId) =>
  c.kind === "group" ? c.name || "Groupe d'étude" : c.members.find((m) => m.user_id !== meId)?.display_name ?? "Discussion";

export default function MessagesScreen({ navigation }) {
  const { user, colors } = useApp();
  const [convs, setConvs] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [creating, setCreating] = useState(false);

  const load = useCallback(() => chatApi.list().then(setConvs).catch(() => setConvs((c) => c ?? [])), []);
  useFocusEffect(
    useCallback(() => {
      load();
      const t = setInterval(load, 8000);
      return () => clearInterval(t);
    }, [load]),
  );
  useEffect(() => {
    navigation.setOptions({ headerRight: () => <IconButton icon={Plus} label="Nouvelle discussion" onPress={() => setCreating(true)} /> });
  }, [navigation]);

  return (
    <SafeAreaView edges={["bottom"]} style={{ flex: 1, backgroundColor: colors.background }}>
      <FlatList
        data={convs ?? []}
        keyExtractor={(c) => c.id}
        contentContainerStyle={{ padding: GUTTER, gap: 10 }}
        refreshControl={<RefreshControl refreshing={refreshing} tintColor={colors.primary} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />}
        ListEmptyComponent={
          convs === null ? (
            <View>{[0, 1, 2].map((i) => <Skeleton key={i} height={68} style={{ marginBottom: 10 }} />)}</View>
          ) : (
            <EmptyState icon={MessageCircle} title="Aucune discussion" action={<Button title="Nouvelle discussion" icon={Plus} onPress={() => setCreating(true)} />}>
              Écris à un camarade ou crée un groupe d'étude.
            </EmptyState>
          )
        }
        renderItem={({ item: c }) => (
          <Card onPress={() => navigation.navigate("Chat", { id: c.id, title: convTitle(c, user.id) })} style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View style={{ width: 44, height: 44, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: alpha(c.kind === "group" ? colors.accent : colors.primary, 0.16) }}>
              {c.kind === "group" ? <Users size={20} color={colors.accent} /> : <T weight="800" size={18} color={colors.primary}>{convTitle(c, user.id)[0]?.toUpperCase()}</T>}
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <H3 numberOfLines={1}>{convTitle(c, user.id)}</H3>
              <T size={12.5} muted numberOfLines={1}>
                {c.kind === "group" ? `${c.members.length} membres · ` : ""}
                {timeAgo(c.last_message_at)}
              </T>
            </View>
          </Card>
        )}
      />
      <NewConversation
        open={creating}
        onClose={() => setCreating(false)}
        onCreated={(c) => {
          setCreating(false);
          navigation.navigate("Chat", { id: c.id, title: convTitle(c, user.id) });
        }}
      />
    </SafeAreaView>
  );
}

function NewConversation({ open, onClose, onCreated }) {
  const { colors } = useApp();
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(new Map());
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (q.trim().length < 2) return setResults([]);
    const t = setTimeout(() => authApi.searchUsers(q.trim()).then(setResults).catch(() => setResults([])), 250);
    return () => clearTimeout(t);
  }, [q]);

  const create = async () => {
    setSaving(true);
    try {
      const c = await chatApi.create([...selected.keys()], name);
      setSelected(new Map());
      setQ("");
      setName("");
      onCreated(c);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Nouvelle discussion"
      footer={<Button title={selected.size > 1 ? "Créer le groupe" : "Démarrer"} disabled={!selected.size} loading={saving} onPress={create} />}
    >
      <Input icon={Search} value={q} onChangeText={setQ} placeholder="Nom ou email d'un élève / prof…" autoCapitalize="none" />
      {selected.size > 0 && (
        <Row wrap gap={6}>
          {[...selected.values()].map((u) => (
            <Pressable key={u.id} onPress={() => setSelected((s) => { const n = new Map(s); n.delete(u.id); return n; })} style={{ flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99, backgroundColor: alpha(colors.primary, 0.15) }}>
              <T size={13} color={colors.primary} weight="600">{u.display_name}</T>
              <X size={13} color={colors.primary} />
            </Pressable>
          ))}
        </Row>
      )}
      {selected.size > 1 && <Input value={name} onChangeText={setName} placeholder="Nom du groupe d'étude" />}
      {results.map((u) => (
        <Pressable
          key={u.id}
          onPress={() => setSelected((s) => new Map(s).set(u.id, u))}
          style={{ flexDirection: "row", alignItems: "center", gap: 10, padding: 10, borderRadius: 12, backgroundColor: selected.has(u.id) ? alpha(colors.primary, 0.1) : colors.surface }}
        >
          <T weight="700" style={{ flex: 1 }}>{u.display_name}</T>
          <T size={12} muted>{u.role === "prof" ? "Professeur" : "Élève"}</T>
        </Pressable>
      ))}
    </Sheet>
  );
}
