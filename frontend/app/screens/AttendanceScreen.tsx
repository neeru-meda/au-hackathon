import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONTS } from '../utils/theme';
import { studentAPI, attendanceAPI } from '../utils/api';
import { format } from 'date-fns';

export default function AttendanceScreen() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [subject, setSubject] = useState('Math');
  const [period, setPeriod] = useState('1');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [attendance, setAttendance] = useState<{ [key: string]: string }>({});

  const subjects = ['Math', 'DBMS', 'OS'];
  const periods = ['1', '2', '3', '4', '5', '6'];

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const data = await studentAPI.getAll();
      setStudents(data.students);
      // Initialize all as Present
      const initialAttendance: any = {};
      data.students.forEach((s: any) => {
        initialAttendance[s.rollNo] = 'Present';
      });
      setAttendance(initialAttendance);
    } catch (error) {
      console.error('Failed to fetch students:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAttendance = (rollNo: string) => {
    setAttendance(prev => ({
      ...prev,
      [rollNo]: prev[rollNo] === 'Present' ? 'Absent' : 'Present'
    }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const attendanceList = students.map(s => ({
        rollNo: s.rollNo,
        name: s.name,
        status: attendance[s.rollNo] || 'Present'
      }));

      await attendanceAPI.submit({
        date,
        subject,
        period,
        markedBy: 'teacher',
        attendance: attendanceList
      });

      Alert.alert('Success', 'Attendance submitted successfully!', [
        {
          text: 'OK',
          onPress: () => {
            // Reset to all Present
            const reset: any = {};
            students.forEach(s => {
              reset[s.rollNo] = 'Present';
            });
            setAttendance(reset);
            fetchStudents(); // Refresh to see updated percentages
          }
        }
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit attendance');
    } finally {
      setSubmitting(false);
    }
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
        <Text style={styles.headerTitle}>Mark Attendance</Text>
        <Text style={styles.headerSubtitle}>Date: {format(new Date(date), 'dd MMM yyyy')}</Text>
      </View>

      <View style={styles.controls}>
        <View style={styles.dropdownContainer}>
          <Text style={styles.label}>Subject</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chipGroup}>
              {subjects.map(sub => (
                <TouchableOpacity
                  key={sub}
                  style={[
                    styles.chip,
                    subject === sub && styles.chipActive
                  ]}
                  onPress={() => setSubject(sub)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      subject === sub && styles.chipTextActive
                    ]}
                  >
                    {sub}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        <View style={styles.dropdownContainer}>
          <Text style={styles.label}>Period</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chipGroup}>
              {periods.map(p => (
                <TouchableOpacity
                  key={p}
                  style={[
                    styles.chip,
                    period === p && styles.chipActive
                  ]}
                  onPress={() => setPeriod(p)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      period === p && styles.chipTextActive
                    ]}
                  >
                    Period {p}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>

      <ScrollView style={styles.studentList}>
        {students.map(student => {
          const isAbsent = attendance[student.rollNo] === 'Absent';
          return (
            <TouchableOpacity
              key={student.rollNo}
              style={[
                styles.studentCard,
                isAbsent && styles.studentCardAbsent
              ]}
              onPress={() => toggleAttendance(student.rollNo)}
            >
              <View style={styles.studentInfo}>
                <Text style={styles.studentName}>{student.name}</Text>
                <Text style={styles.studentRoll}>{student.rollNo}</Text>
              </View>
              <View style={styles.statusContainer}>
                <Text
                  style={[
                    styles.statusText,
                    isAbsent && styles.statusTextAbsent
                  ]}
                >
                  {attendance[student.rollNo]}
                </Text>
                <Ionicons
                  name={isAbsent ? 'close-circle' : 'checkmark-circle'}
                  size={32}
                  color={isAbsent ? COLORS.danger : COLORS.accent}
                />
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <TouchableOpacity
        style={styles.submitButton}
        onPress={handleSubmit}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color={COLORS.white} />
        ) : (
          <Text style={styles.submitButtonText}>Submit Attendance</Text>
        )}
      </TouchableOpacity>
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
  controls: {
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border
  },
  dropdownContainer: {
    marginBottom: SPACING.md
  },
  label: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs
  },
  chipGroup: {
    flexDirection: 'row',
    gap: SPACING.sm
  },
  chip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary
  },
  chipText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.text,
    fontWeight: '600'
  },
  chipTextActive: {
    color: COLORS.white
  },
  studentList: {
    flex: 1,
    padding: SPACING.md
  },
  studentCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.sm,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.accent,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  studentCardAbsent: {
    backgroundColor: '#FFEBEE',
    borderLeftColor: COLORS.danger
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
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm
  },
  statusText: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: COLORS.accent
  },
  statusTextAbsent: {
    color: COLORS.danger
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    margin: SPACING.md,
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 56,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4
  },
  submitButtonText: {
    fontSize: FONTS.sizes.lg,
    fontWeight: 'bold',
    color: COLORS.white
  }
});