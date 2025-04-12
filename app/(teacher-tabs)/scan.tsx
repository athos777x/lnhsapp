import React, { useLayoutEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, Keyboard, SafeAreaView, Modal, Vibration } from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { Camera } from 'expo-camera';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { useNavigation } from '@react-navigation/native';
import api from '../../services/api';
import * as Haptics from 'expo-haptics';

type SchoolYear = {
  school_year: string;
  school_year_id: number;
};

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
  '20240001': { name: 'John Doe', grade: '7', section: 'Diamond' },
  '20240002': { name: 'Jane Smith', grade: '8', section: 'Pearl' },
  '20240003': { name: 'Bob Johnson', grade: '9', section: 'Ruby' },
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

type AttendanceType = 'brigada';

// Update the BrigadaStatus type
type BrigadaStatus = {
  status: 'Yes' | 'No';
  remarks?: string;
};

const ScanScreen: React.FC = () => {
  const [studentId, setStudentId] = useState('');
  const [scannedStudent, setScannedStudent] = useState<{
    id: string;
    name: string;
    grade: string;
    section: string;
    brigadaStatus?: BrigadaStatus;
  } | null>(null);
  const [attendanceType] = useState<AttendanceType>('brigada');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [schoolYears, setSchoolYears] = useState<SchoolYear[]>([]);
  const [currentSchoolYear, setCurrentSchoolYear] = useState<SchoolYear | null>(null);
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [showRemarksModal, setShowRemarksModal] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [attendanceStatus, setAttendanceStatus] = useState<'present' | 'absent' | null>(null);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [showScannedOverlay, setShowScannedOverlay] = useState(false);

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

  // Update the handleSubmit function to match web app data structure
  const handleSubmit = () => {
    if (studentId.trim()) {
      Keyboard.dismiss();
      const foundStudent = MOCK_STUDENTS[studentId];
      if (foundStudent) {
        // In real app, this would be fetched from your API
        const mockBrigadaStatus: BrigadaStatus = {
          status: 'No',
          remarks: ''
        };

        setScannedStudent({
          id: studentId,
          ...foundStudent,
          brigadaStatus: mockBrigadaStatus
        });
        setStudentId('');
      } else {
        Alert.alert('Error', 'Student ID not found');
        setStudentId('');
      }
    }
  };

  const handleToggleAttendance = async (status: 'Yes' | 'No') => {
    try {
      if (!scannedStudent) return;

      if (status === 'No') {
        // Show remarks modal for marking as absent
        setShowRemarksModal(true);
        return;
      }

      // For marking as present, update directly
      await updateAttendance(scannedStudent.id, true, "Attended");
      
      // Update local state
      setScannedStudent(prev => prev ? {
        ...prev,
        brigadaStatus: {
          status: 'Yes',
          remarks: "Attended"
        }
      } : null);

      Alert.alert('Success', 'Student marked as present');
    } catch (error) {
      Alert.alert('Error', 'Failed to update attendance');
    }
  };

  const handleRemarksSubmit = async () => {
    if (!remarks.trim()) {
      Alert.alert('Error', 'Please provide remarks');
      return;
    }

    try {
      if (!scannedStudent) return;

      // In real app, call your API endpoint
      await updateAttendance(scannedStudent.id, false, remarks);

      // Update local state
      setScannedStudent(prev => prev ? {
        ...prev,
        brigadaStatus: {
          status: 'No',
          remarks: remarks
        }
      } : null);

      setShowRemarksModal(false);
      setRemarks('');
      Alert.alert('Success', 'Remarks added successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update remarks');
    }
  };

  const updateAttendance = async (studentId: string, status: boolean, remarks: string) => {
    try {
      // In real app, call your API endpoint
      // await api.put(`/brigada-eskwela/${studentId}`, {
      //   brigada_attendance: status ? 1 : 0,
      //   remarks: remarks
      // });
      
      console.log('Updating attendance:', { studentId, status, remarks });
    } catch (error) {
      throw new Error('Failed to update attendance');
    }
  };

  const handleSchoolYearPress = (year: SchoolYear) => {
    setCurrentSchoolYear(year);
    setShowYearPicker(false);
    Alert.alert('Success', `School Year changed to ${year.school_year}`);
  };

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  useEffect(() => {
    const fetchSchoolYears = async () => {
      try {
        const years = await api.getSchoolYears();
        setSchoolYears(years);
        // Set the current school year to the first one (which will be the active one)
        if (years.length > 0) {
          setCurrentSchoolYear(years[0]);
        }
      } catch (error) {
        console.error('Error fetching school years:', error);
        Alert.alert('Error', 'Failed to load school years');
      }
    };

    fetchSchoolYears();
  }, []);

  const handleBarCodeScanned = async ({ type, data }: { type: string, data: string }) => {
    // Prevent multiple scans of the same code in quick succession
    if (lastScanned === data) return;
    
    setLastScanned(data);
    
    // Provide haptic feedback
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      // Fallback to basic vibration if haptics not available
      Vibration.vibrate(100);
    }

    // Show visual feedback
    setShowScannedOverlay(true);
    setTimeout(() => setShowScannedOverlay(false), 1000);

    // Process the scanned data
    setShowCamera(false);
    setStudentId(data);
    
    // Find student in database
    const foundStudent = MOCK_STUDENTS[data];
    if (foundStudent) {
      setScannedStudent({
        id: data,
        ...foundStudent
      });
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
              BarCodeScanner.Constants.BarCodeType.code128,
              BarCodeScanner.Constants.BarCodeType.ean13,
              BarCodeScanner.Constants.BarCodeType.code39,
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
            {showScannedOverlay && (
              <View style={styles.scannedOverlay}>
                <MaterialIcons name="check-circle" size={60} color="#28a745" />
                <Text style={styles.scannedText}>Barcode Detected!</Text>
              </View>
            )}
          </SafeAreaView>
        </View>
      ) : (
        <View style={styles.content}>
          {/* Page Title */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Brigada Eskwela</Text>
          </View>

          {/* Date Display */}
          <Text style={styles.dateText}>{currentDate}</Text>

          {/* School Year Selector */}
          <TouchableOpacity
            style={styles.schoolYearSelector}
            onPress={() => setShowYearPicker(true)}
          >
            <View style={styles.schoolYearContent}>
              <MaterialIcons name="calendar-today" size={20} color="#28a745" />
              <Text style={styles.schoolYearText}>
                {currentSchoolYear?.school_year || 'Select School Year'}
              </Text>
              <MaterialIcons name="arrow-drop-down" size={24} color="#28a745" />
            </View>
          </TouchableOpacity>

          {/* Search Section */}
          <View style={styles.searchSection}>
            <View style={styles.searchInputContainer}>
              <TextInput
                style={styles.searchInput}
                value={studentId}
                onChangeText={setStudentId}
                placeholder="Enter Student ID"
                placeholderTextColor="#999"
                keyboardType="numeric"
                maxLength={10}
              />
              <TouchableOpacity 
                style={styles.searchButton}
                onPress={handleSubmit}
              >
                <MaterialIcons name="search" size={24} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.scanButton}
                onPress={() => setShowCamera(true)}
              >
                <MaterialIcons name="qr-code-scanner" size={24} color="#28a745" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Student Card */}
          {scannedStudent && (
            <>
              <View style={styles.divider} />
              <View style={styles.studentCard}>
                <View style={styles.studentInfo}>
                  <Text style={styles.studentName}>{scannedStudent.name}</Text>
                  <View style={styles.studentMetaInfo}>
                    <Text style={styles.studentGradeSection}>
                      Grade {scannedStudent.grade} • {scannedStudent.section}
                    </Text>
                    <Text style={styles.studentId}>ID: {scannedStudent.id}</Text>
                  </View>
                </View>

                <View style={styles.brigadaStatusSection}>
                  <View style={[
                    styles.brigadaStatusBadge,
                    scannedStudent.brigadaStatus?.status === 'Yes' 
                      ? styles.brigadaStatusPresent 
                      : styles.brigadaStatusAbsent
                  ]}>
                    <MaterialIcons 
                      name={scannedStudent.brigadaStatus?.status === 'Yes' ? 'check-circle' : 'close'} 
                      size={16} 
                      color="#fff" 
                    />
                    <Text style={styles.brigadaStatusText}>
                      {scannedStudent.brigadaStatus?.status || 'No'}
                    </Text>
                  </View>
                  {scannedStudent.brigadaStatus?.remarks && (
                    <Text style={styles.brigadaStatusRemarks}>
                      Remarks: {scannedStudent.brigadaStatus.remarks}
                    </Text>
                  )}
                </View>

                {(!scannedStudent.brigadaStatus || scannedStudent.brigadaStatus.status === 'No') && (
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={styles.markPresentButton}
                      onPress={() => handleToggleAttendance('Yes')}
                    >
                      <MaterialIcons name="check-circle" size={20} color="#fff" />
                      <Text style={styles.markPresentButtonText}>Mark as Present</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={styles.addRemarksButton}
                      onPress={() => {
                        setShowRemarksModal(true);
                        setRemarks(scannedStudent.brigadaStatus?.remarks || '');
                      }}
                    >
                      <MaterialIcons name="edit" size={20} color="#fff" />
                      <Text style={styles.addRemarksButtonText}>Add Remarks</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* Remarks Modal */}
              <Modal
                visible={showRemarksModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => {
                  setShowRemarksModal(false);
                  setRemarks('');
                }}
              >
                <TouchableOpacity 
                  style={styles.modalOverlay}
                  activeOpacity={1}
                  onPress={() => {
                    setShowRemarksModal(false);
                    setRemarks('');
                  }}
                >
                  <View style={styles.remarksModalContent}>
                    <View style={styles.remarksModalHeader}>
                      <Text style={styles.remarksModalTitle}>Reason for Absence</Text>
                      <TouchableOpacity onPress={() => {
                        setShowRemarksModal(false);
                        setRemarks('');
                      }}>
                        <MaterialIcons name="close" size={24} color="#666" />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.modalStudentName}>
                      Student: {scannedStudent?.name}
                    </Text>
                    <TextInput
                      style={styles.remarksModalInput}
                      value={remarks}
                      onChangeText={setRemarks}
                      placeholder="Please provide a reason for absence..."
                      placeholderTextColor="#999"
                      multiline
                      numberOfLines={3}
                      autoFocus
                    />
                    <View style={styles.remarksModalButtons}>
                      <TouchableOpacity 
                        style={[styles.remarksModalButton, styles.remarksModalCancelButton]}
                        onPress={() => {
                          setShowRemarksModal(false);
                          setRemarks('');
                        }}
                      >
                        <Text style={styles.remarksModalButtonTextCancel}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.remarksModalButton, styles.remarksModalSubmitButton]}
                        onPress={handleRemarksSubmit}
                      >
                        <Text style={styles.remarksModalButtonText}>Submit</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              </Modal>
            </>
          )}
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
                key={year.school_year_id}
                style={[
                  styles.yearOption,
                  currentSchoolYear?.school_year_id === year.school_year_id && styles.selectedYearOption,
                ]}
                onPress={() => handleSchoolYearPress(year)}
              >
                <Text style={[
                  styles.yearOptionText,
                  currentSchoolYear?.school_year_id === year.school_year_id && styles.selectedYearOptionText,
                ]}>
                  {year.school_year}
                </Text>
                {currentSchoolYear?.school_year_id === year.school_year_id && (
                  <Ionicons name="checkmark" size={24} color="#fff" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
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
    flex: 1,
    padding: 16,
  },
  schoolYearSelector: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  schoolYearContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  schoolYearText: {
    flex: 1,
    fontSize: 16,
    color: '#28a745',
    fontWeight: '600',
  },
  dateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 12,
  },
  searchSection: {
    marginBottom: 20,
  },
  searchInputContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchButton: {
    backgroundColor: '#28a745',
    borderRadius: 12,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  scanButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: 48,
    height: 48,
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
    marginVertical: 20,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    padding: 20,
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
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  yearOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#f8f9fa',
  },
  selectedYearOption: {
    backgroundColor: '#28a745',
  },
  yearOptionText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  selectedYearOptionText: {
    color: '#fff',
    fontWeight: '600',
  },
  remarksText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  remarksModalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  remarksModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  remarksModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  remarksModalInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333',
    textAlignVertical: 'top',
    minHeight: 100,
    marginBottom: 20,
  },
  remarksModalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  remarksModalButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  remarksModalCancelButton: {
    backgroundColor: '#f8f9fa',
  },
  remarksModalSubmitButton: {
    backgroundColor: '#28a745',
  },
  remarksModalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  remarksModalButtonTextCancel: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  attendanceStatus: {
    alignItems: 'center',
    width: '100%',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 8,
  },
  presentBadge: {
    backgroundColor: '#28a745',
  },
  absentBadge: {
    backgroundColor: '#dc3545',
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  modalStudentName: {
    fontSize: 16,
    color: '#333',
    marginBottom: 16,
    fontWeight: '500',
  },
  studentCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    gap: 16,
  },
  studentInfo: {
    alignItems: 'center',
  },
  studentName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  studentMetaInfo: {
    alignItems: 'center',
    gap: 4,
  },
  studentGradeSection: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  studentId: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  brigadaStatusSection: {
    alignItems: 'center',
    paddingVertical: 8,
    gap: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
  },
  brigadaStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 6,
  },
  brigadaStatusPresent: {
    backgroundColor: '#28a745',
  },
  brigadaStatusAbsent: {
    backgroundColor: '#dc3545',
  },
  brigadaStatusText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  brigadaStatusRemarks: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  markPresentButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#28a745',
    padding: 12,
    borderRadius: 12,
    gap: 8,
    maxWidth: '48%',
  },
  markPresentButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  addRemarksButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dc3545',
    padding: 12,
    borderRadius: 12,
    gap: 8,
    maxWidth: '48%',
  },
  addRemarksButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  titleContainer: {
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#28a745',
    textAlign: 'center',
  },
  scannedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannedText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
  },
}); 