import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONTS } from '../utils/theme';
import { studentAPI, analyticsAPI } from '../utils/api';

export default function DashboardScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    eligible: 0,
    shortage: 0,
    avgAttendance: 0
  });

  const fetchStats = async () => {
    try {
      const data = await analyticsAPI.semesterWise();
      const avg =
        data.students.reduce((sum: number, s: any) => sum + s.attendancePercent, 0) /
        data.students.length;
      setStats({
        total: data.total,
        eligible: data.eligible,
        shortage: data.shortage,
        avgAttendance: Math.round(avg * 10) / 10
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dashboard</Text>
        <Text style={styles.headerSubtitle}>AU CSSE Smart Utility</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: COLORS.primary }]}>
          <Ionicons name="people" size={32} color={COLORS.white} />
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total Students</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: COLORS.accent }]}>
          <Ionicons name="checkmark-circle" size={32} color={COLORS.white} />
          <Text style={styles.statValue}>{stats.eligible}</Text>
          <Text style={styles.statLabel}>Eligible</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: COLORS.danger }]}>
          <Ionicons name="alert-circle" size={32} color={COLORS.white} />
          <Text style={styles.statValue}>{stats.shortage}</Text>
          <Text style={styles.statLabel}>Shortage</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: COLORS.secondary }]}>
          <Ionicons name="bar-chart" size={32} color={COLORS.white} />
          <Text style={styles.statValue}>{stats.avgAttendance}%</Text>
          <Text style={styles.statLabel}>Avg Attendance</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionCard}>
            <Ionicons name="calendar" size={40} color={COLORS.primary} />
            <Text style={styles.actionText}>Mark Attendance</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <Ionicons name="people-outline" size={40} color={COLORS.accent} />
            <Text style={styles.actionText}>View Students</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <Ionicons name="notifications-outline" size={40} color={COLORS.danger} />
            <Text style={styles.actionText}>Send Alerts</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <Ionicons name="document-text-outline" size={40} color={COLORS.secondary} />
            <Text style={styles.actionText}>Generate Letter</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.infoCard}>
        <Ionicons name="information-circle" size={24} color={COLORS.primary} />
        <View style={styles.infoText}>
          <Text style={styles.infoTitle}>Business Rule Active</Text>
          <Text style={styles.infoDescription}>
            Students with attendance below 75% are automatically marked as "Shortage" and added to
            alert list.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  content: {
    padding: SPACING.md
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background
  },
  header: {
    marginBottom: SPACING.lg
  },
  headerTitle: {
    fontSize: FONTS.sizes.xxxl,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: SPACING.xs
  },
  headerSubtitle: {
    fontSize: FONTS.sizes.md,
    color: COLORS.darkGray
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginBottom: SPACING.lg
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    padding: SPACING.lg,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  statValue: {
    fontSize: FONTS.sizes.xxxl,
    fontWeight: 'bold',
    color: COLORS.white,
    marginTop: SPACING.sm
  },
  statLabel: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.white,
    marginTop: SPACING.xs
  },
  section: {
    marginBottom: SPACING.lg
  },
  sectionTitle: {
    fontSize: FONTS.sizes.xl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.md
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md
  },
  actionCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  actionText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.text,
    marginTop: SPACING.sm,
    textAlign: 'center',
    fontWeight: '600'
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  infoText: {
    flex: 1,
    marginLeft: SPACING.md
  },
  infoTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs
  },
  infoDescription: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.darkGray,
    lineHeight: 20
  }
});