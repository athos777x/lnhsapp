import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';

type Section = {
  id: number;
  name: string;
  grade_level: string;
};

type Subject = {
  id: number;
  name: string;
  code: string;
};

type Student = {
  id: number;
  name: string;
  student_id: string;
  attendance_status?: 'present' | 'late' | 'absent';
};

// Mock Data
const MOCK_SECTIONS: Section[] = [
  { id: 1, name: 'Diamond', grade_level: '7' },
  { id: 2, name: 'Pearl', grade_level: '8' },
  { id: 3, name: 'Ruby', grade_level: '9' },
  { id: 4, name: 'Emerald', grade_level: '10' },
];

const MOCK_SUBJECTS: { [key: number]: Subject[] } = {
  1: [
    { id: 1, name: 'Mathematics', code: 'MATH7' },
    { id: 2, name: 'Science', code: 'SCI7' },
    { id: 3, name: 'English', code: 'ENG7' },
  ],
  2: [
    { id: 4, name: 'Mathematics', code: 'MATH8' },
    { id: 5, name: 'Science', code: 'SCI8' },
    { id: 6, name: 'English', code: 'ENG8' },
  ],
  3: [
    { id: 7, name: 'Mathematics', code: 'MATH9' },
    { id: 8, name: 'Science', code: 'SCI9' },
    { id: 9, name: 'English', code: 'ENG9' },
  ],
  4: [
    { id: 10, name: 'Mathematics', code: 'MATH10' },
    { id: 11, name: 'Science', code: 'SCI10' },
    { id: 12, name: 'English', code: 'ENG10' },
  ],
};

const MOCK_STUDENTS: { [key: number]: Student[] } = {
  1: [
    { id: 1, name: 'John Doe', student_id: '2024-0001' },
    { id: 2, name: 'Jane Smith', student_id: '2024-0002' },
    { id: 3, name: 'Bob Johnson', student_id: '2024-0003' },
    { id: 4, name: 'Alice Brown', student_id: '2024-0004' },
  ],
  2: [
    { id: 5, name: 'Charlie Wilson', student_id: '2024-0005' },
    { id: 6, name: 'Diana Clark', student_id: '2024-0006' },
    { id: 7, name: 'Edward Davis', student_id: '2024-0007' },
    { id: 8, name: 'Fiona Miller', student_id: '2024-0008' },
  ],
  3: [
    { id: 9, name: 'George White', student_id: '2024-0009' },
    { id: 10, name: 'Hannah Lee', student_id: '2024-0010' },
    { id: 11, name: 'Ian Chen', student_id: '2024-0011' },
    { id: 12, name: 'Julia Wang', student_id: '2024-0012' },
  ],
  4: [
    { id: 13, name: 'Kevin Park', student_id: '2024-0013' },
    { id: 14, name: 'Linda Kim', student_id: '2024-0014' },
    { id: 15, name: 'Michael Zhang', student_id: '2024-0015' },
    { id: 16, name: 'Nancy Liu', student_id: '2024-0016' },
  ],
};

