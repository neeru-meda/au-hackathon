import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, SPACING, FONTS } from '../utils/theme';
import { studentAPI, analyticsAPI } from '../utils/api';
import { useUser } from '../utils/UserContext';

export default function DashboardScreen() {
  const router = useRouter();
  const { user, logout } = useUser();
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

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            logout();
            router.replace('/');
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size=\"large\" color={COLORS.primary} />
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
        <View>
          <Text style={styles.headerTitle}>Dashboard</Text>
          <Text style={styles.headerSubtitle}>Welcome, {user?.name || 'User'}</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name=\"log-out-outline\" size={24} color={COLORS.primary} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: COLORS.primary }]}>
          <Ionicons name=\"people\" size={32} color={COLORS.white} />
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total Students</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: COLORS.accent }]}>
          <Ionicons name=\"checkmark-circle\" size={32} color={COLORS.white} />
          <Text style={styles.statValue}>{stats.eligible}</Text>
          <Text style={styles.statLabel}>Eligible</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: COLORS.danger }]}>
          <Ionicons name=\"alert-circle\" size={32} color={COLORS.white} />
          <Text style={styles.statValue}>{stats.shortage}</Text>
          <Text style={styles.statLabel}>Shortage</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: COLORS.secondary }]}>
          <Ionicons name=\"bar-chart\" size={32} color={COLORS.white} />
          <Text style={styles.statValue}>{stats.avgAttendance}%</Text>
          <Text style={styles.statLabel}>Avg Attendance</Text>
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
    marginBottom: SPACING.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
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
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    padding: SPACING.sm,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  logoutText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    color: COLORS.primary
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
  }
});
