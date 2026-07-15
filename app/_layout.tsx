import React, { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { Stack } from "expo-router";
import { useAppStore } from "../src/store/useAppStore";
import { didResetCorruptData, acknowledgeCorruptDataReset } from "../src/store/persistenceStorage";
import { colors, fontSize, spacing } from "../src/constants/theme";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const hasHydrated = useAppStore((s) => s.hasHydrated);
  const [showResetNotice, setShowResetNotice] = useState(false);

  useEffect(() => {
    if (hasHydrated) {
      SplashScreen.hideAsync().catch(() => {});
      if (didResetCorruptData()) {
        setShowResetNotice(true);
        acknowledgeCorruptDataReset();
      }
    }
  }, [hasHydrated]);

  const dismissNotice = useCallback(() => setShowResetNotice(false), []);

  if (!hasHydrated) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        {showResetNotice ? <ResetNotice onDismiss={dismissNotice} /> : null}
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

function ResetNotice({ onDismiss }: { onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <View style={styles.notice} accessibilityLiveRegion="polite">
      <Text style={styles.noticeText}>Saved data couldn't be read and was reset. Starting fresh.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  notice: {
    position: "absolute",
    top: 56,
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 100,
    backgroundColor: colors.primaryDark,
    borderRadius: 12,
    padding: spacing.md,
  },
  noticeText: {
    color: colors.white,
    fontSize: fontSize.sm,
    fontWeight: "600",
    textAlign: "center",
  },
});
