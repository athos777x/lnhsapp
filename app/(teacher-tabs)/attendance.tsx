import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

type Section = {
  section_id: number;
  section_name: string;
  grade_level: string;
  subjects: Subject[];
};

type Subject = {
  subject_id: number;
  subject_name: string;
  time_range: string;
  day: string;
};

type Student = {
  id: string;
  stud_name: string;
  student_id: number;
  lrn?: string;
  attendance_status?: 'present' | 'late' | 'absent';
};

type SchoolYear = {
  school_year: string;
  school_year_id: number;
};

export default function TeacherAttendance() {
  const [sections, setSections] = useState<Section[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ text: string; color: string }>({ text: '', color: '' });
  const [showStatus, setShowStatus] = useState(false);
  const [schoolYears, setSchoolYears] = useState<SchoolYear[]>([]);
  const [currentSchoolYear, setCurrentSchoolYear] = useState<SchoolYear | null>(null);
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { userData } = useAuth();
  const router = useRouter();

  // Add new state for tracking the current date in readable format
  const [currentDate] = useState(new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }));

  // Add status message handler
  const showStatusMessage = (message: string, color: string) => {
    setStatusMessage({ text: message, color: color });
    setShowStatus(true);
    // Hide the message after 2 seconds
    setTimeout(() => {
      setShowStatus(false);
    }, 2000);
  };

  const handleSectionPress = async (section: Section) => {
    setSelectedSection(section);
    setSelectedSubject(null);
    setStudents([]);
    setSubjects(section.subjects);
    
    try {
      console.log('Fetching students for section:', section.section_id);
      const sectionStudents = await api.getSectionStudents(section.section_id);
      console.log('Received students:', sectionStudents);
      
      // Map the API response to match our Student type
      const formattedStudents = sectionStudents.map(student => ({
        id: student.student_id.toString(),
        stud_name: student.stud_name,
        student_id: student.student_id,
        lrn: student.lrn || undefined,
        attendance_status: undefined
      }));
      
      console.log('Formatted students:', formattedStudents);
      setStudents(formattedStudents);
    } catch (error) {
      console.error('Error fetching students:', error);
      showStatusMessage('Failed to load students', '#dc3545');
    }
  };

  const handleSubjectPress = async (subject: Subject) => {
    console.log('Selected subject:', subject);
    console.log('Current students:', students);
    setSelectedSubject(subject);

    try {
      // Get the current date in YYYY-MM-DD format
      const today = new Date();
      const formattedDate = today.toISOString().split('T')[0]; // Format: YYYY-MM-DD
      console.log('Fetching attendance records for date:', formattedDate);
      
      // Fetch existing attendance records for this subject and date
      const attendanceRecords = await api.getAttendanceRecords(subject.subject_id, formattedDate);
      console.log('Received attendance records:', attendanceRecords);
      
      // Update students with their attendance status
      const updatedStudents = students.map(student => {
        const record = attendanceRecords.data.find(r => r.student_id === student.student_id);
        console.log(`Student ${student.student_id} attendance record:`, record);
        return {
          ...student,
          attendance_status: record ? record.status : undefined
        };
      });
      
      console.log('Updated students with attendance status:', updatedStudents);
      setStudents(updatedStudents);
    } catch (error) {
      console.error('Error fetching attendance records:', error);
      showStatusMessage('Failed to load attendance records', '#dc3545');
    }
  };

  const handleAttendanceStatus = async (student: Student, status: 'present' | 'late' | 'absent') => {
    try {
      if (!selectedSubject) {
        showStatusMessage('Please select a subject first', '#dc3545');
        return;
      }

      // Check if the selected subject's day matches today's day
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const currentDay = days[new Date().getDay()];
      
      let hasScheduleToday = false;
      if (selectedSubject.day.startsWith('[') && selectedSubject.day.endsWith(']')) {
        try {
          const daysArray = JSON.parse(selectedSubject.day);
          hasScheduleToday = daysArray.includes(currentDay);
        } catch (e) {
          console.error('Error parsing days:', e);
          hasScheduleToday = selectedSubject.day.includes(currentDay);
        }
      } else {
        hasScheduleToday = selectedSubject.day.includes(currentDay);
      }
      
      if (!hasScheduleToday) {
        showStatusMessage(`No schedule for ${selectedSubject.subject_name} on ${currentDay}`, '#dc3545');
        return;
      }

      // Toggle attendance status in UI
      const updatedStudents = students.map(s => {
        if (s.id === student.id) {
          // If the same status is clicked again, remove it
          const newStatus = s.attendance_status === status ? undefined : status;
          return { ...s, attendance_status: newStatus };
        }
        return s;
      });
      setStudents(updatedStudents);

      // If we're removing the status (toggling off), don't make API call
      if (updatedStudents.find(s => s.id === student.id)?.attendance_status === undefined) {
        showStatusMessage(`Unmarked ${student.stud_name}`, '#6c757d');
        return;
      }

      // Make API call to record attendance
      const response = await api.recordAttendance({
        subject_id: selectedSubject.subject_id,
        status,
        student_id: student.student_id,
        student_name: student.stud_name,
        school_year_id: currentSchoolYear?.school_year_id
      });

      if (response.success) {
        const statusColors = {
          present: '#28a745',
          late: '#ffc107',
          absent: '#dc3545'
        };
        showStatusMessage(`Marked ${student.stud_name} as ${status}`, statusColors[status]);
      } else {
        // If API call fails, revert the UI change
        setStudents(students);
        showStatusMessage(response.error || 'Failed to update attendance', '#dc3545');
      }
    } catch (err: any) {
      console.error('Error updating attendance:', err);
      // Revert UI change on error
      setStudents(students);
      
      // Display error message from API if available
      const errorMessage = err.response?.data?.error || 'Failed to update attendance';
      showStatusMessage(errorMessage, '#dc3545');
    }
  };

  const handleSchoolYearPress = (year: SchoolYear) => {
    setCurrentSchoolYear(year);
    setShowYearPicker(false);
    showStatusMessage(`School Year changed to ${year.school_year}`, '#28a745');
    // Pass the selected year directly to fetchTeacherData
    fetchTeacherData(year);
  };

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

  // Add this function to fetch teacher sections
  const fetchTeacherData = async (schoolYear = currentSchoolYear) => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (!userData || !schoolYear) {
        console.log('Missing data:', { userData, schoolYear });
        setError('Please log in again');
        router.replace('/login');
        return;
      }
      
      const userId = userData.userId;
      console.log('Current user ID:', userId);
      
      // Get employee ID
      const employeeId = await api.getEmployeeId(userId);
      console.log('Employee ID:', employeeId);
      
      // Get sections using the school year ID directly
      const sectionsData = await api.getTeacherSections(employeeId, schoolYear.school_year_id);
      console.log('Raw sections data:', sectionsData);
      
      // Create a map to store unique sections by section_id
      const sectionMap = new Map<number, Section>();
      
      // First pass: Create unique sections
      sectionsData.forEach(item => {
        const sectionKey = item.section_id;
        
        if (!sectionMap.has(sectionKey)) {
          sectionMap.set(sectionKey, {
            section_id: item.section_id,
            section_name: item.section_name,
            grade_level: item.grade_level,
            subjects: []
          });
        }
        
        // Add subject to the section
        const section = sectionMap.get(sectionKey)!;
        // Check if subject doesn't already exist in the section
        if (!section.subjects.some(s => s.subject_id === item.subject_id)) {
          console.log('Adding subject to section:', {
            section_id: item.section_id,
            section_name: item.section_name,
            subject_id: item.subject_id,
            subject_name: item.subject_name
          });
          section.subjects.push({
            subject_id: item.subject_id,
            subject_name: item.subject_name,
            time_range: item.time_range,
            day: item.day
          });
        }
      });
      
      // Convert map to array and sort by grade level and section name
      const finalSections = Array.from(sectionMap.values())
        .sort((a, b) => {
          // Extract grade numbers for comparison
          const gradeA = parseInt(a.grade_level.replace('Grade ', ''));
          const gradeB = parseInt(b.grade_level.replace('Grade ', ''));
          
          // Sort by grade level first
          if (gradeA !== gradeB) {
            return gradeB - gradeA; // Higher grades first
          }
          
          // If same grade, sort by section name
          return a.section_name.localeCompare(b.section_name);
        });
      
      console.log('Final sections data:', finalSections);
      setSections(finalSections);
    } catch (error: any) {
      console.error('Error fetching teacher data:', error);
      let errorMessage = 'Failed to load sections. Please try again.';
      
      if (error.response) {
        console.error('Error response:', error.response.data);
        if (error.response.status === 404) {
          errorMessage = 'Teacher profile not found. Please contact administrator.';
        } else if (error.response.data?.error) {
          errorMessage = error.response.data.error;
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // First fetch school years
    const initializeData = async () => {
      try {
        setIsLoading(true);
        // First get school years
        const years = await api.getSchoolYears();
        setSchoolYears(years);
        
        // Set current school year
        if (years.length > 0) {
          setCurrentSchoolYear(years[0]);
          // Only fetch teacher data after we have the school year
          if (userData) {
            await fetchTeacherData(years[0]);
          }
        }
      } catch (error) {
        console.error('Error initializing data:', error);
        setError('Failed to load initial data');
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();
  }, [userData]); // Add userData as dependency

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#28a745" />
          <Text style={styles.loadingText}>Loading sections...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => {
              // First fetch school years
              const initializeData = async () => {
                try {
                  setIsLoading(true);
                  // First get school years
                  const years = await api.getSchoolYears();
                  setSchoolYears(years);
                  
                  // Set current school year
                  if (years.length > 0) {
                    setCurrentSchoolYear(years[0]);
                    // Only fetch teacher data after we have the school year
                    if (userData) {
                      await fetchTeacherData(years[0]);
                    }
                  }
                } catch (error) {
                  console.error('Error initializing data:', error);
                  setError('Failed to load initial data');
                } finally {
                  setIsLoading(false);
                }
              };

              initializeData();
            }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const renderSection = ({ item }: { item: Section }) => (
    <TouchableOpacity
      style={[
        styles.card,
        selectedSection?.section_id === item.section_id && styles.selectedCard,
      ]}
      onPress={() => handleSectionPress(item)}
    >
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{item.section_name}</Text>
          <View style={styles.gradeBadge}>
            <Text style={styles.gradeBadgeText}>{item.grade_level}</Text>
          </View>
        </View>
        <Ionicons 
          name="chevron-forward" 
          size={20} 
          color={selectedSection?.section_id === item.section_id ? "#28a745" : "#666"} 
        />
      </View>
    </TouchableOpacity>
  );

  const renderSubject = ({ item }: { item: Subject }) => {
    // Check if the subject's day matches today's day
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = days[new Date().getDay()];
    
    // Format days nicely if it's an array in string format
    let formattedDays = item.day;
    if (item.day.startsWith('[') && item.day.endsWith(']')) {
      try {
        // Parse the JSON array string
        const daysArray = JSON.parse(item.day);
        if (Array.isArray(daysArray)) {
          // Convert full day names to shorter versions and join with commas
          formattedDays = daysArray.map(day => {
            // Shortened day names (first 3 letters)
            return day.substring(0, 3);
          }).join(', ');
        }
      } catch (e) {
        // If parsing fails, keep the original string
        console.error('Error parsing days:', e);
      }
    }
    
    // Check if today's day is in the list of days
    const hasScheduleToday = item.day.includes(currentDay);
    
    console.log('Rendering subject:', { 
      subject_id: item.subject_id, 
      subject_name: item.subject_name,
      day: item.day,
      formattedDays,
      time_range: item.time_range
    });
    
    return (
      <TouchableOpacity
        style={[
          styles.card,
          selectedSubject?.subject_id === item.subject_id && styles.selectedCard,
          !hasScheduleToday && styles.disabledCard
        ]}
        onPress={() => {
          if (hasScheduleToday) {
            handleSubjectPress(item);
          } else {
            // Show a message that this subject is not scheduled for today
            showStatusMessage(`No schedule for ${item.subject_name} on ${currentDay}`, '#dc3545');
          }
        }}
        disabled={!hasScheduleToday}
      >
        <View style={styles.cardContent}>
          <View>
            <Text style={[
              styles.cardTitle, 
              { fontSize: 20, fontWeight: '700' },
              !hasScheduleToday && styles.disabledText
            ]}>
              {item.subject_name || "Unnamed Subject"}
            </Text>
            <View style={styles.gradeBadge}>
              <Text style={styles.gradeBadgeText}>{formattedDays}</Text>
              <Text style={styles.gradeBadgeText}>{item.time_range}</Text>
              {!hasScheduleToday && (
                <Text style={styles.noScheduleText}>No schedule for today</Text>
              )}
            </View>
          </View>
          <Ionicons 
            name="chevron-forward" 
            size={20} 
            color={
              !hasScheduleToday 
                ? "#ccc" 
                : selectedSubject?.subject_id === item.subject_id 
                  ? "#28a745" 
                  : "#666"
            } 
          />
        </View>
      </TouchableOpacity>
    );
  };

  const renderStudent = ({ item }: { item: Student }) => {
    console.log('Rendering student:', item);
    return (
      <View style={styles.studentCard} key={item.id}>
        <View style={styles.studentCardContent}>
          <View style={styles.studentInfo}>
            <Text style={styles.studentName}>{item.stud_name}</Text>
            <Text style={styles.studentId}>
              ID: {item.student_id}
            </Text>
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
  };

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

      {!selectedSection ? (
        <>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Select Section</Text>
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

          <FlatList
            data={sections}
            renderItem={renderSection}
            keyExtractor={(item) => item.section_id.toString()}
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

          {/* Date Display */}
          <Text style={styles.dateText}>{currentDate}</Text>

          <FlatList
            data={subjects}
            renderItem={renderSubject}
            keyExtractor={(item) => item.subject_id.toString()}
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

          {/* Date Display */}
          <Text style={styles.dateText}>{currentDate}</Text>

          <FlatList
            data={students}
            renderItem={renderStudent}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            extraData={selectedSubject}
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
    gap: 4,
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
  schoolYearSelector: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 12,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#dc3545',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  noScheduleText: {
    color: '#dc3545',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  dateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginVertical: 12,
    paddingHorizontal: 16,
  },
  disabledCard: {
    backgroundColor: '#f5f5f5',
    opacity: 0.7,
    borderColor: '#ddd',
    borderWidth: 1,
  },
  disabledText: {
    color: '#999',
  },
});
