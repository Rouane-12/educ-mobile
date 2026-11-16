// Toutes les routes du backend (identiques au site web).
import { api } from "./client";

export const authApi = {
  register: (data) => api("/api/auth/register/", { method: "POST", body: data }),
  resend: (email) => api("/api/auth/resend/", { method: "POST", body: { email } }),
  login: (email, password) => api("/api/auth/login/", { method: "POST", body: { email, password } }),
  google: (credential, role) => api("/api/auth/google/", { method: "POST", body: { credential, role } }),
  forgot: (email) => api("/api/auth/password/forgot/", { method: "POST", body: { email } }),
  me: () => api("/api/auth/me/"),
  updateMe: (data) => api("/api/auth/me/", { method: "PATCH", body: data }),
  searchUsers: (q) => api("/api/auth/users/search/", { query: { q } }),
};

export const examsApi = {
  list: (filters = {}) => api("/api/exams/", { query: filters }),
  get: (id) => api(`/api/exams/${id}/`),
  upload: (formData) => api("/api/exams/", { method: "POST", body: formData }),
};

export const quizApi = {
  list: (filters = {}) => api("/api/quizzes/", { query: filters }),
  get: (id) => api(`/api/quizzes/${id}/`),
  create: (data) => api("/api/quizzes/", { method: "POST", body: data }),
  remove: (id) => api(`/api/quizzes/${id}/`, { method: "DELETE" }),
  saveAttempt: (data) => api("/api/attempts/", { method: "POST", body: data }),
  profStats: () => api("/api/prof/stats/"),
};

export const audioApi = {
  list: (mine = false) => api("/api/audios/", { query: { mine: mine ? 1 : undefined } }),
  upload: (formData) => api("/api/audios/", { method: "POST", body: formData }),
  remove: (id) => api(`/api/audios/${id}/`, { method: "DELETE" }),
};

export const chatApi = {
  list: () => api("/api/conversations/"),
  create: (member_ids, name) => api("/api/conversations/", { method: "POST", body: { member_ids, name } }),
  get: (id) => api(`/api/conversations/${id}/`),
  messages: (id, after) => api(`/api/conversations/${id}/messages/`, { query: { after } }),
  send: (id, content) => api(`/api/conversations/${id}/messages/`, { method: "POST", body: { content } }),
};

export const aiApi = {
  quiz: (params) => api("/api/ai/quiz/", { method: "POST", body: params }),
  epreuve: (params) => api("/api/ai/epreuve/", { method: "POST", body: params }),
  corriger: (epreuve, reponses) => api("/api/ai/corriger/", { method: "POST", body: { epreuve, reponses } }),
  conversations: () => api("/api/ai/conversations/"),
  conversation: (id) => api(`/api/ai/conversations/${id}/`),
  createConversation: (title) => api("/api/ai/conversations/", { method: "POST", body: { title } }),
  renameConversation: (id, title) => api(`/api/ai/conversations/${id}/`, { method: "PATCH", body: { title } }),
  deleteConversation: (id) => api(`/api/ai/conversations/${id}/`, { method: "DELETE" }),
};

export const duelApi = {
  list: () => api("/api/duels/"),
  create: (params) => api("/api/duels/", { method: "POST", body: params }),
  get: (code) => api(`/api/duels/${code}/`),
  join: (code) => api(`/api/duels/${code}/join/`, { method: "POST" }),
  start: (code) => api(`/api/duels/${code}/start/`, { method: "POST" }),
  answer: (code, index, answer) => api(`/api/duels/${code}/answer/`, { method: "POST", body: { index, answer } }),
};

export const notifApi = {
  list: (after) => api("/api/notifications/", { query: { after } }),
  read: (ids) => api("/api/notifications/read/", { method: "POST", body: ids ? { ids } : {} }),
  clear: () => api("/api/notifications/clear/", { method: "DELETE" }),
  registerDevice: (token, platform) => api("/api/notifications/devices/", { method: "POST", body: { token, platform } }),
  unregisterDevice: (token) => api("/api/notifications/devices/", { method: "DELETE", body: { token } }),
};

export const billingApi = {
  status: () => api("/api/billing/status/"),
  checkout: (plan) => api("/api/billing/checkout/", { method: "POST", body: { plan } }),
};

export const importApi = {
  send: (formData) => api("/api/ai/import/", { method: "POST", body: formData }),
};

