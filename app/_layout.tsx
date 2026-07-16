import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { Stack } from "expo-router";
import { useAppStore } from "../src/store/useAppStore";
import { didResetCorruptData, acknowledgeCorruptDataReset } from "../src/store/persistenceStorage";
import { useToastStore } from "../src/store/useToastStore";
import { Toast } from "../src/components/Toast";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const hasHydrated = useAppStore((s) => s.hasHydrated);
  const hasCompletedOnboarding = useAppStore((s) => s.hasCompletedOnboarding);

  useEffect(() => {
    if (hasHydrated) {
      SplashScreen.hideAsync().catch(() => {});
      if (didResetCorruptData()) {
        useToastStore.getState().showToast("Saved data couldn't be read and was reset. Starting fresh.");
        acknowledgeCorruptDataReset();
      }
    }
  }, [hasHydrated]);

  if (!hasHydrated) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Toast />
        {/*
          Onboarding is gated declaratively via Stack.Protected rather than an
          imperative router.replace() in a useEffect. The imperative version
          fired in the same tick the native stack navigator was still mounting
          and reliably crashed on Android (worked fine on web, where there's
          no native view hierarchy to race against) — see CLAUDE.md.
        */}
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Protected guard={!hasCompletedOnboarding}>
            <Stack.Screen name="onboarding" />
          </Stack.Protected>

          <Stack.Protected guard={hasCompletedOnboarding}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="create-round" options={{ presentation: "modal" }} />
            <Stack.Screen name="dev-tools" />
            <Stack.Screen name="round/[roundId]/index" />
            <Stack.Screen name="round/[roundId]/leaderboard" options={{ presentation: "modal" }} />
            <Stack.Screen name="round/[roundId]/review" />
            <Stack.Screen name="round/[roundId]/settlement" />
          </Stack.Protected>
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
