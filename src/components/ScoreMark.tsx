import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, fontSize } from "../constants/theme";
import type { ScoreToParCategory } from "../utils/scoreToPar";

const SIZE = 26;
const FRAME_SIZE = 34;
const BORDER_WIDTH = 1.5;

type Props = {
  score: number;
  category: ScoreToParCategory;
};

const UNDER_PAR: ScoreToParCategory[] = ["birdie", "eagle", "albatross-or-better"];
const FILLED: ScoreToParCategory[] = ["eagle", "albatross-or-better", "double-bogey", "triple-or-worse"];
const FRAMED: ScoreToParCategory[] = ["albatross-or-better", "triple-or-worse"];
const CIRCLE: ScoreToParCategory[] = ["birdie", "eagle", "albatross-or-better"];

/** Renders a score number wrapped in the standard golf scorecard mark for its relation to par. */
export function ScoreMark({ score, category }: Props) {
  const tone = UNDER_PAR.includes(category) ? colors.success : category === "par" ? colors.text : colors.negative;
  const filled = FILLED.includes(category);
  const isCircle = CIRCLE.includes(category);

  const shape = (
    <View
      style={[
        styles.shape,
        isCircle ? styles.circle : styles.square,
        filled ? { backgroundColor: tone } : category !== "par" ? { borderColor: tone, borderWidth: BORDER_WIDTH } : null,
      ]}
    >
      <Text style={[styles.text, filled && { color: colors.white }]}>{score}</Text>
    </View>
  );

  if (FRAMED.includes(category)) {
    return (
      <View style={[styles.frame, isCircle ? styles.circle : styles.square, { borderColor: tone }]}>{shape}</View>
    );
  }

  return shape;
}

const styles = StyleSheet.create({
  shape: {
    width: SIZE,
    height: SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  frame: {
    width: FRAME_SIZE,
    height: FRAME_SIZE,
    borderWidth: BORDER_WIDTH,
    alignItems: "center",
    justifyContent: "center",
  },
  circle: {
    borderRadius: FRAME_SIZE / 2,
  },
  square: {
    borderRadius: 4,
  },
  text: {
    fontSize: fontSize.sm,
    fontWeight: "700",
    color: colors.text,
  },
});
