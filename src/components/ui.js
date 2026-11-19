// Kit d'interface EduBénin pour mobile : reprend le design du site (cartes, boutons dégradés, puces…).
import { Eye, EyeOff, Loader2 } from "lucide-react-native";
import { useEffect, useReducer, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Modal as RNModal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApp } from "../context/AppContext";
import { KeyboardInset, useKeyboardScroll } from "../lib/keyboard";
import { alpha, GUTTER, radius } from "../theme";

export function T({ style, size = 15, weight, color, muted, center, children, ...rest }) {
  const { colors, fs } = useApp();
  return (
    <Text
      style={[
        {
          color: color ?? (muted ? colors.mutedForeground : colors.foreground),
          fontSize: fs(size),
          lineHeight: fs(size) * 1.45,
          fontWeight: weight,
          textAlign: center ? "center" : undefined,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </Text>
  );
}

export const H1 = (p) => <T size={26} weight="800" {...p} />;
export const H2 = (p) => <T size={20} weight="700" {...p} />;
export const H3 = (p) => <T size={16} weight="700" {...p} />;

/** Écran défilant avec marges identiques au site, sans débordement horizontal. */
export function Screen({ children, scroll = true, padded = true, refreshControl, contentStyle, edges = ["bottom"], onScroll, ...rest }) {
  const { colors } = useApp();
  const kb = useKeyboardScroll(onScroll);
  const inner = padded ? { paddingHorizontal: GUTTER, paddingVertical: 16 } : null;
  return (
    <SafeAreaView edges={edges} style={{ flex: 1, backgroundColor: colors.background }}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={[inner, { gap: 14, paddingBottom: 40 }, contentStyle]}
          refreshControl={refreshControl}
          {...kb}
          {...rest}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1 }, inner, contentStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

export function Card({ style, children, glow, onPress, ...rest }) {
  const { colors } = useApp();
  const s = [
    {
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: glow ? alpha(colors.primary, 0.45) : colors.border,
      padding: 16,
      gap: 8,
    },
    style,
  ];
  if (onPress)
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [s, pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] }]} {...rest}>
        {children}
      </Pressable>
    );
  return (
    <View style={s} {...rest}>
      {children}
    </View>
  );
}

export function Button({ title, onPress, icon: Icon, iconRight: IconRight, variant = "primary", size = "md", loading, disabled, block, style }) {
  const { colors, fs } = useApp();
  const h = size === "lg" ? 52 : size === "sm" ? 36 : 44;
  const fg =
    variant === "primary" || variant === "danger"
      ? colors.primaryForeground
      : variant === "ghost"
        ? colors.mutedForeground
        : colors.foreground;
  const content = (
    <View style={[styles.btnInner, { height: h, paddingHorizontal: size === "sm" ? 12 : 18 }]}>
      {loading ? <ActivityIndicator color={fg} size="small" /> : Icon ? <Icon color={fg} size={size === "sm" ? 16 : 18} /> : null}
      {title ? (
        <Text numberOfLines={1} style={{ color: fg, fontWeight: "700", fontSize: fs(size === "sm" ? 13 : 15), flexShrink: 1 }}>
          {title}
        </Text>
      ) : null}
      {IconRight && !loading ? <IconRight color={fg} size={18} /> : null}
    </View>
  );
  const off = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      style={({ pressed }) => [
        { borderRadius: radius.md, overflow: "hidden", alignSelf: block ? "stretch" : "flex-start", opacity: off ? 0.55 : 1 },
        variant === "secondary" && { backgroundColor: colors.muted, borderWidth: 1, borderColor: colors.borderStrong },
        variant === "outline" && { borderWidth: 1, borderColor: colors.borderStrong },
        variant === "danger" && { backgroundColor: colors.danger },
        pressed && { transform: [{ scale: 0.98 }], opacity: 0.9 },
        style,
      ]}
    >
      {variant === "primary" ? (
        <LinearGradient colors={[colors.primary, colors.secondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          {content}
        </LinearGradient>
      ) : (
        content
      )}
    </Pressable>
  );
}

export function IconButton({ icon: Icon, onPress, color, size = 20, label, badge, style }) {
  const { colors } = useApp();
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={label}
      hitSlop={8}
      style={({ pressed }) => [styles.iconBtn, { backgroundColor: pressed ? colors.surfaceHover : "transparent" }, style]}
    >
      <Icon color={color ?? colors.foreground} size={size} />
      {badge ? (
        <View style={[styles.badgeDot, { backgroundColor: colors.danger, borderColor: colors.background }]}>
          <Text style={styles.badgeText}>{badge > 99 ? "99+" : badge}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

export function Chip({ label, active, onPress, icon: Icon, small }) {
  const { colors, fs } = useApp();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: active ? alpha(colors.primary, 0.16) : colors.surface,
          borderColor: active ? colors.primary : colors.border,
          maxWidth: "100%",
        },
      ]}
    >
      {Icon ? <Icon size={14} color={active ? colors.primary : colors.mutedForeground} /> : null}
      <Text numberOfLines={1} style={{ color: active ? colors.primary : colors.foreground, fontSize: fs(13), fontWeight: "600", flexShrink: 1 }}>{label}</Text>
      {small ? <Text style={{ color: colors.mutedForeground, fontSize: fs(11) }}>{small}</Text> : null}
    </Pressable>
  );
}

