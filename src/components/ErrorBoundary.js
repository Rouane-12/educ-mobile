import { Component } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

/**
 * Filet de sécurité : si un écran plante, on affiche un message et un bouton « Réessayer »
 * au lieu d'un écran figé ou d'une fermeture de l'application.
 */
export class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("EduBénin : erreur d'affichage", error, info?.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <View style={{ flex: 1, backgroundColor: "#100d0b", justifyContent: "center", padding: 24, gap: 14 }}>
        <Text style={{ color: "#f8f3ec", fontSize: 22, fontWeight: "800" }}>Oups, un souci d'affichage</Text>
        <Text style={{ color: "#b3a798", fontSize: 15, lineHeight: 22 }}>
          Cet écran a rencontré une erreur. Touche « Réessayer » ; si le problème revient, ferme puis rouvre l'application.
        </Text>
        <ScrollView style={{ maxHeight: 120 }}>
          <Text style={{ color: "#776b5f", fontSize: 12 }}>{String(this.state.error?.message ?? this.state.error)}</Text>
        </ScrollView>
        <Pressable
          onPress={() => this.setState({ error: null })}
          style={{ alignSelf: "flex-start", backgroundColor: "#ff7a1a", paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14 }}
        >
          <Text style={{ color: "#fff", fontWeight: "800", fontSize: 15 }}>Réessayer</Text>
        </Pressable>
      </View>
    );
  }
}
