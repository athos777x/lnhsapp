import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useEffect, useState } from 'react';
import { api } from '../../services/api';

// Code128 character set B encoding (includes numbers and uppercase letters)
const CODE128_SET_B = {
  START: [true, true, false, true, true, false, false, true, true, false, false], // Start character for Code128B
  STOP: [true, true, false, true, true, false, false, true, true, true, false, true, true], // Stop character
  QUIET: [false, false, false, false], // Quiet zone
};

// Function to calculate Code128 checksum
const calculateChecksum = (value: string) => {
  let sum = 104; // Start B value
  for (let i = 0; i < value.length; i++) {
    sum += (value.charCodeAt(i) - 32) * (i + 1);
  }
  return sum % 103;
};

// Function to encode a single character in Code128B
const encodeChar = (char: string): boolean[] => {
  // Code128B encoding patterns for ASCII values 32-127
  const patterns: { [key: string]: boolean[] } = {
    '0': [true,true,false,false,true,true,false,false,true,true,false],
    '1': [true,true,false,false,true,true,false,true,true,false,false],
    '2': [true,true,false,true,true,false,false,true,true,false,false],
    '3': [true,false,false,true,false,false,true,true,false,false,false],
    '4': [true,false,false,true,false,true,true,false,false,false,false],
    '5': [true,false,true,true,false,false,true,false,false,false,false],
    '6': [true,false,false,true,true,false,true,false,false,false,false],
    '7': [true,false,false,true,true,false,false,true,false,false,false],
    '8': [true,true,false,false,true,false,true,false,false,false,false],
    '9': [true,true,false,true,true,false,true,false,false,false,false],
  };
  return patterns[char] || patterns['0']; // Default to '0' pattern if character not found
};

// Function to generate Code128B barcode data
const generateBarcodeData = (value: string) => {
  const result: boolean[] = [];
  
  // Add quiet zone
  result.push(...CODE128_SET_B.QUIET);
  
  // Add start character
  result.push(...CODE128_SET_B.START);
  
  // Encode each character
  for (const char of value) {
    result.push(...encodeChar(char));
  }
  
  // Add checksum
  const checksum = calculateChecksum(value);
  result.push(...encodeChar(checksum.toString()));
  
  // Add stop character
  result.push(...CODE128_SET_B.STOP);
  
  // Add quiet zone
  result.push(...CODE128_SET_B.QUIET);
  
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
    width: 1, // Made thinner for better scanning
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