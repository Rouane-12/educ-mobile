import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNavigationContainerRef, DarkTheme, DefaultTheme, NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Bell, BookOpen, Brain, Home, LayoutDashboard, Menu, School, Sparkles } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { StatusBar } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ErrorBoundary } from "./src/components/ErrorBoundary";
import { IconButton, ToastHost } from "./src/components/ui";
import { getJSON, K, setJSON } from "./src/lib/storage";
import { KeyboardInset } from "./src/lib/keyboard";
import { Onboarding, SplashIntro } from "./src/screens/IntroScreens";
import { AppProvider, useApp } from "./src/context/AppContext";
import { NotificationsProvider, useNotifications } from "./src/context/NotificationsContext";
import AdminScreen from "./src/screens/AdminScreen";
import AudiosScreen from "./src/screens/AudiosScreen";
import AuthScreen from "./src/screens/AuthScreen";
import ChatScreen from "./src/screens/ChatScreen";
import DefisScreen from "./src/screens/DefisScreen";
import DuelScreen from "./src/screens/DuelScreen";
import EpreuveScreen from "./src/screens/EpreuveScreen";
import ExamDetailScreen from "./src/screens/ExamDetailScreen";
import ExamsScreen from "./src/screens/ExamsScreen";
import FavorisScreen from "./src/screens/FavorisScreen";
import HomeScreen from "./src/screens/HomeScreen";
import IaScreen from "./src/screens/IaScreen";
import MessagesScreen from "./src/screens/MessagesScreen";
import MoreScreen from "./src/screens/MoreScreen";
import NotificationsScreen from "./src/screens/NotificationsScreen";
import ParametresScreen from "./src/screens/ParametresScreen";
import ProfilScreen from "./src/screens/ProfilScreen";
import ProfQuizRunScreen from "./src/screens/ProfQuizRunScreen";
import { ProfDashboardScreen, ProfQuizNewScreen, ProfQuizScreen } from "./src/screens/ProfScreens";
import ProgressionScreen from "./src/screens/ProgressionScreen";
import QcmScreen from "./src/screens/QcmScreen";
import QuizScreen from "./src/screens/QuizScreen";
import { ClasseScreen, ClassesScreen, DevoirScreen, GainsScreen, ProfProfilScreen } from "./src/screens/ClassesScreens";
import { CompositionScreen, ExamenBlancScreen, LegalScreen, PassScreen, PlanningScreen } from "./src/screens/ExtraScreens";
import { CartesScreen, FicheScreen, FichesScreen, QuestionScreen, QuestionsScreen } from "./src/screens/RevisionScreens";
import { PaywallHost } from "./src/components/PaywallHost";
import { AjouterScreen, ProfAudiosScreen, RechercheScreen } from "./src/screens/ContribScreens";
import GuideScreen from "./src/screens/GuideScreen";
import { CoursScreen } from "./src/screens/CoursScreens";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
export const navigationRef = createNavigationContainerRef();

/** Ouvre l'écran visé par une notification ({screen, id}). */
function openTarget(data = {}) {
  if (!navigationRef.isReady()) return setTimeout(() => openTarget(data), 400);
  const { screen, id } = data;
  if (screen === "Chat" && id) navigationRef.navigate("Chat", { id });
  else if (screen === "Duel" && id) navigationRef.navigate("Duel", { code: id });
  else if (screen === "Devoir" && id) navigationRef.navigate("Devoir", { id });
  else if (screen === "Classe" && id) navigationRef.navigate("Classe", { id });
  else if (screen === "Cours" && id) navigationRef.navigate("Cours", { id });
  else if (screen === "Question" && id) navigationRef.navigate("Question", { id });
  else if (screen === "Quiz") navigationRef.navigate("Tabs", { screen: "QuizTab", params: { mode: "prof" } });
  else if (["Progression", "Pass", "ExamenBlanc", "Planning"].includes(screen)) navigationRef.navigate(screen);
  else navigationRef.navigate("Notifications");
}

function BellButton({ navigation }) {
  const { unread } = useNotifications();
  return <IconButton icon={Bell} label="Notifications" badge={unread} onPress={() => navigation.navigate("Notifications")} />;
}

