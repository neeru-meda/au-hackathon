import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONTS } from '../utils/theme';
import { alertAPI } from '../utils/api';

export default function AlertsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [sending, setSending] = useState<string | null>(null);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const data = await alertAPI.getAll();
      setAlerts(data.alerts);
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAlerts();
    setRefreshing(false);
  };

  const handleSendAlert = async (alertId: string, studentName: string) => {
    Alert.alert(
      'Send Alert',
      `Send attendance shortage alert to ${studentName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: async () => {
            setSending(alertId);
            try {
              await alertAPI.send(alertId);
              Alert.alert('Success', `Alert sent to ${studentName}!`);
              fetchAlerts(); // Refresh list
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to send alert');
            } finally {
              setSending(null);
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Alerts</Text>
        <Text style={styles.headerSubtitle}>
          {alerts.filter(a => a.status === 'Pending').length} Pending Alerts
        </Text>
      </View>

      {alerts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="checkmark-circle-outline" size={80} color={COLORS.accent} />
          <Text style={styles.emptyTitle}>All Good!</Text>
          <Text style={styles.emptyText}>
            No attendance shortage alerts at the moment.
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {alerts.map(alert => (
            <View
              key={alert.alert_id}
              style={[
                styles.alertCard,
                alert.status === 'Sent' && styles.alertCardSent
              ]}
            >
              <View style={styles.alertHeader}>
                <View style={styles.alertIcon}>
                  <Ionicons
                    name={alert.status === 'Sent' ? 'mail' : 'alert-circle'}
                    size={24}
                    color={alert.status === 'Sent' ? COLORS.darkGray : COLORS.danger}
                  />
                </View>
                <View style={styles.alertInfo}>
                  <Text style={styles.alertName}>{alert.name}</Text>
                  <Text style={styles.alertRoll}>{alert.rollNo}</Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    alert.status === 'Sent' ? styles.statusBadgeSent : styles.statusBadgePending
                  ]}
                >
                  <Text style={styles.statusBadgeText}>{alert.status}</Text>
                </View>
              </View>

              <View style={styles.alertContent}>
                <View style={styles.attendanceInfo}>
                  <Ionicons name="bar-chart" size={20} color={COLORS.danger} />
                  <Text style={styles.attendanceLabel}>Attendance:</Text>
                  <Text style={styles.attendanceValue}>
                    {alert.attendancePercent.toFixed(1)}%
                  </Text>
                  <View style={styles.shortageTag}>
                    <Text style={styles.shortageTagText}>Below 75%</Text>
                  </View>
                </View>

                {alert.status === 'Pending' && (
                  <TouchableOpacity
                    style={styles.sendButton}
                    onPress={() => handleSendAlert(alert.alert_id, alert.name)}
                    disabled={sending === alert.alert_id}
                  >
                    {sending === alert.alert_id ? (
                      <ActivityIndicator size="small" color={COLORS.white} />
                    ) : (
                      <>
                        <Ionicons name="send" size={18} color={COLORS.white} />
                        <Text style={styles.sendButtonText}>Send Alert</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}

                {alert.status === 'Sent' && alert.sent_at && (
                  <View style={styles.sentInfo}>
                    <Ionicons name="checkmark-circle" size={16} color={COLORS.accent} />
                    <Text style={styles.sentText}>
                      Sent on {new Date(alert.sent_at).toLocaleDateString()}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background
  },
  header: {
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border
  },
  headerTitle: {
    fontSize: FONTS.sizes.xl,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: SPACING.xs
  },
  headerSubtitle: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.darkGray
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl
  },
  emptyTitle: {
    fontSize: FONTS.sizes.xl,
    fontWeight: 'bold',
    color: COLORS.accent,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm
  },
  emptyText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.darkGray,
    textAlign: 'center'
  },
  list: {
    flex: 1
  },
  listContent: {
    padding: SPACING.md
  },
  alertCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.danger,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  alertCardSent: {
    borderLeftColor: COLORS.darkGray,
    opacity: 0.7
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md
  },
  alertIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFEBEE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm
  },
  alertInfo: {
    flex: 1
  },
  alertName: {
    fontSize: FONTS.sizes.md,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs
  },
  alertRoll: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.darkGray
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 12
  },
  statusBadgePending: {
    backgroundColor: COLORS.warning
  },
  statusBadgeSent: {
    backgroundColor: COLORS.accent
  },
  statusBadgeText: {
    fontSize: FONTS.sizes.xs,
    fontWeight: 'bold',
    color: COLORS.white
  },
  alertContent: {
    gap: SPACING.md
  },
  attendanceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.sm,
    backgroundColor: '#FFEBEE',
    borderRadius: 8
  },
  attendanceLabel: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.text
  },
  attendanceValue: {
    fontSize: FONTS.sizes.md,
    fontWeight: 'bold',
    color: COLORS.danger
  },
  shortageTag: {
    marginLeft: 'auto',
    backgroundColor: COLORS.danger,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: 8
  },
  shortageTagText: {
    fontSize: FONTS.sizes.xs,
    fontWeight: 'bold',
    color: COLORS.white
  },
  sendButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    minHeight: 44
  },
  sendButtonText: {
    fontSize: FONTS.sizes.md,
    fontWeight: 'bold',
    color: COLORS.white
  },
  sentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    padding: SPACING.sm,
    backgroundColor: COLORS.lightGray,
    borderRadius: 8
  },
  sentText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.darkGray
  }
});