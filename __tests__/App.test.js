/**
 * Démarre vraiment l'application (en mémoire, sans téléphone) et ouvre chaque écran :
 * l'accueil doit s'afficher, et aucun écran ne doit planter ni écrire d'erreur.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import ReactTestRenderer, { act } from "react-test-renderer";
import App, { navigationRef } from "../App";

const ELEVE = { id: 1, email: "ama@ex.com", display_name: "Ama Kossi", role: "eleve", niveau: "Terminale", serie: "D", bio: "" };
const PROF = { ...ELEVE, id: 2, display_name: "M. Hounkpè", role: "prof" };
const EXAM = { id: 1, exam_type: "BAC", serie: "D", matiere: "SVT", titre: "SVT BAC D 2024", annee: 2024, session: "Normale", duree_minutes: 180, coefficient: 5, pdf_url: "/media/x.pdf" };
const EPREUVE = {
  titre: "Épreuve de Philosophie",
  consignes: "Traitez un sujet au choix.",
  duree_minutes: 240,
  matiere: "Philosophie",
  exam_type: "BAC",
  serie: "D",
  parties: [
    { titre: "Sujet 1", texte: "", questions: [{ id: "q1", enonce: "Dissertation : la liberté est-elle une illusion ?", points: 20, format: "dissertation" }] },
  ],
};
const QCM = Array.from({ length: 10 }, (_, i) => ({ question: `Question ${i + 1} ?`, options: ["A", "B", "C", "D"], answer: "A", explanation: "", theme: "Génétique" }));

const FUTURE = new Date(Date.now() + 2 * 86400000).toISOString();
const PAST = new Date(Date.now() - 3600000).toISOString();
const CLASSE = { id: "c1", nom: "Tle D1", matiere: "SVT", niveau: "BAC", serie: "D", etablissement: "", archived: false, created_at: PAST,
  prof: { id: 2, display_name: "M. Hounkpè" }, members_count: 1, is_owner: false, can_rate: false, rate_reason: "Rends au moins un devoir.",
  my_rating: null, devoirs: [{ id: "d1", titre: "DM génétique", kind: "quiz", due_at: FUTURE, closed: false, submitted: false }] };
const DEVOIR = { id: "d1", titre: "DM génétique", consigne: "", kind: "quiz", due_at: FUTURE, closed: false, submitted: false,
  classe: { id: "c1", nom: "Tle D1", matiere: "SVT" }, questions: [{ id: "q1", kind: "QCM", question: "Combien de chromosomes ?", options: ["23", "46"] }] };
const FICHE = { id: "f1", titre: "La mitose", matiere: "SVT", niveau: "BAC", serie: "D", chapitre: "", cards_count: 1, has_audio: false,
  author: { id: 2, display_name: "M. Hounkpè" }, created_at: PAST, is_mine: false, contenu: "### Phases", cards: [{ q: "Phases ?", a: "4" }],
  audio_url: null, progress: { due: 1, mastered: 0 } };
const QUESTION = { id: "qq1", matiere: "SVT", niveau: "BAC", serie: "D", texte: "Pourquoi la méiose ?", status: "answered", created_at: PAST,
  image_url: null, eleve: { id: 1, display_name: "Ama" }, votes: 2, answers_count: 1, is_mine: false, voted: false,
  answers: [{ id: 1, texte: "Parce que…", audio_url: null, created_at: PAST, fiche: null, prof: { id: 2, display_name: "M. Hounkpè" } }] };
const COMPO = { id: "co1", exam_type: "BAC", serie: "D", matiere: "SVT", coefficient: 5, duree_minutes: 180, opens_at: FUTURE, closes_at: FUTURE,
  state: "a_venir", submitted: false, participants: 0 };

let me = null;
function fakeFetch(url) {
  const path = String(url).replace(/^https?:\/\/[^/]+/, "").split("?")[0];
  const route = [
    [/^\/api\/health\/$/, { status: "ok" }],
    [/^\/api\/auth\/me\/$/, me],
    [/^\/api\/exams\/$/, [EXAM]],
    [/^\/api\/exams\/\d+\/$/, EXAM],
    [/^\/api\/quizzes\/$/, []],
    [/^\/api\/prof\/stats\/$/, { quizzes: 2, audios: 1, exams: 3 }],
    [/^\/api\/audios\/$/, []],
    [/^\/api\/notifications\/$/, { unread: 1, results: [{ id: 3, kind: "message", title: "Kofi", body: "Salut", data: { screen: "Chat", id: "c1" }, read: false, created_at: new Date().toISOString() }] }],
    [/^\/api\/conversations\/$/, []],
    [/^\/api\/conversations\/c1\/$/, { id: "c1", kind: "direct", name: null, members: [{ user_id: 1, display_name: "Ama" }, { user_id: 9, display_name: "Kofi" }] }],
    [/^\/api\/conversations\/c1\/messages\/$/, [{ id: "m1", sender_id: 9, content: "Salut", created_at: new Date().toISOString() }]],
    [/^\/api\/duels\/$/, []],
    [/^\/api\/duels\/ABC123\/$/, { code: "ABC123", status: "waiting", matiere: "SVT", exam_type: "BAC", serie: "D", n_questions: 10, seconds_per_question: 20, max_players: 2, server_now: new Date().toISOString(), is_member: true, players: [{ user_id: 1, name: "Ama", score: 0, correct: 0, answered: 0, is_me: true, is_host: true }], me: { current: 0, finished: false } }],
    [/^\/api\/ai\/conversations\/$/, []],
    [/^\/api\/ai\/quiz\/$/, { questions: QCM }],
    [/^\/api\/billing\/status\/$/, { pass: { active: false }, free: { chat: { limit: 5, used: 1, left: 4 }, generation: { limit: 1, used: 0, left: 1 } },
      plans: [{ key: "jour", label: "Pass 24 h", price: 200, hours: 24 }, { key: "mois", label: "Pass 30 jours", price: 3000, hours: 720 }], payments_enabled: true, history: [] }],
    [/^\/api\/classes\/$/, [CLASSE]],
    [/^\/api\/classes\/c1\/$/, CLASSE],
    [/^\/api\/classes\/devoirs\/d1\/$/, DEVOIR],
    [/^\/api\/classes\/profs\/2\/$/, { id: 2, display_name: "M. Hounkpè", avatar_key: null, bio: "", matieres: ["SVT"], etablissement: "", ville: "",
      note: 4.6, notes: 12, clarte: 5, disponibilite: 4.5, qualite: 4.4, eleves: 30, niveau: { key: "bronze", label: "Bronze", prime: 1000 },
      quiz: 3, fiches: 2, reponses: 5, classes: 1, avis: [{ commentaire: "Très clair", note: 5, date: PAST }] }],
    [/^\/api\/classes\/gains\/$/, { mois: { month: "2026-11-01", eleves_actifs: 12, note: 4.2, notes: 6, niveau: null,
      prochain: { key: "bronze", label: "Bronze", prime: 1000, manque: { eleves: 8, note: 4, notes: 0 } } },
      niveaux: [{ key: "bronze", label: "Bronze", eleves: 20, note: 4, notes: 5, prime: 1000 }], commission: 0.1, telephone_paiement: "",
      a_verser: 300, verse: 0, historique: [{ id: 1, month: "2026-11-01", kind: "commission", amount: 300, label: "Commission 10 %", status: "pending", paid_at: null }] }],
    [/^\/api\/revision\/fiches\/$/, [FICHE]],
    [/^\/api\/revision\/fiches\/f1\/$/, FICHE],
    [/^\/api\/revision\/fiches\/f1\/review\/$/, { due: [{ index: 0, q: "Phases ?", a: "4", box: 0 }], total: 1, mastered: 0 }],
    [/^\/api\/revision\/questions\/$/, [QUESTION]],
    [/^\/api\/revision\/questions\/qq1\/$/, QUESTION],
    [/^\/api\/examens-blancs\/$/, { examen: { id: "e1", titre: "Examen blanc national — novembre 2026", start_date: "2026-11-16", end_date: "2026-11-19" },
      exam_type: "BAC", serie: "D", compositions: [COMPO] }],
    [/^\/api\/examens-blancs\/compositions\/co1\/$/, { ...COMPO, examen: { id: "e1", titre: "Examen blanc national" } }],
    [/^\/api\/examens-blancs\/e1\/classement\/$/, { participants: 0, top: [], moi: null }],
    [/^\/api\/planning\/$/, { exam_type: "BAC", date_examen: "2027-06-21", jours_restants: 219, serie: 3, actif_aujourdhui: true,
      semaine: [{ date: "2026-11-14", active: true }], matieres: [{ matiere: "PCT", moyenne: 42, quiz: 3 }], points_faibles: [],
      objectifs: [{ type: "quiz", texte: "Quiz de 10 min en PCT" }] }],
    [/^\/api\/legal\/[a-z-]+\/$/, { slug: "confidentialite", title: "Politique de confidentialité", body: "### Données\nLoi n° 2017-20" }],
  ].find(([re]) => re.test(path));
  const body = route ? route[1] : {};
  const status = route && body !== null ? 200 : route ? 401 : 404;
  return Promise.resolve({ ok: status === 200, status, json: async () => body });
}

/** Tout le texte affiché à l'écran, mis bout à bout. */
function text(r) {
  const out = [];
  const walk = (n) => {
    if (n == null) return;
    if (typeof n === "string") return void out.push(n);
    if (Array.isArray(n)) return n.forEach(walk);
    (n.children ?? []).forEach(walk);
  };
  walk(r.toJSON());
  return out.join(" ");
}
const flush = async (ms = 50) => act(() => new Promise((res) => setTimeout(res, ms)));