function Tabs() {
  const { colors, isProf } = useApp();
  return (
    <Tab.Navigator
      screenOptions={({ navigation }) => ({
        headerStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
        headerTitleStyle: { color: colors.foreground, fontWeight: "800" },
        headerRight: () => <BellButton navigation={navigation} />,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
        tabBarLabelStyle: { fontWeight: "600", fontSize: 11 },
        tabBarHideOnKeyboard: true,
      })}
    >
      <Tab.Screen name="HomeTab" component={isProf ? ProfDashboardScreen : HomeScreen} options={{ title: isProf ? "Tableau de bord" : "EduBénin", tabBarLabel: isProf ? "Tableau" : "Accueil", tabBarIcon: ({ color, size }) => (isProf ? <LayoutDashboard color={color} size={size} /> : <Home color={color} size={size} />) }} />
      {isProf ? (
        <Tab.Screen name="ExamsTab" component={ClassesScreen} options={{ title: "Mes classes", tabBarLabel: "Classes", tabBarIcon: ({ color, size }) => <School color={color} size={size} /> }} />
      ) : (
        <Tab.Screen name="ExamsTab" component={ExamsScreen} options={{ title: "Épreuves", tabBarLabel: "Épreuves", tabBarIcon: ({ color, size }) => <BookOpen color={color} size={size} /> }} />
      )}
      {isProf ? (
        <Tab.Screen name="QuizTab" component={ProfQuizScreen} options={{ title: "Mes quiz", tabBarLabel: "Mes quiz", tabBarIcon: ({ color, size }) => <Brain color={color} size={size} /> }} />
      ) : (
        <Tab.Screen name="QuizTab" component={QuizScreen} options={{ title: "Quiz", tabBarLabel: "Quiz", tabBarIcon: ({ color, size }) => <Brain color={color} size={size} /> }} />
      )}
      <Tab.Screen name="IaTab" component={IaScreen} options={{ title: "EduIA", tabBarLabel: "EduIA", tabBarIcon: ({ color, size }) => <Sparkles color={color} size={size} /> }} />
      <Tab.Screen name="MoreTab" component={MoreScreen} options={{ title: "Plus", tabBarLabel: "Plus", tabBarIcon: ({ color, size }) => <Menu color={color} size={size} /> }} />
    </Tab.Navigator>
  );
}

/** Écran logo (au moins 1,6 s, le temps de lire le stockage), puis présentation au premier lancement. */
function useIntro(ready) {
  const [minDone, setMinDone] = useState(false);
  const [onboarded, setOnboarded] = useState(null); // null = pas encore lu
  useEffect(() => {
    const t = setTimeout(() => setMinDone(true), 1600);
    getJSON(K.onboarded, false)
      .then((v) => setOnboarded(Boolean(v)))
      .catch(() => setOnboarded(true));
    return () => clearTimeout(t);
  }, []);
  const finish = useCallback(() => {
    setOnboarded(true);
    setJSON(K.onboarded, true);
  }, []);
  const stage = !ready || !minDone || onboarded === null ? "splash" : onboarded ? "app" : "onboarding";
  return [stage, finish];
}

/** Première connexion (ou inscription) d'un compte sur ce téléphone : on ouvre le Guide de son rôle. */
function useFirstLoginGuide(user, stage) {
  useEffect(() => {
    if (!user?.id || stage !== "app") return undefined;
    let alive = true;
    const key = `edubenin:guide:${user.id}`;
    getJSON(key, false).then((seen) => {
      if (!alive || seen) return;
      setJSON(key, true);
      const open = () => {
        if (!alive) return;
        if (!navigationRef.isReady()) return setTimeout(open, 300);
        navigationRef.navigate("Guide", { first: true });
        return undefined;
      };
      setTimeout(open, 500);
    });
    return () => {
      alive = false;
    };
  }, [user?.id, stage]);
}

