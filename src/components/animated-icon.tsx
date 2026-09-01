import { Image } from 'expo-image';
import * as SplashScreen from 'expo-splash-screen';
import { useState } from 'react';
import { StyleSheet, View, useColorScheme } from 'react-native';
import Animated, { Easing, Keyframe } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { Colors } from '@/constants/theme';

const DURATION = 600;

// `Colors.*.primary` doit rester alignée sur
// `expo.plugins["expo-splash-screen"].backgroundColor` / `.dark.backgroundColor`
// (app.json) : ce fichier JSON, lui, ne peut pas importer theme.ts (lu par
// Expo au build, avant tout JS applicatif) — sa valeur reste à dupliquer et
// tenir à jour manuellement si `primary` change.

export function AnimatedSplashOverlay() {
  const scheme = useColorScheme();
  const [animate, setAnimate] = useState(false);
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  const splashKeyframe = new Keyframe({
    0: {
      transform: [{ scale: 1 }],
      opacity: 1,
    },
    20: {
      opacity: 1,
    },
    70: {
      opacity: 0,
      easing: Easing.elastic(0.7),
    },
    100: {
      opacity: 0,
      transform: [{ scale: 1 }],
      easing: Easing.elastic(0.7),
    },
  });

  const image = <Image style={styles.image} source={require('@/assets/images/expo-logo.png')} />;

  return animate ? (
    <Animated.View
      entering={splashKeyframe.duration(DURATION).withCallback((finished) => {
        'worklet';
        if (finished) {
          scheduleOnRN(setVisible, false);
        }
      })}
      style={[
        styles.splashOverlay,
        { backgroundColor: Colors[scheme === 'dark' ? 'dark' : 'light'].primary },
      ]}
    >
      {image}
    </Animated.View>
  ) : (
    <View
      onLayout={() => {
        SplashScreen.hideAsync().finally(() => {
          setAnimate(true);
        });
      }}
      style={[
        styles.splashOverlay,
        { backgroundColor: Colors[scheme === 'dark' ? 'dark' : 'light'].primary },
      ]}
    >
      {image}
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    width: 76,
    height: 71,
  },
  splashOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
});
