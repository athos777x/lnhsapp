import { View, Text, StyleSheet, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export default function ScanScreen() {
  const sampleStudentId = '2024001'; // Sample student ID

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Student ID</Text>
        <View style={styles.idCard}>
          <MaterialIcons name="person" size={40} color="#28a745" />
          <Text style={styles.idNumber}>{sampleStudentId}</Text>
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