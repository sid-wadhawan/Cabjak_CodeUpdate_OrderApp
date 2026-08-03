import React, {useEffect, useRef, useState} from 'react';
import {View, Text, StyleSheet, AppState} from 'react-native';
import Svg, {Circle} from 'react-native-svg';
import colors from '../../styles/colors';
import {moderateScale, textScale} from '../../styles/responsiveSize';
import fontFamily from '../../styles/fontFamily';

const TOTAL_TIME = 5 * 60 * 1000; // 5 minutes
const SIZE = moderateScale(90);
const STROKE_WIDTH = moderateScale(5.6);
const RADIUS = (SIZE - STROKE_WIDTH*3) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function CircularCountdownTimer() {
  const [remaining, setRemaining] = useState(TOTAL_TIME);
  const endTimeRef = useRef(null);
  const intervalRef = useRef(null);

  const updateTime = () => {
    const timeLeft = endTimeRef.current - Date.now();
    setRemaining(timeLeft > 0 ? timeLeft : 0);

    if (timeLeft <= 0) {
      clearInterval(intervalRef.current);
    }
  };

  useEffect(() => {
    endTimeRef.current = Date.now() + TOTAL_TIME;
    updateTime();

    intervalRef.current = setInterval(updateTime, 1000);

    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') updateTime();
    });

    return () => {
      clearInterval(intervalRef.current);
      sub.remove();
    };
  }, []);

  const progress = remaining / TOTAL_TIME;
  const strokeDashoffset = CIRCUMFERENCE - CIRCUMFERENCE * progress;

  const formatTime = ms => {
    const sec = Math.floor(ms / 1000);
    const min = Math.floor(sec / 60);
    const s = sec % 60;
    return `${min}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <View style={{}}>
      <View style={styles.container}>
        <Svg width={SIZE} height={SIZE}>
          {/* Background Ring */}
          <Circle
            stroke={colors.themeColor}
            fill="none"
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            strokeWidth={STROKE_WIDTH}
          />

          {/* Progress Ring */}
          <Circle
            stroke={colors.white}
            fill="none"
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            strokeWidth={STROKE_WIDTH}
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            rotation="-90"
            origin={`${SIZE / 2}, ${SIZE / 2}`}
          />
        </Svg>

        {/* Center Timer */}
        <View style={styles.centerText}>
          <Text style={styles.timeText}>{formatTime(remaining)}</Text>
          {/* <Text style={styles.subText}>Remaining</Text> */}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerText: {
    position: 'absolute',
    alignItems: 'center',
  },
  timeText: {
    fontSize: textScale(12),
    fontWeight: '700',
    color: colors.white,
    letterSpacing:moderateScale(1.8),
    fontFamily:fontFamily.medium
  },
  subText: {
    fontSize: textScale(8),
    color: colors.white,
    marginTop: 4,
  },
});
