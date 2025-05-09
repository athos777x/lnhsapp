import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { Calendar } from 'react-native-calendars';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

// Mock student data
const STUDENT_INFO = {
  grade: '7',
  section: 'Diamond',
  schoolYear: '2024-2025'
};

type Subject = {
  id: number;
  name: string;
  present: number;
  total: number;
};

type AttendanceStatus = 'present' | 'absent' | 'pending' | 'late';

type AttendanceDay = {
  date: string;
  status: 'present' | 'absent';
};

type DailySubjectAttendance = {
  id: number;
  name: string;
  status: AttendanceStatus;
  time: string;
};

type StudentDailyAttendance = {
  section_grade: string;
  school_year: string;
  subject_name: string;
  time_range: string;
  attendance_status: 'Present' | 'Absent' | 'Late' | 'No Record';
};

export default function AttendanceScreen() {
  const [date, setDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [studentInfo, setStudentInfo] = useState<{
    grade: string;
    section: string;
    schoolYear: string;
  } | null>(null);
  const [dailyAttendance, setDailyAttendance] = useState<StudentDailyAttendance[]>([]);
  const { userData } = useAuth();

  const getDayName = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const fetchStudentAttendance = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!userData?.userId) {
        throw new Error('User not logged in');
      }

      // First get the student ID
      const studentId = await api.getStudentId(userData.userId);
      
      // Get attendance for the selected date
      const dayName = getDayName(date);
      const formattedDate = formatDate(date);
      
      const attendanceData = await api.getStudentDailyAttendance(
        studentId,
        dayName,
        formattedDate
      );

      if (attendanceData.length > 0) {
        // Set student info from the first record
        setStudentInfo({
          grade: attendanceData[0].section_grade,
          section: '',  // Add section if available in the data
          schoolYear: attendanceData[0].school_year
        });
      }

      setDailyAttendance(attendanceData);
    } catch (error) {
      console.error('Error fetching student attendance:', error);
      setError('Failed to load student information');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentAttendance();
  }, [date, userData]);

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'Present':
        return '#28a745';
      case 'Absent':
        return '#dc3545';
      case 'Late':
        return '#ffc107';
      default:
        return '#6c757d';
    }
  };

  const getStatusIcon = (status: string): React.ComponentProps<typeof MaterialIcons>['name'] => {
    switch (status) {
      case 'Present':
        return 'check-circle';
      case 'Absent':
        return 'cancel';
      case 'Late':
        return 'access-time';
      default:
        return 'help';
    }
  };

  const calculatePercentage = (present: number, total: number): string => {
    return ((present / total) * 100).toFixed(1);
  };

  const isTimeBeforeCurrent = (timeStr: string): boolean => {
    const [time, period] = timeStr.split(' ');
    const [hours, minutes] = time.split(':');
    let hour = parseInt(hours);
    
    // Convert to 24-hour format
    if (period === 'PM' && hour !== 12) {
      hour += 12;
    } else if (period === 'AM' && hour === 12) {
      hour = 0;
    }

    const subjectTime = new Date();
    subjectTime.setHours(hour, parseInt(minutes), 0);
    
    return new Date() >= subjectTime;
  };

  const getTimeDifferenceInMinutes = (timeStr: string): number => {
    const [time, period] = timeStr.split(' ');
    const [hours, minutes] = time.split(':');
    let hour = parseInt(hours);
    
    // Convert to 24-hour format
    if (period === 'PM' && hour !== 12) {
      hour += 12;
    } else if (period === 'AM' && hour === 12) {
      hour = 0;
    }

    const subjectTime = new Date();
    subjectTime.setHours(hour, parseInt(minutes), 0);
    
    const currentTime = new Date();
    return Math.floor((currentTime.getTime() - subjectTime.getTime()) / (1000 * 60));
  };

  const getSubjectStatus = (time: string, selectedDate: Date): AttendanceStatus => {
    const today = new Date();
    const isToday = selectedDate.toDateString() === today.toDateString();
    
    if (!isToday) {
      // For past dates, randomly assign present/absent/late (mock data)
      const random = Math.random();
      if (random > 0.6) return 'present';
      if (random > 0.3) return 'late';
      return 'absent';
    }

    // For today, check if the subject time has passed
    if (isTimeBeforeCurrent(time)) {
      const minutesDifference = getTimeDifferenceInMinutes(time);
      const random = Math.random();
      
      // If class started within the last 15 minutes and student is present
      if (minutesDifference <= 15 && random > 0.3) {
        return random > 0.6 ? 'present' : 'late';
      }
      // If class started more than 15 minutes ago
      return random > 0.7 ? 'late' : 'absent';
    }
    
    return 'pending';
  };

  const changeDate = (days: number) => {
    const newDate = new Date(date);
    newDate.setDate(date.getDate() + days);
    
    // Don't allow future dates
    if (newDate <= new Date()) {
      setDate(newDate);
    }
  };

  const handleDateSelect = (day: any) => {
    const selectedDate = new Date(day.year, day.month - 1, day.day);
    const currentDate = new Date();
    
    // Don't allow future dates
    if (selectedDate <= currentDate) {
      setShowCalendar(false);
      setDate(selectedDate);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#28a745" />
        <Text style={styles.loadingText}>Loading attendance...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Daily Attendance Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Daily Attendance</Text>
      </View>

      {/* Student Info Card */}
      {studentInfo && (
        <View style={styles.studentInfoCard}>
          <View style={styles.studentInfoRow}>
            <MaterialIcons name="school" size={24} color="#28a745" />
            <Text style={styles.studentInfoText}>
              {studentInfo.grade}
            </Text>
          </View>
          <View style={styles.studentInfoRow}>
            <MaterialIcons name="event" size={24} color="#28a745" />
            <Text style={styles.studentInfoText}>
              {studentInfo.schoolYear}
            </Text>
          </View>
        </View>
      )}

      {error && (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.datePickerCard}>
        <View style={styles.dateSelector}>
          <TouchableOpacity 
            style={styles.dateArrowButton}
            onPress={() => changeDate(-1)}
          >
            <MaterialIcons name="chevron-left" size={28} color="#28a745" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={() => setShowCalendar(true)}
            style={styles.dateDisplay}
          >
            <MaterialIcons name="calendar-today" size={24} color="#28a745" />
            <Text style={styles.dateText}>
              {date.toLocaleDateString('en-US', { 
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.dateArrowButton}
            onPress={() => changeDate(1)}
          >
            <MaterialIcons name="chevron-right" size={28} color="#28a745" />
          </TouchableOpacity>
        </View>

        {/* Calendar Modal */}
        <Modal
          visible={showCalendar}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowCalendar(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.calendarContainer}>
              <View style={styles.calendarHeader}>
                <Text style={styles.calendarTitle}>Select Date</Text>
                <TouchableOpacity onPress={() => setShowCalendar(false)}>
                  <MaterialIcons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>
              <Calendar
                onDayPress={handleDateSelect}
                maxDate={new Date().toISOString().split('T')[0]}
                markedDates={{
                  [date.toISOString().split('T')[0]]: {
                    selected: true,
                    selectedColor: '#28a745'
                  }
                }}
                theme={{
                  todayTextColor: '#28a745',
                  selectedDayBackgroundColor: '#28a745',
                  arrowColor: '#28a745',
                }}
              />
            </View>
          </View>
        </Modal>

        {/* Daily Subject Attendance */}
        <View style={styles.dailyAttendanceContainer}>
          <Text style={styles.sectionTitle}>Classes</Text>
          {dailyAttendance.map((subject, index) => (
            <View key={index} style={styles.dailyAttendanceCard}>
              <View style={styles.subjectInfoContainer}>
                <View style={styles.subjectIconContainer}>
                  <MaterialIcons name="book" size={22} color="#28a745" />
                </View>
                <View style={styles.subjectInfo}>
                  <Text style={styles.subjectName}>{subject.subject_name}</Text>
                  <View style={styles.timeContainer}>
                    <MaterialIcons name="access-time" size={14} color="#666" />
                    <Text style={styles.subjectTime}>{subject.time_range}</Text>
                  </View>
                </View>
                <View style={[styles.statusContainer, { backgroundColor: getStatusColor(subject.attendance_status) + '20' }]}>
                  <MaterialIcons 
                    name={getStatusIcon(subject.attendance_status)} 
                    size={18} 
                    color={getStatusColor(subject.attendance_status)} 
                  />
                  <Text style={[styles.statusText, { color: getStatusColor(subject.attendance_status) }]}>
                    {subject.attendance_status}
                  </Text>
                </View>
              </View>
            </View>
          ))}
          {dailyAttendance.length === 0 && (
            <View style={styles.noDataContainer}>
              <MaterialIcons name="event-busy" size={48} color="#ccc" />
              <Text style={styles.noDataText}>No attendance records for this date</Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  studentInfoCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  studentInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  studentInfoText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
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
  datePickerCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flex: 1,
    minHeight: 500,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dateArrowButton: {
    padding: 8,
  },
  dateDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  dateText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
  },
  dailyAttendanceContainer: {
    marginTop: 20,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  dailyAttendanceCard: {
    backgroundColor: '#fff',
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  subjectInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subjectIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f8f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  subjectInfo: {
    flex: 1,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  subjectTime: {
    fontSize: 13,
    color: '#666',
    marginLeft: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  noDataContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  noDataText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
    marginTop: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    width: '90%',
    maxWidth: 400,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorCard: {
    backgroundColor: '#fee',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fcc',
  },
  errorText: {
    color: '#dc3545',
    textAlign: 'center',
    fontSize: 14,
  },
});
