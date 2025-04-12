import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

type StudentProfile = {
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
};

export default function ProfileScreen() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [username, setUsername] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { userData } = useAuth();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setIsLoading(true);
        setError(null);

        if (!userData?.userId) {
          throw new Error('User not logged in');
        }

        // Get the username
        const userDetails = await api.getUserDetails(userData.userId);
        setUsername(userDetails.username);

        // Get the student ID
        const studentId = await api.getStudentId(userData.userId);
        
        // Then get the student profile details
        const studentDetails = await api.getStudentProfile(studentId);
        setProfile(studentDetails);
      } catch (error) {
        console.error('Error fetching user profile:', error);
        setError('Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, [userData]);

  const handleLogout = () => {
    router.replace('/login');
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#28a745" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (error || !profile) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || 'Profile not found'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => router.replace('/login')}>
          <Text style={styles.retryButtonText}>Return to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <MaterialIcons name="person" size={32} color="#28a745" />
          </View>
          <Text style={styles.name}>{profile.stud_name}</Text>
          <Text style={styles.email}>{username}</Text>
          <View style={styles.departmentBadge}>
            <Text style={styles.departmentText}>Student</Text>
          </View>
        </View>
      </View>

      {/* Student Details Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Student Details</Text>
        <View style={styles.infoList}>
          <View style={styles.infoRow}>
            <MaterialIcons name="badge" size={20} color="#28a745" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Student ID</Text>
              <Text style={styles.infoValue}>{profile.student_id}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <MaterialIcons name="cake" size={20} color="#28a745" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Birthday</Text>
              <Text style={styles.infoValue}>{profile.birthday}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <MaterialIcons name="person" size={20} color="#28a745" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Gender</Text>
              <Text style={styles.infoValue}>{profile.gender}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <MaterialIcons name="timer" size={20} color="#28a745" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Age</Text>
              <Text style={styles.infoValue}>{profile.age} years old</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Contact Information Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact Information</Text>
        <View style={styles.infoList}>
          <View style={styles.infoRow}>
            <MaterialIcons name="home" size={20} color="#28a745" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Address</Text>
              <Text style={styles.infoValue}>{profile.home_address}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <MaterialIcons name="phone" size={20} color="#28a745" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Contact Number</Text>
              <Text style={styles.infoValue}>{profile.contact_number || 'N/A'}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <MaterialIcons name="email" size={20} color="#28a745" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Email Address</Text>
              <Text style={styles.infoValue}>{profile.email_address || 'N/A'}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Parents Information Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Parents Information</Text>
        <View style={styles.infoList}>
          <View style={styles.infoRow}>
            <MaterialIcons name="face" size={20} color="#28a745" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Mother's Name</Text>
              <Text style={styles.infoValue}>{profile.mother_name || 'N/A'}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <MaterialIcons name="face" size={20} color="#28a745" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Father's Name</Text>
              <Text style={styles.infoValue}>{profile.father_name || 'N/A'}</Text>
            </View>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <MaterialIcons name="logout" size={20} color="#fff" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#fff',
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderRadius: 24,
    margin: 16,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  avatarContainer: {
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e8f5e9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  name: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  departmentBadge: {
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  departmentText: {
    color: '#28a745',
    fontSize: 14,
    fontWeight: '500',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  infoList: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    gap: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    margin: 24,
    backgroundColor: '#dc3545',
    borderRadius: 12,
    gap: 6,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  logoutText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
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
    backgroundColor: '#f8f9fa',
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
});
