import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, RefreshControl, Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONTS, SHADOWS } from '../utils/theme';
import { letterAPI, studentAPI } from '../utils/api';
import { useUser } from '../utils/UserContext';
import { useFocusEffect } from 'expo-router';

const DOC_TYPES = ['Bonafide Certificate', 'Study Certificate', 'Loan Estimation Letter', 'Internship Permission Letter'];

export default function StudentRequestsScreen() {
  const { user } = useUser();
  const [requests, setRequests] = useState<any[]>([]);
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      if (!user?.rollNo) return;
      const [reqData, stuData] = await Promise.all([
        letterAPI.getRequests(),
        studentAPI.getByRollNo(user.rollNo)
      ]);
      const myReqs = (reqData.requests || []).filter((r: any) => r.rollNo === user.rollNo);
      setRequests(myReqs);
      setStudent(stuData);
    } catch (error) {
      console.error('Failed to load data:', error);
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

  const submitRequest = async (docType: string) => {
    if (!user?.rollNo) return;
    setSubmitting(true);
    try {
      await letterAPI.createRequest(user.rollNo, docType);
      setShowModal(false);
      Alert.alert('Success', 'Submitted \u2014 HOD will review shortly');
      loadData();
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.detail || 'Request failed');
    } finally {
      setSubmitting(false);
    }
  };

  const pending = requests.filter(r => r.status === 'Queue');
  const approved = requests.filter(r => r.status === 'Approved');
  const rejected = requests.filter(r => r.status === 'Rejected');

  const formatTime = (ts: string) => {
    if (!ts) return '';
    const d = new Date(ts);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const isEligible = student && student.attendancePercent >= 75;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Requests</Text>
        <Text style={styles.headerSubtitle}>{user?.name} {'\u2022'} {user?.rollNo}</Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} colors={[COLORS.primary]} />}
      >
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* Request Button */}
            {isEligible && (
              <TouchableOpacity style={styles.requestBtn} onPress={() => setShowModal(true)}>
                <Ionicons name="add-circle" size={20} color={COLORS.white} />
                <Text style={styles.requestBtnText}>Request New Certificate</Text>
              </TouchableOpacity>
            )}
            {!isEligible && student && (
              <View style={styles.ineligibleBanner}>
                <Ionicons name="lock-closed" size={18} color={COLORS.danger} />
                <Text style={styles.ineligibleText}>Certificate requests require 75%+ attendance</Text>
              </View>
            )}

            {/* Pending */}
            {pending.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Pending ({pending.length})</Text>
                {pending.map(req => (
                  <View key={req.requestId} style={styles.card}>
                    <View style={styles.cardRow}>
                      <Ionicons name="time" size={20} color="#F59E0B" />
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={styles.cardDocType}>{req.docType}</Text>
                        <Text style={styles.cardStatus}>Awaiting HOD approval</Text>
                      </View>
                      <Text style={styles.cardDate}>{formatTime(req.requestedAt)}</Text>
                    </View>
                  </View>
                ))}
              </>
            )}

            {/* Approved */}
            {approved.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Approved ({approved.length})</Text>
                {approved.map(req => (
                  <View key={req.requestId} style={[styles.card, styles.cardApproved]}>
                    <View style={styles.cardRow}>
                      <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={styles.cardDocType}>{req.docType}</Text>
                        <Text style={[styles.cardStatus, { color: COLORS.success }]}>Ready {'\u2014'} collect from department office</Text>
                      </View>
                      <Text style={styles.cardDate}>{formatTime(req.reviewedAt)}</Text>
                    </View>
                  </View>
                ))}
              </>
            )}

            {/* Rejected */}
            {rejected.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Rejected ({rejected.length})</Text>
                {rejected.map(req => (
                  <View key={req.requestId} style={[styles.card, styles.cardRejected]}>
                    <View style={styles.cardRow}>
                      <Ionicons name="close-circle" size={20} color={COLORS.danger} />
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={styles.cardDocType}>{req.docType}</Text>
                        <Text style={[styles.cardStatus, { color: COLORS.danger, fontStyle: 'italic' }]}>
                          {req.rejectionReason || 'Rejected'}
                        </Text>
                      </View>
                      <Text style={styles.cardDate}>{formatTime(req.reviewedAt)}</Text>
                    </View>
                  </View>
                ))}
              </>
            )}

            {requests.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="document-text-outline" size={64} color={COLORS.gray} />
                <Text style={styles.emptyText}>No certificate requests yet</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Request Modal */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Request Certificate</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>Select certificate type</Text>
            {DOC_TYPES.map(dt => (
              <TouchableOpacity
                key={dt}
                style={styles.modalOption}
                onPress={() => submitRequest(dt)}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color={COLORS.primary} size="small" />
                ) : (
                  <>
                    <Ionicons name="document-text" size={20} color={COLORS.primary} />
                    <Text style={styles.modalOptionText}>{dt}</Text>
                    <Ionicons name="chevron-forward" size={18} color={COLORS.darkGray} />
                  </>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
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
  requestBtn: {
    backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8, padding: 14, borderRadius: 12, marginBottom: SPACING.lg
  },
  requestBtnText: { color: COLORS.white, fontWeight: 'bold', fontSize: FONTS.sizes.md },
  ineligibleBanner: {
    backgroundColor: '#FFEBEE', flexDirection: 'row', alignItems: 'center',
    gap: 8, padding: 12, borderRadius: 10, marginBottom: SPACING.lg
  },
  ineligibleText: { color: COLORS.danger, fontWeight: '600', fontSize: FONTS.sizes.sm },
  sectionTitle: {
    fontSize: FONTS.sizes.lg, fontWeight: 'bold', color: COLORS.primary,
    marginBottom: 10, marginTop: 8
  },
  card: {
    backgroundColor: COLORS.white, borderRadius: 12, padding: SPACING.md,
    marginBottom: 10, ...SHADOWS.small
  },
  cardApproved: { borderLeftWidth: 3, borderLeftColor: COLORS.success },
  cardRejected: { borderLeftWidth: 3, borderLeftColor: COLORS.danger },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  cardDocType: { fontSize: FONTS.sizes.md, fontWeight: '600', color: COLORS.text },
  cardStatus: { fontSize: FONTS.sizes.sm, color: COLORS.darkGray, marginTop: 2 },
  cardDate: { fontSize: 11, color: COLORS.darkGray },
  emptyState: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: FONTS.sizes.md, color: COLORS.darkGray, marginTop: 12 },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: COLORS.white, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: SPACING.lg, paddingBottom: 40
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 8
  },
  modalTitle: { fontSize: FONTS.sizes.xl, fontWeight: 'bold', color: COLORS.text },
  modalSubtitle: { fontSize: FONTS.sizes.sm, color: COLORS.darkGray, marginBottom: SPACING.md },
  modalOption: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border
  },
  modalOptionText: { flex: 1, fontSize: FONTS.sizes.md, color: COLORS.text }
});