/** Lance l'app : écran logo (1,6 s minimum), puis l'accueil (présentation déjà vue, sauf `firstLaunch`). */
async function start({ firstLaunch = false } = {}) {
  if (!firstLaunch) await AsyncStorage.setItem("edubenin:onboarded", "true");
  let r;
  await act(async () => {
    r = ReactTestRenderer.create(<App />);
  });
  await flush(200);
  expect(text(r)).toContain("Réussis ton BAC et ton BEPC"); // écran logo
  await flush(1700);
  return r;
}

/** Appuie sur le premier élément cliquable dont le texte contient `label`. */
async function press(r, label) {
  const node = r.root.findAll((n) => typeof n.props?.onPress === "function" && text({ toJSON: () => n }).includes(label))[0];
  if (!node) throw new Error(`Bouton introuvable : ${label}`);
  await act(async () => node.props.onPress());
  await flush(250);
}

const TABS = ["HomeTab", "ExamsTab", "QuizTab", "IaTab", "MoreTab"];
async function open(r, name, params) {
  await act(async () =>
    TABS.includes(name) ? navigationRef.navigate("Tabs", { screen: name, params }) : navigationRef.navigate(name, params),
  );
  await flush(450); // certaines listes attendent 250 ms avant de chercher (saisie)
  const t = text(r);
  expect(t).not.toContain("Oups, un souci d'affichage");
  return t;
}

