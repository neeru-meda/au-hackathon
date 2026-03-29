import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, FONTS } from '../utils/theme';
import { studentAPI } from '../utils/api';
import CustomDropdown from '../components/CustomDropdown';

export default function StudentsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const classes = ['All', 'Class A', 'Class B', 'Class C', 'Class D'];

  useEffect(() => {
    fetchStudents();
  }, [selectedClass]);

  useEffect(() => {
    filterStudents();
  }, [students, searchQuery]);

  const fetchStudents = async () => {
    try {
      const data = await studentAPI.getAll();
      if (selectedClass === 'All') {
        setStudents(data.students);
      } else {
        const filtered = data.students.filter((s: any) => s.className === selectedClass);
        setStudents(filtered);
      }
    } catch (error) {
      console.error('Failed to fetch students:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterStudents = () => {
    if (!searchQuery) {
      setFilteredStudents(students);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = students.filter(
      s =>
        s.name.toLowerCase().includes(query) ||
        s.rollNo.toLowerCase().includes(query)
    );
    setFilteredStudents(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStudents();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size='large' color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Students</Text>
        <Text style={styles.headerSubtitle}>View student details and attendance records</Text>
      </View>

      <View style={styles.controlsCard}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={COLORS.darkGray} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or roll number..."
            placeholderTextColor={COLORS.darkGray}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={COLORS.darkGray} />
            </TouchableOpacity>
          ) : null}
        </View>

        <CustomDropdown
          label="Filter by Class"
          value={selectedClass}
          options={classes}
          onSelect={setSelectedClass}
          placeholder="Select Class"
        />
      </View>

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.tableContainer}>
          <View style={styles.tableHeader}>
            <Text style={[styles.headerCell, styles.rollNoCell]}>Roll No</Text>
            <Text style={[styles.headerCell, styles.nameCell]}>Name</Text>
            <Text style={[styles.headerCell, styles.attendanceCell]}>Attend %</Text>
            <Text style={[styles.headerCell, styles.statusCell]}>Status</Text>
          </View>

          {filteredStudents.map((student, index) => (
            <View
              key={student.rollNo}
              style={[
                styles.tableRow,
                index % 2 === 0 && styles.tableRowEven
              ]}
            >
              <Text style={[styles.cell, styles.rollNoCell]} numberOfLines={1}>
                {student.rollNo}
              </Text>
              <View style={[styles.nameColumn, styles.nameCell]}>
                <Text style={styles.studentName} numberOfLines={1}>
                  {student.name}
                </Text>
                <Text style={styles.studentClass} numberOfLines={1}>
                  {student.className}
                </Text>
              </View>
              <Text
                style={[
                  styles.cell,
                  styles.attendanceCell,
                  styles.attendanceValue,
                  student.attendancePercent < 75 && styles.attendanceValueLow
                ]}
              >
                {student.attendancePercent.toFixed(0)}%
              </Text>
              <View style={[styles.statusColumn, styles.statusCell]}>
                <View
                  style={[
                    styles.statusPill,
                    student.status === 'Eligible' ? styles.statusPillGreen : styles.statusPillRed
                  ]}
                >
                  <Text style={styles.statusText}>{student.status}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {filteredStudents.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={64} color={COLORS.gray} />
            <Text style={styles.emptyText}>No students found</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery
                ? 'Try a different search term'
                : 'No students in this class'}
            </Text>
          </View>
        )}
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
  controlsCard: {
    backgroundColor: COLORS.white,
    margin: SPACING.md,
    padding: SPACING.lg,
    borderRadius: 12,
    gap: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    minHeight: 50
  },
  searchInput: {
    flex: 1,
    fontSize: FONTS.sizes.md,
    color: COLORS.text,
    padding: 0
  },
  list: {
    flex: 1
  },
  listContent: {
    padding: SPACING.md,
    paddingTop: 0
  },
  tableContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.border,
    minHeight: 56
  },
  headerCell: {
    fontSize: FONTS.sizes.md,
    fontWeight: 'bold',
    color: COLORS.text
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
    alignItems: 'center',
    minHeight: 80
  },
  tableRowEven: {
    backgroundColor: '#FAFAFA'
  },
  cell: {
    fontSize: FONTS.sizes.md,
    color: COLORS.text
  },
  rollNoCell: {
    width: '18%',
    paddingRight: SPACING.sm
  },
  nameCell: {
    width: '35%',
    paddingRight: SPACING.sm
  },
  nameColumn: {
    gap: 6
  },
  attendanceCell: {
    width: '17%',
    textAlign: 'center'
  },
  statusCell: {
    width: '30%'
  },
  statusColumn: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  studentName: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: COLORS.text
  },
  studentClass: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.darkGray
  },
  attendanceValue: {
    fontWeight: 'bold',
    color: COLORS.accent,
    fontSize: FONTS.sizes.lg
  },
  attendanceValueLow: {
    color: COLORS.danger
  },
  statusPill: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 16,
    minWidth: 85,
    alignItems: 'center'
  },
  statusPillGreen: {
    backgroundColor: COLORS.accent
  },
  statusPillRed: {
    backgroundColor: COLORS.danger
  },
  statusText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: 'bold',
    color: COLORS.white
  },
  emptyState: {
    alignItems: 'center',
    padding: SPACING.xl,
    marginTop: SPACING.xl
  },
  emptyText: {
    fontSize: FONTS.sizes.lg,
    fontWeight: 'bold',
    color: COLORS.darkGray,
    marginTop: SPACING.md
  },
  emptySubtext: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.darkGray,
    marginTop: SPACING.xs
  }
});
