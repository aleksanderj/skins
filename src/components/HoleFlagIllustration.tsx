import React from "react";
import Svg, { Circle, Ellipse, Line, Path } from "react-native-svg";
import { colors } from "../constants/theme";

type Props = {
  size?: number;
};

/** Decorative flag-on-a-green motif for the hole info card — deliberately minimal, matching the flat illustration style used elsewhere (see GolfBallOnTeeIcon). */
export function HoleFlagIllustration({ size = 88 }: Props) {
  const height = size * 0.7;

  return (
    <Svg width={size} height={height} viewBox="0 0 96 68">
      <Ellipse cx="48" cy="58" rx="40" ry="9" fill={colors.accent} opacity={0.5} />
      <Circle cx="48" cy="58" r="3" fill={colors.light} opacity={0.6} />
      <Line x1="46" y1="10" x2="46" y2="57" stroke={colors.light} strokeWidth={2} />
      <Path d="M46,10 L76,19 L46,28 Z" fill={colors.warning} />
    </Svg>
  );
}