/** Puces qui passent à la ligne (jamais de débordement). */
export const ChipRow = ({ children, style }) => <View style={[{ flexDirection: "row", flexWrap: "wrap", gap: 8 }, style]}>{children}</View>;

/**
 * Onglets. Le texte reste TOUJOURS sur une ligne : avec 3 onglets ou plus aux libellés longs,
 * ils se rangent sur deux lignes (2 en haut, le reste en bas) au lieu de se serrer.
 */
export function Segmented({ options, value, onChange }) {
  const { colors, fs } = useApp();
  const longest = Math.max(...options.map((o) => String(o.label).length));
  const wrap = options.length >= 4 || (options.length === 3 && longest > 9);
  return (
    <View style={[styles.seg, { backgroundColor: colors.muted, borderColor: colors.border }, wrap && { flexWrap: "wrap" }]}>
      {options.map((o) => {
        const active = o.value === value;
        const Icon = o.icon;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            style={[styles.segItem, wrap ? { flexBasis: "46%", flexGrow: 1 } : { flex: 1 }, active && { backgroundColor: colors.card }]}
          >
            {Icon ? <Icon size={15} color={active ? colors.primary : colors.mutedForeground} /> : null}
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.82}
              style={{ color: active ? colors.foreground : colors.mutedForeground, fontWeight: "700", fontSize: fs(12.5), textAlign: "center", flexShrink: 1 }}
            >
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Field({ label, children, hint }) {
  return (
    <View style={{ gap: 8 }}>
      {label ? <T size={13} weight="700" muted>{label}</T> : null}
      {children}
      {hint ? <T size={12} muted>{hint}</T> : null}
    </View>
  );
}

/** Champ texte. Avec `secureTextEntry`, un œil permet d'afficher / masquer le mot de passe. */
export function Input({ icon: Icon, style, inputStyle, multiline, secureTextEntry, ...rest }) {
  const { colors, fs } = useApp();
  const [visible, setVisible] = useState(false);
  const EyeIcon = visible ? EyeOff : Eye;
  return (
    <View
      style={[
        styles.input,
        { backgroundColor: colors.surface, borderColor: colors.borderStrong, alignItems: multiline ? "flex-start" : "center" },
        style,
      ]}
    >
      {Icon ? <Icon size={17} color={colors.mutedForeground} style={multiline ? { marginTop: 12 } : null} /> : null}
      <TextInput
        placeholderTextColor={colors.mutedForeground}
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "center"}
        style={[{ flex: 1, color: colors.foreground, fontSize: fs(15), paddingVertical: 11, minHeight: multiline ? 110 : 46 }, inputStyle]}
        secureTextEntry={secureTextEntry && !visible}
        {...rest}
      />
      {secureTextEntry ? (
        <Pressable
          onPress={() => setVisible((v) => !v)}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          style={{ padding: 6 }}
        >
          <EyeIcon size={19} color={colors.mutedForeground} />
        </Pressable>
      ) : null}
    </View>
  );
}

export function Badge({ label, tone = "primary" }) {
  const { colors, fs } = useApp();
  const c = colors[tone] ?? colors.primary;
  return (
    <View style={{ alignSelf: "flex-start", paddingHorizontal: 9, paddingVertical: 3, borderRadius: radius.full, backgroundColor: alpha(c, 0.15) }}>
      <Text numberOfLines={1} style={{ color: c, fontSize: fs(11.5), fontWeight: "700" }}>{label}</Text>
    </View>
  );
}

export function EmptyState({ icon: Icon, title, children, action }) {
  const { colors } = useApp();
  return (
    <View style={{ alignItems: "center", padding: 28, gap: 10 }}>
      {Icon ? (
        <View style={[styles.emptyIcon, { backgroundColor: alpha(colors.primary, 0.12) }]}>
          <Icon size={26} color={colors.primary} />
        </View>
      ) : null}
      <H3 center>{title}</H3>
      {children ? <T muted center size={14}>{children}</T> : null}
      {action}
    </View>
  );
}

export function Skeleton({ height = 80, style }) {
  const { colors } = useApp();
  const v = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const a = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(v, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ]),
    );
    a.start();
    return () => a.stop();
  }, [v]);
  return <Animated.View style={[{ height, borderRadius: radius.md, backgroundColor: colors.muted, opacity: v }, style]} />;
}

export function Spinner({ size = 22 }) {
  const { colors } = useApp();
  const r = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const a = Animated.loop(Animated.timing(r, { toValue: 1, duration: 900, easing: Easing.linear, useNativeDriver: true }));
    a.start();
    return () => a.stop();
  }, [r]);
  const rotate = r.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
  return (
    <Animated.View style={{ transform: [{ rotate }] }}>
      <Loader2 size={size} color={colors.primary} />
    </Animated.View>
  );
}

