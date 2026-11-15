// Espace admin (supervision) : comptes, signalements et gains des professeurs, comme sur le site.
import { Archive, Ban, Check, Coins, Flag, HandCoins, Play, Search, ShieldCheck, Trash2, UserPlus, UsersRound } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { Alert, View } from "react-native";
import { supervisionApi } from "../api/endpoints";
import { Badge, Button, Card, Chip, ChipRow, EmptyState, Field, H2, H3, Input, Row, Screen, Segmented, T, toast } from "../components/ui";
import { useApp } from "../context/AppContext";
import { alpha } from "../theme";

const ROLE_LABEL = { eleve: "Élève", prof: "Professeur", admin: "Administrateur" };
const STATUS = { active: ["Actif", "success"], suspended: ["Suspendu", "danger"], archived: ["Archivé", "info"] };
const REASON_LABEL = {
  harcelement: "Harcèlement ou menace",
  insulte: "Insulte, propos haineux",
  contenu_choquant: "Contenu choquant ou sexuel",
  danger_mineur: "Mise en danger d'un élève",
  spam: "Spam ou arnaque",
  triche: "Triche, sujet volé",
  erreur: "Erreur dans le contenu",
  droits_auteur: "Droits d'auteur",
  autre: "Autre",
};
const money = (n) => `${Number(n || 0).toLocaleString("fr-FR")} F CFA`;
const shortDate = (d) => (d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }) : "");

export default function AdminScreen() {
  const { user, colors } = useApp();
  const [section, setSection] = useState("users");
  const isAdmin = Boolean(user?.is_admin ?? user?.role === "admin");

  if (!isAdmin) {
    return (
      <Screen>
        <EmptyState icon={ShieldCheck} title="Réservé aux administrateurs">
          Cet espace sert à superviser les comptes, les signalements et les paiements des professeurs.
        </EmptyState>
      </Screen>
    );
  }

  return (
    <Screen>
      <Card glow style={{ gap: 6 }}>
        <Row gap={8}>
          <ShieldCheck size={20} color={colors.danger} />
          <H2>Supervision</H2>
        </Row>
        <T size={13} muted>
          Suspendre, archiver ou supprimer un compte, traiter les signalements et valider les versements des profs.
        </T>
      </Card>
      <Segmented
        options={[
          { value: "users", label: "Comptes" },
          { value: "reports", label: "Signalements" },
          { value: "earnings", label: "Gains" },
        ]}
        value={section}
        onChange={setSection}
      />
      {section === "users" && <UsersBlock />}
      {section === "reports" && <ReportsBlock />}
      {section === "earnings" && <EarningsBlock />}
    </Screen>
  );
}

