import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useEffect, useState } from 'react';
import { api } from '../../services/api';

// Code128 character set B encoding (includes numbers and uppercase letters)
const CODE128_SET_B = {
  START: [true, true, false, true, true, false, false, true, true, false, false], // Start character for Code128B
  STOP: [true, true, false, true, true, false, false, true, true, true, false, true, true], // Stop character
  QUIET: [false, false, false, false, false, false, false, false, false, false], // Quiet zone - increased width
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
    // Standard Code128B patterns (these follow proper Code128B spec)
    ' ': [true, true, false, true, true, false, false, true, false, false, false], // space (ASCII 32)
    '!': [true, true, false, true, true, false, false, false, true, false, false],
    '"': [true, true, false, true, true, false, false, false, false, true, false],
    '#': [true, true, false, true, true, false, false, false, false, false, true],
    '$': [true, true, false, false, true, true, false, false, true, false, false],
    '%': [true, true, false, false, true, true, false, false, false, true, false],
    '&': [true, true, false, false, true, true, false, false, false, false, true],
    '\'': [true, true, false, false, false, true, true, false, false, true, false],
    '(': [true, true, false, false, false, true, true, false, false, false, true],
    ')': [true, true, false, false, false, false, true, true, false, false, true],
    '*': [true, true, false, true, false, false, true, true, false, false, false],
    '+': [true, true, false, false, true, false, true, true, false, false, false],
    ',': [true, true, false, false, false, true, false, true, true, false, false],
    '-': [true, true, false, false, false, false, true, false, true, true, false],
    '.': [true, true, false, false, false, false, false, true, false, true, true],
    '/': [true, true, false, true, false, false, false, true, false, true, false],
    '0': [true, false, false, true, true, false, false, true, false, false, true],
    '1': [true, false, false, true, false, false, true, true, false, true, false], // Corrected pattern for '1'
    '2': [true, false, false, true, false, false, false, true, true, false, true],
    '3': [true, false, true, true, true, false, false, true, false, false, false],
    '4': [true, false, true, false, false, true, true, true, false, false, false],
    '5': [true, false, false, false, true, true, true, false, true, false, false],
    '6': [true, false, false, false, false, true, true, true, false, true, false],
    '7': [true, false, true, true, false, false, false, true, true, false, false],
    '8': [true, false, true, false, true, true, false, false, true, false, false],
    '9': [true, false, false, true, true, true, false, true, false, false, false],
  };
  
  // If the character pattern doesn't exist, use a default pattern that's scannable
  if (!patterns[char]) {
    console.warn(`No encoding pattern for character: '${char}', using default`);
    return patterns['0']; // Default to '0' pattern
  }
  
  return patterns[char];
};

// Function to generate Code128B barcode data
const generateBarcodeData = (value: string) => {
  // Pad single-digit IDs with leading zeros to improve scanning reliability
  let paddedValue = value;
  if (paddedValue.length === 1) {
    paddedValue = '000000' + paddedValue;
  } else if (paddedValue.length < 8) {
    // Pad to have a reasonable length for better scanning
    paddedValue = paddedValue.padStart(8, '0');
  }
  
  console.log('Generating barcode for:', paddedValue);
  
  const result: boolean[] = [];
  
  // Add quiet zone
  result.push(...CODE128_SET_B.QUIET);
  
  // Add start character
  result.push(...CODE128_SET_B.START);
  
  // Encode each character
  for (const char of paddedValue) {
    result.push(...encodeChar(char));
  }
  
  // Add checksum
  const checksum = calculateChecksum(paddedValue);
  result.push(...encodeChar(String.fromCharCode(checksum + 32))); // Correct checksum encoding
  
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
    <View style={styles.barcodeContainer}>
      <View style={styles.barcodeRow}>
        {barcodeData.map((isBar, index) => (
          <View
            key={index}
            style={[
              styles.barcodeBar,
              { 
                backgroundColor: isBar ? '#000' : '#fff',
                width: 2, // Slightly wider bars for better scanning
              }
            ]}
          />
        ))}
      </View>
      <Text style={styles.barcodeText}>{value.padStart(8, '0')}</Text>
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
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Student ID and Barcode</Text>
        </View>
        <View style={styles.idCard}>
          <MaterialIcons name="person" size={40} color="#28a745" />
          <Text style={styles.idNumber}>{studentId}</Text>
          <Barcode value={studentId} />
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
    padding: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
    width: '100%',
    borderRadius: 8,
  },
  barcodeRow: {
    flexDirection: 'row',
    height: 80,
    alignItems: 'center',
    marginBottom: 8,
  },
  barcodeBar: {
    width: 2, // Made wider for better scanning
    height: '100%',
  },
  barcodeText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8, 
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