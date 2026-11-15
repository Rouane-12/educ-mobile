import { CheckCircle2, Sparkles } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { Animated, View } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { useApp } from "../context/AppContext";
import { H2, Screen, Spinner, T } from "./ui";

/** Écran d'attente pendant que l'IA rédige (étapes qui défilent, comme sur le site). */
export function GeneratingScreen({ title, steps = [] }) {
  const { colors } = useApp();
  const [step, setStep] = useState(0);
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const t = setInterval(() => setStep((s) => Math.min(s + 1, steps.length - 1)), 4500);
    const a = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.08, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
      ]),
    );
    a.start();
    return () => {
      clearInterval(t);
      a.stop();
    };
  }, [steps.length, pulse]);

  return (
    <Screen contentStyle={{ flexGrow: 1, justifyContent: "center", alignItems: "center", gap: 18 }}>
      <Animated.View style={{ transform: [{ scale: pulse }] }}>
        <LinearGradient
          colors={[colors.primary, colors.accent]}
          style={{ width: 76, height: 76, borderRadius: 24, alignItems: "center", justifyContent: "center" }}
        >
          <Sparkles size={34} color="#fff" />
        </LinearGradient>
      </Animated.View>
      <H2 center>{title}</H2>
      <View style={{ gap: 10, alignSelf: "stretch" }}>
        {steps.map((s, i) => (
          <View key={s} style={{ flexDirection: "row", alignItems: "center", gap: 10, opacity: i > step ? 0.4 : 1 }}>
            {i < step ? <CheckCircle2 size={18} color={colors.success} /> : i === step ? <Spinner size={18} /> : <View style={{ width: 18 }} />}
            <T size={14} style={{ flex: 1 }}>{s}</T>
          </View>
        ))}
      </View>
      <T muted size={12.5} center>Cela peut prendre jusqu'à une minute.</T>
    </Screen>
  );
}