let errors;
beforeEach(async () => {
  global.fetch = jest.fn(fakeFetch);
  await AsyncStorage.clear();
  errors = [];
  jest.spyOn(console, "error").mockImplementation((...a) => errors.push(a.map(String).join(" ")));
});
afterEach(() => {
  console.error.mockRestore?.();
  // « act(...) » : simples avertissements des minuteurs de test, pas des bugs de l'application.
  expect(errors.filter((e) => !/not wrapped in act|act\(\.\.\.\)/.test(e))).toEqual([]);
});

test("visiteur : l'accueil s'affiche tout de suite et chaque écran public s'ouvre", async () => {
  me = null;
  const r = await start();
  expect(text(r)).toContain("Réviser");
  expect(text(r)).toContain("Plateforme béninoise");
  expect(text(r)).toContain("Prêt en");
  for (const [name, params, expected] of [
    ["ExamsTab", { examType: "BAC" }, "SVT BAC D 2024"],
    ["ExamDetail", { id: 1 }, "Ouvrir le sujet"],
    ["QuizTab", { mode: "epreuve" }, "Quiz Épreuve IA"],
    ["QuizTab", { mode: "prof" }, "Quiz Professeur"],
    ["IaTab", undefined, "Par quoi on commence"],
    ["MoreTab", undefined, "Paramètres"],
    ["Notifications", undefined, "Connecte-toi"],
    ["Favoris", undefined, "Aucune épreuve en favori"],
    ["Progression", undefined, "Pas encore de résultats"],
    ["Parametres", undefined, "Rappel de révision"],
    ["Auth", undefined, "Continuer avec Google"],
    ["Recherche", undefined, "Que cherches-tu"],
    ["Ajouter", undefined, "Choisir le PDF de l'épreuve"],
  ]) {
    expect(await open(r, name, params)).toContain(expected);
  }
  await act(async () => r.unmount());
});

