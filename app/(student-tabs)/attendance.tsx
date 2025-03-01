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

      {/* Date Selector */}
      <View style={styles.datePickerCard}>
        <Text style={styles.datePickerTitle}>Daily Attendance</Text>
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
          {dailyAttendance.map((subject, index) => (
            <View key={index} style={styles.dailyAttendanceItem}>
              <View style={styles.subjectInfo}>
                <Text style={styles.subjectName}>{subject.subject_name}</Text>
                <Text style={styles.subjectTime}>{subject.time_range}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(subject.attendance_status) }]}>
                <Text style={styles.statusBadgeText}>{subject.attendance_status}</Text>
              </View>
            </View>
          ))}
          {dailyAttendance.length === 0 && (
            <Text style={styles.noDataText}>No attendance records for this date</Text>
          )}
        </View>
      </View>

      {/* Subject-wise Overall Attendance */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Subject Overall Attendance</Text>
        {/* ... */}
      </View>

      {/* Overall Attendance Summary */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Overall Attendance</Text>
        <View style={styles.summaryContent}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>85.5%</Text>
            <Text style={styles.summaryLabel}>Present</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>14.5%</Text>
            <Text style={styles.summaryLabel}>Absent</Text>
          </View>
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
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
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
    marginTop: 16,
  },
  dailyAttendanceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  subjectInfo: {
    flex: 1,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  subjectTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  summaryCard: {
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
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  summaryContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#28a745',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: '#ddd',
  },
  section: {
    marginBottom: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  subjectCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  subjectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  percentageText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#28a745',
  },
  attendanceBar: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    marginBottom: 8,
  },
  attendanceProgress: {
    height: '100%',
    backgroundColor: '#28a745',
    borderRadius: 4,
  },
  attendanceText: {
    fontSize: 12,
    color: '#666',
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
  noDataText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
    padding: 20,
  }
});
