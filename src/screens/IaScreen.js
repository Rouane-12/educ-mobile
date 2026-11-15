import Clipboard from "@react-native-clipboard/clipboard";
import { pick, types } from "@react-native-documents/picker";
import { BookOpen, Calculator, Camera, Copy, Dna, Feather, FileDown, FileText, History, ImagePlus, MessageSquare, Paperclip, Pencil, Plus, Search, Send, Sparkles, Square, Star, Trash2, User, X } from "lucide-react-native";
import { launchCamera, launchImageLibrary } from "react-native-image-picker";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, FlatList, KeyboardAvoidingView, Linking, Modal, Platform, Pressable, ScrollView, TextInput, View } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiUrl, streamChat } from "../api/client";
import { billingApi, importApi } from "../api/endpoints";
import { ReportButton } from "../components/espace";
import { Markdown } from "../components/Markdown";
import { Button, H2, H3, IconButton, Input, Row, Segmented, Sheet, Spinner, T, toast } from "../components/ui";
import { useApp } from "../context/AppContext";
import { aiHistory, groupByDate, titleFrom } from "../lib/aiHistory";
import { uid } from "../lib/format";
import { localStore } from "../lib/storage";
import { alpha, GUTTER, radius } from "../theme";

const SUGGESTIONS = [
  { icon: Calculator, text: "Explique la limite (sin x)/x en 0" },
  { icon: BookOpen, text: "Résume la Guerre froide en 10 points clés" },
  { icon: Feather, text: "Aide-moi à écrire une dissertation de philosophie" },
  { icon: Dna, text: "Crée-moi un quiz de 5 questions sur la génétique" },
];
const PROF_SUGGESTIONS = [
  { icon: Dna, text: "Prépare une situation d'apprentissage sur la génétique pour une Terminale D" },
  { icon: Calculator, text: "Rédige un devoir de 2 h sur les nombres complexes (Tle C) avec barème" },
  { icon: BookOpen, text: "Propose 10 questions de compréhension sur un texte de Jean Pliya pour la 3e" },
  { icon: Feather, text: "Donne-moi une grille de correction pour une dissertation de philosophie" },
];

function Typing() {
  const { colors } = useApp();
  return (
    <Row gap={6} style={{ paddingVertical: 6 }}>
      <Spinner size={16} />
      <T size={13} muted>EduIA réfléchit…</T>
    </Row>
  );
}

