import { useEffect, useRef } from 'react';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import { GameSettings } from '../types/game';

// Sound file mapping — imports are static so Metro bundles the assets.
const SOUND_SOURCES = {
  right: require('../../assets/sounds/right.wav'),
  wrong: require('../../assets/sounds/wrong.wav'),
  win: require('../../assets/sounds/win.wav'),
  lose: require('../../assets/sounds/lose.wav'),
} as const;

const SOUND_VOLUMES: Record<keyof typeof SOUND_SOURCES, number> = {
  right: 0.95,
  wrong: 0.85,
  win: 0.85,
  lose: 0.85,
};

type SoundKey = keyof typeof SOUND_SOURCES;

export function useSoundHaptics(settings: GameSettings) {
  // Store loaded Audio.Sound instances by key — one per event type, reused each play.
  const soundsRef = useRef<Partial<Record<SoundKey, Audio.Sound>>>({});
  // Live-updating flags via ref so callbacks always see the latest values
  // without recreating handlers on every settings change.
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Allow playback in silent mode on iOS
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
        });
      } catch {}

      for (const key of Object.keys(SOUND_SOURCES) as SoundKey[]) {
        if (cancelled) return;
        try {
          const { sound } = await Audio.Sound.createAsync(SOUND_SOURCES[key], {
            volume: SOUND_VOLUMES[key],
          });
          if (cancelled) {
            await sound.unloadAsync();
            return;
          }
          soundsRef.current[key] = sound;
        } catch {
          // Ignore load failures (some platforms/dev-clients might not support audio)
        }
      }
    })();

    return () => {
      cancelled = true;
      // Unload all sounds on unmount
      const snapshot = soundsRef.current;
      soundsRef.current = {};
      Object.values(snapshot).forEach((s) => {
        try {
          s?.unloadAsync();
        } catch {}
      });
    };
  }, []);

  const play = async (key: SoundKey) => {
    if (!settingsRef.current.soundEnabled) return;
    const s = soundsRef.current[key];
    if (!s) return;
    try {
      await s.replayAsync();
    } catch {}
  };

  const playTap = () => {
    if (settingsRef.current.hapticsEnabled) {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    }
    play('right');
  };

  const playBump = () => {
    if (settingsRef.current.hapticsEnabled && settingsRef.current.vibrationOnBump) {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch {}
    }
    play('wrong');
  };

  const playSuccess = () => {
    if (settingsRef.current.hapticsEnabled) {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
    }
    play('win');
  };

  const playError = () => {
    if (settingsRef.current.hapticsEnabled) {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch {}
    }
    play('lose');
  };

  return {
    playTap,
    playBump,
    playSuccess,
    playError,
  };
}
