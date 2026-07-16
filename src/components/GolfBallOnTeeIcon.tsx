import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Path, RadialGradient, Stop } from "react-native-svg";
import { colors, fontSize } from "../constants/theme";

type Props = {
  /** Diameter of the ball itself — the tee below is sized proportionally. */
  size?: number;
  label?: string;
};

/**
 * The whole "Start a Game" FAB: a golf ball (lettered with the label, like a
 * ball stamped with text) resting on a goblet-shaped tee. The tee's cup is
 * narrower than the ball so it stays mostly hidden behind it, with only its
 * waist and flared foot visible below — the way a real ball nests in a tee.
 */
export function GolfBallOnTeeIcon({ size = 50, label = "Start" }: Props) {
  const teeWidth = size * 0.68;
  const teeHeight = size * 0.44;

  return (
    <View style={styles.wrapper}>
      <View style={[styles.ballWrapper, { width: size, height: size, borderRadius: size / 2 }]}>
        <Svg width={size} height={size} viewBox="0 0 48 48">
          <Defs>
            <RadialGradient id="ballShade" cx="36%" cy="28%" r="75%">
              <Stop offset="0%" stopColor="#FFFFFF" />
              <Stop offset="70%" stopColor="#F2F2EF" />
              <Stop offset="100%" stopColor="#D6D6D1" />
            </RadialGradient>
          </Defs>
          <Circle cx="24" cy="24" r="22" fill="url(#ballShade)" stroke={colors.border} strokeWidth={1} />
          <Circle cx="24" cy="14" r="1.5" fill="#C9C9C4" opacity={0.5} />
          <Circle cx="15" cy="20" r="1.5" fill="#C9C9C4" opacity={0.5} />
          <Circle cx="33" cy="20" r="1.5" fill="#C9C9C4" opacity={0.5} />
          <Circle cx="16" cy="31" r="1.5" fill="#C9C9C4" opacity={0.5} />
          <Circle cx="32" cy="31" r="1.5" fill="#C9C9C4" opacity={0.5} />
          <Circle cx="24" cy="35" r="1.5" fill="#C9C9C4" opacity={0.5} />
        </Svg>
        <View style={styles.labelOverlay} pointerEvents="none">
          <Text style={styles.labelText}>{label}</Text>
        </View>
      </View>

      <Svg width={teeWidth} height={teeHeight} viewBox="0 0 40 26" style={{ marginTop: -teeHeight * 0.5 }}>
        <Defs>
          <LinearGradient id="teeShade" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#E4B355" />
            <Stop offset="100%" stopColor="#B9812C" />
          </LinearGradient>
        </Defs>
        <Path
          d="M4,9 C4,14 12,15 13,18 C14,21 8,21 8,24 C8,26 32,26 32,24 C32,21 26,21 27,18 C28,15 36,14 36,9 Z"
          fill="url(#teeShade)"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
  },
  ballWrapper: {
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  labelOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  labelText: {
    fontSize: fontSize.xs,
    fontWeight: "800",
    color: colors.primaryDark,
  },
});
