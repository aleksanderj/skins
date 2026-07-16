import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useToastStore } from "../store/useToastStore";
import { colors, fontSize, radius, spacing } from "../constants/theme";

const VISIBLE_MS = 3000;

/**
 * A single global toast banner, mounted once at the app root. Shows the most
 * recent message from `useToastStore` and fades itself out — screens never
 * render their own toast instances, they just call `showToast(message)`.
 */
const TRAVEL_DISTANCE = 80;

export function Toast() {
  const insets = useSafeAreaInsets();
  const toast = useToastStore((s) => s.toast);
  const hideToast = useToastStore((s) => s.hideToast);
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!toast) return;

    progress.setValue(0);
    Animated.timing(progress, { toValue: 1, duration: 220, useNativeDriver: true }).start();

    const dismissTimer = setTimeout(() => {
      Animated.timing(progress, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
        hideToast();
      });
    }, VISIBLE_MS);

    return () => clearTimeout(dismissTimer);
  }, [toast, progress, hideToast]);

  if (!toast) return null;

  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [TRAVEL_DISTANCE, 0] });

  return (
    <Animated.View
      key={toast.id}
      pointerEvents="none"
      accessibilityLiveRegion="polite"
      style={[
        styles.toast,
        { bottom: insets.bottom + spacing.lg, opacity: progress, transform: [{ translateY }] },
      ]}
    >
      <Text style={styles.text}>{toast.message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 100,
    backgroundColor: colors.primaryDark,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  text: {
    color: colors.white,
    fontSize: fontSize.sm,
    fontWeight: "700",
    textAlign: "center",
  },
});
