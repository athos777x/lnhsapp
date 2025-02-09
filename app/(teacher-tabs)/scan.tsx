import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, Keyboard } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useState } from 'react';


type StudentInfo = {
  name: string;
  grade: string;
  section: string;
};

type Subject = {
  id: string;
  name: string;
  code: string;
};

type TeacherSubjects = {
  [gradeSection: string]: Subject[];
};

type StudentDatabase = {
  [key: string]: StudentInfo;
};

// Mock student data
const MOCK_STUDENTS: StudentDatabase = {
  '2024-0001': { name: 'John Doe', grade: '7', section: 'Diamond' },
  '2024-0002': { name: 'Jane Smith', grade: '8', section: 'Pearl' },
  '2024-0003': { name: 'Bob Johnson', grade: '9', section: 'Ruby' },
  // Add more mock students as needed
};

// Mock teacher's subjects data
const TEACHER_SUBJECTS: TeacherSubjects = {
  '7-Diamond': [
    { id: '1', name: 'Mathematics', code: 'MATH7' },
    { id: '2', name: 'Science', code: 'SCI7' }
  ],
  '8-Pearl': [
    { id: '3', name: 'Mathematics', code: 'MATH8' }
  ],
  '9-Ruby': [
    { id: '4', name: 'Science', code: 'SCI9' }
  ]
};

type AttendanceType = 'regular' | 'brigada';

