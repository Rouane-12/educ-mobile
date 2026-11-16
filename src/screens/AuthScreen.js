import { ArrowLeft, ArrowRight, BookOpen, Check, GraduationCap, KeyRound, Lock, Mail, MailCheck, School, Sparkles, User, UsersRound } from "lucide-react-native";
import { useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { authApi } from "../api/endpoints";
import { Blob, FadeIn, IMAGES, LogoMark, Photo, Pulse, Wordmark } from "../components/brand";
import { Button, Card, Input, Segmented, T, toast } from "../components/ui";
import { useApp } from "../context/AppContext";
import { googleIdToken } from "../lib/google";
import { registerPush } from "../lib/notifications";
import { alpha, GUTTER, radius } from "../theme";

const PERKS = [
  { icon: BookOpen, label: "Épreuves" },
  { icon: Sparkles, label: "EduIA" },
  { icon: UsersRound, label: "Classes" },
];

/** Logo Google officiel (4 couleurs). */
function GoogleG({ size = 20 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.9z" />
      <Path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <Path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <Path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9z" />
    </Svg>
  );
}

function GoogleButton({ onPress, loading, label }) {
  const { colors } = useApp();
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      accessibilityRole="button"
      style={({ pressed }) => ({
        height: 52,
        borderRadius: radius.md,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        backgroundColor: "#ffffff",
        borderWidth: 1,
        borderColor: colors.borderStrong,
        opacity: loading ? 0.7 : 1,
        transform: [{ scale: pressed ? 0.98 : 1 }],
      })}
    >
      {loading ? <ActivityIndicator color="#1f1f1f" /> : <GoogleG />}
      <Text style={{ color: "#1f1f1f", fontWeight: "700", fontSize: 15 }}>{label}</Text>
    </Pressable>
  );
}

function RoleCard({ active, icon: Icon, title, desc, onPress }) {
  const { colors } = useApp();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        padding: 12,
        gap: 6,
        borderRadius: radius.md,
        borderWidth: 1.5,
        borderColor: active ? colors.primary : colors.border,
        backgroundColor: active ? alpha(colors.primary, 0.12) : colors.surface,
        transform: [{ scale: pressed ? 0.98 : 1 }],
      })}
    >
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Icon size={20} color={active ? colors.primary : colors.mutedForeground} />
        <View style={{ width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: active ? colors.primary : colors.borderStrong, alignItems: "center", justifyContent: "center", backgroundColor: active ? colors.primary : "transparent" }}>
          {active ? <Check size={11} color="#fff" /> : null}
        </View>
      </View>
      <T size={14.5} weight="800">{title}</T>
      <T size={12} muted>{desc}</T>
    </Pressable>
  );
}

