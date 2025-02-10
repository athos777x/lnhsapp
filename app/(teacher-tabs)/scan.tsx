import React, { useLayoutEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, Keyboard, SafeAreaView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { Camera } from 'expo-camera';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { useNavigation } from '@react-navigation/native';


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

const ScanScreen: React.FC = () => {
  const [studentId, setStudentId] = useState('');
  const [scannedStudent, setScannedStudent] = useState<{
    id: string;
    name: string;
    grade: string;
    section: string;
  } | null>(null);
  const [attendanceType, setAttendanceType] = useState<AttendanceType>('regular');
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [showCamera, setShowCamera] = useState(false);

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

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    setShowCamera(false);
    setStudentId(data);
    // Automatically submit after scanning
    const foundStudent = MOCK_STUDENTS[data];
    if (foundStudent) {
      setScannedStudent({
        id: data,
        ...foundStudent
      });
      setSelectedSubject(null);
      setStudentId('');
    } else {
      Alert.alert('Error', 'Student ID not found');
      setStudentId('');
    }
  };

  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Scan Student Barcode'
    });
  }, [navigation]);

  if (hasPermission === null) {
    return <View style={styles.container}><Text>Requesting camera permission...</Text></View>;
  }
  if (hasPermission === false) {
    return <View style={styles.container}><Text>No access to camera</Text></View>;
  }

  return (
    <View style={styles.container}>
      {showCamera ? (
        <View style={styles.cameraContainer}>
          <BarCodeScanner
            style={StyleSheet.absoluteFillObject}
            type={BarCodeScanner.Constants.Type.back}
            barCodeTypes={[
              BarCodeScanner.Constants.BarCodeType.code128,  // Most common for student IDs
              BarCodeScanner.Constants.BarCodeType.ean13,    // Standard retail barcode
              BarCodeScanner.Constants.BarCodeType.code39,   // Also common in ID systems
            ]}
            onBarCodeScanned={handleBarCodeScanned}
          />
          <SafeAreaView style={styles.cameraOverlay}>
            <View style={styles.cameraHeader}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowCamera(false)}
              >
                <MaterialIcons name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.cameraTitle}>Scan Barcode</Text>
            </View>
            <View style={styles.scanFrameContainer}>
              <View style={styles.scanFrame} />
              <Text style={styles.scanText}>Position barcode within frame</Text>
            </View>
          </SafeAreaView>
        </View>
      ) : (
        <View style={styles.content}>
          <Text style={styles.title}>Scan Student Barcode</Text>
          
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
            />
            <TouchableOpacity 
              style={styles.submitButton}
              onPress={handleSubmit}
            >
              <MaterialIcons name="arrow-forward" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.submitButton, styles.scanButton]}
              onPress={() => setShowCamera(true)}
            >
              <MaterialIcons name="qr-code" size={24} color="#fff" />
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
      )}
    </View>
  );
};

export default ScanScreen;

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
  scanButton: {
    backgroundColor: '#28a745',
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
  cameraContainer: {
    flex: 1,
    width: '100%',
    backgroundColor: '#000',
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  cameraHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 20,
  },
  cameraTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 16,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
  },
  scanFrameContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: 'transparent',
    borderRadius: 24,
  },
  scanText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 24,
    textAlign: 'center',
    fontWeight: '500',
  },
}); 