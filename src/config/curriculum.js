// Programme béninois — référence unique pour les séries, matières, catégories et thèmes.
//
// Sources :
//  - BAC : « Liste des épreuves à l'examen du Baccalauréat », Office du Baccalauréat du Bénin
//    (https://www.officedubacbenin.bj/spip.php?article11, arrêté 016-2003 modifié) : séries,
//    épreuves écrites/pratiques, coefficients et durées ci-dessous.
//  - BEPC : matières des épreuves écrites telles qu'elles figurent sur les sujets du BEPC béninois
//    (Communication écrite, Lecture, Anglais, Mathématiques, PCT, SVT, Histoire-Géographie).
//  - Thèmes : situations d'apprentissage (SA) quand elles sont connues (PCT Terminale C/D/E,
//    manuel béninois « Collection l'Éveil »), sinon grands thèmes du programme béninois.

// ---------------------------------------------------------------- Catégories
export const CATEGORIES = [
  { key: "lettres", label: "Lettres & langues", tone: "secondary" },
  { key: "sciences", label: "Sciences", tone: "primary" },
  { key: "humaines", label: "Sciences humaines & sociales", tone: "accent" },
  { key: "industriel", label: "Techniques industrielles", tone: "info" },
  { key: "gestion", label: "Gestion & commerce", tone: "success" },
];

