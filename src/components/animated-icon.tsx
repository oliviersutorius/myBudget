import { Image } from 'expo-image';
import * as SplashScreen from 'expo-splash-screen';
import { useState } from 'react';
import { StyleSheet, View, useColorScheme } from 'react-native';
import Animated, { Easing, Keyframe } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

const DURATION = 600;

// Doit rester alignée sur `expo.plugins["expo-splash-screen"].backgroundColor`
// / `.dark.backgroundColor` (app.json) et sur `Colors.*.primary`
// (src/constants/theme.ts, charte graphique — ticket #26) : ce splash natif
// s'affiche avant que le JS (donc le thème) ne soit chargé, ces valeurs ne
// peuvent pas être importées depuis theme.ts ici.
const SPLASH_BACKGROUND = { light: '#457A5A', dark: '#87C39C' };

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
        { backgroundColor: SPLASH_BACKGROUND[scheme === 'dark' ? 'dark' : 'light'] },
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
        { backgroundColor: SPLASH_BACKGROUND[scheme === 'dark' ? 'dark' : 'light'] },
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