// ---------------------------------------------------------------- Comptes
function UsersBlock() {
  const { colors } = useApp();
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ display_name: "", email: "", role: "prof", password: "" });

  const load = useCallback(() => {
    supervisionApi.users({ q, role, status }).then(setData).catch((e) => toast.error(e.message));
  }, [q, role, status]);
  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  const patch = async (u, body, message) => {
    setBusy(u.id);
    try {
      await supervisionApi.updateUser(u.id, body);
      toast.success(message);
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(0);
    }
  };

  const askStatus = (u, next) => {
    if (next === "active") return patch(u, { status: "active", status_reason: "" }, "Compte réactivé");
    const label = next === "suspended" ? "Suspendre" : "Archiver";
    Alert.alert(`${label} ce compte ?`, `${u.display_name} perdra immédiatement l'accès à EduBénin.`, [
      { text: "Annuler", style: "cancel" },
      {
        text: label,
        style: "destructive",
        onPress: () =>
          patch(u, { status: next, status_reason: next === "suspended" ? "Décision de la supervision" : "" },
            next === "suspended" ? "Compte suspendu" : "Compte archivé"),
      },
    ]);
  };

  const askDelete = (u) =>
    Alert.alert("Supprimer définitivement ?", `${u.display_name} (${u.email}) et ses données seront effacés. Préfère « suspendre » ou « archiver » pour garder l'historique.`, [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          try {
            await supervisionApi.deleteUser(u.id);
            toast.success("Compte supprimé");
            load();
          } catch (e) {
            toast.error(e.message);
          }
        },
      },
    ]);

  const create = async () => {
    try {
      const r = await supervisionApi.createUser(form);
      setShowCreate(false);
      setForm({ display_name: "", email: "", role: "prof", password: "" });
      toast.success("Compte créé");
      if (r.password) Alert.alert("Compte créé", `Mot de passe de ${r.user.email} :\n\n${r.password}\n\nNote-le, il ne sera plus affiché.`);
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <>
      <Input icon={Search} placeholder="Nom, email, établissement…" value={q} onChangeText={setQ} />
      <ChipRow>
        {[["", "Tous"], ["eleve", "Élèves"], ["prof", "Profs"], ["admin", "Admins"]].map(([v, l]) => (
          <Chip key={v || "all"} label={l} active={role === v} onPress={() => setRole(v)} small />
        ))}
      </ChipRow>
      <ChipRow>
        {[["", "Tous statuts"], ["active", "Actifs"], ["suspended", "Suspendus"], ["archived", "Archivés"]].map(([v, l]) => (
          <Chip key={v || "all"} label={l} active={status === v} onPress={() => setStatus(v)} small />
        ))}
      </ChipRow>

      <Button title={showCreate ? "Fermer le formulaire" : "Ajouter un utilisateur"} icon={UserPlus} variant="secondary" block onPress={() => setShowCreate((v) => !v)} />

      {showCreate && (
        <Card style={{ gap: 10 }}>
          <H3>Nouveau compte</H3>
          <Field label="Nom affiché"><Input value={form.display_name} onChangeText={(v) => setForm((f) => ({ ...f, display_name: v }))} placeholder="Awa Sossou" /></Field>
          <Field label="Email"><Input value={form.email} onChangeText={(v) => setForm((f) => ({ ...f, email: v }))} placeholder="awa@exemple.bj" autoCapitalize="none" keyboardType="email-address" /></Field>
          <ChipRow>
            {["eleve", "prof", "admin"].map((r) => (
              <Chip key={r} label={ROLE_LABEL[r]} active={form.role === r} onPress={() => setForm((f) => ({ ...f, role: r }))} small />
            ))}
          </ChipRow>
          <Field label="Mot de passe" hint="Laisse vide pour en générer un.">
            <Input value={form.password} onChangeText={(v) => setForm((f) => ({ ...f, password: v }))} placeholder="(généré)" />
          </Field>
          <Button title="Créer le compte" icon={UserPlus} onPress={create} />
        </Card>
      )}

      {data === null ? (
        <T muted>Chargement…</T>
      ) : data.results.length === 0 ? (
        <EmptyState icon={UsersRound} title="Aucun compte trouvé">Modifie la recherche ou les filtres.</EmptyState>
      ) : (
        data.results.map((u) => {
          const [label, tone] = STATUS[u.status];
          return (
            <Card key={u.id} style={{ gap: 8 }}>
              <Row gap={10} style={{ alignItems: "center" }}>
                <View style={{ width: 40, height: 40, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: alpha(colors.primary, 0.16) }}>
                  <T weight="800" color={colors.primary}>{u.display_name?.[0]?.toUpperCase() ?? "?"}</T>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <T weight="700" numberOfLines={1}>{u.display_name}</T>
                  <T size={12} muted numberOfLines={1}>{u.email}</T>
                </View>
                <Badge label={label} tone={tone} />
              </Row>
              <Row gap={6} style={{ flexWrap: "wrap" }}>
                <Badge label={ROLE_LABEL[u.role]} tone={u.role === "admin" ? "accent" : "info"} />
                {u.status_reason ? <T size={12} muted numberOfLines={1}>{u.status_reason}</T> : null}
              </Row>
              <Row gap={8} style={{ flexWrap: "wrap" }}>
                {u.status !== "active" ? (
                  <Button title="Réactiver" icon={Play} size="sm" variant="secondary" loading={busy === u.id} onPress={() => askStatus(u, "active")} />
                ) : (
                  <Button title="Suspendre" icon={Ban} size="sm" variant="secondary" loading={busy === u.id} onPress={() => askStatus(u, "suspended")} />
                )}
                {u.status !== "archived" && (
                  <Button title="Archiver" icon={Archive} size="sm" variant="secondary" loading={busy === u.id} onPress={() => askStatus(u, "archived")} />
                )}
                <Button title="Supprimer" icon={Trash2} size="sm" variant="secondary" onPress={() => askDelete(u)} />
              </Row>
            </Card>
          );
        })
      )}
      {data && data.count > data.results.length ? (
        <T size={12} muted center>{data.results.length} comptes affichés sur {data.count} — affine la recherche pour voir les autres.</T>
      ) : null}
    </>
  );
}