// ---------------------------------------------------------------- Matières
// `bac` / `bepc` : thèmes (ou SA) utilisés pour filtrer les quiz et guider l'IA.
export const MATIERES = {
  // Lettres & langues
  "Français": {
    cat: "lettres",
    bac: ["Commentaire composé", "Dissertation littéraire", "Résumé et discussion d'un texte argumentatif", "Littérature béninoise et africaine", "Étude de la langue (figures de style, grammaire)"],
  },
  "Communication écrite": {
    cat: "lettres",
    bepc: ["Rédaction narrative", "Rédaction descriptive", "Rédaction argumentative", "Lettre et écrits fonctionnels", "Grammaire et conjugaison"],
  },
  "Lecture": {
    cat: "lettres",
    bepc: ["Compréhension de texte", "Vocabulaire et sens des mots", "Étude de la langue dans un texte", "Œuvres et auteurs africains"],
  },
  "Anglais": {
    cat: "lettres",
    bac: ["Reading comprehension", "Grammar and tenses", "Vocabulary: education and health", "Vocabulary: environment and development", "Essay writing"],
    bepc: ["Reading comprehension", "Grammar and tenses", "Vocabulary: daily life and school", "Guided writing"],
  },
  "Allemand": { cat: "lettres", bac: ["Leseverstehen", "Grammatik", "Wortschatz", "Schriftlicher Ausdruck"] },
  "Espagnol": { cat: "lettres", bac: ["Comprensión de texto", "Gramática", "Vocabulario", "Expresión escrita"] },
  "Philosophie": {
    cat: "lettres",
    bac: ["La conscience et l'inconscient", "La liberté", "Le travail", "Autrui et la société", "L'État, la politique et le droit", "La science et la technique", "La religion", "L'art", "La vérité et la raison"],
  },

  // Sciences
  "Mathématiques": {
    cat: "sciences",
    bac: ["Nombres complexes", "Limites et continuité", "Dérivation et étude de fonctions", "Fonctions logarithme et exponentielle", "Primitives et calcul intégral", "Suites numériques", "Équations différentielles", "Dénombrement et probabilités", "Statistiques à deux variables", "Géométrie dans l'espace"],
    bepc: ["Calcul littéral et identités remarquables", "Équations et inéquations", "Systèmes d'équations", "Fonctions linéaires et affines", "Racines carrées", "Théorème de Thalès", "Théorème de Pythagore et trigonométrie", "Vecteurs et repérage", "Statistiques", "Solides de l'espace (pyramide, cône)"],
  },
  "PCT": {
    cat: "sciences",
    full: "Physique-Chimie-Technologie",
    bac: ["SA 1 : Champs de forces et interactions", "SA 2 : Chimie des solutions aqueuses", "SA 3 : Oscillations mécaniques et électriques", "SA 4 : Chimie organique", "SA 5 : Optique", "SA 6 : Physique atomique et nucléaire"],
    bepc: ["Électricité : loi d'Ohm, puissance et énergie", "Mécanique : forces, poids et équilibre", "Machines simples (poulies, leviers)", "Chimie : ions, acides, bases et pH", "Chimie : métaux et oxydation", "Optique : lentilles et images"],
  },
  "SVT": {
    cat: "sciences",
    full: "Sciences de la Vie et de la Terre",
    bac: ["Génétique et hérédité", "Immunologie", "Reproduction humaine et contrôle hormonal", "Communication nerveuse et activité musculaire", "Régulation du milieu intérieur (glycémie)", "Géologie et géodynamique", "Écologie et environnement au Bénin"],
    bepc: ["Digestion et absorption", "Contrôle nerveux", "Reproduction humaine", "Réponses immunitaires et santé", "Techniques biomédicales (vaccins, transfusion)"],
  },

  // Sciences humaines & sociales
  "Histoire-Géographie": {
    cat: "humaines",
    bac: ["Décolonisation et indépendances africaines", "La Guerre froide et les relations internationales", "Le Bénin de 1960 à la Conférence nationale de 1990", "Intégration régionale : CEDEAO et UEMOA", "Économie et population du Bénin", "Mondialisation et grandes puissances"],
    bepc: ["Le Dahomey colonial", "L'indépendance du Dahomey (1960)", "Les royaumes du Bénin précolonial", "Relief, climat et hydrographie du Bénin", "Population et activités économiques du Bénin", "L'Afrique de l'Ouest"],
  },
  "Économie": {
    cat: "humaines",
    bac: ["Croissance et développement", "Monnaie, BCEAO et franc CFA", "Commerce international", "Chômage et inflation", "Intégration économique (UEMOA, CEDEAO)", "Finances publiques"],
  },
  "Géographie économique": { cat: "humaines", bac: ["Ressources et activités économiques du Bénin", "Échanges et transports", "Économie mondiale"] },

  // Techniques industrielles
  "Construction mécanique": { cat: "industriel", bac: ["Lecture de plans et cotation", "Liaisons mécaniques", "Transmission de puissance", "Dimensionnement"] },
  "Mécanique": { cat: "industriel", bac: ["Statique", "Cinématique", "Dynamique", "Résistance des matériaux"] },
  "Automatique": { cat: "industriel", bac: ["Logique combinatoire", "GRAFCET", "Capteurs et actionneurs"] },
  "Étude d'outillage": { cat: "industriel", bac: ["Outillages de fabrication", "Montages d'usinage"] },
  "Analyse de fabrication": { cat: "industriel", bac: ["Gammes d'usinage", "Procédés d'obtention des pièces"] },
  "Étude d'un système technique": { cat: "industriel", bac: ["Analyse fonctionnelle", "Chaîne d'énergie et d'information", "Schémas et dimensionnement"] },
  "Étude de fabrication ou technologie": { cat: "industriel", bac: ["Procédés de fabrication", "Technologie des matériaux"] },
  "Électrotechnique": { cat: "industriel", bac: ["Circuits monophasés et triphasés", "Transformateurs", "Machines électriques"] },
  "Résistance des matériaux": { cat: "industriel", bac: ["Contraintes et déformations", "Flexion", "Traction et compression"] },
  "Béton armé": { cat: "industriel", bac: ["Poutres", "Poteaux", "Fondations"] },
  "Métré et étude de prix": { cat: "industriel", bac: ["Avant-métré", "Devis quantitatif et estimatif"] },
  "Procédés de construction": { cat: "industriel", bac: ["Gros œuvre", "Second œuvre", "Matériaux de construction"] },
  "Eau et assainissement": { cat: "industriel", bac: ["Traitement de l'eau", "Réseaux hydrauliques", "Assainissement", "Mobilisation des ressources en eau"] },

  // Gestion & commerce
  "Étude de cas": { cat: "gestion", bac: ["Comptabilité générale", "Comptabilité analytique", "Gestion financière", "Gestion commerciale"] },
  "Droit": { cat: "gestion", bac: ["Droit administratif", "Droit du travail", "Finances publiques", "Droit commercial"] },
  "Mathématiques appliquées": { cat: "gestion", bac: ["Mathématiques financières", "Statistiques", "Suites et intérêts"] },
  "Techniques de secrétariat": { cat: "gestion", bac: ["Courrier administratif", "Organisation du travail de bureau", "Classement et archivage"] },
  "Compte rendu, PV et rapport": { cat: "gestion", bac: ["Compte rendu", "Procès-verbal", "Rapport"] },
};

