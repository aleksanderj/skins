import React from "react";
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from "react-native-svg";
import { colors } from "../../constants/theme";

/**
 * Flat, code-drawn stand-in for a course photo, used on the two onboarding
 * slides that don't have a background photo. Deliberately reads as an
 * intentional brand pattern (layered hills in the app's own palette) rather
 * than an attempt to fake photorealism.
 */
export function GradientCourseBackground() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice">
      <Defs>
        <LinearGradient id="skyShade" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor={colors.accent} />
          <Stop offset="100%" stopColor={colors.primaryDark} />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="400" height="400" fill="url(#skyShade)" />
      <Circle cx="320" cy="90" r="46" fill={colors.light} opacity={0.18} />
      <Path d="M0,260 C90,210 150,300 240,250 C310,215 360,260 400,235 L400,400 L0,400 Z" fill={colors.light} opacity={0.14} />
      <Path d="M0,300 C80,270 170,330 260,290 C320,265 360,300 400,285 L400,400 L0,400 Z" fill={colors.light} opacity={0.2} />
      <Path d="M0,345 C100,320 190,365 280,335 C330,318 370,345 400,335 L400,400 L0,400 Z" fill={colors.light} opacity={0.3} />
    </Svg>
  );
}