export const classesApi = {
  list: () => api("/api/classes/"),
  create: (data) => api("/api/classes/", { method: "POST", body: data }),
  join: (code) => api("/api/classes/join/", { method: "POST", body: { code } }),
  get: (id) => api(`/api/classes/${id}/`),
  update: (id, data) => api(`/api/classes/${id}/`, { method: "PATCH", body: data }),
  leaveOrArchive: (id) => api(`/api/classes/${id}/`, { method: "DELETE" }),
  removeMember: (id, userId) => api(`/api/classes/${id}/members/${userId}/`, { method: "DELETE" }),
  createDevoir: (id, data) => api(`/api/classes/${id}/devoirs/`, { method: "POST", body: data }),
  devoir: (id) => api(`/api/classes/devoirs/${id}/`),
  deleteDevoir: (id) => api(`/api/classes/devoirs/${id}/`, { method: "DELETE" }),
  submit: (id, answers) => api(`/api/classes/devoirs/${id}/submit/`, { method: "POST", body: { answers } }),
  results: (id) => api(`/api/classes/devoirs/${id}/results/`),
  rate: (id, data) => api(`/api/classes/${id}/rate/`, { method: "POST", body: data }),
  prof: (userId) => api(`/api/classes/profs/${userId}/`),
  gains: () => api("/api/classes/gains/"),
  setPhone: (telephone_paiement) => api("/api/classes/gains/", { method: "PATCH", body: { telephone_paiement } }),
};

export const revisionApi = {
  fiches: (filters = {}) => api("/api/revision/fiches/", { query: filters }),
  fiche: (id) => api(`/api/revision/fiches/${id}/`),
  createFiche: (formData) => api("/api/revision/fiches/", { method: "POST", body: formData }),
  deleteFiche: (id) => api(`/api/revision/fiches/${id}/`, { method: "DELETE" }),
  generateCards: (contenu, count) => api("/api/revision/fiches/generate-cards/", { method: "POST", body: { contenu, count } }),
  review: (id) => api(`/api/revision/fiches/${id}/review/`),
  answerCard: (id, index, ok) => api(`/api/revision/fiches/${id}/review/`, { method: "POST", body: { index, ok } }),
  questions: (filters = {}) => api("/api/revision/questions/", { query: filters }),
  question: (id) => api(`/api/revision/questions/${id}/`),
  ask: (formData) => api("/api/revision/questions/", { method: "POST", body: formData }),
  deleteQuestion: (id) => api(`/api/revision/questions/${id}/`, { method: "DELETE" }),
  answer: (id, formData) => api(`/api/revision/questions/${id}/answer/`, { method: "POST", body: formData }),
  vote: (id) => api(`/api/revision/questions/${id}/vote/`, { method: "POST" }),
};

export const examBlancApi = {
  current: (filters = {}) => api("/api/examens-blancs/", { query: filters }),
  composition: (id) => api(`/api/examens-blancs/compositions/${id}/`),
  submit: (id, reponses) => api(`/api/examens-blancs/compositions/${id}/submit/`, { method: "POST", body: { reponses } }),
  classement: (id, filters = {}) => api(`/api/examens-blancs/${id}/classement/`, { query: filters }),
};

export const planningApi = { get: () => api("/api/planning/") };

/** Supervision (troisième rôle) : comptes, signalements, gains des professeurs. */
export const supervisionApi = {
  stats: () => api("/api/supervision/stats/"),
  users: (filters = {}) => api("/api/supervision/users/", { query: filters }),
  createUser: (data) => api("/api/supervision/users/", { method: "POST", body: data }),
  updateUser: (id, data) => api(`/api/supervision/users/${id}/`, { method: "PATCH", body: data }),
  deleteUser: (id) => api(`/api/supervision/users/${id}/`, { method: "DELETE" }),
  reports: (filters = {}) => api("/api/supervision/reports/", { query: filters }),
  handleReport: (id, status) => api(`/api/supervision/reports/${id}/`, { method: "POST", body: { status } }),
  earnings: (filters = {}) => api("/api/supervision/earnings/", { query: filters }),
  setEarning: (id, status) => api(`/api/supervision/earnings/${id}/`, { method: "POST", body: { status } }),
  bonus: (data) => api("/api/supervision/earnings/bonus/", { method: "POST", body: data }),
};

export const communityApi = {
  toggleBlock: (user_id) => api("/api/blocks/", { method: "POST", body: { user_id } }),
  report: (data) => api("/api/reports/", { method: "POST", body: data }),
  legal: (slug) => api(`/api/legal/${slug}/`),
};
