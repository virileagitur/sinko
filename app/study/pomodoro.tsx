import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal, Switch,
  AppState, AppStateStatus, Vibration, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import { useTheme } from '../../context/ThemeContext';

const WORK_DURATION  = 25 * 60; // seconds
const SHORT_BREAK    = 5  * 60;
const LONG_BREAK     = 15 * 60;

type Phase = 'work' | 'short_break' | 'long_break';

function formatTime(sec: number) {
  const m = Math.floor(sec / 60).toString().padStart(2, '0');
  const s = (sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function PomodoroScreen() {
  const { colors } = useTheme();

  // Timer state
  const [phase, setPhase]           = useState<Phase>('work');
  const [timeLeft, setTimeLeft]     = useState(WORK_DURATION);
  const [isRunning, setIsRunning]   = useState(false);
  const [session, setSession]       = useState(1);         // work session counter
  const [beepEnabled, setBeepEnabled] = useState(true);
  const [showBreakModal, setShowBreakModal] = useState(false);

  // Background timer: record the timestamp when we last ticked
  const lastTickRef    = useRef<number>(Date.now());
  const soundRef       = useRef<Audio.Sound | null>(null);
  const appStateRef    = useRef<AppStateStatus>('active');
  const intervalRef    = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Load beep sound on mount ──────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    Audio.setAudioModeAsync({ playsInSilentModeIOS: true }).catch(() => {});
    Audio.Sound.createAsync(
      // Use a bundled chime or fall back gracefully
      require('../../assets/sounds/beep.mp3'),
    )
      .then(({ sound }) => { if (mounted) soundRef.current = sound; })
      .catch(() => {}); // If file missing, just skip

    return () => {
      mounted = false;
      soundRef.current?.unloadAsync().catch(() => {});
    };
  }, []);

  // ── AppState listener — compensate for background time ───────────────────
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (next === 'active' && appStateRef.current !== 'active' && isRunning) {
        // App came to foreground — calculate elapsed
        const elapsed = Math.floor((Date.now() - lastTickRef.current) / 1000);
        setTimeLeft((prev) => Math.max(0, prev - elapsed));
      }
      if (next !== 'active') {
        lastTickRef.current = Date.now();
      }
      appStateRef.current = next;
    });
    return () => sub.remove();
  }, [isRunning]);

  // ── Core countdown tick ───────────────────────────────────────────────────
  useEffect(() => {
    if (isRunning) {
      lastTickRef.current = Date.now();
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            handlePhaseEnd();
            return 0;
          }
          lastTickRef.current = Date.now();
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, phase]);

  // ── Phase completed ───────────────────────────────────────────────────────
  const handlePhaseEnd = useCallback(async () => {
    setIsRunning(false);
    Vibration.vibrate([0, 400, 200, 400]);

    if (beepEnabled && soundRef.current) {
      try {
        await soundRef.current.replayAsync();
      } catch (_) {}
    }

    if (phase === 'work') {
      const newSession = session + 1;
      setSession(newSession);
      const nextPhase: Phase = newSession % 4 === 0 ? 'long_break' : 'short_break';
      setPhase(nextPhase);
      setTimeLeft(nextPhase === 'long_break' ? LONG_BREAK : SHORT_BREAK);
      setShowBreakModal(true);
    } else {
      setPhase('work');
      setTimeLeft(WORK_DURATION);
    }
  }, [phase, session, beepEnabled]);

  const startBreak = () => {
    setShowBreakModal(false);
    setIsRunning(true);
  };

  const skipBreak = () => {
    setShowBreakModal(false);
    setPhase('work');
    setTimeLeft(WORK_DURATION);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setPhase('work');
    setTimeLeft(WORK_DURATION);
    setSession(1);
  };

  // ── Styles ────────────────────────────────────────────────────────────────
  const phaseColor = phase === 'work' ? '#DC2626' : '#7C3AED';
  const phaseName  = phase === 'work'
    ? `Focus Session ${session}`
    : phase === 'long_break' ? 'Long Break ☕' : 'Short Break 🌿';

  const progress = 1 - timeLeft / (
    phase === 'work' ? WORK_DURATION :
    phase === 'long_break' ? LONG_BREAK : SHORT_BREAK
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Pomodoro</Text>
        <TouchableOpacity onPress={resetTimer}>
          <Ionicons name="refresh" size={22} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Phase label */}
      <View style={[styles.phaseLabel, { backgroundColor: phaseColor + '20' }]}>
        <Text style={[styles.phaseLabelText, { color: phaseColor }]}>{phaseName}</Text>
      </View>

      {/* Circular Timer */}
      <View style={styles.timerWrap}>
        <View style={[styles.timerRing, { borderColor: phaseColor + '30' }]}>
          <View style={[styles.timerFill, { borderColor: phaseColor }]} />
          <View style={[styles.timerInner, { backgroundColor: colors.white, borderColor: phaseColor + '20' }]}>
            <Text style={[styles.timerText, { color: phaseColor }]}>{formatTime(timeLeft)}</Text>
            <Text style={[styles.timerSub, { color: colors.textMuted }]}>
              {isRunning ? 'Stay focused...' : 'Press play to start'}
            </Text>
          </View>
        </View>
      </View>

      {/* Session dots */}
      <View style={styles.sessionDots}>
        {[1, 2, 3, 4].map((i) => (
          <View
            key={i}
            style={[
              styles.dot,
              { backgroundColor: i < session ? phaseColor : colors.border },
            ]}
          />
        ))}
        <Text style={[styles.sessionLabel, { color: colors.textMuted }]}>Session {session}/4</Text>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.controlBtn, { backgroundColor: colors.white, borderColor: colors.border }]}
          onPress={() => {
            setPhase('work');
            setTimeLeft(WORK_DURATION);
            setIsRunning(false);
          }}
        >
          <Ionicons name="play-skip-back" size={20} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.playBtn, { backgroundColor: phaseColor }]}
          onPress={() => setIsRunning((r) => !r)}
        >
          <Ionicons name={isRunning ? 'pause' : 'play'} size={32} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlBtn, { backgroundColor: colors.white, borderColor: colors.border }]}
          onPress={() => setIsRunning(false)}
        >
          <Ionicons name="stop" size={20} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Settings bar */}
      <View style={[styles.settingsBar, { backgroundColor: colors.white, borderColor: colors.border }]}>
        <Ionicons name={beepEnabled ? 'volume-high-outline' : 'volume-mute-outline'} size={18} color={colors.textMuted} />
        <Text style={[styles.settingLabel, { color: colors.text }]}>Beep on phase end</Text>
        <Switch
          value={beepEnabled}
          onValueChange={setBeepEnabled}
          trackColor={{ false: colors.border, true: phaseColor }}
          thumbColor={colors.white}
        />
      </View>

      {/* ── Break Modal ── */}
      <Modal visible={showBreakModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.white }]}>
            <Text style={[styles.modalEmoji]}>
              {phase === 'long_break' ? '☕' : '🌿'}
            </Text>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {phase === 'long_break' ? 'Long Break Time!' : 'Short Break Time!'}
            </Text>
            <Text style={[styles.modalSub, { color: colors.textMuted }]}>
              Great work! Take{' '}
              {phase === 'long_break' ? '15 minutes' : '5 minutes'} to rest.
            </Text>

            {/* Break countdown display */}
            <View style={[styles.breakTimer, { backgroundColor: phaseColor + '12' }]}>
              <Text style={[styles.breakTimerText, { color: phaseColor }]}>
                {formatTime(timeLeft)}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.modalPrimary, { backgroundColor: phaseColor }]}
              onPress={startBreak}
            >
              <Text style={styles.modalPrimaryText}>Start Break</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalSecondary} onPress={skipBreak}>
              <Text style={[styles.modalSecondaryText, { color: colors.textMuted }]}>
                Skip Break — Back to Work
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8,
  },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  phaseLabel: {
    alignSelf: 'center', paddingHorizontal: 16, paddingVertical: 6,
    borderRadius: 99, marginBottom: 24,
  },
  phaseLabelText: { fontSize: 13, fontWeight: '600' },
  timerWrap: { alignItems: 'center', marginBottom: 32 },
  timerRing: {
    width: 240, height: 240, borderRadius: 120,
    borderWidth: 12, alignItems: 'center', justifyContent: 'center',
  },
  timerFill: { position: 'absolute' },
  timerInner: {
    width: 200, height: 200, borderRadius: 100,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1,
  },
  timerText: { fontSize: 52, fontWeight: '700', fontVariant: ['tabular-nums'] as any },
  timerSub: { fontSize: 12, marginTop: 4 },
  sessionDots: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    justifyContent: 'center', marginBottom: 32,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  sessionLabel: { fontSize: 12, marginLeft: 4 },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20, marginBottom: 32 },
  controlBtn: {
    width: 52, height: 52, borderRadius: 26,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1,
  },
  playBtn: {
    width: 76, height: 76, borderRadius: 38,
    alignItems: 'center', justifyContent: 'center',
  },
  settingsBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 20, padding: 14, borderRadius: 14, borderWidth: 1,
  },
  settingLabel: { flex: 1, fontSize: 14 },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 32 },
  modalSheet: {
    width: '100%', borderRadius: 24, padding: 28,
    alignItems: 'center', gap: 12,
  },
  modalEmoji: { fontSize: 48 },
  modalTitle: { fontSize: 22, fontWeight: '700', textAlign: 'center' },
  modalSub: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  breakTimer: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14, marginVertical: 4 },
  breakTimerText: { fontSize: 36, fontWeight: '700', fontVariant: ['tabular-nums'] as any },
  modalPrimary: {
    width: '100%', borderRadius: 14, paddingVertical: 14, alignItems: 'center',
  },
  modalPrimaryText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  modalSecondary: { paddingVertical: 8 },
  modalSecondaryText: { fontSize: 13 },
});
