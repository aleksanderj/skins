import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppHeader } from "../../src/components/AppHeader";
import { Card } from "../../src/components/Card";
import { FriendRow } from "../../src/features/friends/FriendRow";
import { SAMPLE_FRIENDS } from "../../src/features/friends/sampleFriends";
import { colors, spacing } from "../../src/constants/theme";

export default function FriendsScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <AppHeader title="Friends" />
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: spacing.xxl + insets.bottom }]}>
        <Card style={styles.card} padded={false}>
          {SAMPLE_FRIENDS.map((friend, index) => (
            <FriendRow key={friend.id} friend={friend} index={index} />
          ))}
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    padding: spacing.lg,
  },
  card: {
    paddingHorizontal: spacing.lg,
  },
});