// ---------------------------------------------------------------- Signalements
function ReportsBlock() {
  const [status, setStatus] = useState("open");
  const [rows, setRows] = useState(null);
  const [busy, setBusy] = useState(0);

  const load = useCallback(() => {
    supervisionApi.reports({ status }).then(setRows).catch((e) => toast.error(e.message));
  }, [status]);
  useEffect(load, [load]);

  const handle = async (r, suspend = false) => {
    setBusy(r.id);
    try {
      if (suspend && r.preview?.user_id) {
        await supervisionApi.updateUser(r.preview.user_id, {
          status: "suspended",
          status_reason: `Signalement : ${REASON_LABEL[r.reason] ?? r.reason}`,
        });
      }
      await supervisionApi.handleReport(r.id, "done");
      toast.success(suspend ? "Auteur suspendu, signalement traité" : "Signalement traité");
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(0);
    }
  };

  return (
    <>
      <Segmented
        options={[{ value: "open", label: "À traiter" }, { value: "done", label: "Traités" }]}
        value={status}
        onChange={setStatus}
      />
      {rows === null ? (
        <T muted>Chargement…</T>
      ) : rows.length === 0 ? (
        <EmptyState icon={Flag} title={status === "open" ? "Aucun signalement ouvert" : "Aucun signalement traité"}>
          {status === "open" ? "Les signalements des élèves et des profs arriveront ici." : "L'historique apparaîtra ici."}
        </EmptyState>
      ) : (
        rows.map((r) => (
          <Card key={r.id} style={{ gap: 8 }}>
            <Row gap={8} style={{ flexWrap: "wrap", alignItems: "center" }}>
              <Badge label={REASON_LABEL[r.reason] ?? r.reason} tone="danger" />
              <T size={12} muted>{r.reporter.display_name} · {shortDate(r.created_at)}</T>
            </Row>
            <T size={14}>{r.preview?.label ?? `contenu #${r.target_id} (${r.target_type})`}</T>
            {r.details ? <T size={13} muted>{r.details}</T> : null}
            {status === "open" && (
              <Row gap={8} style={{ flexWrap: "wrap" }}>
                <Button title="Marquer traité" icon={Check} size="sm" variant="secondary" loading={busy === r.id} onPress={() => handle(r)} />
                {r.preview?.user_id ? (
                  <Button title="Suspendre l'auteur" icon={Ban} size="sm" onPress={() => handle(r, true)} />
                ) : null}
              </Row>
            )}
          </Card>
        ))
      )}
    </>
  );
}