export default function ScanScreen() {
  const [studentId, setStudentId] = useState('');
  const [scannedStudent, setScannedStudent] = useState<{
    id: string;
    name: string;
    grade: string;
    section: string;
  } | null>(null);
  const [attendanceType, setAttendanceType] = useState<AttendanceType>('regular');
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

  // Get current date in a readable format
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const getTeacherSubjectsForStudent = (grade: string, section: string): Subject[] => {
    const key = `${grade}-${section}`;
    return TEACHER_SUBJECTS[key] || [];
  };

  const handleSubmit = () => {
    if (studentId.trim()) {
      Keyboard.dismiss(); // Dismiss keyboard after submit
      const foundStudent = MOCK_STUDENTS[studentId];
      if (foundStudent) {
        setScannedStudent({
          id: studentId,
          ...foundStudent
        });
        setSelectedSubject(null); // Reset selected subject
        setStudentId(''); // Clear input after submission
      } else {
        Alert.alert('Error', 'Student ID not found');
        setStudentId('');
      }
    }
  };

  const handleAttendanceSubmit = async (status: 'present' | 'late' | 'absent') => {
    try {
      if (attendanceType === 'regular' && !selectedSubject) {
        Alert.alert('Error', 'Please select a subject first');
        return;
      }

      // Here you would normally make an API call to update attendance
      const message = attendanceType === 'regular'
        ? `${scannedStudent?.name}'s attendance for ${selectedSubject?.name} marked as ${status}`
        : `${scannedStudent?.name}'s brigada attendance marked as ${status}`;

      Alert.alert('Success', message);
      setScannedStudent(null); // Reset for next student
      setSelectedSubject(null); // Reset selected subject
    } catch (error) {
      Alert.alert('Error', 'Failed to update attendance');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Scan Student ID</Text>
        
        <View style={styles.attendanceTypeContainer}>
          <TouchableOpacity
            style={[
              styles.attendanceTypeButton,
              attendanceType === 'regular' && styles.attendanceTypeButtonActive
            ]}
            onPress={() => {
              setAttendanceType('regular');
              setSelectedSubject(null);
            }}
          >
            <Text style={[
              styles.attendanceTypeText,
              attendanceType === 'regular' && styles.attendanceTypeTextActive
            ]}>Regular</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.attendanceTypeButton,
              attendanceType === 'brigada' && styles.attendanceTypeButtonActive
            ]}
            onPress={() => {
              setAttendanceType('brigada');
              setSelectedSubject(null);
            }}
          >
            <Text style={[
              styles.attendanceTypeText,
              attendanceType === 'brigada' && styles.attendanceTypeTextActive
            ]}>Brigada</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.dateText}>{currentDate}</Text>
        
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={studentId}
            onChangeText={setStudentId}
            placeholder="Enter Student ID"
            placeholderTextColor="#666"
            keyboardType="numeric"
            maxLength={10}
            autoFocus
          />
          <TouchableOpacity 
            style={styles.submitButton}
            onPress={handleSubmit}
          >
            <MaterialIcons name="arrow-forward" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {scannedStudent && (
          <>
            <View style={styles.divider} />
            <View style={styles.studentCard}>
              <MaterialIcons name="person" size={40} color="#28a745" />
              <Text style={styles.studentName}>{scannedStudent.name}</Text>
              <Text style={styles.studentDetails}>
                Grade {scannedStudent.grade} - {scannedStudent.section}
              </Text>
              <Text style={styles.studentId}>{scannedStudent.id}</Text>

              {attendanceType === 'regular' && (
                <>
                  <View style={styles.divider} />
                  <Text style={styles.sectionTitle}>Select Subject</Text>
                  <View style={styles.subjectsContainer}>
                    {getTeacherSubjectsForStudent(scannedStudent.grade, scannedStudent.section).map((subject) => (
                      <TouchableOpacity
                        key={subject.id}
                        style={[
                          styles.subjectButton,
                          selectedSubject?.id === subject.id && styles.subjectButtonSelected
                        ]}
                        onPress={() => setSelectedSubject(subject)}
                      >
                        <Text style={[
                          styles.subjectButtonText,
                          selectedSubject?.id === subject.id && styles.subjectButtonTextSelected
                        ]}>
                          {subject.name}
                        </Text>
                        <Text style={[
                          styles.subjectCodeText,
                          selectedSubject?.id === subject.id && styles.subjectButtonTextSelected
                        ]}>
                          {subject.code}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}
              
              <View style={styles.attendanceButtons}>
                <TouchableOpacity
                  style={[styles.statusButton, styles.presentButton]}
                  onPress={() => handleAttendanceSubmit('present')}
                >
                  <MaterialIcons name="check-circle" size={24} color="#fff" />
                  <Text style={styles.statusButtonText}>Present</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.statusButton, styles.lateButton]}
                  onPress={() => handleAttendanceSubmit('late')}
                >
                  <MaterialIcons name="schedule" size={24} color="#fff" />
                  <Text style={styles.statusButtonText}>Late</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.statusButton, styles.absentButton]}
                  onPress={() => handleAttendanceSubmit('absent')}
                >
                  <MaterialIcons name="cancel" size={24} color="#fff" />
                  <Text style={styles.statusButtonText}>Absent</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#28a745',
    marginBottom: 20,
  },
  dateText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    fontWeight: '500',
  },
  attendanceTypeContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  attendanceTypeButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  attendanceTypeButtonActive: {
    backgroundColor: '#28a745',
  },
  attendanceTypeText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  attendanceTypeTextActive: {
    color: '#fff',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    fontSize: 18,
    color: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  submitButton: {
    backgroundColor: '#28a745',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#e9ecef',
    width: '100%',
    marginVertical: 20,
  },
  studentCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  studentName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  studentDetails: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  studentId: {
    fontSize: 14,
    color: '#888',
    marginTop: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  subjectsContainer: {
    width: '100%',
    gap: 8,
    marginBottom: 20,
  },
  subjectButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  subjectButtonSelected: {
    backgroundColor: '#28a745',
    borderColor: '#28a745',
  },
  subjectButtonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  subjectCodeText: {
    fontSize: 14,
    color: '#666',
  },
  subjectButtonTextSelected: {
    color: '#fff',
  },
  attendanceButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginTop: 20,
    width: '100%',
  },
  statusButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  presentButton: {
    backgroundColor: '#28a745',
  },
  lateButton: {
    backgroundColor: '#ffc107',
  },
  absentButton: {
    backgroundColor: '#dc3545',
  },
  statusButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
}); 