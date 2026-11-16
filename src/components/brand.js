// Identité visuelle et petites animations partagées (accueil, présentation, connexion).
import { GraduationCap } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Image, Pressable, Text, View } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { useApp } from "../context/AppContext";
import { alpha } from "../theme";

// Photos libres de droits (Pexels), les mêmes que sur le site, en taille réduite pour le mobile.
const pexels = (id, w = 900) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}`;
export const IMAGES = {
  hero: pexels(34162714, 1000),
  studyGroup: pexels(9090818),
  teacher: pexels(5905484),
  laptop: pexels(6281731),
  classroom: pexels(28593054),
  phone: pexels(5940840),
  library: pexels(3808060),
  auth: pexels(5965612),
};

/** Logo carré (dégradé orange + toque). */
export function LogoMark({ size = 44, style }) {
  const { colors } = useApp();
  return (
    <LinearGradient
      colors={[colors.primary, colors.secondary]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        {
          width: size,
          height: size,
          borderRadius: size * 0.3,
          alignItems: "center",
          justifyContent: "center",
          shadowColor: colors.primary,
          shadowOpacity: 0.5,
          shadowRadius: 16,
          elevation: 8,
        },
        style,
      ]}
    >
      <GraduationCap size={size * 0.55} color="#fff" />
    </LinearGradient>
  );
}

/** « EduBénin » avec la deuxième moitié en couleur. */
export function Wordmark({ size = 22, light }) {
  const { colors, fs } = useApp();
  return (
    <Text style={{ fontSize: fs(size), fontWeight: "800", color: light ? "#fff" : colors.foreground, letterSpacing: -0.4 }}>
      Edu<Text style={{ color: colors.primary }}>Bénin</Text>
    </Text>
  );
}

/** Apparition en fondu + glissement (décalable avec `delay`). */
export function FadeIn({ delay = 0, from = 18, duration = 520, style, children, axis = "y" }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const a = Animated.timing(v, { toValue: 1, duration, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true });
    a.start();
    return () => a.stop();
  }, [v, delay, duration]);
  const shift = v.interpolate({ inputRange: [0, 1], outputRange: [from, 0] });
  return (
    <Animated.View style={[{ opacity: v, transform: [axis === "x" ? { translateX: shift } : { translateY: shift }] }, style]}>
      {children}
    </Animated.View>
  );
}

/** Zone cliquable qui s'enfonce légèrement au toucher. */
export function PressScale({ onPress, style, children, scaleTo = 0.96, ...rest }) {
  const s = useRef(new Animated.Value(1)).current;
  const to = (v) => Animated.spring(s, { toValue: v, useNativeDriver: true, speed: 40, bounciness: 6 }).start();
  return (
    <Pressable onPress={onPress} onPressIn={() => to(scaleTo)} onPressOut={() => to(1)} {...rest}>
      <Animated.View style={[style, { transform: [{ scale: s }] }]}>{children}</Animated.View>
    </Pressable>
  );
}

/** Bulle de couleur floue qui flotte doucement (décor de fond). */
export function Blob({ size = 220, color, style, duration = 5200, dx = 24, dy = 18 }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const a = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(v, { toValue: 0, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    a.start();
    return () => a.stop();
  }, [v, duration]);
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: "absolute",
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          opacity: 0.55,
          transform: [
            { translateX: v.interpolate({ inputRange: [0, 1], outputRange: [0, dx] }) },
            { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, dy] }) },
            { scale: v.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] }) },
          ],
        },
        style,
      ]}
    />
  );
}

/** Pulsation douce en boucle (badges, icônes mises en avant). */
export function Pulse({ children, style, min = 0.94, max = 1.06, duration = 1400 }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const a = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(v, { toValue: 0, duration, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    a.start();
    return () => a.stop();
  }, [v, duration]);
  return <Animated.View style={[style, { transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [min, max] }) }] }]}>{children}</Animated.View>;
}

/**
 * Photo distante avec repli élégant : en mode « économie de données », ou si l'image ne charge pas,
 * on affiche un dégradé aux couleurs de l'app (aucune zone vide ou cassée).
 */
export function Photo({ uri, style, children, overlay = true, radius = 0 }) {
  const { colors, settings } = useApp();
  const [failed, setFailed] = useState(false);
  const show = uri && !settings?.dataSaver && !failed;
  return (
    <View style={[{ overflow: "hidden", borderRadius: radius, backgroundColor: colors.card2 }, style]}>
      <LinearGradient
        colors={[alpha(colors.primary, 0.55), alpha(colors.secondary, 0.25), colors.card]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      />
      {show ? (
        <Image source={{ uri }} resizeMode="cover" onError={() => setFailed(true)} style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} />
      ) : null}
      {overlay ? (
        <LinearGradient
          colors={["rgba(0,0,0,0.05)", "rgba(10,7,5,0.55)", "rgba(10,7,5,0.92)"]}
          locations={[0, 0.55, 1]}
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        />
      ) : null}
      {children}
    </View>
  );
}

/** Pastille d'icône colorée. */
export function IconBadge({ icon: Icon, tone = "primary", size = 44, style }) {
  const { colors } = useApp();
  const c = colors[tone] ?? colors.primary;
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size * 0.32,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: alpha(c, 0.16),
          borderWidth: 1,
          borderColor: alpha(c, 0.32),
        },
        style,
      ]}
    >
      <Icon size={size * 0.48} color={c} />
    </View>
  );
}
