// Écran logo au lancement + présentation de l'app en 5 étapes (affichée une seule fois).
import { ArrowLeft, ArrowRight, BookOpen, Brain, Check, Crown, GraduationCap, Medal, MessageCircleQuestion, Sparkles, Swords, UsersRound } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Pressable, StatusBar, Text, useWindowDimensions, View } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { Blob, FadeIn, IMAGES, LogoMark, Photo, Pulse, Wordmark } from "../components/brand";
import { useApp } from "../context/AppContext";
import { alpha, radius } from "../theme";

/* ------------------------------------------------------------------ */
/* Écran logo                                                          */
/* ------------------------------------------------------------------ */

export function SplashIntro() {
  const { colors } = useApp();
  const logo = useRef(new Animated.Value(0)).current;
  const text = useRef(new Animated.Value(0)).current;
  const bar = useRef(new Animated.Value(0)).current;
  const ring = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(logo, { toValue: 1, useNativeDriver: true, speed: 9, bounciness: 12 }),
      Animated.parallel([
        Animated.timing(text, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(bar, { toValue: 1, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
      ]),
    ]).start();
    const r = Animated.loop(Animated.timing(ring, { toValue: 1, duration: 1600, easing: Easing.out(Easing.quad), useNativeDriver: true }));
    r.start();
    return () => r.stop();
  }, [logo, text, bar, ring]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <Blob size={320} color={alpha(colors.primary, 0.35)} style={{ top: -80, right: -120 }} />
      <Blob size={260} color={alpha(colors.secondary, 0.25)} style={{ bottom: -60, left: -100 }} dx={-20} dy={-24} />

      <View style={{ alignItems: "center", justifyContent: "center" }}>
        <Animated.View
          style={{
            position: "absolute",
            width: 110,
            height: 110,
            borderRadius: 36,
            borderWidth: 2,
            borderColor: colors.primary,
            opacity: ring.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] }),
            transform: [{ scale: ring.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.7] }) }],
          }}
        />
        <Animated.View
          style={{
            opacity: logo,
            transform: [
              { scale: logo.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) },
              { rotate: logo.interpolate({ inputRange: [0, 1], outputRange: ["-18deg", "0deg"] }) },
            ],
          }}
        >
          <LogoMark size={96} />
        </Animated.View>
      </View>

      <Animated.View
        style={{
          marginTop: 28,
          alignItems: "center",
          gap: 10,
          opacity: text,
          transform: [{ translateY: text.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
        }}
      >
        <Wordmark size={34} />
        <Text style={{ color: colors.mutedForeground, fontSize: 14.5, fontWeight: "600" }}>Réussis ton BAC et ton BEPC</Text>
      </Animated.View>

      <View style={{ position: "absolute", bottom: 64, width: 120, height: 4, borderRadius: 2, backgroundColor: colors.muted, overflow: "hidden" }}>
        <Animated.View style={{ height: 4, flexDirection: "row", width: bar.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }) }}>
          <View style={{ flex: 1, backgroundColor: colors.beninGreen }} />
          <View style={{ flex: 1, backgroundColor: colors.beninYellow }} />
          <View style={{ flex: 1, backgroundColor: colors.beninRed }} />
        </Animated.View>
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Présentation en 5 étapes                                            */
/* ------------------------------------------------------------------ */

