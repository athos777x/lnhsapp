import axios from 'axios';

// For development on physical device, use your computer's IP address
// For emulator on Windows, use 10.0.2.2 instead of localhost
const BASE_URL = process.env.API_URL || 'http://10.0.2.2:3002';
// If using a physical device, replace 10.0.2.2 with your computer's IP address
// Example: const BASE_URL = 'http://192.168.1.100:3002';

// At the top of the file after the BASE_URL definition
console.log('API base URL:', BASE_URL);

// Types for API responses
interface LoginResponse {
  success: boolean;
  data?: {
    userId: number;
    role: string;
    username: string;
  };
  error?: string;
}

interface UserDetails {
  username: string;
  role_id: number;
  fullName: string;
  student_id?: string;
}

// Add this interface for school year response
interface SchoolYear {
  school_year: string;
  school_year_id: number;
}

interface SchoolYearResponse {
  success: boolean;
  data: SchoolYear[];
  error?: string;
}

interface TeacherSection {
  grade_level: string;
  section_name: string;
  subject_name: string;
  section_id: number;
  subject_id: number;
  time_range: string;
  day: string;
}

type Subject = {
  id: number;
  subject_id: number;
  subject_name: string;
  time_range: string;
};

interface TeacherSectionsResponse {
  success: boolean;
  data: TeacherSection[];
  error?: string;
}

interface EmployeeResponse {
  success: boolean;
  data: {
    employee_id: number;
  };
  error?: string;
}

// Add these interfaces
interface Student {
  id: string;
  stud_name: string;
  student_id: number;
  lrn?: string;
}

interface SectionStudentsResponse {
  success: boolean;
  data: Student[];
  error?: string;
}

// Add this interface
interface EmployeeDetails {
  employee_id: number;
  emp_name: string;
  address: string;
  contact_number: string;
}

interface EmployeeDetailsResponse {
  success: boolean;
  data: EmployeeDetails;
  error?: string;
}

interface AttendanceRecord {
  subject_id: number;
  status: 'present' | 'absent' | 'late';
  student_id: number;
  student_name: string;
}

interface AttendanceResponse {
  success: boolean;
  data?: {
    attendance_id: number;
    subject_id: number;
    status: 'P' | 'A' | 'L';
    student_id: number;
    student_name: string;
  };
  error?: string;
}

interface AttendanceRecordResponse {
  success: boolean;
  data: {
    attendance_id: number;
    subject_id: number;
    schedule_id: number;
    student_id: number;
    student_name: string;
    status: 'present' | 'absent' | 'late';
    date: string;
  }[];
  error?: string;
}

interface StudentProfile {
  student_id: number;
  stud_name: string;
  contact_number: string;
  birthday: string;
  gender: string;
  age: number;
  email_address: string;
  mother_name: string;
  father_name: string;
  home_address: string;
}

interface StudentProfileResponse {
  success: boolean;
  data: StudentProfile;
  error?: string;
}

interface StudentResponse {
  success: boolean;
  data: {
    student_id: number;
  };
  error?: string;
}

interface StudentDailyAttendance {
  section_grade: string;
  school_year: string;
  subject_name: string;
  time_range: string;
  attendance_status: 'Present' | 'Absent' | 'Late' | 'No Record';
}

interface StudentDailyAttendanceResponse {
  success: boolean;
  data: StudentDailyAttendance[];
  error?: string;
}

interface StudentSearchResult {
  student_id: string;
  lrn?: string | number;
  name: string;
  grade: string;
  section: string;
}

interface StudentSearchResponse {
  success: boolean;
  data?: StudentSearchResult;
  error?: string;
}

interface StudentsSearchResponse {
  success: boolean;
  data?: StudentSearchResult[];
  error?: string;
}