export default function TeacherAttendance() {
  const [sections] = useState<Section[]>(MOCK_SECTIONS);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ text: string; color: string }>({ text: '', color: '' });
  const [showStatus, setShowStatus] = useState(false);
  const [currentSchoolYear, setCurrentSchoolYear] = useState('');
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [schoolYears, setSchoolYears] = useState<string[]>([]);

  // Add status message handler
  const showStatusMessage = (message: string, color: string) => {
    setStatusMessage({ text: message, color: color });
    setShowStatus(true);
    // Hide the message after 2 seconds
    setTimeout(() => {
      setShowStatus(false);
    }, 2000);
  };

  const handleSectionPress = (section: Section) => {
    setSelectedSection(section);
    setSelectedSubject(null);
    setStudents([]);
    // Load mock subjects for the selected section
    setSubjects(MOCK_SUBJECTS[section.id]);
  };

  const handleSubjectPress = (subject: Subject) => {
    setSelectedSubject(subject);
    // Load mock students for the selected section
    setStudents(MOCK_STUDENTS[selectedSection!.id].map(student => ({
      ...student,
      attendance_status: undefined,
    })));
  };

  const handleAttendanceStatus = async (student: Student, status: 'present' | 'late' | 'absent') => {
    try {
      // Toggle attendance status
      setStudents(students.map(s => {
        if (s.id === student.id) {
          // If the same status is clicked again, remove it
          const newStatus = s.attendance_status === status ? undefined : status;
          // Show appropriate status message with color
          if (newStatus === undefined) {
            showStatusMessage(`Unmarked ${student.name}`, '#6c757d'); // Gray for unmark
          } else {
            const statusColors = {
              present: '#28a745',
              late: '#ffc107',
              absent: '#dc3545'
            };
            showStatusMessage(`Marked ${student.name} as ${status}`, statusColors[status]);
          }
          return { ...s, attendance_status: newStatus };
        }
        return s;
      }));
    } catch (err) {
      console.error(err);
      showStatusMessage('Failed to update attendance', '#dc3545'); // Red for error
    }
  };

  const handleSchoolYearPress = (year: string) => {
    setCurrentSchoolYear(year);
    setShowYearPicker(false);
    showStatusMessage(`School Year changed to ${year}`, '#28a745');
  };

  const fetchSchoolYears = async () => {
    try {
      const schoolYears = await api.getSchoolYears();
      setSchoolYears(schoolYears);
      // Set the current school year to the first one (which will be the active one)
      if (schoolYears.length > 0) {
        setCurrentSchoolYear(schoolYears[0]);
      }
    } catch (error) {
      console.error('Error fetching school years:', error);
      Alert.alert('Error', 'Failed to load school years');
    }
  };

  useEffect(() => {
    fetchSchoolYears();
  }, []);

  const renderSection = ({ item }: { item: Section }) => (
    <TouchableOpacity
      style={[
        styles.card,
        selectedSection?.id === item.id && styles.selectedCard,
      ]}
      onPress={() => handleSectionPress(item)}
    >
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <View style={styles.gradeBadge}>
            <Text style={styles.gradeBadgeText}>Grade {item.grade_level}</Text>
          </View>
        </View>
        <Ionicons 
          name="chevron-forward" 
          size={20} 
          color={selectedSection?.id === item.id ? "#28a745" : "#666"} 
        />
      </View>
    </TouchableOpacity>
  );

  const renderSubject = ({ item }: { item: Subject }) => (
    <TouchableOpacity
      style={[
        styles.card,
        selectedSubject?.id === item.id && styles.selectedCard,
      ]}
      onPress={() => handleSubjectPress(item)}
    >
      <View style={styles.cardContent}>
        <View>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <Text style={styles.cardSubtitle}>{item.code}</Text>
        </View>
        <Ionicons 
          name="chevron-forward" 
          size={20} 
          color={selectedSubject?.id === item.id ? "#28a745" : "#666"} 
        />
      </View>
    </TouchableOpacity>
  );

  const renderStudent = ({ item }: { item: Student }) => (
    <View style={styles.studentCard}>
      <View style={styles.studentCardContent}>
        <View style={styles.studentInfo}>
          <Text style={styles.studentName}>{item.name}</Text>
          <Text style={styles.studentId}>{item.student_id}</Text>
        </View>
        <View style={styles.attendanceButtons}>
          <TouchableOpacity
            style={[
              styles.statusButton,
              { borderColor: '#28a745' },
              item.attendance_status === 'present' && styles.presentButtonSelected,
            ]}
            onPress={() => handleAttendanceStatus(item, 'present')}
          >
            <Ionicons 
              name="checkmark-circle" 
              size={20} 
              color={item.attendance_status === 'present' ? '#fff' : '#28a745'} 
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.statusButton,
              { borderColor: '#ffc107' },
              item.attendance_status === 'late' && styles.lateButtonSelected,
            ]}
            onPress={() => handleAttendanceStatus(item, 'late')}
          >
            <Ionicons 
              name="time" 
              size={20} 
              color={item.attendance_status === 'late' ? '#fff' : '#ffc107'} 
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.statusButton,
              { borderColor: '#dc3545' },
              item.attendance_status === 'absent' && styles.absentButtonSelected,
            ]}
            onPress={() => handleAttendanceStatus(item, 'absent')}
          >
            <Ionicons 
              name="close-circle" 
              size={20} 
              color={item.attendance_status === 'absent' ? '#fff' : '#dc3545'} 
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {showStatus && (
        <View style={[styles.statusContainer, { backgroundColor: `${statusMessage.color}dd` }]}>
          <Text style={styles.statusText}>{statusMessage.text}</Text>
        </View>
      )}
      
      <Modal
        visible={showYearPicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowYearPicker(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowYearPicker(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select School Year</Text>
              <TouchableOpacity onPress={() => setShowYearPicker(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            {schoolYears.map((year) => (
              <TouchableOpacity
                key={year}
                style={[
                  styles.yearOption,
                  currentSchoolYear === year && styles.selectedYearOption,
                ]}
                onPress={() => handleSchoolYearPress(year)}
              >
                <Text style={[
                  styles.yearOptionText,
                  currentSchoolYear === year && styles.selectedYearOptionText,
                ]}>
                  {year}
                </Text>
                {currentSchoolYear === year && (
                  <Ionicons name="checkmark" size={24} color="#fff" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {!selectedSection ? (
        <>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Select Section</Text>
          </View>
          <View style={styles.schoolYearContainer}>
            <TouchableOpacity
              style={styles.schoolYearBadge}
              onPress={() => setShowYearPicker(true)}
            >
              <Ionicons name="calendar-outline" size={20} color="#28a745" />
              <Text style={styles.schoolYearText}>School Year {currentSchoolYear}</Text>
              <Ionicons name="chevron-down" size={20} color="#28a745" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={sections}
            renderItem={renderSection}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContainer}
          />
        </>
      ) : !selectedSubject ? (
        <>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setSelectedSection(null)}
            >
              <Ionicons name="arrow-back" size={24} color="#28a745" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Select Subject</Text>
          </View>
          <FlatList
            data={subjects}
            renderItem={renderSubject}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContainer}
          />
        </>
      ) : (
        <>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setSelectedSubject(null)}
            >
              <Ionicons name="arrow-back" size={24} color="#28a745" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Mark Attendance</Text>
          </View>
          <FlatList
            data={students}
            renderItem={renderStudent}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContainer}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  backButton: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
  },
  listContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    overflow: 'hidden',
  },
  cardContent: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardHeader: {
    flex: 1,
  },
  selectedCard: {
    backgroundColor: '#e8f5e9',
    borderColor: '#28a745',
    borderWidth: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  gradeBadge: {
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  gradeBadgeText: {
    color: '#28a745',
    fontSize: 14,
    fontWeight: '500',
  },
  studentCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  studentCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  studentId: {
    fontSize: 14,
    color: '#666',
  },
  attendanceButtons: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 16,
    alignItems: 'center',
  },
  statusButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    borderWidth: 1,
  },
  presentButtonSelected: {
    backgroundColor: '#28a745',
    borderColor: '#28a745',
  },
  lateButtonSelected: {
    backgroundColor: '#ffc107',
    borderColor: '#ffc107',
  },
  absentButtonSelected: {
    backgroundColor: '#dc3545',
    borderColor: '#dc3545',
  },
  statusContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: 8,
    zIndex: 999,
  },
  statusText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
  },
  schoolYearContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  schoolYearBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'center',
    gap: 8,
  },
  schoolYearText: {
    fontSize: 16,
    color: '#28a745',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '80%',
    maxWidth: 400,
    padding: 16,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  yearOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedYearOption: {
    backgroundColor: '#28a745',
  },
  yearOptionText: {
    fontSize: 16,
    color: '#333',
  },
  selectedYearOptionText: {
    color: '#fff',
    fontWeight: '600',
  },
});
