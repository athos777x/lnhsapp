import { View, Text, StyleSheet, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useEffect, useState } from 'react';
import { api } from '../../services/api';

// Use the TEC-IT barcode generator service
const BarcodeImage = ({ value }: { value: string }) => {
  // Generate a URL to the barcode service
  const getBarcodeUrl = (studentId: string) => {
    // Construct the URL to the TEC-IT barcode service
    return `https://barcode.tec-it.com/barcode.ashx?data=${studentId}&code=Code128&translate-esc=on&dpi=96&height=30&width=50&quietzone=0`;
  };

  return (
    <View style={styles.barcodeWrapper}>
      <Image
        source={{ uri: getBarcodeUrl(value) }}
        style={styles.barcodeImage}
        resizeMode="contain"
      />
    </View>
  );
};

export default function ScanScreen() {
  const { userData } = useAuth();
  const [studentId, setStudentId] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStudentId = async () => {
      if (userData?.userId) {
        try {
          const userDetails = await api.getUserDetails(userData.userId);
          if (userDetails.student_id) {
            const id = userDetails.student_id.toString();
            setStudentId(id);
          }
        } catch (error) {
          console.error('Error fetching student ID:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchStudentId();
  }, [userData?.userId]);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Text>Loading...</Text>
      </View>
    );
  }

  // Pad the student ID to ensure it's at least 8 characters (for better scanning)
  const paddedStudentId = studentId.padStart(8, '0');

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Student ID and Barcode</Text>
        </View>
        <View style={styles.idCard}>
          <MaterialIcons name="person" size={40} color="#28a745" />
          <Text style={styles.idNumber}>{paddedStudentId}</Text>
          
          <View style={styles.barcodeContainer}>
            <BarcodeImage value={paddedStudentId} />
          </View>
        </View>
        <View style={styles.divider} />
        <Text style={styles.instruction}>Show this ID/barcode to your teacher</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    marginBottom: 16,
    marginHorizontal: -20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  idCard: {
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
  idNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
    marginBottom: 20,
  },
  barcodeContainer: {
    marginTop: 10,
    padding: 0,
    backgroundColor: '#fff',
    alignItems: 'center',
    width: '100%',
    borderRadius: 8,
  },
  barcodeWrapper: {
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 10,
    width: '100%',
  },
  barcodeImage: {
    width: 260,
    height: 120,
  },
  barcodeText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#333',
    marginTop: 8,
  },
  attribution: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#e9ecef',
    marginVertical: 20,
    width: '100%',
  },
  instruction: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
}); 