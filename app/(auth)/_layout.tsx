import { Redirect, Stack } from "expo-router";
import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export default function AuthLayout() {
  const { signIn } = useAuthActions();
  // Redirect to tabs if already logged in
  const profile = useQuery(api.users.getMyProfile);

  // If the query returns (even null means logged out), check session
  // We'll handle redirect in individual auth screens
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
    </Stack>
  );
}
