import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, type Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { colors, fontSize, spacing, touchTarget } from "../constants/theme";

const BAR_HEIGHT = 60;
const FAB_SIZE = 52;

type TabBarProps = NonNullable<React.ComponentProps<typeof Tabs>["tabBar"]> extends (props: infer P) => unknown
  ? P
  : never;

/**
 * Custom tab bar: the four real routes (Home, History, Friends, Settings)
 * plus a raised "Start a Game" action in a dedicated slot centered between
 * History and Friends. The action isn't a real tab/route — it's a Pressable
 * that navigates straight to the create-round modal — so it doesn't
 * participate in react-navigation's tab-focus state at all. It gets its own
 * flex slot (rather than sitting dead-center over a real tab) so its raised
 * circle and label never overlap a tab's own icon/label underneath.
 */
export function AppTabBar({ state, descriptors, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();

  const handleStartGame = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    router.push("/create-round");
  };

  const renderTab = (route: (typeof state.routes)[number], index: number) => {
    const { options } = descriptors[route.key];
    const isFocused = state.index === index;
    const label = typeof options.title === "string" ? options.title : route.name;
    const color = isFocused ? colors.primaryDark : colors.textSecondary;

    const onPress = () => {
      const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(route.name, route.params);
      }
    };

    return (
      <Pressable
        key={route.key}
        onPress={onPress}
        accessibilityRole="tab"
        accessibilityState={{ selected: isFocused }}
        accessibilityLabel={label}
        style={styles.tabButton}
      >
        {options.tabBarIcon?.({ color, size: 22, focused: isFocused })}
        <Text style={[styles.tabLabel, { color }]}>{label}</Text>
      </Pressable>
    );
  };

  return (
    <View style={[styles.wrapper, { paddingBottom: insets.bottom }]}>
      <View style={styles.row}>
        {renderTab(state.routes[0], 0)}
        {renderTab(state.routes[1], 1)}
        <View style={styles.fabSlot}>
          <Pressable
            onPress={handleStartGame}
            accessibilityRole="button"
            accessibilityLabel="Start a Game"
            accessibilityHint="Opens the new round setup form"
            style={styles.fabWrapper}
          >
            <View style={styles.fab}>
              <Ionicons name="add" size={26} color={colors.white} />
            </View>
            <Text style={styles.fabLabel}>Start</Text>
          </Pressable>
        </View>
        {renderTab(state.routes[2], 2)}
        {renderTab(state.routes[3], 3)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  row: {
    flexDirection: "row",
    height: BAR_HEIGHT,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: touchTarget.min,
    gap: 2,
  },
  tabLabel: {
    fontSize: fontSize.xs,
    fontWeight: "600",
  },
  fabSlot: {
    flex: 1,
    alignItems: "center",
  },
  fabWrapper: {
    position: "absolute",
    top: -FAB_SIZE / 2 - 8,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  fab: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    backgroundColor: colors.primaryDark,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
    borderWidth: 3,
    borderColor: colors.surface,
  },
  fabLabel: {
    fontSize: fontSize.xs,
    fontWeight: "700",
    color: colors.primaryDark,
    marginTop: 2,
  },
});
