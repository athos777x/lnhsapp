import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Calendar } from 'react-native-calendars';

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

export default function AttendanceScreen() {
  const [date, setDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDateAttendance, setSelectedDateAttendance] = useState<DailySubjectAttendance[]>([
    { id: 1, name: 'Mathematics', status: 'pending', time: '8:00 AM' },
    { id: 2, name: 'Science', status: 'pending', time: '9:00 AM' },
    { id: 3, name: 'English', status: 'pending', time: '10:00 AM' },
    { id: 4, name: 'History', status: 'pending', time: '11:00 AM' },
  ]);

  // Mock data for overall attendance
  const subjects: Subject[] = [
    { id: 1, name: 'Mathematics', present: 15, total: 20 },
    { id: 2, name: 'Science', present: 18, total: 20 },
    { id: 3, name: 'English', present: 17, total: 20 },
    { id: 4, name: 'History', present: 19, total: 20 },
  ];

  const recentAttendance: AttendanceDay[] = [
    { date: '2024-01-31', status: 'present' },
    { date: '2024-01-30', status: 'present' },
    { date: '2024-01-29', status: 'absent' },
    { date: '2024-01-28', status: 'present' },
    { date: '2024-01-27', status: 'present' },
  ];

  const getStatusColor = (status: AttendanceStatus): string => {
    switch (status) {
      case 'present':
        return '#28a745';
      case 'absent':
        return '#dc3545';
      case 'pending':
        return '#6c757d';
      case 'late':
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
      // Update attendance statuses based on the selected date
      const updatedAttendance: DailySubjectAttendance[] = [
        { id: 1, name: 'Mathematics', status: getSubjectStatus('8:00 AM', newDate), time: '8:00 AM' },
        { id: 2, name: 'Science', status: getSubjectStatus('9:00 AM', newDate), time: '9:00 AM' },
        { id: 3, name: 'English', status: getSubjectStatus('10:00 AM', newDate), time: '10:00 AM' },
        { id: 4, name: 'History', status: getSubjectStatus('11:00 AM', newDate), time: '11:00 AM' },
      ];
      setSelectedDateAttendance(updatedAttendance);
    }
  };

  const handleDateSelect = (day: any) => {
    // Create date at start of day in local timezone
    const selectedDate = new Date(day.year, day.month - 1, day.day);
    const currentDate = new Date();
    
    // Don't allow future dates
    if (selectedDate <= currentDate) {
      setShowCalendar(false);
      setDate(selectedDate);
      // Update attendance statuses based on the selected date
      const updatedAttendance: DailySubjectAttendance[] = [
        { id: 1, name: 'Mathematics', status: getSubjectStatus('8:00 AM', selectedDate), time: '8:00 AM' },
        { id: 2, name: 'Science', status: getSubjectStatus('9:00 AM', selectedDate), time: '9:00 AM' },
        { id: 3, name: 'English', status: getSubjectStatus('10:00 AM', selectedDate), time: '10:00 AM' },
        { id: 4, name: 'History', status: getSubjectStatus('11:00 AM', selectedDate), time: '11:00 AM' },
      ];
      setSelectedDateAttendance(updatedAttendance);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Student Info Card */}
      <View style={styles.studentInfoCard}>
        <View style={styles.studentInfoRow}>
          <MaterialIcons name="school" size={24} color="#28a745" />
          <Text style={styles.studentInfoText}>
            Grade {STUDENT_INFO.grade} - {STUDENT_INFO.section}
          </Text>
        </View>
        <View style={styles.studentInfoRow}>
          <MaterialIcons name="event" size={24} color="#28a745" />
          <Text style={styles.studentInfoText}>
            School Year {STUDENT_INFO.schoolYear}
          </Text>
        </View>
      </View>

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
          {selectedDateAttendance.map((subject) => (
            <View key={subject.id} style={styles.dailyAttendanceItem}>
              <View style={styles.subjectInfo}>
                <Text style={styles.subjectName}>{subject.name}</Text>
                <Text style={styles.subjectTime}>{subject.time}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(subject.status) }]}>
                <Text style={styles.statusBadgeText}>
                  {subject.status.charAt(0).toUpperCase() + subject.status.slice(1)}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Subject-wise Overall Attendance */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Subject Overall Attendance</Text>
        {subjects.map((subject) => (
          <View key={subject.id} style={styles.subjectCard}>
            <View style={styles.subjectHeader}>
              <Text style={styles.subjectName}>{subject.name}</Text>
              <Text style={styles.percentageText}>
                {calculatePercentage(subject.present, subject.total)}%
              </Text>
            </View>
            <View style={styles.attendanceBar}>
              <View 
                style={[
                  styles.attendanceProgress, 
                  { width: `${(subject.present / subject.total) * 100}%` }
                ]} 
              />
            </View>
            <Text style={styles.attendanceText}>
              {subject.present} present out of {subject.total} classes
            </Text>
          </View>
        ))}
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
});
