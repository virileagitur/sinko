import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, Vibration
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Colors, Spacing, Radius } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Line, G, Text as SvgText } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';

const WORK_MINUTES = 25;
const BREAK_MINUTES = 5;
const LONG_BREAK_MINUTES = 15;

type Phase = 'work' | 'break' | 'longBreak';

export default function PomodoroScreen() {
  const { deckId } = useLocalSearchParams<{ deckId?: string }>();
  const deck = useQuery(api.decks.getById, deckId ? { deckId } : 'skip');
  const startSession = useMutation(api.study.startSession);
  const endSession = useMutation(api.study.endSession);

  const [phase, setPhase] = useState<Phase>('work');
  const [timeLeft, setTimeLeft] = useState(WORK_MINUTES * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [totalPomodoros, setTotalPomodoros] = useState(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const handAnim = useRef(new Animated.Value(0)).current;

  const phaseDuration = {
    work: WORK_MINUTES * 60,
    break: BREAK_MINUTES * 60,
    longBreak: LONG_BREAK_MINUTES * 60,
  };

  const phaseLabels = {
    work: 'Focus Time',
    break: 'Short Break',
    longBreak: 'Long Break',
  };

  const phaseColors = {
    work: '#C0392B',
    break: Colors.success,
    longBreak: Colors.azure,
  };

  // Seconds to clock angles
  const totalSecs = phaseDuration[phase];
  const elapsed = totalSecs - timeLeft;
  const progress = elapsed / totalSecs; // 0 to 1
  const minuteAngle = (progress * 360) % 360;
  const secondAngle = ((totalSecs - timeLeft) % 60) * 6; // 6 deg per second

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  useEffect(() => {
    if (isRunning) {
      tickRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(tickRef.current!);
            Vibration.vibrate([0, 500, 200, 500]);
            handlePhaseComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (tickRef.current) clearInterval(tickRef.current);
    }
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [isRunning]);

  const handlePhaseComplete = () => {
    setIsRunning(false);
    if (phase === 'work') {
      const newCount = sessionCount + 1;
      setSessionCount(newCount);
      setTotalPomodoros((p) => p + 1);
      if (newCount % 4 === 0) {
        setPhase('longBreak');
        setTimeLeft(LONG_BREAK_MINUTES * 60);
      } else {
        setPhase('break');
        setTimeLeft(BREAK_MINUTES * 60);
      }
    } else {
      setPhase('work');
      setTimeLeft(WORK_MINUTES * 60);
    }
  };

  const handleStartStop = async () => {
    if (!isRunning && !sessionId && deckId) {
      const id = await startSession({ deckId: deckId as any, mode: 'pomodoro' });
      setSessionId(id);
    }
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(phaseDuration[phase]);
  };

  const handleClose = async () => {
    setIsRunning(false);
    if (sessionId) {
      await endSession({ sessionId: sessionId as any, cardsReviewed: 0, pomodoroSessions: totalPomodoros });
    }
    router.back();
  };

  // Clock face rendering with SVG
  const R = 100;
  const cx = 110;
  const cy = 110;

  const toRad = (deg: number) => (deg - 90) * (Math.PI / 180);

  const handEnd = (angle: number, length: number) => ({
    x: cx + length * Math.cos(toRad(angle)),
    y: cy + length * Math.sin(toRad(angle)),
  });

  const minuteHand = handEnd(minuteAngle, 70);
  const secondHand = handEnd(secondAngle, 85);

  const color = phaseColors[phase];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#FFF8F0' }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color="#6B4C3B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pomodoro Timer</Text>
        <View style={{ width: 40 }} />
      </View>

      {deck && (
        <Text style={styles.deckLabel}>📚 {deck.title}</Text>
      )}

      {/* Phase indicator */}
      <View style={styles.phaseRow}>
        {(['work', 'break', 'longBreak'] as Phase[]).map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.phaseChip, phase === p && { backgroundColor: phaseColors[p] }]}
            onPress={() => {
              if (!isRunning) {
                setPhase(p);
                setTimeLeft(phaseDuration[p]);
              }
            }}
          >
            <Text style={[styles.phaseChipText, phase === p && { color: Colors.white }]}>
              {phaseLabels[p]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Analog Clock */}
      <View style={styles.clockWrapper}>
        <Svg width={220} height={220} viewBox="0 0 220 220">
          {/* Clock face */}
          <Circle cx={cx} cy={cy} r={R} fill="#FFF8F0" stroke="#D4B896" strokeWidth={3} />

          {/* Hour marks */}
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = i * 30;
            const outer = handEnd(angle, 93);
            const inner = handEnd(angle, i % 3 === 0 ? 78 : 86);
            return (
              <Line
                key={i}
                x1={inner.x}
                y1={inner.y}
                x2={outer.x}
                y2={outer.y}
                stroke="#A0856B"
                strokeWidth={i % 3 === 0 ? 2.5 : 1}
              />
            );
          })}

          {/* Progress arc */}
          <Circle
            cx={cx}
            cy={cy}
            r={85}
            fill="none"
            stroke={color}
            strokeWidth={4}
            strokeOpacity={0.25}
          />

          {/* Minute hand (tracks overall progress) */}
          <Line
            x1={cx}
            y1={cy}
            x2={minuteHand.x}
            y2={minuteHand.y}
            stroke={color}
            strokeWidth={3.5}
            strokeLinecap="round"
          />

          {/* Second hand */}
          <Line
            x1={cx}
            y1={cy}
            x2={secondHand.x}
            y2={secondHand.y}
            stroke="#E74C3C"
            strokeWidth={1.5}
            strokeLinecap="round"
          />

          {/* Center dot */}
          <Circle cx={cx} cy={cy} r={5} fill={color} />

          {/* Timer digits in center */}
          <SvgText
            x={cx}
            y={cy + 38}
            textAnchor="middle"
            fontSize={13}
            fontWeight="500"
            fill="#8B6751"
          >
            {formatTime(timeLeft)}
          </SvgText>
        </Svg>
      </View>

      {/* Phase label */}
      <Text style={[styles.phaseLabel, { color }]}>{phaseLabels[phase].toUpperCase()}</Text>

      {/* Session counter */}
      <View style={styles.tomatoRow}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Text key={i} style={{ fontSize: 22, opacity: i < (sessionCount % 4) ? 1 : 0.25 }}>
            🍅
          </Text>
        ))}
      </View>
      <Text style={styles.sessionCount}>
        {totalPomodoros} pomodoro{totalPomodoros !== 1 ? 's' : ''} completed
      </Text>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
          <Ionicons name="refresh" size={22} color="#8B6751" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.startBtn, { backgroundColor: color }]}
          onPress={handleStartStop}
          activeOpacity={0.85}
        >
          <Ionicons name={isRunning ? 'pause' : 'play'} size={32} color={Colors.white} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.resetBtn} onPress={handlePhaseComplete}>
          <Ionicons name="play-skip-forward" size={22} color="#8B6751" />
        </TouchableOpacity>
      </View>

      <Text style={styles.tip}>
        {phase === 'work'
          ? '💡 Stay focused. Close all distractions.'
          : phase === 'break'
          ? '☕ Take a short walk or stretch!'
          : '🌿 Great job! Rest well before continuing.'}
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EDE0D0',
  },
  headerTitle: { fontSize: 17, fontWeight: '600', color: '#5C3A1E' },
  deckLabel: { fontSize: 13, color: '#8B6751', marginBottom: Spacing.sm },
  phaseRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  phaseChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: '#EDE0D0',
  },
  phaseChipText: { fontSize: 12, fontWeight: '600', color: '#8B6751' },
  clockWrapper: {
    width: 220,
    height: 220,
    marginVertical: Spacing.md,
    // Warm shadow
    shadowColor: '#8B6751',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  phaseLabel: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 2,
    marginTop: -Spacing.sm,
  },
  tomatoRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: Spacing.md,
  },
  sessionCount: {
    fontSize: 13,
    color: '#8B6751',
    marginTop: 4,
    marginBottom: Spacing.lg,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xl,
  },
  resetBtn: {
    width: 48,
    height: 48,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EDE0D0',
  },
  startBtn: {
    width: 72,
    height: 72,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  tip: {
    fontSize: 13,
    color: '#8B6751',
    textAlign: 'center',
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
});