test("élève connecté : messages, défis, notifications, épreuve avec dissertation, QCM", async () => {
  me = ELEVE;
  await AsyncStorage.setMany({ "edubenin:access": "a", "edubenin:refresh": "r" });
  const r = await start();
  await flush(300);
  expect(text(r)).toContain("Bonjour Ama");
  for (const [name, params, expected] of [
    ["Notifications", undefined, "Salut"],
    ["Messages", undefined, "Aucune discussion"],
    ["Chat", { id: "c1" }, "Salut"],
    ["Defis", undefined, "Créer un défi"],
    ["Duel", { code: "ABC123" }, "ABC123"],
    ["Audios", undefined, "Aucun audio"],
    ["Profil", undefined, "Enregistrer"],
    ["Epreuve", { epreuve: EPREUVE, timed: true }, "Introduction"],
    ["Qcm", { params: { exam_type: "BAC", serie: "D", matiere: "SVT", themes: [] }, minutes: 10, target: 10, meta: { matiere: "SVT", examType: "BAC" } }, "Question 1 ?"],
    ["ProfQuizRun", { mode: "revision", matiere: "SVT", examType: "BAC", questions: [{ id: 1, kind: "QCM", question: "2+2 ?", options: ["4", "5"], answer: "4" }] }, "2+2 ?"],
    ["Classes", undefined, "Tle D1"],
    ["Classe", { id: "c1" }, "DM génétique"],
    ["Devoir", { id: "d1" }, "Combien de chromosomes ?"],
    ["ProfProfil", { id: 2 }, "Très clair"],
    ["Fiches", undefined, "La mitose"],
    ["Fiche", { id: "f1" }, "Réviser les cartes"],
    ["Cartes", { id: "f1" }, "Phases ?"],
    ["Questions", undefined, "Pourquoi la méiose ?"],
    ["Question", { id: "qq1" }, "Parce que…"],
    ["ExamenBlanc", undefined, "Examen blanc national — novembre 2026"],
    ["Composition", { id: "co1" }, "Ouverture dans"],
    ["Planning", undefined, "219"],
    ["Pass", undefined, "Pass 24 h"],
    ["Legal", { slug: "confidentialite" }, "2017-20"],
    ["IaTab", undefined, "4 question(s)"],
  ]) {
    expect(await open(r, name, params)).toContain(expected);
  }
  // L'épreuve affiche le chrono et la zone de rédaction structurée.
  await open(r, "Epreuve", { epreuve: EPREUVE, timed: true });
  const t = text(r);
  expect(t).toContain("Conclusion");
  expect(t).toContain("Ajouter une partie");
  expect(t).toMatch(/[34]:[0-5]\d:[0-5]\d/); // chrono de 4 h de l'épreuve de philosophie
  await act(async () => r.unmount());
});

test("professeur : tableau de bord, mes quiz, nouveau quiz", async () => {
  me = PROF;
  await AsyncStorage.setMany({ "edubenin:access": "a", "edubenin:refresh": "r" });
  const r = await start();
  await flush(300);
  for (const [name, expected] of [
    ["ProfDashboard", "Espace professeur"],
    ["ProfQuiz", "Aucun quiz publié"],
    ["ProfQuizNew", "Proposer des questions"],
    ["Gains", "Commission 10 %"],
    ["Classes", "Tle D1"],
    ["ProfAudios", "Mes publications"],
  ]) {
    expect(await open(r, name)).toContain(expected);
  }
  await act(async () => r.unmount());
});

test("premier lancement : écran logo puis présentation en 5 étapes (Suivant, Précédent, Passer)", async () => {
  me = null;
  const r = await start({ firstLaunch: true });
  expect(text(r)).toContain("Étape 1 sur 5");
  expect(text(r)).toContain("Passer");
  await press(r, "Suivant");
  expect(text(r)).toContain("Étape 2 sur 5");
  await press(r, "Précédent");
  expect(text(r)).toContain("Étape 1 sur 5");
  for (let i = 0; i < 4; i += 1) await press(r, "Suivant");
  expect(text(r)).toContain("Étape 5 sur 5");
  await press(r, "Commencer");
  expect(text(r)).toContain("Plateforme béninoise"); // accueil
  expect(await AsyncStorage.getItem("edubenin:onboarded")).toBe("true");
  await act(async () => r.unmount());
});
