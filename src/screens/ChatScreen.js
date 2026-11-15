import { Send, ShieldAlert } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, TextInput, View } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { chatApi, communityApi } from "../api/endpoints";
import { IconButton, Spinner, T, toast } from "../components/ui";
import { useApp } from "../context/AppContext";
import { formatDate } from "../lib/format";
import { GUTTER } from "../theme";
import { convTitle } from "./MessagesScreen";

const DUEL_RE = /\/defis\/([A-Z0-9]{6})/;

export default function ChatScreen({ route, navigation }) {
  const { id, title } = route.params;
  const { user, colors, fs } = useApp();
  const [conv, setConv] = useState(null);
  const [msgs, setMsgs] = useState(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);
  const lastRef = useRef(null);

  const append = useCallback((list) => {
    if (!list?.length) return;
    setMsgs((cur) => {
      const seen = new Set((cur ?? []).map((m) => m.id));
      const next = [...(cur ?? []), ...list.filter((m) => !seen.has(m.id))];
      lastRef.current = next[next.length - 1]?.created_at ?? lastRef.current;
      return next;
    });
  }, []);

  useEffect(() => {
    navigation.setOptions({ title: title ?? "Discussion" });
    Promise.all([chatApi.get(id), chatApi.messages(id)])
      .then(([c, m]) => {
        setConv(c);
        const other = c.kind === "direct" ? c.members.find((m) => m.user_id !== user.id) : null;
        navigation.setOptions({
          title: convTitle(c, user.id),
          headerRight: other
            ? () => (
                <IconButton
                  icon={ShieldAlert}
                  label="Bloquer ou signaler"
                  onPress={() =>
                    Alert.alert(other.display_name, "Que veux-tu faire ?", [
                      { text: "Annuler", style: "cancel" },
                      { text: "Signaler", onPress: () => communityApi.report({ target_type: "user", target_id: String(other.user_id), reason: "harcelement" }).then((r) => toast.success(r.message)) },
                      { text: "Bloquer / débloquer", style: "destructive", onPress: () => communityApi.toggleBlock(other.user_id).then((r) => toast.success(r.blocked ? "Bloqué : il ne peut plus t'écrire." : "Débloqué")) },
                    ])
                  }
                />
              )
            : undefined,
        });
        setMsgs([]);
        append(m);
      })
      .catch((e) => toast.error(e.message));
    const t = setInterval(() => lastRef.current && chatApi.messages(id, lastRef.current).then(append).catch(() => {}), 3000);
    return () => clearInterval(t);
  }, [id, navigation, title, user.id, append]);

  const send = async () => {
    const content = text.trim();
    if (!content || sending) return;
    setSending(true);
    setText("");
    try {
      append([await chatApi.send(id, content)]);
    } catch (e) {
      setText(content);
      toast.error(e.message);
    } finally {
      setSending(false);
    }
  };

  const nameOf = (uid) => conv?.members.find((m) => m.user_id === uid)?.display_name ?? "";

  return (
    <SafeAreaView edges={["bottom"]} style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={90}>
        {msgs === null ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <Spinner />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={msgs}
            keyExtractor={(m) => m.id}
            contentContainerStyle={{ padding: GUTTER, gap: 8 }}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
            ListEmptyComponent={<T muted center style={{ marginTop: 40 }}>Écris le premier message 👋</T>}
            renderItem={({ item: m }) => {
              const mine = m.sender_id === user.id;
              const duel = m.content.match(DUEL_RE)?.[1];
              return (
                <View style={{ alignSelf: mine ? "flex-end" : "flex-start", maxWidth: "84%", gap: 2 }}>
                  {!mine && conv?.kind === "group" ? <T size={11.5} weight="700" color={colors.primary}>{nameOf(m.sender_id)}</T> : null}
                  <Pressable
                    disabled={!duel}
                    onPress={() => duel && navigation.navigate("Duel", { code: duel })}
                    style={{
                      paddingHorizontal: 13,
                      paddingVertical: 9,
                      borderRadius: 16,
                      borderBottomRightRadius: mine ? 4 : 16,
                      borderBottomLeftRadius: mine ? 16 : 4,
                      backgroundColor: mine ? colors.primary : colors.card,
                      borderWidth: mine ? 0 : 1,
                      borderColor: colors.border,
                    }}
                  >
                    <T size={15} color={mine ? "#fff" : colors.foreground}>{m.content}</T>
                    {duel ? <T size={12.5} weight="800" color={mine ? "#fff" : colors.primary}>⚔️ Toucher pour rejoindre le défi</T> : null}
                  </Pressable>
                  <T size={10.5} muted style={{ alignSelf: mine ? "flex-end" : "flex-start" }}>{formatDate(m.created_at)}</T>
                </View>
              );
            }}
          />
        )}
        <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 8, padding: 10, borderTopWidth: 1, borderTopColor: colors.border }}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Écris un message…"
            placeholderTextColor={colors.mutedForeground}
            multiline
            style={{ flex: 1, maxHeight: 120, color: colors.foreground, fontSize: fs(15), paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.card }}
          />
          <Pressable onPress={send} disabled={!text.trim()} style={{ opacity: text.trim() ? 1 : 0.5 }}>
            <LinearGradient colors={[colors.primary, colors.secondary]} style={{ width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" }}>
              <Send size={18} color="#fff" />
            </LinearGradient>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
