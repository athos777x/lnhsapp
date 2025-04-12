import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useEffect, useState } from 'react';
import { api } from '../../services/api';

// Function to generate simple barcode data
const generateBarcodeData = (value: string) => {
  const result: boolean[] = [];
  // Start with quiet zone
  result.push(false, false);
  
  // Convert each character to binary pattern
  for (const char of value) {
    const code = char.charCodeAt(0);
    const binary = code.toString(2).padStart(8, '0');
    for (const bit of binary) {
      result.push(bit === '1');
      // Add separator between bits
      result.push(false);
    }
  }
  
  // End with quiet zone
  result.push(false, false);
  return result;
};

// Simple Barcode component using Views
const Barcode = ({ value }: { value: string }) => {
  const barcodeData = generateBarcodeData(value);
  
  return (
    <View style={styles.barcodeRow}>
      {barcodeData.map((isBar, index) => (
        <View
          key={index}
          style={[
            styles.barcodeBar,
            { backgroundColor: isBar ? '#000' : '#fff' }
          ]}
        />
      ))}
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
            setStudentId(userDetails.student_id.toString());
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

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Student ID</Text>
        <View style={styles.idCard}>
          <MaterialIcons name="person" size={40} color="#28a745" />
          <Text style={styles.idNumber}>{studentId}</Text>
          <View style={styles.barcodeContainer}>
            <Barcode value={studentId} />
          </View>
        </View>
        <View style={styles.divider} />
        <Text style={styles.instruction}>Show this ID to your teacher</Text>
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
    padding: 20,
    alignItems: 'center',
    marginTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#28a745',
    marginBottom: 20,
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
    padding: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  barcodeRow: {
    flexDirection: 'row',
    height: 80,
    alignItems: 'center',
  },
  barcodeBar: {
    width: 2,
    height: '100%',
  },
  divider: {
    height: 1,
    backgroundColor: '#e9ecef',
    width: '100%',
    marginVertical: 20,
  },
  instruction: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
}); 