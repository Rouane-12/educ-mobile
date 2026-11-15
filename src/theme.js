// Palette EduBénin : exactement les couleurs du site (frontend/src/styles/base/_theme.scss).
export const palettes = {
  dark: {
    mode: "dark",
    background: "#100d0b",
    background2: "#171210",
    foreground: "#f8f3ec",
    muted: "#221d19",
    mutedForeground: "#b3a798",
    card: "#1a1613",
    card2: "#211b17",
    border: "rgba(255,240,225,0.085)",
    borderStrong: "rgba(255,240,225,0.17)",
    primary: "#ff7a1a",
    primaryForeground: "#ffffff",
    secondary: "#ff4f2e",
    accent: "#ffc531",
    success: "#22c56e",
    info: "#3ba9ff",
    danger: "#ff4d4d",
    beninGreen: "#00a35c",
    beninYellow: "#fcd116",
    beninRed: "#e8112d",
    surface: "rgba(255,240,225,0.028)",
    surfaceHover: "rgba(255,240,225,0.055)",
    aurora: "rgba(255,122,26,0.22)",
  },
  light: {
    mode: "light",
    background: "#fbf7f2",
    background2: "#f4ede4",
    foreground: "#221c17",
    muted: "#f0e8de",
    mutedForeground: "#74685c",
    card: "#ffffff",
    card2: "#fdfaf6",
    border: "rgba(36,29,24,0.09)",
    borderStrong: "rgba(36,29,24,0.18)",
    primary: "#f2660a",
    primaryForeground: "#ffffff",
    secondary: "#e8401f",
    accent: "#d99b00",
    success: "#16a34a",
    info: "#3b88c4",
    danger: "#d6483e",
    beninGreen: "#008751",
    beninYellow: "#f5c400",
    beninRed: "#e8112d",
    surface: "rgba(36,29,24,0.022)",
    surfaceHover: "rgba(36,29,24,0.045)",
    aurora: "rgba(242,153,90,0.16)",
  },
};

export const radius = { sm: 9, md: 14, lg: 20, xl: 26, full: 999 };
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };
/** Marge latérale de l'écran : identique au site (16 px). */
export const GUTTER = 16;

/** Couleur avec transparence à partir d'un #rrggbb. */
export function alpha(hex, a) {
  if (!hex?.startsWith("#") || hex.length !== 7) return hex;
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
