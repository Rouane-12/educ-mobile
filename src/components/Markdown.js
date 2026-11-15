import { useMemo } from "react";
import MarkdownDisplay from "react-native-markdown-display";
import { useApp } from "../context/AppContext";
import { alpha } from "../theme";

/** Les formules LaTeX ($…$) ne sont pas rendues nativement : on les affiche lisiblement en code. */
const prepare = (s = "") =>
  String(s)
    .replace(/\$\$([\s\S]+?)\$\$/g, (_, f) => `\n\`\`\`\n${f.trim()}\n\`\`\`\n`)
    .replace(/\$([^$\n]+?)\$/g, (_, f) => `\`${f.trim()}\``);

export function Markdown({ children, size = 15 }) {
  const { colors, fs } = useApp();
  const style = useMemo(
    () => ({
      body: { color: colors.foreground, fontSize: fs(size), lineHeight: fs(size) * 1.55 },
      heading1: { fontSize: fs(21), fontWeight: "800", marginTop: 10, marginBottom: 4, color: colors.foreground },
      heading2: { fontSize: fs(18), fontWeight: "800", marginTop: 10, marginBottom: 4, color: colors.foreground },
      heading3: { fontSize: fs(16), fontWeight: "700", marginTop: 8, marginBottom: 2, color: colors.primary },
      strong: { fontWeight: "800" },
      link: { color: colors.primary },
      bullet_list_icon: { color: colors.primary },
      ordered_list_icon: { color: colors.primary },
      code_inline: { backgroundColor: alpha(colors.primary, 0.12), color: colors.foreground, borderRadius: 4, paddingHorizontal: 4 },
      fence: { backgroundColor: colors.muted, borderColor: colors.border, color: colors.foreground, borderRadius: 10, padding: 10 },
      code_block: { backgroundColor: colors.muted, borderColor: colors.border, color: colors.foreground, borderRadius: 10 },
      blockquote: { backgroundColor: colors.surface, borderLeftColor: colors.primary, borderLeftWidth: 3, paddingHorizontal: 10 },
      table: { borderColor: colors.border },
      th: { borderColor: colors.border, padding: 6 },
      td: { borderColor: colors.border, padding: 6 },
      hr: { backgroundColor: colors.border },
    }),
    [colors, fs, size],
  );
  return <MarkdownDisplay style={style}>{prepare(children)}</MarkdownDisplay>;
}
