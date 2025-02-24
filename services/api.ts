import axios from 'axios';

// For development on physical device, use your computer's IP address
// For emulator on Windows, use 10.0.2.2 instead of localhost
const BASE_URL = process.env.API_URL || 'http://10.0.2.2:3002';
// If using a physical device, replace 10.0.2.2 with your computer's IP address
// Example: const BASE_URL = 'http://192.168.1.100:3002';

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
interface SchoolYearResponse {
  success: boolean;
  data: string[];
  error?: string;
}

interface TeacherSection {
  grade_level: string;
  section_name: string;
  subject_name: string;
  section_id: number;
  subject_id: number;
}

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
  async getSchoolYears(): Promise<string[]> {
    try {
      const response = await axios.get<SchoolYearResponse>(`${BASE_URL}/api/school-years`);
      return response.data.data;
    } catch (error) {
      console.error('Get school years error:', error);
      throw error;
    }
  },

  // Get teacher sections
  async getTeacherSections(employeeId: number): Promise<TeacherSection[]> {
    try {
      const response = await axios.get<TeacherSectionsResponse>(
        `${BASE_URL}/api/teacher/sections/${employeeId}`
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
  }
};

export default api; 