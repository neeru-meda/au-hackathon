import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONTS } from '../utils/theme';
import { analyticsAPI } from '../utils/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format } from 'date-fns';

type AnalyticsView = 'day-wise' | 'subject-wise' | 'eligibility';

export default function AnalyticsScreen() {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeView, setActiveView] = useState<AnalyticsView>('eligibility');
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, [activeView]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let result;
      switch (activeView) {
        case 'eligibility':
          result = await analyticsAPI.semesterWise();
          break;
        case 'day-wise':
          const today = format(new Date(), 'yyyy-MM-dd');
          result = await analyticsAPI.dayWise(today);
          break;
        case 'subject-wise':
          result = await analyticsAPI.subjectWise('Math');
          break;
      }
      setData(result);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.headerSection}>
          <Text style={styles.headerTitle}>Analytics Dashboard</Text>
          <Text style={styles.headerSubtitle}>Monitor attendance trends</Text>
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeView === 'eligibility' && styles.tabActive]}
            onPress={() => setActiveView('eligibility')}
          >
            <Ionicons
              name="school"
              size={20}
              color={activeView === 'eligibility' ? COLORS.white : COLORS.darkGray}
            />
            <Text
              style={[
                styles.tabText,
                activeView === 'eligibility' && styles.tabTextActive
              ]}
            >
              Eligibility
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeView === 'day-wise' && styles.tabActive]}
            onPress={() => setActiveView('day-wise')}
          >
            <Ionicons
              name="calendar"
              size={20}
              color={activeView === 'day-wise' ? COLORS.white : COLORS.darkGray}
            />
            <Text
              style={[
                styles.tabText,
                activeView === 'day-wise' && styles.tabTextActive
              ]}
            >
              Day-wise
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeView === 'subject-wise' && styles.tabActive]}
            onPress={() => setActiveView('subject-wise')}
          >
            <Ionicons
              name="book"
              size={20}
              color={activeView === 'subject-wise' ? COLORS.white : COLORS.darkGray}
            />
            <Text
              style={[
                styles.tabText,
                activeView === 'subject-wise' && styles.tabTextActive
              ]}
            >
              Subject-wise
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size='large' color={COLORS.primary} />
            </View>
          ) : (
            <>
              {activeView === 'eligibility' && data && (
                <View>
                  <View style={styles.statsRow}>
                    <View style={[styles.statBox, { backgroundColor: COLORS.accent }]}>
                      <Text style={styles.statValue}>{data.eligible}</Text>
                      <Text style={styles.statLabel}>Eligible</Text>
                    </View>
                    <View style={[styles.statBox, { backgroundColor: COLORS.danger }]}>
                      <Text style={styles.statValue}>{data.shortage}</Text>
                      <Text style={styles.statLabel}>Shortage</Text>
                    </View>
                  </View>

                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>All Students</Text>
                    {data.students?.map((student: any) => (
                      <View key={student.rollNo} style={styles.studentCard}>
                        <View style={styles.studentInfo}>
                          <Text style={styles.studentName}>{student.name}</Text>
                          <Text style={styles.studentRoll}>{student.rollNo} • {student.className}</Text>
                        </View>
                        <View style={styles.studentStats}>
                          <Text style={styles.percentage}>{student.attendancePercent.toFixed(1)}%</Text>
                          <View
                            style={[
                              styles.statusBadge,
                              student.status === 'Eligible' ? styles.badgeGreen : styles.badgeRed
                            ]}
                          >
                            <Text style={styles.statusText}>{student.status}</Text>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {activeView === 'day-wise' && data && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Today's Absentees</Text>
                    <Text style={styles.sectionCount}>{data.absent_students?.length || 0} students</Text>
                  </View>
                  {data.absent_students?.length === 0 ? (
                    <View style={styles.emptyState}>
                      <Ionicons name="checkmark-circle" size={48} color={COLORS.accent} />
                      <Text style={styles.emptyText}>Perfect Attendance!</Text>
                      <Text style={styles.emptySubtext}>No absences recorded today</Text>
                    </View>
                  ) : (
                    data.absent_students?.map((entry: any, index: number) => (
                      <View key={index} style={styles.absentCard}>
                        <Ionicons name="close-circle" size={24} color={COLORS.danger} />
                        <View style={styles.absentInfo}>
                          <Text style={styles.absentName}>{entry.name}</Text>
                          <Text style={styles.absentDetails}>
                            {entry.rollNo} • {entry.className} • {entry.subject} (Period {entry.period})
                          </Text>
                        </View>
                      </View>
                    ))
                  )}
                </View>
              )}

              {activeView === 'subject-wise' && data && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Math - Low Attendance</Text>
                    <Text style={styles.sectionCount}>{data.students?.length || 0} students</Text>
                  </View>
                  {data.students?.length === 0 ? (
                    <View style={styles.emptyState}>
                      <Ionicons name="checkmark-circle" size={48} color={COLORS.accent} />
                      <Text style={styles.emptyText}>All Good!</Text>
                      <Text style={styles.emptySubtext}>No students below 75% in Math</Text>
                    </View>
                  ) : (
                    data.students?.map((student: any) => (
                      <View key={student.rollNo} style={styles.subjectCard}>
                        <View style={styles.studentInfo}>
                          <Text style={styles.studentName}>{student.name}</Text>
                          <Text style={styles.studentRoll}>{student.rollNo} • {student.className}</Text>
                        </View>
                        <Text style={[styles.percentage, { color: COLORS.danger }]}>
                          {student.attendancePercent.toFixed(1)}%
                        </Text>
                      </View>
                    ))
                  )}
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  headerSection: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
    marginBottom: SPACING.sm
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: SPACING.xs
  },
  headerSubtitle: {
    fontSize: FONTS.sizes.md,
    color: COLORS.darkGray,
    lineHeight: 22
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.md,
    padding: SPACING.sm,
    gap: SPACING.sm,
    borderRadius: 12,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: SPACING.sm,
    borderRadius: 8,
    backgroundColor: COLORS.lightGray
  },
  tabActive: {
    backgroundColor: COLORS.primary
  },
  tabText: {
    fontSize: FONTS.sizes.xs,
    fontWeight: '600',
    color: COLORS.darkGray
  },
  tabTextActive: {
    color: COLORS.white
  },
  content: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xl
  },
  loadingContainer: {
    paddingTop: SPACING.xl
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.lg
  },
  statBox: {
    flex: 1,
    padding: SPACING.lg,
    borderRadius: 12,
    alignItems: 'center'
  },
  statValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: SPACING.xs
  },
  statLabel: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.white,
    fontWeight: '600'
  },
  section: {
    marginBottom: SPACING.lg
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md
  },
  sectionTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: 'bold',
    color: COLORS.text
  },
  sectionCount: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.darkGray,
    fontWeight: '600'
  },
  studentCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  studentInfo: {
    flex: 1
  },
  studentName: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs
  },
  studentRoll: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.darkGray
  },
  studentStats: {
    alignItems: 'flex-end',
    gap: SPACING.xs
  },
  percentage: {
    fontSize: FONTS.sizes.lg,
    fontWeight: 'bold',
    color: COLORS.accent
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 12
  },
  badgeGreen: {
    backgroundColor: COLORS.accent
  },
  badgeRed: {
    backgroundColor: COLORS.danger
  },
  statusText: {
    fontSize: FONTS.sizes.xs,
    fontWeight: 'bold',
    color: COLORS.white
  },
  emptyState: {
    alignItems: 'center',
    padding: SPACING.xl,
    backgroundColor: COLORS.white,
    borderRadius: 12
  },
  emptyText: {
    fontSize: FONTS.sizes.lg,
    fontWeight: 'bold',
    color: COLORS.accent,
    marginTop: SPACING.md
  },
  emptySubtext: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.darkGray,
    marginTop: SPACING.xs
  },
  absentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.sm,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.danger,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  absentInfo: {
    flex: 1
  },
  absentName: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4
  },
  absentDetails: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.darkGray
  },
  subjectCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.sm,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.danger,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  }
});