/** En-tête de page façon site : étiquette, grand titre, sous-titre. */
export function PageHero({ eyebrow, icon: Icon, title, subtitle, children }) {
  const { colors } = useApp();
  return (
    <View style={{ gap: 8, paddingVertical: 6 }}>
      {eyebrow ? (
        <View style={[styles.eyebrow, { backgroundColor: alpha(colors.primary, 0.12), borderColor: alpha(colors.primary, 0.3) }]}>
          {Icon ? <Icon size={13} color={colors.primary} /> : null}
          <T size={12} weight="700" color={colors.primary}>{eyebrow}</T>
        </View>
      ) : null}
      <H1>{title}</H1>
      {subtitle ? <T muted size={14.5}>{subtitle}</T> : null}
      {children}
    </View>
  );
}

/** Feuille modale (bas d'écran sur mobile). */
export function Sheet({ open, onClose, title, children, footer }) {
  const { colors } = useApp();
  return (
    <RNModal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardInset>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <SafeAreaView edges={["bottom"]} style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.grabber, { backgroundColor: colors.borderStrong }]} />
        {title ? <H2>{title}</H2> : null}
        <ScrollView style={{ maxHeight: 460 }} contentContainerStyle={{ gap: 10, paddingVertical: 6 }} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
        {footer ? <View style={{ flexDirection: "row", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" }}>{footer}</View> : null}
      </SafeAreaView>
      </KeyboardInset>
    </RNModal>
  );
}

/** Petits messages éphémères (équivalent de « sonner » sur le site). */
let toastListener = null;
export const toast = {
  show: (message, tone = "info") => toastListener?.({ message, tone, id: Date.now() }),
  success: (m) => toast.show(m, "success"),
  error: (m) => toast.show(m, "danger"),
  info: (m) => toast.show(m, "info"),
};

export function ToastHost() {
  const { colors, fs } = useApp();
  const y = useRef(new Animated.Value(-120)).current;
  const msgRef = useRef(null);
  const timer = useRef(null);
  const [, force] = useStateForce();
  useEffect(() => {
    toastListener = (m) => {
      msgRef.current = m;
      force();
      clearTimeout(timer.current);
      Animated.spring(y, { toValue: 0, useNativeDriver: true }).start();
      timer.current = setTimeout(() => Animated.timing(y, { toValue: -120, duration: 220, useNativeDriver: true }).start(), 2600);
    };
    return () => {
      toastListener = null;
    };
  }, [y, force]);
  const m = msgRef.current;
  if (!m) return null;
  return (
    <SafeAreaView edges={["top"]} pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Animated.View
        style={[
          styles.toast,
          { backgroundColor: colors.card, borderColor: alpha(colors[m.tone] ?? colors.info, 0.6), transform: [{ translateY: y }] },
        ]}
      >
        <View style={{ width: 4, alignSelf: "stretch", borderRadius: 2, backgroundColor: colors[m.tone] ?? colors.info }} />
        <Text style={{ color: colors.foreground, fontSize: fs(14), fontWeight: "600", flex: 1 }}>{m.message}</Text>
      </Animated.View>
    </SafeAreaView>
  );
}

function useStateForce() {
  return useReducer((x) => x + 1, 0);
}

export const Row = ({ style, children, gap = 10, wrap }) => (
  <View style={[{ flexDirection: "row", alignItems: "center", gap, flexWrap: wrap ? "wrap" : "nowrap" }, style]}>{children}</View>
);

export function Divider() {
  const { colors } = useApp();
  return <View style={{ height: 1, backgroundColor: colors.border }} />;
}

/** Bande aux couleurs du drapeau béninois. */
export function FlagBar({ style }) {
  const { colors } = useApp();
  return (
    <View style={[{ flexDirection: "row", height: 4, borderRadius: 2, overflow: "hidden", width: 54 }, style]}>
      <View style={{ flex: 1, backgroundColor: colors.beninGreen }} />
      <View style={{ flex: 1, backgroundColor: colors.beninYellow }} />
      <View style={{ flex: 1, backgroundColor: colors.beninRed }} />
    </View>
  );
}

const styles = StyleSheet.create({
  btnInner: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  iconBtn: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  badgeDot: {
    position: "absolute",
    top: 3,
    right: 2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  badgeText: { color: "#fff", fontSize: 9.5, fontWeight: "800" },
  chip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.full, borderWidth: 1 },
  seg: { flexDirection: "row", padding: 4, borderRadius: radius.md, borderWidth: 1, gap: 4 },
  segItem: { minHeight: 40, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 6 },
  input: { flexDirection: "row", gap: 8, borderWidth: 1, borderRadius: radius.md, paddingHorizontal: 12 },
  emptyIcon: { width: 56, height: 56, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  eyebrow: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full, borderWidth: 1 },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, padding: GUTTER, gap: 12 },
  grabber: { alignSelf: "center", width: 40, height: 4, borderRadius: 2 },
  toast: { marginHorizontal: GUTTER, marginTop: 8, flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: radius.md, borderWidth: 1, elevation: 6 },
});