export const api = {
  // Fetch all users
  async getUsers() {
    try {
      const response = await axios.get(`${BASE_URL}/api/users`);
      return response.data;
    } catch (error) {
      console.error('API error:', error);
      throw error;
    }
  },

  // Add attendance record
  async addAttendance(attendanceData: {
    enrollment_id: number;
    schedule_id: number;
    status: string;
    student_id: number;
    student_name: string;
  }) {
    try {
      const response = await axios.post(`${BASE_URL}/api/attendance/add`, attendanceData);
      return response.data;
    } catch (error) {
      console.error('API error:', error);
      throw error;
    }
  },

  // Generic function to make GET requests
  async get(endpoint: string) {
    try {
      const response = await axios.get(`${BASE_URL}${endpoint}`);
      return response.data;
    } catch (error) {
      console.error('API error:', error);
      throw error;
    }
  },

  // Generic function to make POST requests
  async post(endpoint: string, data: any) {
    try {
      const response = await axios.post(`${BASE_URL}${endpoint}`, data);
      return response.data;
    } catch (error) {
      console.error('API error:', error);
      throw error;
    }
  },

  // Login function
  async login(username: string, password: string): Promise<LoginResponse> {
    try {
      const response = await axios.post(`${BASE_URL}/api/login`, {
        username,
        password,
      });
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  // Get user details
  async getUserDetails(userId: number): Promise<UserDetails> {
    try {
      const response = await axios.get(`${BASE_URL}/api/users/${userId}`);
      return response.data.data;
    } catch (error) {
      console.error('Get user details error:', error);
      throw error;
    }
  },

  // Get school years
  async getSchoolYears(): Promise<SchoolYear[]> {
    try {
      const response = await axios.get<SchoolYearResponse>(`${BASE_URL}/api/school-years`);
      return response.data.data;
    } catch (error) {
      console.error('Get school years error:', error);
      throw error;
    }
  },

  // Get teacher sections
  async getTeacherSections(employeeId: number, schoolYearId: number): Promise<TeacherSection[]> {
    try {
      const response = await axios.get<TeacherSectionsResponse>(
        `${BASE_URL}/api/teacher/sections/${employeeId}/${schoolYearId}`
      );
      return response.data.data;
    } catch (error) {
      console.error('Get teacher sections error:', error);
      throw error;
    }
  },

  // Add this new method
  async getEmployeeId(userId: number): Promise<number> {
    try {
      const response = await axios.get<EmployeeResponse>(
        `${BASE_URL}/api/employee/${userId}`
      );
      return response.data.data.employee_id;
    } catch (error) {
      console.error('Get employee ID error:', error);
      throw error;
    }
  },

  // Get students in a section
  async getSectionStudents(sectionId: number): Promise<Student[]> {
    try {
      const response = await axios.get<SectionStudentsResponse>(
        `${BASE_URL}/api/section/${sectionId}/students`
      );
      return response.data.data;
    } catch (error) {
      console.error('Get section students error:', error);
      throw error;
    }
  },

  // Get employee details
  async getEmployeeDetails(employeeId: number): Promise<EmployeeDetails> {
    try {
      const response = await axios.get<EmployeeDetailsResponse>(
        `${BASE_URL}/api/employee/details/${employeeId}`
      );
      return response.data.data;
    } catch (error) {
      console.error('Get employee details error:', error);
      throw error;
    }
  },

  // Add this function to get school year ID from school year string
  async getSchoolYearId(schoolYear: string): Promise<number> {
    try {
      const response = await axios.get(`${BASE_URL}/api/school-year-id/${schoolYear}`);
      return response.data.id;
    } catch (error) {
      console.error('Get school year ID error:', error);
      throw error;
    }
  },

  // Record student attendance
  async recordAttendance(data: AttendanceRecord): Promise<AttendanceResponse> {
    try {
      const response = await axios.post(`${BASE_URL}/api/attendance/record`, data);
      return response.data;
    } catch (error) {
      console.error('Record attendance error:', error);
      throw error;
    }
  },

  // Get attendance records for a schedule and date
  async getAttendanceRecords(subjectId: number, date: string): Promise<AttendanceRecordResponse> {
    try {
      const response = await axios.get(`${BASE_URL}/api/attendance/${subjectId}/${date}`);
      return response.data;
    } catch (error) {
      console.error('Get attendance records error:', error);
      throw error;
    }
  },

  // Get student profile
  async getStudentProfile(studentId: number): Promise<StudentProfile> {
    try {
      const response = await axios.get<StudentProfileResponse>(
        `${BASE_URL}/api/student/profile/${studentId}`
      );
      return response.data.data;
    } catch (error) {
      console.error('Get student profile error:', error);
      throw error;
    }
  },

  // Get student ID from user ID
  async getStudentId(userId: number): Promise<number> {
    try {
      const response = await axios.get<StudentResponse>(
        `${BASE_URL}/api/student/${userId}`
      );
      return response.data.data.student_id;
    } catch (error) {
      console.error('Get student ID error:', error);
      throw error;
    }
  },

  // Get student daily attendance
  async getStudentDailyAttendance(
    studentId: number,
    day: string,
    date: string
  ): Promise<StudentDailyAttendance[]> {
    try {
      const response = await axios.get<StudentDailyAttendanceResponse>(
        `${BASE_URL}/api/student/attendance/${studentId}/${day}/${encodeURIComponent(date)}`
      );
      return response.data.data;
    } catch (error) {
      console.error('Get student daily attendance error:', error);
      throw error;
    }
  },

  // Search student by ID
  async searchStudentById(studentId: string): Promise<StudentSearchResult | null> {
    try {
      console.log(`API call: searchStudentById with ID: ${studentId}`);
      
      // Validate ID is a number before making request
      const numericId = parseInt(studentId, 10);
      if (isNaN(numericId)) {
        console.warn('Invalid student ID (not a number):', studentId);
        return null;
      }
      
      const response = await axios.get<StudentSearchResponse>(
        `${BASE_URL}/api/student/search/${studentId}`
      );
      
      console.log(`API response for student ID ${studentId}:`, response.data);
      
      return response.data.data || null;
    } catch (error: any) {
      console.error(`Search student error for ID ${studentId}:`, error);
      
      // Add more detailed error logging
      if (error.response) {
        console.error(`Response status: ${error.response.status}`);
        console.error('Response data:', error.response.data);
      }
      
      throw error;
    }
  },
  
  // Search students by various criteria
  async searchStudents(searchParams: { 
    name?: string; 
    grade?: string; 
    section?: string;
    lrn?: string;
  }): Promise<StudentSearchResult[]> {
    try {
      const response = await axios.get<StudentsSearchResponse>(
        `${BASE_URL}/api/students/search`, 
        { params: searchParams }
      );
      return response.data.data || [];
    } catch (error) {
      console.error('Search students error:', error);
      throw error;
    }
  },

  // Add a diagnostic function to the api object
  async testConnection(): Promise<boolean> {
    try {
      console.log('Testing API connection to:', BASE_URL);
      const response = await axios.get(`${BASE_URL}/api/db-test`);
      console.log('Connection test response:', response.data);
      return response.data.success === true;
    } catch (error: any) {
      console.error('API connection test failed:', error);
      if (error.code === 'ECONNREFUSED') {
        console.error('Connection refused. Check if server is running and BASE_URL is correct.');
      }
      return false;
    }
  },

  // Add a method to get the base URL
  getBaseUrl(): string {
    return BASE_URL;
  },

  // Update Brigada Eskwela attendance status
  async updateBrigadaStatus(studentId: number, status: boolean): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await axios.put(`${BASE_URL}/api/brigada-eskwela/${studentId}`, {
        brigada_attendance: status ? 1 : 0
      });
      return response.data;
    } catch (error: any) {
      console.error('API error updating brigada status:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to update brigada status'
      };
    }
  },

  // Update Brigada Eskwela remarks
  async updateBrigadaRemarks(studentId: number, remarks: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await axios.post(`${BASE_URL}/api/brigada-eskwela/remarks`, {
        studentId,
        remarks
      });
      return response.data;
    } catch (error: any) {
      console.error('API error updating brigada remarks:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to update brigada remarks'
      };
    }
  },

  // Get Brigada Eskwela status for a student
  async getBrigadaStatus(studentId: number): Promise<{ 
    success: boolean; 
    data?: { status: 'Yes' | 'No'; remarks: string }; 
    error?: string 
  }> {
    try {
      const response = await axios.get(`${BASE_URL}/api/brigada-eskwela/${studentId}`);
      return response.data;
    } catch (error: any) {
      console.error('API error getting brigada status:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to get brigada status'
      };
    }
  },
};

export default api; 