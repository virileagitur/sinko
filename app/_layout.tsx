import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Colors } from "../constants/theme";

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!);

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ConvexAuthProvider client={convex} storage={require("expo-secure-store")}>
        <SafeAreaProvider>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: Colors.white },
              headerShadowVisible: false,
              headerTitleStyle: { fontSize: 17, fontWeight: '600', color: Colors.text },
              headerTintColor: Colors.azure,
              contentStyle: { backgroundColor: Colors.bg },
              headerBackTitle: '',
            }}
          >
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="course/[courseId]" options={{ title: 'Course' }} />
            <Stack.Screen name="deck/[deckId]" options={{ title: 'Deck' }} />
            <Stack.Screen name="deck/create" options={{ title: 'Create Deck', presentation: 'modal' }} />
            <Stack.Screen name="card/[cardId]/edit" options={{ title: 'Edit Card', presentation: 'modal' }} />
            <Stack.Screen name="study/flashcard" options={{ headerShown: false }} />
            <Stack.Screen name="study/pomodoro" options={{ headerShown: false }} />
            <Stack.Screen name="study/quiz" options={{ headerShown: false }} />
            <Stack.Screen name="study/matching" options={{ headerShown: false }} />
            <Stack.Screen name="study/spaced" options={{ headerShown: false }} />
            <Stack.Screen name="forum/[postId]" options={{ title: 'Discussion' }} />
            <Stack.Screen name="group/[groupId]" options={{ title: 'Group' }} />
            <Stack.Screen name="ai/import" options={{ title: 'AI Import', presentation: 'modal' }} />
            <Stack.Screen name="settings/profile" options={{ title: 'Edit Profile' }} />
            <Stack.Screen name="settings/subscription" options={{ title: 'Subscription' }} />
          </Stack>
        </SafeAreaProvider>
      </ConvexAuthProvider>
    </GestureHandlerRootView>
  );
}