/** Connexion / inscription / mot de passe oublié (même compte que sur le site). */
export default function AuthScreen({ navigation }) {
  const { signIn, colors } = useApp();
  const [mode, setMode] = useState("signin");
  const [role, setRole] = useState("eleve");
  const [form, setForm] = useState({ email: "", password: "", confirm: "", name: "" });
  const [loading, setLoading] = useState(false);
  const [gLoading, setGLoading] = useState(false);
  const [sent, setSent] = useState(null);
  const [terms, setTerms] = useState(false);
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const run = async (fn) => {
    setLoading(true);
    try {
      await fn();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const finish = async (payload, msg) => {
    await signIn(payload);
    registerPush();
    toast.success(msg);
    if (navigation.canGoBack()) navigation.goBack();
  };

  const google = async () => {
    setGLoading(true);
    try {
      const credential = await googleIdToken();
      if (!credential) return;
      await finish(await authApi.google(credential, role), "Connexion réussie");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setGLoading(false);
    }
  };

  const submit = () =>
    run(async () => {
      if (!form.email.trim()) throw new Error("Saisis ton email");
      if (mode === "signin") {
        try {
          await finish(await authApi.login(form.email.trim(), form.password), "Connexion réussie");
        } catch (e) {
          if (e.data?.code === "email_not_verified") {
            setSent("signup");
            return;
          }
          throw e;
        }
      } else if (mode === "signup") {
        if (form.password.length < 6) throw new Error("Mot de passe : 6 caractères minimum");
        if (form.password !== form.confirm) throw new Error("Les deux mots de passe ne sont pas identiques.");
        if (!terms) throw new Error("Accepte les conditions d'utilisation pour créer ton compte.");
        try {
          await authApi.register({
            email: form.email.trim(),
            password: form.password,
            password_confirm: form.confirm,
            display_name: form.name.trim(),
            role,
            accept_terms: true,
          });
          setSent("signup");
        } catch (e) {
          if (e.status === 409) setMode("signin");
          throw e;
        }
      } else {
        await authApi.forgot(form.email.trim());
        setSent("forgot");
      }
    });

  if (sent)
    return (
      <SafeAreaView edges={["bottom"]} style={{ flex: 1, backgroundColor: colors.background, justifyContent: "center", padding: GUTTER, overflow: "hidden" }}>
        <Blob size={260} color={alpha(colors.primary, 0.25)} style={{ top: -60, right: -90 }} />
        <FadeIn>
          <Card glow style={{ alignItems: "center", gap: 14, paddingVertical: 30 }}>
            <Pulse>
              <View style={{ width: 76, height: 76, borderRadius: 26, alignItems: "center", justifyContent: "center", backgroundColor: alpha(colors.primary, 0.16) }}>
                <MailCheck size={36} color={colors.primary} />
              </View>
            </Pulse>
            <T size={22} weight="800" center>Vérifie ta boîte mail</T>
            <T muted center>
              {sent === "signup"
                ? `Nous avons envoyé un lien de confirmation à ${form.email}. Clique dessus, puis reviens te connecter.`
                : `Si un compte existe pour ${form.email}, tu vas recevoir un lien pour choisir un nouveau mot de passe.`}
            </T>
            <T size={12.5} muted center>Rien reçu ? Regarde dans les spams ou « Promotions ».</T>
            {sent === "signup" ? (
              <Button title="Renvoyer l'email" variant="secondary" onPress={() => run(async () => { await authApi.resend(form.email.trim()); toast.success("Email renvoyé"); })} />
            ) : null}
            <Button
              title="Revenir à la connexion"
              icon={ArrowLeft}
              onPress={() => {
                setSent(null);
                setMode("signin");
              }}
            />
          </Card>
        </FadeIn>
      </SafeAreaView>
    );

  const title = mode === "signin" ? "Bon retour 👋" : mode === "signup" ? "Crée ton compte" : "Mot de passe oublié";
  const subtitle =
    mode === "signin"
      ? "Connecte-toi pour retrouver tes révisions, tes classes et EduIA."
      : mode === "signup"
        ? "Élève ou professeur, l'inscription est gratuite."
        : "Saisis ton email : tu recevras un lien pour le changer.";

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Bandeau photo */}
        <Photo uri={IMAGES.auth} style={{ height: 250 }}>
          <Blob size={200} color={alpha(colors.primary, 0.35)} style={{ top: -70, right: -60 }} />
          <View style={{ flex: 1, justifyContent: "flex-end", padding: GUTTER, gap: 12 }}>
            <FadeIn from={10}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <LogoMark size={38} />
                <Wordmark size={21} light />
              </View>
            </FadeIn>
            <FadeIn delay={120}>
              <Text style={{ color: "#fff", fontSize: 25, fontWeight: "800", lineHeight: 31 }}>
                Un compte,{"\n"}
                <Text style={{ color: colors.primary }}>toute ta prépa.</Text>
              </Text>
            </FadeIn>
            <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
              {PERKS.map((p, i) => {
                const Icon = p.icon;
                return (
                  <FadeIn key={p.label} delay={220 + i * 90} from={10}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: "rgba(16,13,11,0.7)", borderWidth: 1, borderColor: "rgba(255,255,255,0.14)" }}>
                      <Icon size={13} color={colors.primary} />
                      <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>{p.label}</Text>
                    </View>
                  </FadeIn>
                );
              })}
            </View>
          </View>
        </Photo>

        {/* Formulaire */}
        <FadeIn delay={180} from={30} style={{ marginTop: -22, paddingHorizontal: GUTTER }}>
          <View style={{ backgroundColor: colors.card, borderRadius: 26, borderWidth: 1, borderColor: colors.border, padding: 18, gap: 14, elevation: 6, shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 20 }}>
            <View style={{ gap: 4 }}>
              <T size={23} weight="800">{title}</T>
              <T size={13.5} muted>{subtitle}</T>
            </View>

            {mode !== "forgot" && (
              <Segmented
                options={[
                  { value: "signin", label: "Connexion" },
                  { value: "signup", label: "Inscription" },
                ]}
                value={mode}
                onChange={setMode}
              />
            )}

            {mode === "signup" && (
              <FadeIn from={10} style={{ gap: 12 }}>
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <RoleCard active={role === "eleve"} icon={School} title="Élève" desc="BAC ou BEPC" onPress={() => setRole("eleve")} />
                  <RoleCard active={role === "prof"} icon={GraduationCap} title="Professeur" desc="Classes et devoirs" onPress={() => setRole("prof")} />
                </View>
                <Input icon={User} value={form.name} onChangeText={set("name")} placeholder="Ton nom ou pseudo" autoComplete="name" />
              </FadeIn>
            )}

            <Input icon={Mail} value={form.email} onChangeText={set("email")} placeholder="Email" keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
            {mode !== "forgot" && (
              <Input
                icon={Lock}
                value={form.password}
                onChangeText={set("password")}
                placeholder={mode === "signup" ? "Mot de passe (6 caractères minimum)" : "Mot de passe"}
                secureTextEntry
                autoCapitalize="none"
                autoComplete={mode === "signin" ? "password" : "new-password"}
                onSubmitEditing={mode === "signin" ? submit : undefined}
              />
            )}
            {mode === "signup" && (
              <>
                <Input icon={Lock} value={form.confirm} onChangeText={set("confirm")} placeholder="Confirme le mot de passe" secureTextEntry autoCapitalize="none" autoComplete="new-password" />
                {form.confirm && form.confirm !== form.password ? (
                  <T size={12.5} color={colors.danger}>Les deux mots de passe ne sont pas identiques.</T>
                ) : null}
                <Pressable onPress={() => setTerms((t) => !t)} style={{ flexDirection: "row", gap: 10, alignItems: "flex-start" }}>
                  <View style={{ width: 22, height: 22, borderRadius: 7, borderWidth: 2, borderColor: terms ? colors.primary : colors.borderStrong, backgroundColor: terms ? colors.primary : "transparent", alignItems: "center", justifyContent: "center", marginTop: 2 }}>
                    {terms ? <Check size={14} color="#fff" /> : null}
                  </View>
                  <T size={13} muted style={{ flex: 1 }}>
                    J'accepte les{" "}
                    <T size={13} color={colors.primary} weight="700" onPress={() => navigation.navigate("Legal", { slug: "conditions-utilisation" })}>conditions d'utilisation</T> et la{" "}
                    <T size={13} color={colors.primary} weight="700" onPress={() => navigation.navigate("Legal", { slug: "confidentialite" })}>politique de confidentialité</T>. Si je suis mineur, j'ai l'accord de mes parents.
                  </T>
                </Pressable>
              </>
            )}

            <Button
              title={mode === "signin" ? "Se connecter" : mode === "signup" ? "Créer mon compte" : "Recevoir le lien"}
              iconRight={ArrowRight}
              block
              size="lg"
              loading={loading}
              disabled={mode === "signup" && !terms}
              onPress={submit}
            />

            {mode === "signin" ? (
              <Pressable onPress={() => setMode("forgot")} style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 4 }}>
                <KeyRound size={15} color={colors.primary} />
                <T color={colors.primary} weight="700" size={14}>Mot de passe oublié ?</T>
              </Pressable>
            ) : mode === "forgot" ? (
              <Pressable onPress={() => setMode("signin")} style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 4 }}>
                <ArrowLeft size={15} color={colors.primary} />
                <T color={colors.primary} weight="700" size={14}>Revenir à la connexion</T>
              </Pressable>
            ) : null}

            {mode !== "forgot" && (
              <>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
                  <T size={12.5} muted>ou</T>
                  <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
                </View>
                <GoogleButton onPress={google} loading={gLoading} label={mode === "signup" ? "S'inscrire avec Google" : "Continuer avec Google"} />
                <T size={11.5} muted center>
                  {mode === "signup" ? `Avec Google, ton compte est créé en tant que ${role === "prof" ? "professeur" : "élève"}. ` : ""}
                  En continuant avec Google, tu acceptes les conditions d'utilisation.
                </T>
              </>
            )}
          </View>
        </FadeIn>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
