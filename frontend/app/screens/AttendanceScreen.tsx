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
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, FONTS } from '../utils/theme';
import { studentAPI, attendanceAPI } from '../utils/api';
import { format } from 'date-fns';
import CustomDropdown from '../components/CustomDropdown';

export default function AttendanceScreen() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState('Class A');
  const [subject, setSubject] = useState('');
  const [period, setPeriod] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [attendance, setAttendance] = useState<{ [key: string]: string }>({});

  const classes = ['Class A', 'Class B', 'Class C', 'Class D'];
  const subjects = ['Math', 'DBMS', 'OS', 'CN', 'SE'];
  const periods = ['Period 1', 'Period 2', 'Period 3', 'Period 4', 'Period 5', 'Period 6'];

  useEffect(() => {
    fetchStudents();
  }, [selectedClass]);

  const fetchStudents = async () => {
    try {
      const data = await studentAPI.getAll();
      const classStudents = data.students.filter((s: any) => s.className === selectedClass);
      setStudents(classStudents);
      // Initialize all as Absent
      const initialAttendance: any = {};
      classStudents.forEach((s: any) => {
        initialAttendance[s.rollNo] = 'Absent';
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
    if (!subject || !period) {
      Alert.alert('Error', 'Please select subject and period');
      return;
    }

    setSubmitting(true);
    try {
      const attendanceList = students.map(s => ({
        rollNo: s.rollNo,
        name: s.name,
        status: attendance[s.rollNo] || 'Absent'
      }));

      await attendanceAPI.submit({
        date,
        className: selectedClass,
        subject,
        period: period.split(' ')[1], // Extract number from "Period 1"
        markedBy: 'teacher',
        attendance: attendanceList
      });

      Alert.alert('Success', 'Attendance submitted successfully!', [
        {
          text: 'OK',
          onPress: () => {
            fetchStudents();
          }
        }
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit attendance');
    } finally {
      setSubmitting(false);
    }
  };

  const presentCount = Object.values(attendance).filter(s => s === 'Present').length;
  const absentCount = students.length - presentCount;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size='large' color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Take Attendance</Text>
          <Text style={styles.headerSubtitle}>Mark student attendance for today's class</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.controlsRow}>
            <CustomDropdown
              label="Class"
              value={selectedClass}
              options={classes}
              onSelect={setSelectedClass}
              placeholder="Select Class"
            />
            <CustomDropdown
              label="Subject"
              value={subject}
              options={subjects}
              onSelect={setSubject}
              placeholder="Select Subject"
            />
          </View>

          <View style={styles.controlsRow}>
            <View style={styles.dateContainer}>
              <Text style={styles.label}>Date</Text>
              <View style={styles.dateBox}>
                <Ionicons name="calendar-outline" size={20} color={COLORS.darkGray} />
                <Text style={styles.dateText}>{format(new Date(date), 'dd-MM-yyyy')}</Text>
              </View>
            </View>
            <CustomDropdown
              label="Period"
              value={period}
              options={periods}
              onSelect={setPeriod}
              placeholder="Select Period"
            />
          </View>

          <View style={styles.summaryRow}>
            <View style={[styles.summaryBox, { backgroundColor: COLORS.accent }]}>
              <Text style={styles.summaryText}>Present: {presentCount}</Text>
            </View>
            <View style={[styles.summaryBox, { backgroundColor: COLORS.danger }]}>
              <Text style={styles.summaryText}>Absent: {absentCount}</Text>
            </View>
          </View>
        </View>

        <View style={styles.studentSection}>
          <Text style={styles.sectionTitle}>Students ({students.length})</Text>
          {students.map(student => {
            const isPresent = attendance[student.rollNo] === 'Present';
            return (
              <TouchableOpacity
                key={student.rollNo}
                style={[
                  styles.studentCard,
                  isPresent && styles.studentCardPresent
                ]}
                onPress={() => toggleAttendance(student.rollNo)}
              >
                <View style={styles.studentInfo}>
                  <Text style={styles.studentName}>{student.name}</Text>
                  <Text style={styles.studentRoll}>{student.rollNo}</Text>
                </View>
                <View style={styles.statusContainer}>
                  <View
                    style={[
                      styles.statusBadge,
                      isPresent ? styles.statusBadgePresent : styles.statusBadgeAbsent
                    ]}
                  >
                    <Text style={styles.statusBadgeText}>
                      {attendance[student.rollNo]}
                    </Text>
                  </View>
                  <Ionicons
                    name={isPresent ? 'checkmark-circle' : 'close-circle'}
                    size={28}
                    color={isPresent ? COLORS.accent : COLORS.danger}
                  />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

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
      </ScrollView>
    </SafeAreaView>
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
    padding: SPACING.lg,
    paddingTop: SPACING.md
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs
  },
  headerSubtitle: {
    fontSize: FONTS.sizes.md,
    color: COLORS.darkGray
  },
  card: {
    backgroundColor: COLORS.white,
    margin: SPACING.md,
    padding: SPACING.lg,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3
  },
  controlsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.md
  },
  dateContainer: {
    flex: 1
  },
  label: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs
  },
  dateBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: SPACING.md,
    minHeight: 50
  },
  dateText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.text
  },
  summaryRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.md
  },
  summaryBox: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: 8,
    alignItems: 'center'
  },
  summaryText: {
    fontSize: FONTS.sizes.md,
    fontWeight: 'bold',
    color: COLORS.white
  },
  studentSection: {
    padding: SPACING.md
  },
  sectionTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.md
  },
  studentCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.sm,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.danger
  },
  studentCardPresent: {
    backgroundColor: COLORS.white,
    borderLeftColor: COLORS.accent
  },
  studentInfo: {
    flex: 1
  },
  studentName: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4
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
  statusBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: 16,
    minWidth: 80,
    alignItems: 'center'
  },
  statusBadgePresent: {
    backgroundColor: COLORS.accent
  },
  statusBadgeAbsent: {
    backgroundColor: COLORS.danger
  },
  statusBadgeText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: 'bold',
    color: COLORS.white
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    margin: SPACING.md,
    marginTop: 0,
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
