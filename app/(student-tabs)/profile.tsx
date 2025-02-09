import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState, useEffect } from 'react';
import { api } from '../../services/api';

type StudentProfile = {
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  grade: string;
  birthday: string;
  gender: string;
  age: number;
  homeAddress: string;
  barangay: string;
  cityMunicipality: string;
  province: string;
  contactNumber: string;
  mothersName: string;
  fathersName: string;
};

export default function ProfileScreen() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const userDetails = await api.getUserDetails(1);
        // Transform API data to match our profile structure
        setProfile({
          firstName: "Elo",
          middleName: "L",
          lastName: "Plateros",
          email: "elo_p@lnhs.com",
          grade: "Grade 10",
          birthday: "May 10, 2005",
          gender: "Male",
          age: 16,
          homeAddress: "123 Main St",
          barangay: "Brgy. 1",
          cityMunicipality: "City A",
          province: "Province A",
          contactNumber: "555-1234",
          mothersName: "Jane Doe",
          fathersName: "John Doe"
        });
      } catch (error) {
        console.error('Error fetching user profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const handleLogout = () => {
    router.replace('/login');
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
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
          <Text style={styles.name}>{profile?.firstName} {profile?.middleName}. {profile?.lastName}</Text>
          <Text style={styles.email}>{profile?.email}</Text>
          <View style={styles.gradeBadge}>
            <MaterialIcons name="school" size={16} color="#28a745" style={styles.gradeIcon} />
            <Text style={styles.gradeText}>{profile?.grade}</Text>
          </View>
        </View>
      </View>

      {/* Student Details Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Student Details</Text>
        <View style={styles.infoList}>
          <View style={styles.infoRow}>
            <MaterialIcons name="cake" size={20} color="#28a745" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Birthday</Text>
              <Text style={styles.infoValue}>{profile?.birthday}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <MaterialIcons name="school" size={20} color="#28a745" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Grade Level</Text>
              <Text style={styles.infoValue}>{profile?.grade}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <MaterialIcons name="person" size={20} color="#28a745" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Gender</Text>
              <Text style={styles.infoValue}>{profile?.gender}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <MaterialIcons name="event" size={20} color="#28a745" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Age</Text>
              <Text style={styles.infoValue}>{profile?.age}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Standard Information Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Personal Information</Text>
        <View style={styles.infoList}>
          <View style={styles.infoRow}>
            <MaterialIcons name="person-outline" size={20} color="#28a745" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Full Name</Text>
              <Text style={styles.infoValue}>{profile?.firstName} {profile?.middleName}. {profile?.lastName}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <MaterialIcons name="email" size={20} color="#28a745" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Email Address</Text>
              <Text style={styles.infoValue}>{profile?.email}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <MaterialIcons name="home" size={20} color="#28a745" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Address</Text>
              <Text style={styles.infoValue}>{profile?.homeAddress}, {profile?.barangay}, {profile?.cityMunicipality}, {profile?.province}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <MaterialIcons name="phone" size={20} color="#28a745" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Contact Number</Text>
              <Text style={styles.infoValue}>{profile?.contactNumber}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <MaterialIcons name="people" size={20} color="#28a745" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Parents</Text>
              <Text style={styles.infoValue}>Mother: {profile?.mothersName}</Text>
              <Text style={styles.infoValue}>Father: {profile?.fathersName}</Text>
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
  gradeBadge: {
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  gradeIcon: {
    marginRight: 2,
  },
  gradeText: {
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
});