export default function IaScreen({ navigation }) {
  const { user, isProf, colors, fs } = useApp();
  const store = useMemo(() => aiHistory(Boolean(user)), [user]);
  const [history, setHistory] = useState(null);
  const [conv, setConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [q, setQ] = useState("");
  const [renaming, setRenaming] = useState(null);
  const [importing, setImporting] = useState(false);
  const [quota, setQuota] = useState(null);
  const refreshQuota = useCallback(() => {
    if (user) billingApi.status().then(setQuota).catch(() => {});
  }, [user]);
  useEffect(() => {
    refreshQuota();
  }, [refreshQuota]);
  const listRef = useRef(null);
  const abortRef = useRef(null);

  const loadHistory = useCallback(() => {
    store.list().then(setHistory).catch(() => setHistory([]));
  }, [store]);

  useEffect(() => {
    setConv(null);
    setMessages([]);
    loadHistory();
  }, [loadHistory]);

  const newChat = useCallback(() => {
    abortRef.current?.();
    setConv(null);
    setMessages([]);
    setDrawer(false);
  }, []);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Row gap={2}>
          <IconButton icon={History} label="Historique" onPress={() => setDrawer(true)} />
          <IconButton icon={Plus} label="Nouvelle conversation" onPress={newChat} />
        </Row>
      ),
    });
  }, [navigation, newChat]);

  const openChat = async (c) => {
    if (streaming) return;
    try {
      const full = await store.get(c.id);
      if (!full) throw new Error("Conversation introuvable");
      setConv({ id: full.id, title: full.title, created_at: full.created_at });
      setMessages(full.messages.map(({ role, content, attachments, pdf_url }) => ({ role, content, attachments, pdf_url })));
      setDrawer(false);
    } catch (e) {
      toast.error(e.message);
      loadHistory();
    }
  };

  const removeChat = (c) =>
    Alert.alert("Supprimer la conversation ?", c.title, [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          await store.remove(c.id).catch((e) => toast.error(e.message));
          setHistory((h) => h.filter((x) => x.id !== c.id));
          if (conv?.id === c.id) newChat();
        },
      },
    ]);

  const renameChat = async (c, title) => {
    setRenaming(null);
    if (!title.trim() || title === c.title) return;
    await store.rename(c.id, title).catch((e) => toast.error(e.message));
    setHistory((h) => h.map((x) => (x.id === c.id ? { ...x, title: titleFrom(title) } : x)));
    if (conv?.id === c.id) setConv((cv) => ({ ...cv, title: titleFrom(title) }));
  };

  const send = async (text) => {
    const content = text.trim();
    if (!content || streaming) return;
    if (!user) {
      toast.info("Connecte-toi pour discuter avec EduIA (gratuit).");
      navigation.navigate("Auth");
      return;
    }
    let current = conv;
    if (!current) {
      try {
        current = await store.create(content);
        setConv(current);
      } catch {
        current = null;
      }
    }
    const hist = [...messages, { role: "user", content }];
    setMessages([...hist, { role: "assistant", content: "" }]);
    setInput("");
    setStreaming(true);
    let acc = "";
    const write = (c) =>
      setMessages((m) => {
        const copy = m.slice();
        copy[copy.length - 1] = { role: "assistant", content: c };
        return copy;
      });
    const { promise, abort } = streamChat({ messages: hist.map(({ role, content: c }) => ({ role, content: c })), conversation: store.remote ? current?.id : undefined }, (d) => {
      acc += d;
      write(acc);
    });
    abortRef.current = abort;
    try {
      await promise;
    } catch (e) {
      if (e.name === "AbortError") {
        if (!acc) write("_Réponse interrompue._");
      } else if (e.status === 402) {
        setMessages(hist.slice(0, -1));
        setInput(content);
      } else {
        write(`⚠️ ${e.message}`);
        toast.error(e.message);
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
      refreshQuota();
      if (current && acc) {
        await store.save(current, [...hist, { role: "assistant", content: acc }]).catch(() => {});
        loadHistory();
      }
    }
  };

  const filtered = (history ?? []).filter((c) => !q.trim() || c.title.toLowerCase().includes(q.trim().toLowerCase()));

  const renderMsg = ({ item: m, index: i }) => {
    const mine = m.role === "user";
    const last = i === messages.length - 1;
    return (
      <View style={{ flexDirection: mine ? "row-reverse" : "row", gap: 8, alignItems: "flex-start" }}>
        <View style={{ width: 30, height: 30, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: mine ? colors.muted : alpha(colors.primary, 0.16) }}>
          {mine ? <User size={15} color={colors.mutedForeground} /> : <Sparkles size={15} color={colors.primary} />}
        </View>
        <View
          style={{
            flexShrink: 1,
            maxWidth: mine ? "82%" : "88%",
            paddingHorizontal: 13,
            paddingVertical: 9,
            borderRadius: 16,
            borderTopRightRadius: mine ? 4 : 16,
            borderTopLeftRadius: mine ? 16 : 4,
            backgroundColor: mine ? colors.primary : colors.card,
            borderWidth: mine ? 0 : 1,
            borderColor: colors.border,
          }}
        >
          {mine ? (
            <T color="#fff" size={15}>{m.content.replace(/\*\*/g, "")}</T>
          ) : m.content ? (
            <Markdown size={15}>{m.content}</Markdown>
          ) : (
            <Typing />
          )}
          {!mine && m.content && !(streaming && last) ? (
            <Row gap={4} wrap style={{ marginTop: 4 }}>
              {m.pdf_url ? (
                <Button title="Corrigé PDF" size="sm" variant="secondary" icon={FileDown} onPress={() => Linking.openURL(apiUrl(m.pdf_url))} />
              ) : null}
              <IconButton
                icon={Copy}
                size={16}
                label="Copier"
                color={colors.mutedForeground}
                onPress={() => {
                  Clipboard.setString(m.content);
                  toast.success("Copié");
                }}
              />
              <IconButton
                icon={Star}
                size={16}
                label="Favori"
                color={colors.accent}
                onPress={async () => {
                  await localStore.addAiFav({ id: uid(), question: messages[i - 1]?.content ?? "", answer: m.content, date: new Date().toISOString() });
                  toast.success("Réponse ajoutée aux favoris");
                }}
              />
              {user ? <ReportButton type="ai" id={conv?.id ?? "nouvelle"} label="Erreur ?" defaultReason="erreur" /> : null}
            </Row>
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView edges={["bottom"]} style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={90}>
        {conv ? (
          <Pressable onPress={() => setDrawer(true)} style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: GUTTER, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <MessageSquare size={14} color={colors.primary} />
            <T size={13} weight="600" numberOfLines={1} style={{ flex: 1 }}>{conv.title}</T>
          </Pressable>
        ) : null}

        {messages.length === 0 ? (
          <ScrollView contentContainerStyle={{ padding: GUTTER, gap: 14, alignItems: "center", flexGrow: 1, justifyContent: "center" }} keyboardShouldPersistTaps="handled">
            <LinearGradient colors={[colors.primary, colors.accent]} style={{ width: 64, height: 64, borderRadius: 20, alignItems: "center", justifyContent: "center" }}>
              <Sparkles size={30} color="#fff" />
            </LinearGradient>
            <H2 center>Par quoi on commence ?</H2>
            <T muted center>Choisis une suggestion ou écris ta question.</T>
            <View style={{ alignSelf: "stretch", gap: 10 }}>
              {(isProf ? PROF_SUGGESTIONS : SUGGESTIONS).map(({ icon: Icon, text }) => (
                <Pressable
                  key={text}
                  onPress={() => send(text)}
                  style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: pressed ? colors.surfaceHover : colors.card })}
                >
                  <Icon size={18} color={colors.primary} />
                  <T size={14} style={{ flex: 1 }}>{text}</T>
                </Pressable>
              ))}
            </View>
            {history?.length ? (
              <Pressable onPress={() => setDrawer(true)} style={{ flexDirection: "row", gap: 6, alignItems: "center", padding: 8 }}>
                <History size={15} color={colors.primary} />
                <T size={13.5} weight="700" color={colors.primary}>
                  Reprendre une conversation ({history.length})
                </T>
              </Pressable>
            ) : null}
          </ScrollView>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(_, i) => `${conv?.id ?? "new"}-${i}`}
            renderItem={renderMsg}
            contentContainerStyle={{ padding: GUTTER, gap: 14 }}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
            keyboardShouldPersistTaps="handled"
          />
        )}

        <View style={{ paddingHorizontal: GUTTER, paddingTop: 8, paddingBottom: 6, gap: 4, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.background }}>
          {!user ? (
            <Pressable onPress={() => navigation.navigate("Auth")} style={{ padding: 10, borderRadius: radius.md, backgroundColor: alpha(colors.primary, 0.1) }}>
              <T size={13} center>Connecte-toi pour discuter avec EduIA : c'est gratuit (5 questions par jour). <T size={13} weight="800" color={colors.primary}>Se connecter</T></T>
            </Pressable>
          ) : null}
          <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 6, padding: 6, paddingLeft: 6, borderRadius: 22, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.card }}>
            <Pressable
              onPress={() => (user ? setImporting(true) : navigation.navigate("Auth"))}
              disabled={streaming}
              accessibilityLabel="Importer une épreuve ou une photo d'exercice"
              style={{ width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" }}
            >
              <Paperclip size={19} color={colors.mutedForeground} />
            </Pressable>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Pose ta question à EduIA…"
              placeholderTextColor={colors.mutedForeground}
              multiline
              style={{ flex: 1, color: colors.foreground, fontSize: fs(15), maxHeight: 140, paddingVertical: 8 }}
            />
            {streaming ? (
              <Pressable onPress={() => abortRef.current?.()} style={{ width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: colors.danger }}>
                <Square size={16} color="#fff" />
              </Pressable>
            ) : (
              <Pressable onPress={() => send(input)} disabled={!input.trim()} style={{ opacity: input.trim() ? 1 : 0.5 }}>
                <LinearGradient colors={[colors.primary, colors.secondary]} style={{ width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" }}>
                  <Send size={17} color="#fff" />
                </LinearGradient>
              </Pressable>
            )}
          </View>
          <T size={11} muted center>
            EduIA peut se tromper : vérifie les informations importantes.
            {quota && !quota.pass.active ? ` · Aujourd'hui : ${quota.free.chat.left} question(s), ${quota.free.generation.left} import(s) gratuits` : ""}
            {quota?.pass.active ? " · Pass actif 👑" : ""}
          </T>
        </View>
      </KeyboardAvoidingView>

      <ImportSheet
        open={importing}
        onClose={() => setImporting(false)}
        conversationId={store.remote ? conv?.id : undefined}
        onImported={(r) => {
          setImporting(false);
          setConv({ id: r.conversation.id, title: r.conversation.title, created_at: r.conversation.created_at });
          setMessages((m) => (conv?.id === r.conversation.id ? [...m, ...r.messages] : r.messages));
          loadHistory();
          refreshQuota();
        }}
      />

      {/* Historique des conversations */}
      <Modal visible={drawer} animationType="slide" transparent onRequestClose={() => setDrawer(false)}>
        <View style={{ flex: 1, flexDirection: "row" }}>
          <SafeAreaView style={{ width: "86%", maxWidth: 360, backgroundColor: colors.card, borderRightWidth: 1, borderColor: colors.border }}>
            <View style={{ padding: GUTTER, gap: 10, flex: 1 }}>
              <Row style={{ justifyContent: "space-between" }}>
                <H2>Historique</H2>
                <IconButton icon={X} label="Fermer" onPress={() => setDrawer(false)} />
              </Row>
              <Pressable onPress={newChat}>
                <LinearGradient colors={[colors.primary, colors.secondary]} style={{ flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center", padding: 12, borderRadius: radius.md }}>
                  <Plus size={17} color="#fff" />
                  <T weight="700" color="#fff">Nouvelle conversation</T>
                </LinearGradient>
              </Pressable>
              <Input icon={Search} value={q} onChangeText={setQ} placeholder="Rechercher…" />
              <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: 4, paddingBottom: 20 }} keyboardShouldPersistTaps="handled">
                {history === null ? (
                  <T muted center>Chargement…</T>
                ) : filtered.length === 0 ? (
                  <T muted center style={{ padding: 16 }}>
                    {q ? "Aucun résultat." : "Tes conversations apparaîtront ici."}
                  </T>
                ) : (
                  groupByDate(filtered).map((g) => (
                    <View key={g.key} style={{ gap: 2, marginBottom: 8 }}>
                      <T size={11} weight="800" muted style={{ paddingHorizontal: 8, paddingVertical: 4, letterSpacing: 0.6 }}>{g.label.toUpperCase()}</T>
                      {g.items.map((c) => (
                        <View
                          key={c.id}
                          style={{ flexDirection: "row", alignItems: "center", borderRadius: radius.sm, backgroundColor: conv?.id === c.id ? colors.surfaceHover : "transparent", borderLeftWidth: 3, borderLeftColor: conv?.id === c.id ? colors.primary : "transparent" }}
                        >
                          {renaming === c.id ? (
                            <TextInput
                              autoFocus
                              defaultValue={c.title}
                              onSubmitEditing={(e) => renameChat(c, e.nativeEvent.text)}
                              onEndEditing={(e) => renameChat(c, e.nativeEvent.text)}
                              style={{ flex: 1, color: colors.foreground, padding: 8, borderWidth: 1, borderColor: colors.primary, borderRadius: radius.sm, margin: 4 }}
                            />
                          ) : (
                            <Pressable onPress={() => openChat(c)} style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 8, padding: 10 }}>
                              <MessageSquare size={15} color={colors.mutedForeground} />
                              <T size={14} numberOfLines={1} style={{ flex: 1 }}>{c.title}</T>
                            </Pressable>
                          )}
                          <IconButton icon={Pencil} size={15} label="Renommer" color={colors.mutedForeground} onPress={() => setRenaming(c.id)} />
                          <IconButton icon={Trash2} size={15} label="Supprimer" color={colors.mutedForeground} onPress={() => removeChat(c)} />
                        </View>
                      ))}
                    </View>
                  ))
                )}
              </ScrollView>
              {!user ? (
                <View style={{ padding: 10, borderRadius: radius.sm, backgroundColor: alpha(colors.primary, 0.1) }}>
                  <T size={12.5} muted center>Connecte-toi pour retrouver tes conversations sur le site et le téléphone.</T>
                </View>
              ) : null}
            </View>
          </SafeAreaView>
          <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }} onPress={() => setDrawer(false)} />
        </View>
      </Modal>
    </SafeAreaView>
  );
}


