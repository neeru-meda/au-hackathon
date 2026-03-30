import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONTS, SHADOWS } from '../utils/theme';
import { studentAPI, analyticsAPI } from '../utils/api';
import { useUser } from '../utils/UserContext';
import { useFocusEffect } from 'expo-router';

export default function StudentAttendanceScreen() {
  const { user } = useUser();
  const [student, setStudent] = useState<any>(null);
  const [atRisk, setAtRisk] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      if (!user?.rollNo) return;
      const data = await studentAPI.getByRollNo(user.rollNo);
      setStudent(data);
      try {
        const risk = await analyticsAPI.atRisk();
        const myRisk = (risk.atRiskStudents || []).find((r: any) => r.rollNo === user.rollNo);
        setAtRisk(myRisk || null);
      } catch (e) {
        console.log('At-risk fetch failed');
      }
    } catch (error) {
      console.error('Failed to load student data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [user?.rollNo])
  );

  const subjects = [
    { key: 'math', label: 'Mathematics' },
    { key: 'dbms', label: 'DBMS' },
    { key: 'os', label: 'Operating Systems' },
    { key: 'cn', label: 'Computer Networks' },
    { key: 'se', label: 'Software Engineering' }
  ];

  const getColor = (pct: number) => {
    if (pct >= 75) return COLORS.success;
    if (pct >= 65) return '#F59E0B';
    return COLORS.danger;
  };

  const getClassesNeeded = (pct: number) => {
    if (pct >= 75) return 0;
    const totalEstimate = 100;
    const attended = (pct / 100) * totalEstimate;
    const needed = Math.ceil((0.75 * (totalEstimate + 40) - attended));
    return Math.max(needed, 1);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 100 }} />
      </SafeAreaView>
    );
  }

  if (!student) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Attendance</Text>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Could not load student data</Text>
        </View>
      </SafeAreaView>
    );
  }

  const overallColor = getColor(student.attendancePercent);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Attendance</Text>
        <Text style={styles.headerSubtitle}>{student.name} • {student.rollNo}</Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} colors={[COLORS.primary]} />}
      >
        {/* Circular Progress */}
        <View style={styles.progressCard}>
          <View style={[styles.progressRing, { borderColor: overallColor }]}>
            <Text style={[styles.progressPercent, { color: overallColor }]}>
              {student.attendancePercent}%
            </Text>
            <Text style={styles.progressLabel}>Overall</Text>
          </View>
          <View style={[
            styles.statusPill,
            { backgroundColor: student.status === 'Eligible' ? '#E8F5E9' : '#FFEBEE' }
          ]}>
            <Ionicons
              name={student.status === 'Eligible' ? 'checkmark-circle' : 'warning'}
              size={16}
              color={student.status === 'Eligible' ? COLORS.success : COLORS.danger}
            />
            <Text style={[
              styles.statusText,
              { color: student.status === 'Eligible' ? COLORS.success : COLORS.danger }
            ]}>
              {student.status}
            </Text>
          </View>
        </View>

        {/* Shortage Banner */}
        {student.status === 'Shortage' && (
          <View style={styles.shortageBanner}>
            <Ionicons name="alert-circle" size={20} color={COLORS.white} />
            <Text style={styles.shortageText}>
              You need approximately {getClassesNeeded(student.attendancePercent)} more classes to reach 75%
            </Text>
          </View>
        )}

        {/* At-Risk Warning */}
        {atRisk && (
          <View style={styles.atRiskBanner}>
            <Ionicons name="trending-down" size={20} color="#92400E" />
            <Text style={styles.atRiskText}>
              You are trending towards shortage in: {atRisk.subjectsAtRisk.join(', ')}
            </Text>
          </View>
        )}

        {/* Subject Breakdown */}
        <Text style={styles.sectionTitle}>Subject-wise Breakdown</Text>
        {subjects.map((subj) => {
          const pct = student.subjectAttendance?.[subj.key] || 0;
          const color = getColor(pct);
          return (
            <View key={subj.key} style={styles.subjectCard}>
              <View style={styles.subjectHeader}>
                <Text style={styles.subjectName}>{subj.label}</Text>
                <View style={[
                  styles.subjectPill,
                  { backgroundColor: pct >= 75 ? '#E8F5E9' : '#FFEBEE' }
                ]}>
                  <Text style={[
                    styles.subjectPillText,
                    { color: pct >= 75 ? COLORS.success : COLORS.danger }
                  ]}>
                    {pct >= 75 ? 'Eligible' : 'Shortage'}
                  </Text>
                </View>
              </View>
              <View style={styles.barContainer}>
                <View style={[styles.barFill, { width: `${Math.min(pct, 100)}%`, backgroundColor: color }]} />
              </View>
              <Text style={[styles.subjectPercent, { color }]}>{pct}%</Text>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.primary, paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md, paddingBottom: SPACING.lg
  },
  headerTitle: { fontSize: FONTS.sizes.xxl, fontWeight: 'bold', color: COLORS.white },
  headerSubtitle: { fontSize: FONTS.sizes.sm, color: '#FFCCCC', marginTop: 2 },
  content: { flex: 1 },
  contentContainer: { padding: SPACING.lg, paddingBottom: 100 },
  emptyState: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: FONTS.sizes.md, color: COLORS.darkGray },
  progressCard: {
    backgroundColor: COLORS.white, borderRadius: 16, padding: SPACING.xl,
    alignItems: 'center', marginBottom: SPACING.md, ...SHADOWS.medium
  },
  progressRing: {
    width: 140, height: 140, borderRadius: 70, borderWidth: 8,
    alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.md
  },
  progressPercent: { fontSize: 36, fontWeight: 'bold' },
  progressLabel: { fontSize: FONTS.sizes.sm, color: COLORS.darkGray, marginTop: 2 },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20
  },
  statusText: { fontWeight: '600', fontSize: FONTS.sizes.sm },
  shortageBanner: {
    backgroundColor: COLORS.danger, flexDirection: 'row', alignItems: 'center',
    gap: 10, padding: 14, borderRadius: 12, marginBottom: SPACING.md
  },
  shortageText: { color: COLORS.white, fontWeight: '600', fontSize: FONTS.sizes.sm, flex: 1 },
  atRiskBanner: {
    backgroundColor: '#FEF3C7', flexDirection: 'row', alignItems: 'center',
    gap: 10, padding: 14, borderRadius: 12, marginBottom: SPACING.md
  },
  atRiskText: { color: '#92400E', fontWeight: '600', fontSize: FONTS.sizes.sm, flex: 1 },
  sectionTitle: {
    fontSize: FONTS.sizes.lg, fontWeight: 'bold', color: COLORS.primary,
    marginBottom: SPACING.md, marginTop: SPACING.sm
  },
  subjectCard: {
    backgroundColor: COLORS.white, borderRadius: 12, padding: SPACING.md,
    marginBottom: 10, ...SHADOWS.small
  },
  subjectHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  subjectName: { fontSize: FONTS.sizes.md, fontWeight: '600', color: COLORS.text },
  subjectPill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  subjectPillText: { fontSize: 11, fontWeight: '600' },
  barContainer: {
    height: 8, backgroundColor: COLORS.lightGray, borderRadius: 4, overflow: 'hidden'
  },
  barFill: { height: '100%', borderRadius: 4 },
  subjectPercent: { fontSize: FONTS.sizes.sm, fontWeight: '700', marginTop: 6, textAlign: 'right' }
});
