import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { PoseDebugInfo } from '../services/poseRules';
import Colors from '../constants/colors';

interface PoseDebugOverlayProps {
  debugInfo: PoseDebugInfo | undefined;
  visible: boolean;
}

const getZoneColor = (zone: 'green' | 'yellow' | 'red'): string => {
  switch (zone) {
    case 'green': return Colors.success;
    case 'yellow': return Colors.warning;
    case 'red': return Colors.error;
  }
};

const PoseDebugOverlay: React.FC<PoseDebugOverlayProps> = ({ debugInfo, visible }) => {
  if (!visible || !debugInfo) {
    return null;
  }

  const { angleChecks, alignmentChecks, scoreBreakdown, phase, holdSeconds } = debugInfo;

  return (
    <View style={styles.container} pointerEvents="none">
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Phase and Hold Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Phase: {phase.toUpperCase()}</Text>
          {holdSeconds > 0 && (
            <Text style={styles.holdText}>Hold: {holdSeconds.toFixed(1)}s</Text>
          )}
        </View>

        {/* Score Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Score Breakdown</Text>
          <View style={styles.scoreRow}>
            <Text style={styles.scoreLabel}>Angle:</Text>
            <Text style={styles.scoreValue}>{scoreBreakdown.angleScore}</Text>
            <Text style={styles.scoreWeight}>×{scoreBreakdown.weights.angle}</Text>
          </View>
          <View style={styles.scoreRow}>
            <Text style={styles.scoreLabel}>Align:</Text>
            <Text style={styles.scoreValue}>{scoreBreakdown.alignmentScore}</Text>
            <Text style={styles.scoreWeight}>×{scoreBreakdown.weights.alignment}</Text>
          </View>
          <View style={styles.scoreRow}>
            <Text style={styles.scoreLabel}>Stable:</Text>
            <Text style={styles.scoreValue}>{scoreBreakdown.stabilityScore}</Text>
            <Text style={styles.scoreWeight}>×{scoreBreakdown.weights.stability}</Text>
          </View>
        </View>

        {/* Angle Checks */}
        {angleChecks.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Angle Checks</Text>
            {angleChecks.map((check, index) => (
              <View key={index} style={styles.checkRow}>
                <View style={[styles.zoneDot, { backgroundColor: getZoneColor(check.zone) }]} />
                <View style={styles.checkInfo}>
                  <Text style={styles.checkName}>{check.name}</Text>
                  <Text style={styles.checkDetail}>
                    {check.currentAngle}° → {check.targetAngle}° (±{check.deviation}°)
                  </Text>
                </View>
                <Text style={[styles.checkScore, { color: getZoneColor(check.zone) }]}>
                  {check.score}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Alignment Checks */}
        {alignmentChecks.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Alignment Checks</Text>
            {alignmentChecks.map((check, index) => (
              <View key={index} style={styles.checkRow}>
                <View style={[styles.zoneDot, { backgroundColor: getZoneColor(check.zone) }]} />
                <View style={styles.checkInfo}>
                  <Text style={styles.checkName}>{check.name}</Text>
                  <Text style={styles.checkDetail}>
                    diff: {(check.currentDiff * 100).toFixed(1)}% (tol: {(check.tolerance * 100).toFixed(1)}%)
                  </Text>
                </View>
                <Text style={[styles.checkScore, { color: getZoneColor(check.zone) }]}>
                  {check.score}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 120,
    left: 10,
    width: 200,
    maxHeight: 400,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    borderRadius: 12,
    padding: 10,
  },
  scrollView: {
    maxHeight: 380,
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  holdText: {
    color: Colors.warning,
    fontSize: 14,
    fontWeight: '600',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  scoreLabel: {
    color: Colors.textLight,
    fontSize: 11,
    width: 50,
  },
  scoreValue: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    width: 35,
  },
  scoreWeight: {
    color: Colors.textMuted,
    fontSize: 10,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  zoneDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  checkInfo: {
    flex: 1,
  },
  checkName: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '500',
  },
  checkDetail: {
    color: Colors.textMuted,
    fontSize: 9,
  },
  checkScore: {
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
  },
});

export default PoseDebugOverlay;
