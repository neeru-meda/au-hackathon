import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Pressable
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONTS } from '../utils/theme';

interface CustomDropdownProps {
  label: string;
  value: string;
  options: string[];
  onSelect: (value: string) => void;
  placeholder?: string;
}

export default function CustomDropdown({
  label,
  value,
  options,
  onSelect,
  placeholder = 'Select...'
}: CustomDropdownProps) {
  const [modalVisible, setModalVisible] = useState(false);

  const handleSelect = (option: string) => {
    onSelect(option);
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={styles.selector}
        onPress={() => setModalVisible(true)}
      >
        <Text style={[styles.selectorText, !value && styles.placeholder]}>
          {value || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={20} color={COLORS.darkGray} />
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
              <Text style={styles.modalTitle}>Select {label}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.optionsList}>
              {options.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.option,
                    value === option && styles.optionSelected
                  ]}
                  onPress={() => handleSelect(option)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      value === option && styles.optionTextSelected
                    ]}
                  >
                    {option}
                  </Text>
                  {value === option && (
                    <Ionicons name="checkmark" size={20} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
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
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: SPACING.md,
    minHeight: 50
  },
  selectorText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.text,
    flex: 1
  },
  placeholder: {
    color: COLORS.darkGray
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
    maxHeight: '70%',
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
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border
  },
  modalTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: 'bold',
    color: COLORS.text
  },
  optionsList: {
    maxHeight: 400
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray
  },
  optionSelected: {
    backgroundColor: '#FFF5F5'
  },
  optionText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.text
  },
  optionTextSelected: {
    color: COLORS.primary,
    fontWeight: '600'
  }
});