// ---------------------------------------------------------------- Séries du BAC
// e : épreuves du premier groupe [matière, coefficient, durée en minutes] (EPS : coef 1 pour toutes).
// lv : séries où l'élève choisit sa/ses langue(s) vivante(s) (Anglais obligatoire en LV1 ou LV2).
export const BAC_SERIES = [
  { code: "A1", label: "Série A1 — Lettres-Langues", group: "Enseignement général",
    e: [["Français", 5, 240], ["Philosophie", 4, 240], ["Histoire-Géographie", 3, 240], ["Anglais", 3, 180], ["Allemand", 2, 120], ["Espagnol", 2, 120], ["Mathématiques", 2, 90], ["SVT", 2, 90]], lv: true },
  { code: "A2", label: "Série A2 — Lettres-Sciences humaines", group: "Enseignement général",
    e: [["Histoire-Géographie", 5, 240], ["Français", 4, 240], ["Philosophie", 3, 240], ["Anglais", 3, 180], ["Allemand", 2, 120], ["Espagnol", 2, 120], ["Mathématiques", 2, 90], ["SVT", 2, 90]], lv: true },
  { code: "B", label: "Série B — Lettres-Sciences sociales", group: "Enseignement général",
    e: [["Économie", 4, 240], ["Français", 4, 240], ["Histoire-Géographie", 4, 240], ["Philosophie", 3, 240], ["Anglais", 2, 180], ["Mathématiques", 2, 90], ["SVT", 2, 90]] },
  { code: "C", label: "Série C — Mathématiques et Sciences physiques", group: "Enseignement général",
    e: [["Mathématiques", 6, 240], ["PCT", 5, 240], ["Français", 2, 240], ["Anglais", 2, 180], ["SVT", 2, 120], ["Histoire-Géographie", 2, 120], ["Philosophie", 2, 120]] },
  { code: "D", label: "Série D — Biologie-Géologie", group: "Enseignement général",
    e: [["SVT", 5, 180], ["Mathématiques", 4, 240], ["PCT", 4, 240], ["Français", 2, 240], ["Anglais", 2, 180], ["Histoire-Géographie", 2, 120], ["Philosophie", 2, 120]] },
  { code: "E", label: "Série E — Mathématiques et Techniques", group: "Enseignement technique",
    e: [["Mathématiques", 5, 240], ["PCT", 4, 240], ["Construction mécanique", 3, 300], ["Étude de fabrication ou technologie", 2, 120], ["Français", 2, 240]] },
  { code: "F1", label: "Série F1 — Construction mécanique", group: "Enseignement technique",
    e: [["Mathématiques", 3, 240], ["Construction mécanique", 3, 360], ["Analyse de fabrication", 3, 240], ["PCT", 2, 180], ["Mécanique", 2, 240], ["Automatique", 2, 120], ["Étude d'outillage", 2, 240], ["Français", 2, 180]] },
  { code: "F2", label: "Série F2 — Électronique", group: "Enseignement technique",
    e: [["Étude d'un système technique", 4, 240], ["Mathématiques", 3, 240], ["PCT", 2, 180], ["Construction mécanique", 2, 240], ["Français", 2, 180]] },
  { code: "F3", label: "Série F3 — Électrotechnique", group: "Enseignement technique",
    e: [["Étude d'un système technique", 5, 240], ["Électrotechnique", 3, 240], ["Mathématiques", 3, 240], ["PCT", 2, 180], ["Français", 2, 180]] },
  { code: "F4", label: "Série F4 — Génie civil", group: "Enseignement technique",
    e: [["Mathématiques", 3, 240], ["Résistance des matériaux", 3, 180], ["Béton armé", 2, 180], ["Métré et étude de prix", 2, 240], ["Procédés de construction", 2, 180], ["PCT", 2, 180], ["Français", 2, 180]] },
  { code: "G1", label: "Série G1 — Techniques administratives", group: "Enseignement tertiaire",
    e: [["Étude de cas", 4, 240], ["Français", 3, 180], ["Économie", 3, 180], ["Techniques de secrétariat", 3, 120], ["Compte rendu, PV et rapport", 3, 120], ["Droit", 2, 120], ["Anglais", 2, 180]] },
  { code: "G2", label: "Série G2 — Techniques quantitatives de gestion", group: "Enseignement tertiaire",
    e: [["Étude de cas", 6, 300], ["Français", 3, 180], ["Économie", 3, 180], ["Mathématiques appliquées", 3, 180], ["Droit", 2, 120], ["Anglais", 2, 180]] },
  { code: "G3", label: "Série G3 — Techniques commerciales", group: "Enseignement tertiaire",
    e: [["Étude de cas", 6, 300], ["Français", 3, 180], ["Économie", 3, 180], ["Mathématiques appliquées", 3, 180], ["Droit", 2, 120], ["Anglais", 2, 180]] },
  { code: "EA", label: "Filière Eau et Assainissement", group: "Enseignement technique",
    e: [["Eau et assainissement", 4, 300], ["Mathématiques", 3, 180], ["Français", 2, 180], ["PCT", 2, 120], ["Anglais", 1, 120]] },
];

