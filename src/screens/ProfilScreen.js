import { Save } from "lucide-react-native";
import { useState } from "react";
import { authApi } from "../api/endpoints";
import { Button, Card, Chip, ChipRow, Field, Input, Screen, T, toast } from "../components/ui";
import { BAC_SERIES } from "../config/curriculum";
import { useApp } from "../context/AppContext";

const CLASSES = ["3ème", "2nde", "1ère", "Terminale"];

export default function ProfilScreen() {
  const { user, setUser, isProf } = useApp();
  const [p, setP] = useState({
    display_name: user?.display_name ?? "",
    niveau: user?.niveau || "Terminale",
    serie: user?.serie || "D",
    bio: user?.bio ?? "",
    etablissement: user?.etablissement ?? "",
    ville: user?.ville ?? "",
    matieres: (user?.matieres ?? []).join(", "),
  });
  const [saving, setSaving] = useState(false);
  const set = (k) => (v) => setP((s) => ({ ...s, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      setUser(await authApi.updateMe({ ...p, matieres: isProf ? p.matieres.split(",").map((m) => m.trim()).filter(Boolean) : undefined }));
      toast.success("Profil enregistré");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <Card style={{ gap: 14 }}>
        <Field label="Nom affiché">
          <Input value={p.display_name} onChangeText={set("display_name")} />
        </Field>
        <T size={13} muted>{user?.email}</T>
        {!isProf && (
          <>
            <Field label="Classe">
              <ChipRow>
                {CLASSES.map((c) => (
                  <Chip key={c} label={c} active={p.niveau === c} onPress={() => set("niveau")(c)} />
                ))}
              </ChipRow>
            </Field>
            {p.niveau !== "3ème" && (
              <Field label="Série">
                <ChipRow>
                  {BAC_SERIES.map((s) => (
                    <Chip key={s.code} label={s.code} active={p.serie === s.code} onPress={() => set("serie")(s.code)} />
                  ))}
                </ChipRow>
              </Field>
            )}
          </>
        )}
        <Field label="Établissement" hint="Pour les classements de l'examen blanc">
          <Input value={p.etablissement} onChangeText={set("etablissement")} placeholder="Ex. CEG Gbégamey" />
        </Field>
        <Field label="Ville">
          <Input value={p.ville} onChangeText={set("ville")} placeholder="Ex. Cotonou" />
        </Field>
        {isProf && (
          <Field label="Matières enseignées" hint="Séparées par des virgules (questions des élèves, profil public)">
            <Input value={p.matieres} onChangeText={set("matieres")} placeholder="Ex. SVT, PCT" />
          </Field>
        )}
        <Field label={isProf ? "Présentation" : "Mon objectif"}>
          <Input value={p.bio} onChangeText={set("bio")} multiline placeholder={isProf ? "Matières enseignées, établissement…" : "Ex. Avoir 14 de moyenne au BAC"} />
        </Field>
        <Button title="Enregistrer" icon={Save} block loading={saving} onPress={save} />
      </Card>
    </Screen>
  );
}