const IMPORT_MODES = [
  { value: "corrige", label: "Corrigé" },
  { value: "guide", label: "Guide" },
  { value: "explique", label: "Expliquer" },
];
const IMPORT_HELP = {
  corrige: "Corrigé détaillé question par question, téléchargeable en PDF.",
  guide: "La méthode et des indices, sans les réponses : pour t'entraîner vraiment.",
  explique: "L'exercice expliqué pas à pas (idéal avec une photo de ton cahier).",
};

/** Importer une épreuve (PDF) ou jusqu'à 4 photos d'exercice (appareil photo ou galerie). */
function ImportSheet({ open, onClose, conversationId, onImported }) {
  const { colors } = useApp();
  const [files, setFiles] = useState([]);
  const [mode, setMode] = useState("corrige");
  const [consigne, setConsigne] = useState("");
  const [sending, setSending] = useState(false);

  const addPhotos = async (camera) => {
    const opts = { mediaType: "photo", quality: 0.75, maxWidth: 1800, maxHeight: 1800, selectionLimit: 4 };
    const r = camera ? await launchCamera(opts) : await launchImageLibrary(opts);
    if (r.errorCode) return toast.error(r.errorCode === "camera_unavailable" ? "Appareil photo indisponible" : "Accès aux photos refusé");
    const imgs = (r.assets ?? []).map((a) => ({ uri: a.uri, name: a.fileName ?? "photo.jpg", type: a.type ?? "image/jpeg" }));
    setFiles((f) => [...f.filter((x) => !x.type.includes("pdf")), ...imgs].slice(0, 4));
  };
  const addPdf = async () => {
    try {
      const [d] = await pick({ type: [types.pdf] });
      setFiles([{ uri: d.uri, name: d.name ?? "epreuve.pdf", type: "application/pdf" }]);
    } catch {
      /* annulé */
    }
  };

  const send = async () => {
    setSending(true);
    const fd = new FormData();
    files.forEach((f) => fd.append("files", f));
    fd.append("mode", mode);
    fd.append("consigne", consigne);
    if (conversationId) fd.append("conversation", conversationId);
    try {
      onImported(await importApi.send(fd));
      setFiles([]);
      setConsigne("");
    } catch (e) {
      if (e.status !== 402) toast.error(e.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <Sheet
      open={open}
      onClose={sending ? () => {} : onClose}
      title="Importer une épreuve ou un exercice"
      footer={<Button title={sending ? "EduIA lit ton document…" : "Envoyer à EduIA"} icon={Sparkles} loading={sending} disabled={!files.length} onPress={send} />}
    >
      <Row wrap>
        <Button title="Photo" size="sm" variant="secondary" icon={Camera} onPress={() => addPhotos(true)} />
        <Button title="Galerie" size="sm" variant="secondary" icon={ImagePlus} onPress={() => addPhotos(false)} />
        <Button title="PDF" size="sm" variant="secondary" icon={FileText} onPress={addPdf} />
      </Row>
      {files.length ? (
        files.map((f, i) => (
          <Row key={i}>
            <T size={13} style={{ flex: 1 }} numberOfLines={1}>{f.name}</T>
            <Pressable onPress={() => setFiles((x) => x.filter((_, j) => j !== i))} hitSlop={8}><X size={16} color={colors.mutedForeground} /></Pressable>
          </Row>
        ))
      ) : (
        <T size={13} muted>1 PDF ou jusqu'à 4 photos · 15 Mo maximum.</T>
      )}
      <Segmented options={IMPORT_MODES} value={mode} onChange={setMode} />
      <T size={13} muted>{IMPORT_HELP[mode]}</T>
      <Input value={consigne} onChangeText={setConsigne} placeholder="Précision (ex. seulement l'exercice 2)" />
    </Sheet>
  );
}