export const SERIE_GROUPS = ["Enseignement général", "Enseignement technique", "Enseignement tertiaire"];

// ---------------------------------------------------------------- BEPC
// Épreuves écrites du BEPC (durées indicatives pour l'épreuve type générée).
export const BEPC_EPREUVES = [
  ["Communication écrite", null, 120],
  ["Lecture", null, 120],
  ["Anglais", null, 120],
  ["Mathématiques", null, 120],
  ["PCT", null, 120],
  ["SVT", null, 120],
  ["Histoire-Géographie", null, 120],
];
export const MATIERES_BEPC = BEPC_EPREUVES.map(([m]) => m);

// ---------------------------------------------------------------- Divers
export const ANNEES = Array.from({ length: 12 }, (_, i) => 2026 - i); // 2026..2015
export const SESSIONS = ["Normale", "Remplacement", "Rattrapage"];
export const DIFFICULTES = [
  { value: "tres_facile", label: "Très facile" },
  { value: "facile", label: "Facile" },
  { value: "moyenne", label: "Moyenne" },
  { value: "difficile", label: "Difficile" },
  { value: "tres_difficile", label: "Très difficile" },
];
export const difficulteLabel = (v) => DIFFICULTES.find((d) => d.value === v)?.label ?? v;

// ---------------------------------------------------------------- Aides
export const serieByCode = (code) => BAC_SERIES.find((s) => s.code === code);

/** Matières écrites d'une série (ou du BEPC), triées par coefficient décroissant. */
export function matieresFor(examType, serie) {
  if (examType === "BEPC") return MATIERES_BEPC;
  if (!serie) return ALL_BAC_MATIERES;
  return serieByCode(serie)?.e.map(([m]) => m) ?? [];
}

/** Coefficient et durée officiels d'une matière dans une série. */
export function epreuveInfo(examType, serie, matiere) {
  const list = examType === "BEPC" ? BEPC_EPREUVES : serieByCode(serie)?.e ?? [];
  const row = list.find(([m]) => m === matiere);
  return row ? { coefficient: row[1], duree: row[2] } : null;
}

export const ALL_BAC_MATIERES = Array.from(new Set(BAC_SERIES.flatMap((s) => s.e.map(([m]) => m))));

export const categoryOf = (matiere) => MATIERES[matiere]?.cat ?? "lettres";
export const categoryLabel = (key) => CATEGORIES.find((c) => c.key === key)?.label ?? key;
export const matiereLabel = (m) => (MATIERES[m]?.full ? `${m} — ${MATIERES[m].full}` : m);

/** Regroupe une liste de matières par catégorie, dans l'ordre de CATEGORIES. */
export function groupByCategory(list) {
  return CATEGORIES.map((c) => ({ ...c, items: list.filter((m) => categoryOf(m) === c.key) })).filter((g) => g.items.length);
}

/** Thèmes / SA d'une matière pour le niveau donné. */
export const themesFor = (examType, matiere) => MATIERES[matiere]?.[examType === "BEPC" ? "bepc" : "bac"] ?? [];

export const formatDuree = (min) => (min >= 60 ? `${Math.floor(min / 60)} h${min % 60 ? String(min % 60).padStart(2, "0") : ""}` : `${min} min`);