const SLIDES = [
  {
    image: IMAGES.hero,
    icon: GraduationCap,
    tone: "primary",
    eyebrow: "Bienvenue",
    title: "Ta prépa BAC et BEPC, dans ta poche",
    text: "EduBénin rassemble tout ce qu'il faut pour réussir tes examens, selon le programme béninois.",
    chips: [
      { icon: BookOpen, label: "Épreuves" },
      { icon: Brain, label: "Quiz" },
      { icon: Sparkles, label: "EduIA" },
    ],
  },
  {
    image: IMAGES.studyGroup,
    icon: BookOpen,
    tone: "info",
    eyebrow: "Épreuves & quiz",
    title: "Les anciens sujets et des quiz corrigés",
    text: "Lis les épreuves du BAC et du BEPC par série, matière et année. Entraîne-toi avec des quiz notés sur 20, chronométrés comme le jour J.",
    chips: [
      { icon: GraduationCap, label: "Séries A à G" },
      { icon: Brain, label: "Notes sur 20" },
    ],
  },
  {
    image: IMAGES.phone,
    icon: Sparkles,
    tone: "accent",
    eyebrow: "EduIA",
    title: "Une IA qui t'explique, pas qui triche",
    text: "Pose ta question, prends en photo un exercice ou importe un sujet : EduIA t'explique pas à pas et prépare un corrigé en PDF.",
    chips: [
      { icon: Check, label: "Gratuit chaque jour" },
      { icon: Crown, label: "Pass illimité" },
    ],
  },
  {
    image: IMAGES.teacher,
    icon: UsersRound,
    tone: "success",
    eyebrow: "Tes profs",
    title: "Ta classe, tes devoirs et de vrais profs",
    text: "Rejoins la classe de ton prof avec un code, rends tes devoirs, écoute leurs audios et pose-leur tes questions.",
    chips: [
      { icon: UsersRound, label: "Classes" },
      { icon: MessageCircleQuestion, label: "Questions" },
    ],
  },
  {
    image: IMAGES.classroom,
    icon: Medal,
    tone: "danger",
    eyebrow: "Motivation",
    title: "Examen blanc national et défis",
    text: "Tous les 2 mois, compose les mêmes sujets que tout le Bénin et découvre ton classement. Défie tes amis sur un quiz en direct.",
    chips: [
      { icon: Medal, label: "Classement" },
      { icon: Swords, label: "Défis" },
    ],
  },
];

function Slide({ s, width, active }) {
  const { colors } = useApp();
  const c = colors[s.tone] ?? colors.primary;
  const Icon = s.icon;
  return (
    <View style={{ width, paddingHorizontal: 20, gap: 22 }}>
      {active ? (
        <FadeIn from={26}>
          <View>
            <Photo uri={s.image} radius={30} style={{ height: 300, borderWidth: 1, borderColor: colors.border }}>
              <View style={{ position: "absolute", left: 16, bottom: 16, right: 16, flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {s.chips.map((ch, i) => {
                  const ChIcon = ch.icon;
                  return (
                    <FadeIn key={ch.label} delay={260 + i * 110} from={12}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 11, paddingVertical: 7, borderRadius: 999, backgroundColor: "rgba(16,13,11,0.72)", borderWidth: 1, borderColor: "rgba(255,255,255,0.14)" }}>
                        <ChIcon size={14} color={c} />
                        <Text style={{ color: "#fff", fontSize: 12.5, fontWeight: "700" }}>{ch.label}</Text>
                      </View>
                    </FadeIn>
                  );
                })}
              </View>
            </Photo>
            <Pulse style={{ position: "absolute", top: -14, right: 18 }}>
              <LinearGradient
                colors={[c, alpha(c, 0.7)]}
                style={{ width: 58, height: 58, borderRadius: 20, alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: colors.background, elevation: 8 }}
              >
                <Icon size={26} color="#fff" />
              </LinearGradient>
            </Pulse>
          </View>
        </FadeIn>
      ) : (
        <View style={{ height: 300 }} />
      )}
      {active ? (
        <View style={{ gap: 10 }}>
          <FadeIn delay={120}>
            <Text style={{ color: c, fontSize: 13, fontWeight: "800", letterSpacing: 1.2, textTransform: "uppercase" }}>{s.eyebrow}</Text>
          </FadeIn>
          <FadeIn delay={200}>
            <Text style={{ color: colors.foreground, fontSize: 27, fontWeight: "800", lineHeight: 33, letterSpacing: -0.4 }}>{s.title}</Text>
          </FadeIn>
          <FadeIn delay={280}>
            <Text style={{ color: colors.mutedForeground, fontSize: 15, lineHeight: 22 }}>{s.text}</Text>
          </FadeIn>
        </View>
      ) : null}
    </View>
  );
}

function Dot({ active, color, muted }) {
  const w = useRef(new Animated.Value(active ? 1 : 0)).current;
  useEffect(() => {
    Animated.spring(w, { toValue: active ? 1 : 0, useNativeDriver: false, speed: 18, bounciness: 8 }).start();
  }, [active, w]);
  return (
    <Animated.View
      style={{
        height: 8,
        borderRadius: 4,
        width: w.interpolate({ inputRange: [0, 1], outputRange: [8, 26] }),
        backgroundColor: active ? color : muted,
      }}
    />
  );
}