// ---------------------------------------------------------------- Gains des professeurs
function EarningsBlock() {
  const { colors } = useApp();
  const [status, setStatus] = useState("pending");
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(0);
  const [profs, setProfs] = useState([]);
  const [form, setForm] = useState({ prof_id: "", amount: "", label: "" });

  const load = useCallback(() => {
    supervisionApi.earnings({ status }).then(setData).catch((e) => toast.error(e.message));
  }, [status]);
  useEffect(load, [load]);
  useEffect(() => {
    supervisionApi.users({ role: "prof" }).then((r) => setProfs(r.results)).catch(() => {});
  }, []);

  const pay = async (e, next) => {
    setBusy(e.id);
    try {
      await supervisionApi.setEarning(e.id, next);
      toast.success(next === "paid" ? "Versement validé" : "Remis en attente");
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(0);
    }
  };

  const sendBonus = async () => {
    try {
      await supervisionApi.bonus({ prof_id: Number(form.prof_id), amount: Number(form.amount), label: form.label });
      toast.success("Prime accordée");
      setForm({ prof_id: "", amount: "", label: "" });
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <>
      <Row gap={10}>
        <Card style={{ flex: 1, gap: 2 }}>
          <T size={12} muted>À verser</T>
          <T weight="800">{money(data?.totaux?.a_verser)}</T>
        </Card>
        <Card style={{ flex: 1, gap: 2 }}>
          <T size={12} muted>Déjà versé</T>
          <T weight="800">{money(data?.totaux?.verse)}</T>
        </Card>
      </Row>
      <Segmented
        options={[{ value: "pending", label: "À verser" }, { value: "paid", label: "Versés" }]}
        value={status}
        onChange={setStatus}
      />

      {data === null ? (
        <T muted>Chargement…</T>
      ) : data.results.length === 0 ? (
        <EmptyState icon={HandCoins} title="Rien à payer ici">Les primes de niveau et commissions des profs s'affichent ici.</EmptyState>
      ) : (
        data.results.map((e) => (
          <Card key={e.id} style={{ gap: 6 }}>
            <Row gap={8} style={{ alignItems: "center" }}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <T weight="700" numberOfLines={1}>{e.prof.display_name}</T>
                <T size={12} muted numberOfLines={1}>{e.label}</T>
                <T size={12} muted numberOfLines={1}>{e.prof.telephone_paiement || "numéro Mobile Money manquant"}</T>
              </View>
              <T weight="800" color={colors.primary}>{money(e.amount)}</T>
            </Row>
            <Row gap={8} style={{ flexWrap: "wrap", alignItems: "center" }}>
              <Badge label={e.status === "paid" ? `Versé le ${shortDate(e.paid_at)}` : "À verser"} tone={e.status === "paid" ? "success" : "accent"} />
              {e.status === "paid" ? (
                <Button title="Remettre en attente" size="sm" variant="secondary" loading={busy === e.id} onPress={() => pay(e, "pending")} />
              ) : (
                <Button title="Marquer versé" icon={Check} size="sm" variant="secondary" loading={busy === e.id} onPress={() => pay(e, "paid")} />
              )}
            </Row>
          </Card>
        ))
      )}

      <Card style={{ gap: 10 }}>
        <Row gap={8}><Coins size={18} color={colors.accent} /><H3>Prime exceptionnelle</H3></Row>
        <ChipRow>
          {profs.map((p) => (
            <Chip key={p.id} label={p.display_name} active={String(form.prof_id) === String(p.id)} onPress={() => setForm((f) => ({ ...f, prof_id: p.id }))} small />
          ))}
        </ChipRow>
        <Field label="Montant (F CFA)"><Input value={form.amount} onChangeText={(v) => setForm((f) => ({ ...f, amount: v }))} keyboardType="number-pad" placeholder="5000" /></Field>
        <Field label="Motif"><Input value={form.label} onChangeText={(v) => setForm((f) => ({ ...f, label: v }))} placeholder="Meilleure progression du mois" /></Field>
        <Button title="Accorder la prime" icon={Coins} variant="secondary" onPress={sendBonus} />
      </Card>
    </>
  );
}