function Root() {
  const { ready, colors, user } = useApp();
  const NotifScreen = useCallback((props) => <NotificationsScreen {...props} openTarget={openTarget} />, []);
  const [stage, finishIntro] = useIntro(ready);
  useFirstLoginGuide(user, stage);

  if (stage === "splash") return <SplashIntro />;
  if (stage === "onboarding") return <Onboarding onDone={finishIntro} />;

  const base = colors.mode === "light" ? DefaultTheme : DarkTheme;
  const navTheme = {
    ...base,
    colors: { ...base.colors, primary: colors.primary, background: colors.background, card: colors.background, text: colors.foreground, border: colors.border, notification: colors.danger },
  };

  return (
    <NavigationContainer ref={navigationRef} theme={navTheme}>
      <StatusBar barStyle={colors.mode === "light" ? "dark-content" : "light-content"} backgroundColor={colors.background} />
      <NotificationsProvider onOpen={openTarget}>
        <Stack.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.foreground,
            headerTitleStyle: { fontWeight: "800" },
            headerShadowVisible: false,
            contentStyle: { backgroundColor: colors.background },
            headerBackButtonDisplayMode: "minimal",
          }}
        >
          <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
          <Stack.Screen name="ExamDetail" component={ExamDetailScreen} options={{ title: "Épreuve" }} />
          <Stack.Screen name="Epreuve" component={EpreuveScreen} options={{ title: "Quiz Épreuve IA", gestureEnabled: false }} />
          <Stack.Screen name="Qcm" component={QcmScreen} options={{ title: "Quiz Questions IA" }} />
          <Stack.Screen name="ProfQuizRun" component={ProfQuizRunScreen} options={{ title: "Quiz Professeur" }} />
          <Stack.Screen name="Notifications" component={NotifScreen} options={{ title: "Notifications" }} />
          <Stack.Screen name="Favoris" component={FavorisScreen} options={{ title: "Favoris" }} />
          <Stack.Screen name="Progression" component={ProgressionScreen} options={{ title: "Ma progression" }} />
          <Stack.Screen name="Parametres" component={ParametresScreen} options={{ title: "Paramètres" }} />
          <Stack.Screen name="Auth" component={AuthScreen} options={{ title: "Mon compte", presentation: "modal" }} />
          <Stack.Screen name="Exams" component={ExamsScreen} options={{ title: "Épreuves" }} />
          <Stack.Screen name="Bac" component={ExamsScreen} initialParams={{ examType: "BAC", fixed: true }} options={{ title: "Épreuves du BAC" }} />
          <Stack.Screen name="Bepc" component={ExamsScreen} initialParams={{ examType: "BEPC", fixed: true }} options={{ title: "Épreuves du BEPC" }} />
          <Stack.Screen name="Fiches" component={FichesScreen} options={{ title: "Fiches & cartes" }} />
          <Stack.Screen name="Fiche" component={FicheScreen} options={{ title: "Fiche" }} />
          <Stack.Screen name="Questions" component={QuestionsScreen} options={{ title: "Questions aux profs" }} />
          <Stack.Screen name="ProfProfil" component={ProfProfilScreen} options={{ title: "Professeur" }} />
          <Stack.Screen name="Legal" component={LegalScreen} options={{ title: "Informations légales" }} />
          <Stack.Screen name="Recherche" component={RechercheScreen} options={{ title: "Rechercher" }} />
          <Stack.Screen name="Ajouter" component={AjouterScreen} options={{ title: "Ajouter une épreuve" }} />
          {user && (
            <>
              <Stack.Screen name="Profil" component={ProfilScreen} options={{ title: "Profil" }} />
              <Stack.Screen name="Messages" component={MessagesScreen} options={{ title: "Messages" }} />
              <Stack.Screen name="Chat" component={ChatScreen} options={{ title: "Discussion" }} />
              <Stack.Screen name="Audios" component={AudiosScreen} options={{ title: "Audios des profs" }} />
              <Stack.Screen name="Defis" component={DefisScreen} options={{ title: "Défis" }} />
              <Stack.Screen name="Duel" component={DuelScreen} options={{ title: "Défi" }} />
              <Stack.Screen name="ProfDashboard" component={ProfDashboardScreen} options={{ title: "Tableau de bord" }} />
              <Stack.Screen name="ProfQuiz" component={ProfQuizScreen} options={{ title: "Mes quiz" }} />
              <Stack.Screen name="ProfQuizNew" component={ProfQuizNewScreen} options={{ title: "Nouveau quiz" }} />
              <Stack.Screen name="Classes" component={ClassesScreen} options={{ title: "Classes" }} />
              <Stack.Screen name="Classe" component={ClasseScreen} options={{ title: "Classe" }} />
              <Stack.Screen name="Devoir" component={DevoirScreen} options={{ title: "Devoir" }} />
              <Stack.Screen name="Gains" component={GainsScreen} options={{ title: "Mes gains" }} />
              <Stack.Screen name="ProfAudios" component={ProfAudiosScreen} options={{ title: "Mes audios" }} />
              <Stack.Screen name="Guide" component={GuideScreen} options={{ title: "Guide" }} />
              <Stack.Screen name="Cours" component={CoursScreen} options={{ title: "Cours" }} />
              {user.is_admin || user.role === "admin" ? (
                <Stack.Screen name="Admin" component={AdminScreen} options={{ title: "Supervision" }} />
              ) : null}
              <Stack.Screen name="Cartes" component={CartesScreen} options={{ title: "Cartes de révision" }} />
              <Stack.Screen name="Question" component={QuestionScreen} options={{ title: "Question" }} />
              <Stack.Screen name="ExamenBlanc" component={ExamenBlancScreen} options={{ title: "Examen blanc national" }} />
              <Stack.Screen name="Composition" component={CompositionScreen} options={{ title: "Épreuve" }} />
              <Stack.Screen name="Planning" component={PlanningScreen} options={{ title: "Mon planning" }} />
              <Stack.Screen name="Pass" component={PassScreen} options={{ title: "Pass EduIA" }} />
            </>
          )}
        </Stack.Navigator>
      </NotificationsProvider>
      <PaywallHost navigationRef={navigationRef} />
      <ToastHost />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <AppProvider>
          <KeyboardInset>
            <Root />
          </KeyboardInset>
        </AppProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
