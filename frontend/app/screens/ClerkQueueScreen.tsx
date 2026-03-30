import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONTS, SHADOWS } from '../utils/theme';
import { letterAPI } from '../utils/api';
import { useFocusEffect } from 'expo-router';

export default function ClerkQueueScreen() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadRequests = async () => {
    try {
      const data = await letterAPI.getRequests();
      const approved = (data.requests || []).filter((r: any) => r.status === 'Approved');
      setRequests(approved);
    } catch (error) {
      console.error('Failed to load requests:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadRequests();
    }, [])
  );

  const handlePrint = async (req: any) => {
    setActionLoading(req.requestId);
    try {
      const result = await letterAPI.generateFull(req.rollNo, req.docType, req.requestId);
      if (result.html) {
        Alert.alert('Success', `Certificate generated: ${result.filename}\nVerify Token: ${result.verifyToken}`);
      }
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.detail || 'Failed to generate');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCollected = async (req: any) => {
    setActionLoading(req.requestId);
    try {
      await letterAPI.updateRequest(req.requestId, { collectedAt: new Date().toISOString() });
      setRequests(prev => prev.map(r =>
        r.requestId === req.requestId ? { ...r, collectedAt: new Date().toISOString() } : r
      ));
    } catch (error: any) {
      Alert.alert('Error', 'Failed to mark as collected');
    } finally {
      setActionLoading(null);
    }
  };

  const formatTime = (ts: string) => {
    if (!ts) return '';
    const d = new Date(ts);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Print Queue</Text>
        <Text style={styles.headerSubtitle}>{requests.length} approved certificate(s)</Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadRequests(); }} colors={[COLORS.primary]} />}
      >
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : requests.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="print-outline" size={64} color={COLORS.gray} />
            <Text style={styles.emptyText}>No certificates in print queue</Text>
          </View>
        ) : (
          requests.map((req) => (
            <View key={req.requestId} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardName}>{req.studentName}</Text>
                  <Text style={styles.cardRoll}>{req.rollNo}</Text>
                </View>
                {req.collectedAt ? (
                  <View style={styles.collectedBadge}>
                    <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                    <Text style={styles.collectedText}>Collected</Text>
                  </View>
                ) : (
                  <View style={styles.approvedBadge}>
                    <Text style={styles.approvedText}>Approved</Text>
                  </View>
                )}
              </View>

              <View style={styles.cardMeta}>
                <View style={styles.metaItem}>
                  <Ionicons name="document-text-outline" size={14} color={COLORS.darkGray} />
                  <Text style={styles.metaText}>{req.docType}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="checkmark-done-outline" size={14} color={COLORS.success} />
                  <Text style={styles.metaText}>Approved by HOD</Text>
                </View>
                {req.reviewedAt && (
                  <View style={styles.metaItem}>
                    <Ionicons name="time-outline" size={14} color={COLORS.darkGray} />
                    <Text style={styles.metaText}>{formatTime(req.reviewedAt)}</Text>
                  </View>
                )}
              </View>

              {!req.collectedAt && (
                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={styles.printBtn}
                    onPress={() => handlePrint(req)}
                    disabled={actionLoading === req.requestId}
                  >
                    {actionLoading === req.requestId ? (
                      <ActivityIndicator color={COLORS.white} size="small" />
                    ) : (
                      <>
                        <Ionicons name="download-outline" size={16} color={COLORS.white} />
                        <Text style={styles.printBtnText}>Download & Print</Text>
                      </>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.collectBtn}
                    onPress={() => handleCollected(req)}
                    disabled={actionLoading === req.requestId}
                  >
                    <Ionicons name="checkmark" size={16} color={COLORS.success} />
                    <Text style={styles.collectBtnText}>Mark Collected</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))
        )}
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
  emptyText: { fontSize: FONTS.sizes.md, color: COLORS.darkGray, marginTop: 12 },
  card: {
    backgroundColor: COLORS.white, borderRadius: 14, padding: SPACING.md,
    marginBottom: 12, ...SHADOWS.small
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  cardName: { fontSize: FONTS.sizes.lg, fontWeight: 'bold', color: COLORS.text },
  cardRoll: { fontSize: FONTS.sizes.sm, color: COLORS.darkGray },
  approvedBadge: {
    backgroundColor: '#E8F5E9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12
  },
  approvedText: { color: COLORS.success, fontSize: 12, fontWeight: '600' },
  collectedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#E8F5E9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12
  },
  collectedText: { color: COLORS.success, fontSize: 12, fontWeight: '600' },
  cardMeta: { gap: 6, marginBottom: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: FONTS.sizes.sm, color: COLORS.darkGray },
  cardActions: { flexDirection: 'row', gap: 8 },
  printBtn: {
    flex: 1, backgroundColor: COLORS.primary, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 10, borderRadius: 8, minHeight: 44
  },
  printBtnText: { color: COLORS.white, fontWeight: '600', fontSize: FONTS.sizes.sm },
  collectBtn: {
    flex: 1, borderWidth: 1, borderColor: COLORS.success, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 10, borderRadius: 8, minHeight: 44
  },
  collectBtnText: { color: COLORS.success, fontWeight: '600', fontSize: FONTS.sizes.sm }
});
