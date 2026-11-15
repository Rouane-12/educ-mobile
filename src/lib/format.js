export const formatTime = (s) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`;
};

const pad = (n) => String(n).padStart(2, "0");

export function formatDate(d, withTime = true) {
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return "";
  const date = `${pad(x.getDate())}/${pad(x.getMonth() + 1)}/${x.getFullYear()}`;
  return withTime ? `${date} ${pad(x.getHours())}:${pad(x.getMinutes())}` : date;
}

/** « il y a 5 min », « hier », … */
export function timeAgo(d) {
  const diff = (Date.now() - new Date(d).getTime()) / 1000;
  if (diff < 60) return "à l'instant";
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
  if (diff < 172800) return "hier";
  if (diff < 604800) return `il y a ${Math.floor(diff / 86400)} j`;
  return formatDate(d, false);
}

export const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
