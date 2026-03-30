import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONTS, SHADOWS } from '../utils/theme';
import { studentAPI, letterAPI } from '../utils/api';

export default function ClerkScanScreen() {
  const [rollNo, setRollNo] = useState('');
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [requestSent, setRequestSent] = useState(false);

  const fetchStudent = async () => {
    if (!rollNo.trim()) {
      Alert.alert('Error', 'Please enter a roll number');
      return;
    }
    setLoading(true);
    setStudent(null);
    setRequestSent(false);
    try {
      const data = await studentAPI.getByRollNo(rollNo.trim());
      setStudent(data);
    } catch (error: any) {
      const msg = error?.response?.data?.detail || 'Student not found';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const requestCertificate = async (docType: string) => {
    if (!student) return;
    setRequesting(true);
    try {
      await letterAPI.createRequest(student.rollNo, docType);
      setRequestSent(true);
      Alert.alert('Success', 'Request sent to HOD for approval');
    } catch (error: any) {
      const msg = error?.response?.data?.detail || 'Request failed';
      Alert.alert('Error', msg);
    } finally {
      setRequesting(false);
    }
  };

  const resetScreen = () => {
    setRollNo('');
    setStudent(null);
    setRequestSent(false);
  };

  const isEligible = student && student.attendancePercent >= 75 && !student.hasOutstandingDues;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Scan & Generate</Text>
        <Text style={styles.headerSubtitle}>Clerk Office</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Mode Toggle */}
        <View style={styles.modeCard}>
          <View style={styles.modeToggle}>
            <View style={[styles.modeBtn, styles.modeBtnActive]}>
              <Ionicons name="create-outline" size={18} color={COLORS.white} />
              <Text style={styles.modeBtnTextActive}>Manual Entry</Text>
            </View>
            <View style={styles.modeBtn}>
              <Ionicons name="barcode-outline" size={18} color={COLORS.darkGray} />
              <Text style={styles.modeBtnText}>Scan ID</Text>
            </View>
          </View>
          <Text style={styles.modeNote}>Barcode scanning available on mobile device</Text>
        </View>

        {/* Manual Entry */}
        <View style={styles.inputCard}>
          <Text style={styles.label}>Roll Number</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={rollNo}
              onChangeText={setRollNo}
              placeholder="Enter Roll Number (e.g. R001)"
              placeholderTextColor={COLORS.darkGray}
              autoCapitalize="characters"
            />
            <TouchableOpacity
              style={styles.fetchBtn}
              onPress={fetchStudent}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} size="small" />
              ) : (
                <Text style={styles.fetchBtnText}>Fetch</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Student Card */}
        {student && (
          <View style={styles.studentCard}>
            <View style={styles.studentHeader}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>{student.name?.charAt(0)}</Text>
              </View>
              <View style={styles.studentInfo}>
                <Text style={styles.studentName}>{student.name}</Text>
                <Text style={styles.studentRoll}>{student.rollNo}</Text>
              </View>
            </View>

            <View style={styles.detailsGrid}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Course</Text>
                <Text style={styles.detailValue}>{student.course}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Semester</Text>
                <Text style={styles.detailValue}>{student.semester}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Attendance</Text>
                <Text style={[
                  styles.detailValue,
                  { color: student.attendancePercent >= 75 ? COLORS.success : COLORS.danger }
                ]}>{student.attendancePercent}%</Text>
              </View>
            </View>

            {/* Eligibility Check */}
            {student.attendancePercent < 75 && (
              <View style={styles.blockBanner}>
                <Ionicons name="close-circle" size={20} color={COLORS.white} />
                <Text style={styles.blockText}>Not eligible — Attendance {student.attendancePercent}%</Text>
              </View>
            )}
            {student.hasOutstandingDues && (
              <View style={styles.blockBanner}>
                <Ionicons name="close-circle" size={20} color={COLORS.white} />
                <Text style={styles.blockText}>Outstanding dues on record</Text>
              </View>
            )}

            {/* Certificate Buttons */}
            {isEligible && !requestSent && (
              <View style={styles.certGrid}>
                {[
                  'Bonafide Certificate',
                  'Study Certificate',
                  'Loan Estimation Letter',
                  'Internship Permission Letter'
                ].map((docType) => (
                  <TouchableOpacity
                    key={docType}
                    style={styles.certBtn}
                    onPress={() => requestCertificate(docType)}
                    disabled={requesting}
                  >
                    {requesting ? (
                      <ActivityIndicator color={COLORS.white} size="small" />
                    ) : (
                      <>
                        <Ionicons name="document-text" size={20} color={COLORS.white} />
                        <Text style={styles.certBtnText}>{docType}</Text>
                      </>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {requestSent && (
              <View style={styles.successBanner}>
                <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
                <Text style={styles.successText}>Request sent to HOD for approval</Text>
              </View>
            )}

            {/* Scan Another */}
            <TouchableOpacity style={styles.resetBtn} onPress={resetScreen}>
              <Ionicons name="refresh" size={18} color={COLORS.primary} />
              <Text style={styles.resetBtnText}>Scan Another</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg
  },
  headerTitle: { fontSize: FONTS.sizes.xxl, fontWeight: 'bold', color: COLORS.white },
  headerSubtitle: { fontSize: FONTS.sizes.sm, color: '#FFCCCC', marginTop: 2 },
  content: { flex: 1 },
  contentContainer: { padding: SPACING.lg, paddingBottom: 100 },
  modeCard: {
    backgroundColor: COLORS.white, borderRadius: 12, padding: SPACING.md,
    marginBottom: SPACING.md, ...SHADOWS.small
  },
  modeToggle: { flexDirection: 'row', gap: 8 },
  modeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: 8, backgroundColor: COLORS.lightGray
  },
  modeBtnActive: { backgroundColor: COLORS.primary },
  modeBtnText: { fontSize: FONTS.sizes.sm, color: COLORS.darkGray, fontWeight: '600' },
  modeBtnTextActive: { fontSize: FONTS.sizes.sm, color: COLORS.white, fontWeight: '600' },
  modeNote: { fontSize: 11, color: COLORS.darkGray, textAlign: 'center', marginTop: 8 },
  inputCard: {
    backgroundColor: COLORS.white, borderRadius: 12, padding: SPACING.md,
    marginBottom: SPACING.md, ...SHADOWS.small
  },
  label: { fontSize: FONTS.sizes.md, fontWeight: '600', color: COLORS.text, marginBottom: 8 },
  inputRow: { flexDirection: 'row', gap: 8 },
  input: {
    flex: 1, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10,
    padding: 12, fontSize: FONTS.sizes.md, backgroundColor: COLORS.white, color: COLORS.text
  },
  fetchBtn: {
    backgroundColor: COLORS.primary, paddingHorizontal: 20, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', minHeight: 48
  },
  fetchBtnText: { color: COLORS.white, fontWeight: 'bold', fontSize: FONTS.sizes.md },
  studentCard: {
    backgroundColor: COLORS.white, borderRadius: 16, padding: SPACING.lg,
    ...SHADOWS.medium
  },
  studentHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md },
  avatarCircle: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center'
  },
  avatarText: { fontSize: FONTS.sizes.xl, fontWeight: 'bold', color: COLORS.white },
  studentInfo: { marginLeft: 14, flex: 1 },
  studentName: { fontSize: FONTS.sizes.lg, fontWeight: 'bold', color: COLORS.text },
  studentRoll: { fontSize: FONTS.sizes.sm, color: COLORS.darkGray, marginTop: 2 },
  detailsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12,
    marginBottom: SPACING.md, paddingBottom: SPACING.md,
    borderBottomWidth: 1, borderBottomColor: COLORS.border
  },
  detailItem: { flex: 1, minWidth: '30%' },
  detailLabel: { fontSize: 11, color: COLORS.darkGray, marginBottom: 2 },
  detailValue: { fontSize: FONTS.sizes.md, fontWeight: '600', color: COLORS.text },
  blockBanner: {
    backgroundColor: COLORS.danger, flexDirection: 'row', alignItems: 'center',
    gap: 8, padding: 12, borderRadius: 10, marginBottom: 10
  },
  blockText: { color: COLORS.white, fontWeight: '600', fontSize: FONTS.sizes.sm, flex: 1 },
  certGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4
  },
  certBtn: {
    backgroundColor: COLORS.primary, paddingVertical: 12, paddingHorizontal: 14,
    borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 6,
    width: '48%', minHeight: 48
  },
  certBtnText: { color: COLORS.white, fontSize: 12, fontWeight: '600', flex: 1 },
  successBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#E8F5E9', padding: 14, borderRadius: 10, marginTop: 8
  },
  successText: { color: COLORS.success, fontWeight: '600', fontSize: FONTS.sizes.sm },
  resetBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, marginTop: SPACING.md, paddingVertical: 12,
    borderWidth: 1, borderColor: COLORS.primary, borderRadius: 10
  },
  resetBtnText: { color: COLORS.primary, fontWeight: '600', fontSize: FONTS.sizes.md }
});