export function Onboarding({ onDone }) {
  const { colors } = useApp();
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const x = useRef(new Animated.Value(0)).current;
  const last = index === SLIDES.length - 1;

  const goTo = (i) => {
    const next = Math.max(0, Math.min(SLIDES.length - 1, i));
    setIndex(next);
    Animated.spring(x, { toValue: -next * width, useNativeDriver: true, speed: 14, bounciness: 4 }).start();
  };

  // Glisser du doigt vers la gauche / la droite pour changer d'étape.
  const startX = useRef(0);
  const responder = {
    onStartShouldSetResponder: () => false,
    onMoveShouldSetResponder: (e) => {
      const dx = e.nativeEvent.pageX - startX.current;
      return Math.abs(dx) > 12;
    },
    onResponderGrant: () => {},
    onResponderRelease: (e) => {
      const dx = e.nativeEvent.pageX - startX.current;
      if (dx < -50) goTo(index + 1);
      else if (dx > 50) goTo(index - 1);
    },
  };

  const c = colors[SLIDES[index].tone] ?? colors.primary;

  return (
    <SafeAreaView edges={["top", "bottom"]} style={{ flex: 1, backgroundColor: colors.background, overflow: "hidden" }}>
      <StatusBar barStyle={colors.mode === "light" ? "dark-content" : "light-content"} backgroundColor={colors.background} />
      <Blob size={300} color={alpha(c, 0.28)} style={{ top: -120, left: -110 }} />
      <Blob size={240} color={alpha(colors.secondary, 0.18)} style={{ bottom: 40, right: -120 }} dx={-18} />

      {/* Haut : logo + Passer */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <LogoMark size={34} />
          <Wordmark size={19} />
        </View>
        {!last ? (
          <Pressable onPress={onDone} hitSlop={10} style={({ pressed }) => ({ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: pressed ? colors.surfaceHover : colors.muted })}>
            <Text style={{ color: colors.foreground, fontWeight: "700", fontSize: 13.5 }}>Passer</Text>
          </Pressable>
        ) : null}
      </View>

      {/* Étapes */}
      <View
        style={{ flex: 1, justifyContent: "center", overflow: "hidden" }}
        onTouchStart={(e) => {
          startX.current = e.nativeEvent.pageX;
        }}
        {...responder}
      >
        <Animated.View style={{ flexDirection: "row", width: width * SLIDES.length, transform: [{ translateX: x }] }}>
          {SLIDES.map((s, i) => (
            <Slide key={s.title} s={s} width={width} active={i === index} />
          ))}
        </Animated.View>
      </View>

      {/* Bas : points + Précédent / Suivant */}
      <View style={{ paddingHorizontal: 20, paddingBottom: 18, gap: 18 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 }}>
          {SLIDES.map((s, i) => (
            <Pressable key={s.title} onPress={() => goTo(i)} hitSlop={6} accessibilityLabel={`Étape ${i + 1}`}>
              <Dot active={i === index} color={c} muted={colors.borderStrong} />
            </Pressable>
          ))}
        </View>
        <View style={{ flexDirection: "row", gap: 10 }}>
          {index > 0 ? (
            <Pressable
              onPress={() => goTo(index - 1)}
              accessibilityLabel="Précédent"
              style={({ pressed }) => ({ height: 54, paddingHorizontal: 18, borderRadius: radius.md, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: pressed ? colors.surfaceHover : colors.card })}
            >
              <ArrowLeft size={18} color={colors.foreground} />
              <Text style={{ color: colors.foreground, fontWeight: "700", fontSize: 15 }}>Précédent</Text>
            </Pressable>
          ) : null}
          <Pressable onPress={() => (last ? onDone() : goTo(index + 1))} style={({ pressed }) => ({ flex: 1, borderRadius: radius.md, overflow: "hidden", transform: [{ scale: pressed ? 0.98 : 1 }] })}>
            <LinearGradient colors={[colors.primary, colors.secondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ height: 54, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <Text style={{ color: "#fff", fontWeight: "800", fontSize: 15.5 }}>{last ? "Commencer" : "Suivant"}</Text>
              <ArrowRight size={18} color="#fff" />
            </LinearGradient>
          </Pressable>
        </View>
        <Text style={{ color: colors.mutedForeground, textAlign: "center", fontSize: 12.5 }}>
          {`Étape ${index + 1} sur ${SLIDES.length}`}
        </Text>
      </View>
    </SafeAreaView>
  );
}
