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
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="create-round" options={{ presentation: "modal" }} />
          <Stack.Screen name="round/[roundId]/index" />
          <Stack.Screen name="round/[roundId]/leaderboard" options={{ presentation: "modal" }} />
          <Stack.Screen name="round/[roundId]/review" />
          <Stack.Screen name="round/[roundId]/settlement" />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
