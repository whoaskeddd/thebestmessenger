import React, { useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  color: string;
  disabled?: boolean;
}

export function PrimaryButton({ title, onPress, color, disabled }: PrimaryButtonProps) {
  const hoverAnim = useRef(new Animated.Value(0)).current;
  const pressAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(-1)).current;
  const glowIntensity = Animated.add(hoverAnim, pressAnim);

  function runHoverAnimation(toValue: number) {
    Animated.timing(hoverAnim, {
      toValue,
      duration: 180,
      useNativeDriver: true
    }).start();
  }

  const hoverScale = hoverAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.02]
  });

  const pressScale = pressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.985]
  });

  const animatedStyle = {
    transform: [{ scale: Animated.multiply(hoverScale, pressScale) }]
  };

  function runPressAnimation(toValue: number) {
    Animated.timing(pressAnim, {
      toValue,
      duration: 140,
      useNativeDriver: true
    }).start();
  }

  function handlePressIn() {
    runPressAnimation(1);
    shimmerAnim.setValue(-1);
    Animated.timing(shimmerAnim, {
      toValue: 1,
      duration: 360,
      useNativeDriver: true
    }).start();
  }

  const haloStyle = {
    opacity: glowIntensity.interpolate({
      inputRange: [0, 1, 2],
      outputRange: [0, 0.22, 0.36]
    }),
    transform: [
      {
        scale: glowIntensity.interpolate({
          inputRange: [0, 1, 2],
          outputRange: [0.98, 1.04, 1.07]
        })
      }
    ]
  };

  const auraStyle = {
    opacity: glowIntensity.interpolate({
      inputRange: [0, 1, 2],
      outputRange: [0, 0.08, 0.14]
    }),
    transform: [
      {
        scale: glowIntensity.interpolate({
          inputRange: [0, 1, 2],
          outputRange: [1, 1.1, 1.14]
        })
      }
    ]
  };

  const shimmerStyle = {
    opacity: pressAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 0.35]
    }),
    transform: [
      {
        translateX: shimmerAnim.interpolate({
          inputRange: [-1, 1],
          outputRange: [-180, 180]
        })
      },
      { rotate: '18deg' }
    ]
  };

  return (
    <Animated.View style={[styles.wrapper, animatedStyle]}>
      <Animated.View pointerEvents="none" style={[styles.aura, auraStyle]} />
      <Animated.View
        pointerEvents="none"
        style={[styles.halo, { backgroundColor: color }, haloStyle]}
      />
      <Pressable
        disabled={disabled}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={() => runPressAnimation(0)}
        onHoverIn={() => runHoverAnimation(1)}
        onHoverOut={() => runHoverAnimation(0)}
        style={[styles.button, { backgroundColor: color, opacity: disabled ? 0.6 : 1 }]}
      >
        <View pointerEvents="none" style={styles.shimmerContainer}>
          <Animated.View style={[styles.shimmer, shimmerStyle]} />
        </View>
        <Text style={styles.title}>{title}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative'
  },
  aura: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: 26,
    backgroundColor: '#FFFFFF'
  },
  halo: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 20
  },
  button: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 16,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center'
  },
  shimmerContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden'
  },
  shimmer: {
    position: 'absolute',
    top: -26,
    width: 42,
    height: 110,
    backgroundColor: '#FFFFFF'
  },
  title: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700'
  }
});
