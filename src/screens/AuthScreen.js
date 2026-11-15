import { ArrowRight, Check, GraduationCap, Lock, Mail, School, User } from "lucide-react-native";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, View } from "react-native";
import { authApi } from "../api/endpoints";
import { Button, Card, FlagBar, H1, Input, Row, Screen, Segmented, T, toast } from "../components/ui";
import { useApp } from "../context/AppContext";
import { registerPush } from "../lib/notifications";

/** Connexion / inscription / mot de passe oublié (même compte que sur le site). */
export default function AuthScreen({ navigation }) {
  const { signIn, colors } = useApp();
  const [mode, setMode] = useState("signin");
  const [role, setRole] = useState("eleve");
  const [form, setForm] = useState({ email: "", password: "", name: "" });
  const [loading, setLoading] = useState(false);
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

  const submit = () =>
    run(async () => {
      if (!form.email.trim()) throw new Error("Saisis ton email");
      if (mode === "signin") {
        try {
          const payload = await authApi.login(form.email.trim(), form.password);
          await signIn(payload);
          registerPush();
          toast.success("Connexion réussie");
          navigation.goBack();
        } catch (e) {
          if (e.data?.code === "email_not_verified") {
            setSent("signup");
            return;
          }
          throw e;
        }
      } else if (mode === "signup") {
        if (form.password.length < 6) throw new Error("Mot de passe : 6 caractères minimum");
        try {
          if (!terms) throw new Error("Accepte les conditions d'utilisation pour créer ton compte.");
          await authApi.register({ email: form.email.trim(), password: form.password, display_name: form.name.trim(), role, accept_terms: true });
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
      <Screen contentStyle={{ flexGrow: 1, justifyContent: "center" }}>
        <Card glow style={{ alignItems: "center", gap: 12, paddingVertical: 28 }}>
          <Mail size={36} color={colors.primary} />
          <H1 center style={{ fontSize: 22 }}>Vérifie ta boîte mail</H1>
          <T muted center>
            {sent === "signup"
              ? `Nous avons envoyé un lien de confirmation à ${form.email}. Clique dessus, puis reviens te connecter.`
              : `Si un compte existe pour ${form.email}, tu vas recevoir un lien pour choisir un nouveau mot de passe.`}
          </T>
          {sent === "signup" ? (
            <Button title="Renvoyer l'email" variant="secondary" onPress={() => run(async () => { await authApi.resend(form.email.trim()); toast.success("Email renvoyé"); })} />
          ) : null}
          <Button
            title="Revenir à la connexion"
            onPress={() => {
              setSent(null);
              setMode("signin");
            }}
          />
        </Card>
      </Screen>
    );

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Screen>
        <FlagBar />
        <H1>{mode === "signin" ? "Bon retour !" : mode === "signup" ? "Crée ton compte" : "Mot de passe oublié"}</H1>
        <T muted>
          {mode === "forgot" ? "Saisis ton email : tu recevras un lien pour le réinitialiser." : "Le même compte que sur le site EduBénin."}
        </T>

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

        <Card style={{ gap: 12 }}>
          {mode === "signup" && (
            <>
              <Segmented
                options={[
                  { value: "eleve", label: "Élève", icon: School },
                  { value: "prof", label: "Professeur", icon: GraduationCap },
                ]}
                value={role}
                onChange={setRole}
              />
              <Input icon={User} value={form.name} onChangeText={set("name")} placeholder="Ton nom ou pseudo" autoComplete="name" />
            </>
          )}
          <Input icon={Mail} value={form.email} onChangeText={set("email")} placeholder="Email" keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
          {mode !== "forgot" && (
            <Input icon={Lock} value={form.password} onChangeText={set("password")} placeholder="Mot de passe" secureTextEntry autoComplete={mode === "signin" ? "password" : "new-password"} onSubmitEditing={submit} />
          )}
          {mode === "signup" && (
            <Pressable onPress={() => setTerms((t) => !t)} style={{ flexDirection: "row", gap: 10, alignItems: "flex-start" }}>
              <View style={{ width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: terms ? colors.primary : colors.borderStrong, backgroundColor: terms ? colors.primary : "transparent", alignItems: "center", justifyContent: "center", marginTop: 2 }}>
                {terms ? <Check size={14} color="#fff" /> : null}
              </View>
              <T size={13} muted style={{ flex: 1 }}>
                J'accepte les{" "}
                <T size={13} color={colors.primary} weight="700" onPress={() => navigation.navigate("Legal", { slug: "conditions-utilisation" })}>conditions d'utilisation</T> et la{" "}
                <T size={13} color={colors.primary} weight="700" onPress={() => navigation.navigate("Legal", { slug: "confidentialite" })}>politique de confidentialité</T>. Si je suis mineur, j'ai l'accord de mes parents.
              </T>
            </Pressable>
          )}
          <Button
            title={mode === "signin" ? "Se connecter" : mode === "signup" ? "Créer mon compte" : "Envoyer le lien"}
            iconRight={ArrowRight}
            block
            size="lg"
            loading={loading}
            onPress={submit}
          />
        </Card>

        <Row style={{ justifyContent: "center" }} wrap>
          {mode === "signin" ? (
            <Pressable onPress={() => setMode("forgot")}>
              <T color={colors.primary} weight="600">Mot de passe oublié ?</T>
            </Pressable>
          ) : mode === "forgot" ? (
            <Pressable onPress={() => setMode("signin")}>
              <T color={colors.primary} weight="600">Revenir à la connexion</T>
            </Pressable>
          ) : null}
        </Row>
        <View style={{ height: 20 }} />
      </Screen>
    </KeyboardAvoidingView>
  );
}
