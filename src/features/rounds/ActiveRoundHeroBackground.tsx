import React from "react";
import { StyleSheet } from "react-native";
import Svg, { Circle, Ellipse, Path } from "react-native-svg";
import { colors } from "../../constants/theme";

/** Decorative hills/trees backdrop for the active-round card's hero panel — same flat, code-drawn illustration language as GradientCourseBackground and HoleFlagIllustration, scoped to sit behind the card's right side. */
export function ActiveRoundHeroBackground() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 400 220" preserveAspectRatio="xMidYMid slice" style={StyleSheet.absoluteFill}>
      <Circle cx="340" cy="55" r="30" fill={colors.light} opacity={0.1} />
      <Path d="M170,220 C215,150 255,195 300,150 C335,120 365,145 400,125 L400,220 Z" fill={colors.accent} opacity={0.55} />
      <Path d="M230,220 C265,175 300,205 335,175 C360,155 380,168 400,160 L400,220 Z" fill={colors.light} opacity={0.12} />
      <Ellipse cx="300" cy="152" rx="12" ry="26" fill={colors.accent} opacity={0.65} />
      <Ellipse cx="352" cy="132" rx="15" ry="30" fill={colors.accent} opacity={0.5} />
      <Ellipse cx="378" cy="150" rx="10" ry="22" fill={colors.accent} opacity={0.6} />
    </Svg>
  );
}
