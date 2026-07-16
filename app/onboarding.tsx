import React, { useRef, useState } from "react";
import {
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAppStore } from "../src/store/useAppStore";
import { PrimaryButton } from "../src/components/PrimaryButton";
import { GradientCourseBackground } from "../src/features/onboarding/GradientCourseBackground";
import { ImageFadeOverlay } from "../src/features/onboarding/ImageFadeOverlay";
import { ScoringPreviewCard } from "../src/features/onboarding/ScoringPreviewCard";
import { StandingsPreviewCard } from "../src/features/onboarding/StandingsPreviewCard";
import { SettlementPreviewCard } from "../src/features/onboarding/SettlementPreviewCard";
import { colors, fontSize, radius, spacing } from "../src/constants/theme";

type Slide = {
  key: string;
  icon: React.ComponentProps<typeof Ionicons>["name"] | null;
  headline: string;
  body: string;
  background: { type: "photo"; source: number } | { type: "illustration" };
  mockup?: React.ComponentType;
};

const SLIDES: Slide[] = [
  {
    key: "hero",
    icon: null,
    headline: "Play the round.\nWe handle the math.",
    body: "Skins automatically tracks scores, calculates results, and shows who owes what — so you can focus on the game.",
    background: { type: "photo", source: require("../assets/onboarding-hero.png") },
  },
  {
    key: "scoring",
    icon: "stats-chart",
    headline: "Automatic Scoring",
    body: "Track scores hole-by-hole in real time. We'll handle the totals, standings, and everything in between.",
    background: { type: "illustration" },
    mockup: ScoringPreviewCard,
  },
  {
    key: "standings",
    icon: "trophy",
    headline: "Live Standings",
    body: "See skins, match play, and more update live with handicaps built in.",
    background: { type: "photo", source: require("../assets/onboarding-fairway.png") },
    mockup: StandingsPreviewCard,
  },
  {
    key: "settle",
    icon: "cash",
    headline: "Settle Up Easily",
    body: "We calculate who owes who. You settle up however you choose.",
    background: { type: "photo", source: require("../assets/onboarding-bridge.png") },
    mockup: SettlementPreviewCard,
  },
  {
    key: "closing",
    icon: "people",
    headline: "More Golf.\nLess Math.",
    body: "More time for what matters — good rounds and great company.",
    background: { type: "illustration" },
  },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);
  const [index, setIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const imageHeight = height * 0.42;
  const isFirst = index === 0;
  const isLast = index === SLIDES.length - 1;

  const goToIndex = (nextIndex: number) => {
    scrollRef.current?.scrollTo({ x: nextIndex * width, animated: true });
    setIndex(nextIndex);
  };

  const handleScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const nextIndex = Math.round(e.nativeEvent.contentOffset.x / width);
    setIndex(nextIndex);
  };

  const handlePrimaryPress = () => {
    if (isLast) {
      // No explicit navigation here — flipping this flag makes the root
      // layout's Stack.Protected guard for this screen false, which
      // auto-redirects to the (tabs) group declaratively.
      completeOnboarding();
    } else {
      goToIndex(index + 1);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScrollEnd}
        style={styles.scroll}
      >
        {SLIDES.map((slide) => (
          <View key={slide.key} style={{ width }}>
            <View style={[styles.imageArea, { height: imageHeight }]}>
              {slide.background.type === "photo" ? (
                <ImageBackground source={slide.background.source} style={styles.image} resizeMode="cover" />
              ) : (
                <GradientCourseBackground />
              )}
              <ImageFadeOverlay />
            </View>

            <View style={styles.content}>
              {slide.icon ? (
                <View style={styles.iconBadge}>
                  <Ionicons name={slide.icon} size={22} color={colors.white} />
                </View>
              ) : (
                <Text style={styles.kicker}>SKINS</Text>
              )}
              <Text style={styles.headline}>{slide.headline}</Text>
              <Text style={styles.body}>{slide.body}</Text>
              {slide.mockup ? (
                <View style={styles.mockupWrapper}>
                  <slide.mockup />
                </View>
              ) : null}
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}>
        <View style={styles.dots}>
          {SLIDES.map((slide, i) => (
            <View key={slide.key} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>
        <PrimaryButton
          label={isFirst || isLast ? "Get Started" : "Next"}
          onPress={handlePrimaryPress}
          style={styles.button}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  imageArea: {
    width: "100%",
    overflow: "hidden",
    backgroundColor: colors.primaryDark,
  },
  image: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },
  kicker: {
    fontSize: fontSize.md,
    fontWeight: "800",
    color: colors.primaryDark,
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryDark,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  headline: {
    fontSize: fontSize.xxl,
    fontWeight: "800",
    color: colors.text,
    lineHeight: 34,
  },
  body: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    lineHeight: 22,
    marginTop: spacing.sm,
  },
  mockupWrapper: {
    marginTop: spacing.lg,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    backgroundColor: colors.background,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  dotActive: {
    backgroundColor: colors.primaryDark,
    width: 20,
  },
  button: {
    width: "100%",
  },
});
