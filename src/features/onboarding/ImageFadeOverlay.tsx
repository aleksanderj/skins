import React from "react";
import { StyleSheet } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { colors } from "../../constants/theme";

/**
 * Absolutely-fills an onboarding slide's image/illustration area and fades
 * its lower portion into the screen background color, so the photo blends
 * smoothly into the content below instead of cutting off with a hard edge.
 * Most of the image stays clear — only the bottom third fades.
 */
export function ImageFadeOverlay() {
  return (
    <Svg style={styles.overlay} width="100%" height="100%">
      <Defs>
        <LinearGradient id="fadeToBackground" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor={colors.background} stopOpacity={0} />
          <Stop offset="65%" stopColor={colors.background} stopOpacity={0} />
          <Stop offset="100%" stopColor={colors.background} stopOpacity={1} />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#fadeToBackground)" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
