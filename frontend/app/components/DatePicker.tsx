import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONTS } from '../utils/theme';
import { format, addDays, subDays, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';

interface DatePickerProps {
  label: string;
  value: Date;
  onSelect: (date: Date) => void;
}

export default function DatePicker({ label, value, onSelect }: DatePickerProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(value || new Date());

  const handleSelect = (date: Date) => {
    onSelect(date);
    setModalVisible(false);
  };

  const getDaysInMonth = () => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  };

  const days = getDaysInMonth();

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={styles.selector}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="calendar-outline" size={18} color={COLORS.darkGray} />
        <Text style={styles.selectorText} numberOfLines={1}>
          {format(value, 'dd-MM-yyyy')}
        </Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => setCurrentMonth(subDays(startOfMonth(currentMonth), 1))}
              >
                <Ionicons name="chevron-back" size={24} color={COLORS.text} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                {format(currentMonth, 'MMMM yyyy')}
              </Text>
              <TouchableOpacity
                onPress={() => setCurrentMonth(addDays(endOfMonth(currentMonth), 1))}
              >
                <Ionicons name="chevron-forward" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.calendar}>
              <View style={styles.weekDays}>
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                  <Text key={i} style={styles.weekDay}>{day}</Text>
                ))}
              </View>
              <View style={styles.daysGrid}>
                {days.map((day, index) => {
                  const isSelected = format(day, 'yyyy-MM-dd') === format(value, 'yyyy-MM-dd');
                  const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.dayCell,
                        isSelected && styles.dayCellSelected,
                        isToday && !isSelected && styles.dayCellToday
                      ]}
                      onPress={() => handleSelect(day)}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          isSelected && styles.dayTextSelected
                        ]}
                      >
                        {format(day, 'd')}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <TouchableOpacity
              style={styles.todayButton}
              onPress={() => handleSelect(new Date())}
            >
              <Text style={styles.todayButtonText}>Today</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minWidth: 100
  },
  label: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: SPACING.md,
    minHeight: 50
  },
  selectorText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.text,
    flex: 1
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    width: '100%',
    maxWidth: 350,
    padding: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border
  },
  modalTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: 'bold',
    color: COLORS.text
  },
  calendar: {},
  weekDays: {
    flexDirection: 'row',
    marginBottom: SPACING.sm
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    fontSize: FONTS.sizes.sm,
    fontWeight: 'bold',
    color: COLORS.darkGray
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4
  },
  dayCellSelected: {
    backgroundColor: COLORS.primary,
    borderRadius: 20
  },
  dayCellToday: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 20
  },
  dayText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.text
  },
  dayTextSelected: {
    color: COLORS.white,
    fontWeight: 'bold'
  },
  todayButton: {
    backgroundColor: COLORS.accent,
    padding: SPACING.sm,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: SPACING.md
  },
  todayButtonText: {
    fontSize: FONTS.sizes.md,
    fontWeight: 'bold',
    color: COLORS.white
  }
});
