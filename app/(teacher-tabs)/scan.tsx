import React, { useLayoutEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, Keyboard, SafeAreaView, Modal, Vibration, ActivityIndicator, FlatList, Animated } from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { Camera } from 'expo-camera';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { useNavigation } from '@react-navigation/native';
import api from '../../services/api';
import * as Haptics from 'expo-haptics';
import axios from 'axios';

type SchoolYear = {
  school_year: string;
  school_year_id: number;
};

type StudentInfo = {
  name: string;
  grade: string;
  section: string;
};

type Subject = {
  id: string;
  name: string;
  code: string;
};

type TeacherSubjects = {
  [gradeSection: string]: Subject[];
};

// Update the BrigadaStatus type
type BrigadaStatus = {
  status: 'Yes' | 'No';
  remarks?: string;
};

type StudentSearchResult = {
  student_id: string;
  lrn?: string | number;
  name: string;
  grade: string;
  section: string;
};

const ScanScreen: React.FC = () => {
  const [studentId, setStudentId] = useState('');
  const [scannedStudent, setScannedStudent] = useState<{
    id: string;
    lrn?: string;
    name: string;
    grade: string;
    section: string;
    brigadaStatus?: BrigadaStatus;
  } | null>(null);
  const [attendanceType] = useState<'brigada'>('brigada');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [schoolYears, setSchoolYears] = useState<SchoolYear[]>([]);
  const [currentSchoolYear, setCurrentSchoolYear] = useState<SchoolYear | null>(null);
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [showRemarksModal, setShowRemarksModal] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [attendanceStatus, setAttendanceStatus] = useState<'present' | 'absent' | null>(null);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [showScannedOverlay, setShowScannedOverlay] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<StudentSearchResult[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchMode, setSearchMode] = useState<'id' | 'name'>('id');
  const [lastScannedData, setLastScannedData] = useState<string | null>(null);
  const [scanCount, setScanCount] = useState(0);
  const [scanDebugMode, setScanDebugMode] = useState(false);
  const [lastScannedTimestamp, setLastScannedTimestamp] = useState<number | null>(null);

  // Get current date in a readable format
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Add this useEffect at the beginning of your component
  useEffect(() => {
    // Run a diagnostic test when component mounts
    const runDiagnostics = async () => {
      try {
        console.log('Running API connection diagnostics...');
        const isConnected = await api.testConnection();
        
        if (!isConnected) {
          console.error('API connection test failed');
        } else {
          console.log('API connection successful');
          
          // Also test student table diagnostics
          try {
            const response = await axios.get(`${api.getBaseUrl()}/api/diagnose/student`);
            console.log('Student table diagnostics:', response.data);
          } catch (error) {
            console.error('Error checking student table:', error);
          }
        }
      } catch (error) {
        console.error('Error running diagnostics:', error);
      }
    };

    runDiagnostics();
  }, []);

  // New function for advanced search
  const handleSearch = async () => {
    const trimmedSearchText = searchText.trim();
    if (trimmedSearchText) {
      setIsLoading(true);
      Keyboard.dismiss();
      
      try {
        let results: StudentSearchResult[] = [];
        
        if (searchMode === 'id') {
          // For student ID searches, prioritize exact matching
          if (!isNaN(parseInt(trimmedSearchText, 10))) {
            console.log('Searching by student ID:', trimmedSearchText);
            
            // Try searchStudentById for exact match by ID first
            try {
              const student = await api.searchStudentById(trimmedSearchText);
              if (student) {
                results = [student];
              } else {
                console.log('No exact student ID match, trying general search');
                // If no exact match, try the general search
                try {
                  const searchResults = await api.searchStudents({ lrn: trimmedSearchText });
                  results = searchResults;
                } catch (fallbackError) {
                  console.error('Error in fallback search:', fallbackError);
                  // If both searches fail, show the not found message
                  Alert.alert('Student Not Found', `No student found with ID: ${trimmedSearchText}`);
                  setIsLoading(false);
                  return;
                }
              }
            } catch (error: any) {
              console.error('Error in direct ID search, falling back to general search:', error);
              // Check if it's a server error
              if (error.response && error.response.status === 500) {
                // Log additional details
                console.error('Server error details:', error.response.data);
                
                // Handle database schema errors specially
                const errorDetails = error.response.data?.details || '';
                if (errorDetails.includes('Unknown column')) {
                  Alert.alert(
                    'Database Error', 
                    'There is an issue with the database configuration. Please contact your administrator.'
                  );
                  setIsLoading(false);
                  return;
                }
              }
              
              // Try the general search as fallback
              try {
                const searchResults = await api.searchStudents({ lrn: trimmedSearchText });
                results = searchResults;
              } catch (fallbackError: any) {
                console.error('Fallback search also failed:', fallbackError);
                
                // Check if fallback also had database error
                if (fallbackError.response && fallbackError.response.status === 500) {
                  const errorDetails = fallbackError.response.data?.details || '';
                  if (errorDetails.includes('Unknown column')) {
                    Alert.alert(
                      'Database Error', 
                      'There is an issue with the database configuration. Please contact your administrator.'
                    );
                    setIsLoading(false);
                    return;
                  }
                }
                
                Alert.alert(
                  'Search Error', 
                  'Unable to search for student. Please try again or contact support.'
                );
                setIsLoading(false);
                return;
              }
            }
          } else {
            // Not a numeric ID, just do a regular search
            Alert.alert('Invalid ID', 'Please enter a valid student ID number');
            setIsLoading(false);
            return;
          }
        } else {
          // Search by name
          try {
            results = await api.searchStudents({ name: trimmedSearchText });
          } catch (error: any) {
            console.error('Error searching by name:', error);
            if (error.response && error.response.status === 500) {
              const errorDetails = error.response.data?.details || '';
              if (errorDetails.includes('Unknown column')) {
                Alert.alert(
                  'Database Error', 
                  'There is an issue with the database configuration. Please contact your administrator.'
                );
                setIsLoading(false);
                return;
              }
            }
            
            Alert.alert('Search Error', 'Failed to search by name. Please try again.');
            setIsLoading(false);
            return;
          }
        }
        
        setSearchResults(results);
        setShowSearchResults(results.length > 0);
        
        if (results.length === 1) {
          // If there's only one result, select it automatically
          handleStudentSelect(results[0]);
        } else if (results.length === 0) {
          if (searchMode === 'id') {
            Alert.alert('Student Not Found', `No student found with ID: ${trimmedSearchText}`);
          } else {
            Alert.alert('Student Not Found', `No student found with name: ${trimmedSearchText}`);
          }
        } else {
          // Multiple results found - just show them
          console.log(`Found ${results.length} matching students`);
        }
      } catch (error: any) {
        console.error('Error searching student:', error);
        
        // Handle different types of errors
        if (error.response) {
          // The request was made and the server responded with an error status
          if (error.response.status === 500) {
            console.error('Server error details:', error.response.data);
            
            // Check for database schema errors
            const errorDetails = error.response.data?.details || '';
            if (errorDetails.includes('Unknown column')) {
              Alert.alert(
                'Database Error', 
                'There is an issue with the database configuration. Please contact your administrator.'
              );
            } else {
              Alert.alert(
                'Server Error', 
                'The server encountered an error while processing your request. Please try again later.'
              );
            }
          } else {
            const errorMessage = error.response.data?.error || error.response.data?.details || error.message || 'Failed to search student';
            Alert.alert('Error', errorMessage);
          }
        } else if (error.request) {
          // The request was made but no response was received
          Alert.alert('Connection Error', 'Could not connect to the server. Please check your internet connection and try again.');
        } else {
          // Something else happened in making the request
          Alert.alert('Error', error.message || 'An unexpected error occurred');
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Handle student selection from search results
  const handleStudentSelect = async (student: StudentSearchResult) => {
    // First set the student with default brigada status
    setScannedStudent({
      id: student.student_id,
      lrn: student.lrn?.toString() || '',
      name: student.name,
      grade: student.grade,
      section: student.section,
      brigadaStatus: {
        status: 'No',
        remarks: ''
      }
    });
    
    // Then fetch and update the brigada status
    try {
      const brigadaResponse = await api.getBrigadaStatus(parseInt(student.student_id));
      if (brigadaResponse.success && brigadaResponse.data) {
        // Update with actual brigada status
        setScannedStudent(prev => prev ? {
          ...prev,
          brigadaStatus: {
            status: brigadaResponse.data?.status || 'No',
            remarks: brigadaResponse.data?.remarks || ''
          }
        } : null);
      }
    } catch (error) {
      console.error('Error fetching brigada status:', error);
      // Continue with default "No" status
    }
    
    setShowSearchResults(false);
    setSearchText('');
  };

  // Update the existing handleSubmit to use our new search function
  const handleSubmit = async () => {
    if (studentId.trim()) {
      setIsLoading(true);
      Keyboard.dismiss();
      try {
        const student = await api.searchStudentById(studentId);
        if (student) {
          // Set initial student data
          setScannedStudent({
            id: student.student_id,
            lrn: student.lrn?.toString() || '',
            name: student.name,
            grade: student.grade,
            section: student.section,
            brigadaStatus: {
              status: 'No',
              remarks: ''
            }
          });
          
          // Fetch and update brigada status
          try {
            const brigadaResponse = await api.getBrigadaStatus(parseInt(student.student_id));
            if (brigadaResponse.success && brigadaResponse.data) {
              // Update with actual brigada status
              setScannedStudent(prev => prev ? {
                ...prev,
                brigadaStatus: {
                  status: brigadaResponse.data?.status || 'No',
                  remarks: brigadaResponse.data?.remarks || ''
                }
              } : null);
            }
          } catch (error) {
            console.error('Error fetching brigada status:', error);
            // Continue with default "No" status
          }
          
          setStudentId('');
        } else {
          Alert.alert('Not Found', `No student found with ID: ${studentId}`);
          setStudentId('');
        }
      } catch (error: any) {
        console.error('Error searching student:', error);
        const errorMessage = error.response?.data?.error || error.message || 'Failed to search student';
        Alert.alert('Error', errorMessage);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleToggleAttendance = async (status: 'Yes' | 'No') => {
    try {
      if (!scannedStudent) return;

      if (status === 'No') {
        // Show remarks modal for marking as absent
        setShowRemarksModal(true);
        return;
      }

      // For marking as present, update directly
      await updateAttendance(scannedStudent.id, true, "Attended");
      
      // Update local state
      setScannedStudent(prev => prev ? {
        ...prev,
        brigadaStatus: {
          status: 'Yes',
          remarks: "Attended"
        }
      } : null);

      Alert.alert('Success', 'Student marked as present');
    } catch (error) {
      Alert.alert('Error', 'Failed to update attendance');
    }
  };

  const handleRemarksSubmit = async () => {
    if (!remarks.trim()) {
      Alert.alert('Error', 'Please provide remarks');
      return;
    }

    try {
      if (!scannedStudent) return;

      // In real app, call your API endpoint
      await updateAttendance(scannedStudent.id, false, remarks);

      // Update local state
      setScannedStudent(prev => prev ? {
        ...prev,
        brigadaStatus: {
          status: 'No',
          remarks: remarks
        }
      } : null);

      setShowRemarksModal(false);
      setRemarks('');
      Alert.alert('Success', 'Remarks added successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update remarks');
    }
  };

  const updateAttendance = async (studentId: string, status: boolean, remarks: string) => {
    try {
      // In real app, call your API endpoint
      // await api.put(`/brigada-eskwela/${studentId}`, {
      //   brigada_attendance: status ? 1 : 0,
      //   remarks: remarks
      // });
      
      // First update the attendance status
      const statusResponse = await api.updateBrigadaStatus(parseInt(studentId), status);
      if (!statusResponse.success) {
        throw new Error(statusResponse.error || 'Failed to update attendance status');
      }
      
      // Then update remarks if provided
      if (remarks.trim()) {
        const remarksResponse = await api.updateBrigadaRemarks(parseInt(studentId), remarks);
        if (!remarksResponse.success) {
          throw new Error(remarksResponse.error || 'Failed to update remarks');
        }
      }
      
      console.log('Successfully updated attendance:', { studentId, status, remarks });
    } catch (error) {
      console.error('Error updating attendance:', error);
      throw new Error('Failed to update attendance');
    }
  };

  const handleSchoolYearPress = (year: SchoolYear) => {
    setCurrentSchoolYear(year);
    setShowYearPicker(false);
    Alert.alert('Success', `School Year changed to ${year.school_year}`);
  };

  useEffect(() => {
    (async () => {
      console.log('Requesting camera permission...');
      
      try {
        const { status } = await Camera.requestCameraPermissionsAsync();
        console.log('Camera permission status:', status);
        
        setHasPermission(status === 'granted');
        
        if (status !== 'granted') {
          console.error('Camera permission was denied');
          Alert.alert(
            'Camera Permission Required',
            'Please grant camera permission to scan barcodes. The app cannot function without camera access.',
            [
              { 
                text: 'Try Again', 
                onPress: async () => {
                  const { status } = await Camera.requestCameraPermissionsAsync();
                  setHasPermission(status === 'granted');
                }
              }
            ]
          );
        } else {
          // Test if camera can be opened
          try {
            // This is a safer way to verify camera is working
            console.log('Camera permission granted - camera should be available');
            
            // We'll rely on the camera component to handle errors if the device
            // camera isn't working properly, which it will do automatically
          } catch (error) {
            console.error('Camera error:', error);
            Alert.alert(
              'Camera Error',
              'Your device camera appears to be unavailable. Please restart the app or check your device settings.'
            );
          }
        }
      } catch (error) {
        console.error('Error requesting camera permission:', error);
        Alert.alert(
          'Camera Error',
          'There was an error accessing your camera. Please check your device settings and restart the app.'
        );
      }
    })();
  }, []);

  useEffect(() => {
    const fetchSchoolYears = async () => {
      try {
        const years = await api.getSchoolYears();
        setSchoolYears(years);
        // Set the current school year to the first one (which will be the active one)
        if (years.length > 0) {
          setCurrentSchoolYear(years[0]);
        }
      } catch (error) {
        console.error('Error fetching school years:', error);
        Alert.alert('Error', 'Failed to load school years');
      }
    };

    fetchSchoolYears();
  }, []);

  // Update the handleBarCodeScanned function
  const handleBarCodeScanned = async ({ type, data }: { type: string, data: string }) => {
    // Always update these values for debugging
    setLastScannedData(data);
    setScanCount(prev => prev + 1);
    
    // Provide haptic feedback for every scan (helps confirm scanner is working)
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      // Fallback to basic vibration if haptics not available
      Vibration.vibrate(100);
    }
    
    // Show visual feedback
    setShowScannedOverlay(true);
    setTimeout(() => setShowScannedOverlay(false), 1000);

    console.log(`Barcode scanned! Type: ${type}, Data: ${data}`);
    
    // Prevent multiple scans of the same code in quick succession
    if (lastScanned === data && Date.now() - (lastScannedTimestamp || 0) < 2000) {
      console.log('Ignoring duplicate scan within 2 seconds');
      return;
    }
    
    setLastScanned(data);
    setLastScannedTimestamp(Date.now());
    setIsLoading(true);
    
    // Process the scanned data
    if (scanDebugMode) {
      // In debug mode, just show what was scanned but don't close camera
      Alert.alert(
        'Barcode Detected',
        `Type: ${type}\nData: ${data}`,
        [{ text: 'Continue Scanning', style: 'default' }]
      );
      setIsLoading(false);
      return;
    }
    
    // Normal processing
    setShowCamera(false);
    
    try {
      // Clean up the scanned data - remove any non-numeric characters
      // This helps with potential formatting in barcodes
      const cleanedBarcode = data.replace(/[^0-9]/g, '').trim();
      console.log('Cleaned barcode value:', cleanedBarcode);
      
      // Validate it's a number
      if (!cleanedBarcode || isNaN(parseInt(cleanedBarcode, 10))) {
        Alert.alert('Invalid Barcode', 'The scanned barcode does not contain a valid student ID.');
        setIsLoading(false);
        return;
      }
      
      // Use direct ID search since we know the barcode is the student ID
      try {
        console.log('Searching for student with barcode ID:', cleanedBarcode);
        const student = await api.searchStudentById(cleanedBarcode);
        
        if (student) {
          console.log('Found student by ID:', student);
          // Student found - update the UI
          setScannedStudent({
            id: student.student_id,
            lrn: student.lrn?.toString() || '',
            name: student.name,
            grade: student.grade,
            section: student.section,
            brigadaStatus: {
              status: 'No',
              remarks: ''
            }
          });
          
          // Fetch brigada status
          try {
            const brigadaResponse = await api.getBrigadaStatus(parseInt(student.student_id));
            if (brigadaResponse.success && brigadaResponse.data) {
              // Update with actual brigada status
              setScannedStudent(prev => prev ? {
                ...prev,
                brigadaStatus: {
                  status: brigadaResponse.data?.status || 'No',
                  remarks: brigadaResponse.data?.remarks || ''
                }
              } : null);
            }
          } catch (error) {
            console.error('Error fetching brigada status:', error);
            // Continue with default "No" status
          }
          
          // Show success message
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          console.log('No student found with exact ID match, trying general search');
          // If exact ID search failed, try the more flexible search
          const results = await api.searchStudents({ lrn: cleanedBarcode });
          
          if (results.length === 1) {
            // One result found - select it
            handleStudentSelect(results[0]);
          } else if (results.length > 1) {
            // Multiple results - show them
            setSearchResults(results);
            setShowSearchResults(true);
          } else {
            // No results found
            Alert.alert('Student Not Found', `No student found with ID: ${cleanedBarcode}`);
          }
        }
      } catch (error: any) {
        console.error('Error searching for student with barcode:', error);
        
        // Check for database errors
        if (error.response && error.response.status === 500) {
          const errorDetails = error.response.data?.details || '';
          if (errorDetails.includes('Unknown column')) {
            Alert.alert(
              'Database Error', 
              'There is an issue with the database configuration. Please contact your administrator.'
            );
          } else {
            Alert.alert('Server Error', 'Unable to process the barcode. Please try again or search manually.');
          }
        } else {
          Alert.alert('Error', 'Failed to find student. Please try scanning again or search manually.');
        }
      }
    } catch (error: any) {
      console.error('Error processing barcode:', error);
      Alert.alert('Error', 'Failed to process the scanned code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Scan Student Barcode'
    });
  }, [navigation]);

  if (hasPermission === null) {
    return (
      <View style={styles.permissionContainer}>
        <MaterialIcons name="camera-alt" size={64} color="#999" />
        <Text style={styles.permissionTitle}>Requesting Camera Access</Text>
        <Text style={styles.permissionText}>
          Please wait while we access your camera for barcode scanning.
        </Text>
        <ActivityIndicator size="large" color="#28a745" style={{ marginTop: 20 }} />
      </View>
    );
  }
  if (hasPermission === false) {
    return (
      <View style={styles.permissionContainer}>
        <MaterialIcons name="no-photography" size={64} color="#dc3545" />
        <Text style={styles.permissionTitle}>Camera Access Denied</Text>
        <Text style={styles.permissionText}>
          Camera permission is required to scan barcodes. Please enable camera access in your device settings.
        </Text>
        <TouchableOpacity 
          style={styles.permissionButton}
          onPress={async () => {
            const { status } = await Camera.requestCameraPermissionsAsync();
            setHasPermission(status === 'granted');
          }}
        >
          <Text style={styles.permissionButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Add an animated scan line
  const AnimatedScanLine = () => {
    const translateY = React.useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(translateY, {
            toValue: 200, // Move down
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: 0, // Move back up
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      );
      
      animation.start();
      
      return () => {
        animation.stop();
      };
    }, [translateY]);

    return (
      <Animated.View
        style={[
          styles.scanLine,
          {
            transform: [{ translateY }],
          },
        ]}
      />
    );
  };

  return (
    <View style={styles.container}>
      {showCamera ? (
        <View style={styles.cameraContainer}>
          <BarCodeScanner
            style={StyleSheet.absoluteFillObject}
            type={BarCodeScanner.Constants.Type.back}
            barCodeTypes={[
              BarCodeScanner.Constants.BarCodeType.code128,
              BarCodeScanner.Constants.BarCodeType.ean13,
              BarCodeScanner.Constants.BarCodeType.ean8,
              BarCodeScanner.Constants.BarCodeType.code39,
              BarCodeScanner.Constants.BarCodeType.code93,
              BarCodeScanner.Constants.BarCodeType.qr,
              BarCodeScanner.Constants.BarCodeType.upc_e,
            ]}
            onBarCodeScanned={scanDebugMode ? handleBarCodeScanned : handleBarCodeScanned}
          />
          <SafeAreaView style={styles.cameraOverlay}>
            <View style={styles.cameraHeader}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowCamera(false)}
              >
                <MaterialIcons name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.cameraTitle}>Scan Student ID</Text>
              
              {/* Add test button for debugging */}
              <TouchableOpacity
                style={styles.testScanButton}
                onPress={() => {
                  // Simulate a scan with test data
                  handleBarCodeScanned({ 
                    type: 'CODE128', 
                    data: '00000001' // Use a valid student ID from your database
                  });
                }}
              >
                <Text style={styles.testScanButtonText}>Test</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.scanFrameContainer}>
              <View style={styles.scanFrame}>
                <View style={[styles.cornerIndicator, styles.topLeftCorner]} />
                <View style={[styles.cornerIndicator, styles.topRightCorner]} />
                <View style={[styles.cornerIndicator, styles.bottomLeftCorner]} />
                <View style={[styles.cornerIndicator, styles.bottomRightCorner]} />
                
                {/* Add animated scanning line */}
                <AnimatedScanLine />
              </View>
              <Text style={styles.scanText}>Position student barcode within frame</Text>
              <Text style={styles.scanSubText}>Keep the camera steady for best results</Text>
              
              {/* Add a visible indicator that shows when camera is active */}
              <View style={styles.cameraStatusIndicator}>
                <View style={styles.statusDot} />
                <Text style={styles.cameraStatusText}>Camera Active</Text>
              </View>
            </View>
            
            {showScannedOverlay && (
              <View style={styles.scannedOverlay}>
                <MaterialIcons name="check-circle" size={60} color="#28a745" />
                <Text style={styles.scannedText}>Barcode Detected!</Text>
                <Text style={styles.scannedData}>{lastScannedData}</Text>
              </View>
            )}
            
            <View style={styles.scanDebugPanel}>
              <Text style={styles.scanDebugText}>
                Scans: {scanCount} | Last: {lastScannedData ? lastScannedData.substring(0, 10) : 'None'}
              </Text>
              <TouchableOpacity 
                style={styles.scanDebugButton}
                onPress={() => setScanDebugMode(!scanDebugMode)}
              >
                <Text style={styles.scanDebugButtonText}>
                  {scanDebugMode ? 'Exit Debug' : 'Debug Mode'}
                </Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      ) : (
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Brigada Eskwela</Text>
          </View>

          {/* Date Display */}
          <Text style={styles.dateText}>{currentDate}</Text>

          {/* School Year Selector */}
          <TouchableOpacity
            style={styles.schoolYearSelector}
            onPress={() => setShowYearPicker(true)}
          >
            <View style={styles.schoolYearContent}>
              <MaterialIcons name="calendar-today" size={20} color="#28a745" />
              <Text style={styles.schoolYearText}>
                {currentSchoolYear?.school_year || 'Select School Year'}
              </Text>
              <MaterialIcons name="arrow-drop-down" size={24} color="#28a745" />
            </View>
          </TouchableOpacity>

          {/* Search Section */}
          <View style={styles.searchSection}>
            {/* Search Mode Toggle */}
            <View style={styles.searchModeToggle}>
              <TouchableOpacity
                style={[styles.searchModeButton, searchMode === 'id' && styles.searchModeActive]}
                onPress={() => setSearchMode('id')}
              >
                <Text style={[styles.searchModeText, searchMode === 'id' && styles.searchModeTextActive]}>
                  Student ID
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.searchModeButton, searchMode === 'name' && styles.searchModeActive]}
                onPress={() => setSearchMode('name')}
              >
                <Text style={[styles.searchModeText, searchMode === 'name' && styles.searchModeTextActive]}>
                  Name
                </Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.searchInputContainer}>
              <TextInput
                style={styles.searchInput}
                value={searchText}
                onChangeText={setSearchText}
                placeholder={searchMode === 'id' ? "Enter Student ID" : "Enter Student Name"}
                placeholderTextColor="#999"
                keyboardType={searchMode === 'id' ? "numeric" : "default"}
              />
              <TouchableOpacity 
                style={styles.searchButton}
                onPress={handleSearch}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <MaterialIcons name="search" size={24} color="#fff" />
                )}
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.scanButton}
                onPress={() => setShowCamera(true)}
                disabled={isLoading}
              >
                <MaterialIcons name="qr-code-scanner" size={24} color="#28a745" />
              </TouchableOpacity>
            </View>
            
            {/* Search Results */}
            {showSearchResults && (
              <View style={styles.searchResultsContainer}>
                <FlatList
                  data={searchResults}
                  keyExtractor={(item) => item.student_id}
                  renderItem={({ item }) => (
                    <TouchableOpacity 
                      style={styles.searchResultItem}
                      onPress={() => handleStudentSelect(item)}
                    >
                      <View style={styles.searchResultContent}>
                        <Text style={styles.searchResultName}>{item.name}</Text>
                        <Text style={styles.searchResultDetails}>
                          Grade {item.grade} • {item.section}
                        </Text>
                        <View style={styles.searchResultIdContainer}>
                          <Text style={styles.searchResultID}>ID: {item.student_id}</Text>
                          {item.lrn && (
                            <Text style={styles.searchResultLRN}>LRN: {item.lrn}</Text>
                          )}
                        </View>
                      </View>
                      <MaterialIcons name="chevron-right" size={24} color="#ccc" />
                    </TouchableOpacity>
                  )}
                />
              </View>
            )}
          </View>

          {/* Add a loading overlay component right after the search section */}
          {isLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#28a745" />
              <Text style={styles.loadingText}>Searching for student...</Text>
            </View>
          )}

          {/* Student Card */}
          {scannedStudent && (
            <>
              <View style={styles.divider} />
              <View style={styles.studentCard}>
                <View style={styles.studentInfo}>
                  <Text style={styles.studentName}>{scannedStudent.name}</Text>
                  <View style={styles.studentMetaInfo}>
                    <Text style={styles.studentGradeSection}>
                      Grade {scannedStudent.grade} • {scannedStudent.section}
                    </Text>
                    <Text style={styles.studentId}>ID: {scannedStudent.id}</Text>
                    {scannedStudent.lrn && (
                      <Text style={styles.studentLrn}>LRN: {scannedStudent.lrn}</Text>
                    )}
                  </View>
                </View>

                <View style={styles.brigadaStatusSection}>
                  <View style={[
                    styles.brigadaStatusBadge,
                    scannedStudent.brigadaStatus?.status === 'Yes' 
                      ? styles.brigadaStatusPresent 
                      : styles.brigadaStatusAbsent
                  ]}>
                    <MaterialIcons 
                      name={scannedStudent.brigadaStatus?.status === 'Yes' ? 'check-circle' : 'close'} 
                      size={16} 
                      color="#fff" 
                    />
                    <Text style={styles.brigadaStatusText}>
                      {scannedStudent.brigadaStatus?.status || 'No'}
                    </Text>
                  </View>
                  {scannedStudent.brigadaStatus?.remarks && (
                    <Text style={styles.brigadaStatusRemarks}>
                      Remarks: {scannedStudent.brigadaStatus.remarks}
                    </Text>
                  )}
                </View>

                {(!scannedStudent.brigadaStatus || scannedStudent.brigadaStatus.status === 'No') && (
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={styles.markPresentButton}
                      onPress={() => handleToggleAttendance('Yes')}
                    >
                      <MaterialIcons name="check-circle" size={20} color="#fff" />
                      <Text style={styles.markPresentButtonText}>Mark as Present</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={styles.addRemarksButton}
                      onPress={() => {
                        setShowRemarksModal(true);
                        setRemarks(scannedStudent.brigadaStatus?.remarks || '');
                      }}
                    >
                      <MaterialIcons name="edit" size={20} color="#fff" />
                      <Text style={styles.addRemarksButtonText}>Add Remarks</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* Remarks Modal */}
              <Modal
                visible={showRemarksModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => {
                  setShowRemarksModal(false);
                  setRemarks('');
                }}
              >
                <TouchableOpacity 
                  style={styles.modalOverlay}
                  activeOpacity={1}
                  onPress={() => {
                    setShowRemarksModal(false);
                    setRemarks('');
                  }}
                >
                  <View style={styles.remarksModalContent}>
                    <View style={styles.remarksModalHeader}>
                      <Text style={styles.remarksModalTitle}>Reason for Absence</Text>
                      <TouchableOpacity onPress={() => {
                        setShowRemarksModal(false);
                        setRemarks('');
                      }}>
                        <MaterialIcons name="close" size={24} color="#666" />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.modalStudentName}>
                      Student: {scannedStudent?.name}
                    </Text>
                    <TextInput
                      style={styles.remarksModalInput}
                      value={remarks}
                      onChangeText={setRemarks}
                      placeholder="Please provide a reason for absence..."
                      placeholderTextColor="#999"
                      multiline
                      numberOfLines={3}
                      autoFocus
                    />
                    <View style={styles.remarksModalButtons}>
                      <TouchableOpacity 
                        style={[styles.remarksModalButton, styles.remarksModalCancelButton]}
                        onPress={() => {
                          setShowRemarksModal(false);
                          setRemarks('');
                        }}
                      >
                        <Text style={styles.remarksModalButtonTextCancel}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.remarksModalButton, styles.remarksModalSubmitButton]}
                        onPress={handleRemarksSubmit}
                      >
                        <Text style={styles.remarksModalButtonText}>Submit</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              </Modal>
            </>
          )}
        </View>
      )}

      <Modal
        visible={showYearPicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowYearPicker(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowYearPicker(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select School Year</Text>
              <TouchableOpacity onPress={() => setShowYearPicker(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            {schoolYears.map((year) => (
              <TouchableOpacity
                key={year.school_year_id}
                style={[
                  styles.yearOption,
                  currentSchoolYear?.school_year_id === year.school_year_id && styles.selectedYearOption,
                ]}
                onPress={() => handleSchoolYearPress(year)}
              >
                <Text style={[
                  styles.yearOptionText,
                  currentSchoolYear?.school_year_id === year.school_year_id && styles.selectedYearOptionText,
                ]}>
                  {year.school_year}
                </Text>
                {currentSchoolYear?.school_year_id === year.school_year_id && (
                  <Ionicons name="checkmark" size={24} color="#fff" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default ScanScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    marginBottom: 16,
    marginHorizontal: -16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  schoolYearSelector: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  schoolYearContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  schoolYearText: {
    flex: 1,
    fontSize: 16,
    color: '#28a745',
    fontWeight: '600',
  },
  dateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 12,
  },
  searchSection: {
    marginBottom: 20,
  },
  searchInputContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchButton: {
    backgroundColor: '#28a745',
    borderRadius: 12,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  scanButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#e9ecef',
    marginVertical: 20,
  },
  cameraContainer: {
    flex: 1,
    width: '100%',
    backgroundColor: '#000',
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  cameraHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 20,
  },
  cameraTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 16,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
  },
  scanFrameContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: 'transparent',
    borderRadius: 24,
  },
  scanText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 24,
    textAlign: 'center',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  yearOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#f8f9fa',
  },
  selectedYearOption: {
    backgroundColor: '#28a745',
  },
  yearOptionText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  selectedYearOptionText: {
    color: '#fff',
    fontWeight: '600',
  },
  remarksText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  remarksModalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  remarksModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  remarksModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  remarksModalInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333',
    textAlignVertical: 'top',
    minHeight: 100,
    marginBottom: 20,
  },
  remarksModalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  remarksModalButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  remarksModalCancelButton: {
    backgroundColor: '#f8f9fa',
  },
  remarksModalSubmitButton: {
    backgroundColor: '#28a745',
  },
  remarksModalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  remarksModalButtonTextCancel: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  attendanceStatus: {
    alignItems: 'center',
    width: '100%',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 8,
  },
  presentBadge: {
    backgroundColor: '#28a745',
  },
  absentBadge: {
    backgroundColor: '#dc3545',
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  modalStudentName: {
    fontSize: 16,
    color: '#333',
    marginBottom: 16,
    fontWeight: '500',
  },
  studentCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    gap: 16,
  },
  studentInfo: {
    alignItems: 'center',
  },
  studentName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  studentMetaInfo: {
    alignItems: 'center',
    gap: 4,
  },
  studentGradeSection: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  studentId: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  brigadaStatusSection: {
    alignItems: 'center',
    paddingVertical: 8,
    gap: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
  },
  brigadaStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 6,
  },
  brigadaStatusPresent: {
    backgroundColor: '#28a745',
  },
  brigadaStatusAbsent: {
    backgroundColor: '#dc3545',
  },
  brigadaStatusText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  brigadaStatusRemarks: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  markPresentButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#28a745',
    padding: 12,
    borderRadius: 12,
    gap: 8,
    maxWidth: '48%',
  },
  markPresentButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  addRemarksButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dc3545',
    padding: 12,
    borderRadius: 12,
    gap: 8,
    maxWidth: '48%',
  },
  addRemarksButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  scannedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannedText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
  },
  searchModeToggle: {
    flexDirection: 'row',
    marginBottom: 10,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  searchModeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  searchModeActive: {
    backgroundColor: '#28a745',
  },
  searchModeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  searchModeTextActive: {
    color: '#fff',
  },
  searchResultsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 12,
    maxHeight: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  searchResultContent: {
    flex: 1,
  },
  searchResultName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  searchResultDetails: {
    fontSize: 14,
    color: '#666',
  },
  searchResultIdContainer: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 2,
  },
  searchResultID: {
    fontSize: 12,
    color: '#888',
  },
  searchResultLRN: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  studentLrn: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#28a745',
    fontWeight: '600',
  },
  scanSubText: {
    color: '#fff',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    opacity: 0.8,
  },
  cornerIndicator: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: '#28a745',
    borderWidth: 3,
  },
  topLeftCorner: {
    top: 0,
    left: 0,
    borderBottomWidth: 0,
    borderRightWidth: 0,
    borderTopLeftRadius: 10,
  },
  topRightCorner: {
    top: 0,
    right: 0,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderTopRightRadius: 10,
  },
  bottomLeftCorner: {
    bottom: 0,
    left: 0,
    borderTopWidth: 0,
    borderRightWidth: 0,
    borderBottomLeftRadius: 10,
  },
  bottomRightCorner: {
    bottom: 0,
    right: 0,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderBottomRightRadius: 10,
  },
  scanDebugPanel: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 10,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scanDebugText: {
    color: '#fff',
    fontSize: 12,
  },
  scanDebugButton: {
    backgroundColor: '#28a745',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  scanDebugButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  testScanButton: {
    backgroundColor: '#28a745',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  testScanButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  scanLine: {
    height: 2,
    width: '80%',
    backgroundColor: '#28a745',
    position: 'absolute',
    opacity: 0.8,
  },
  cameraStatusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#28a745',
    marginRight: 6,
  },
  cameraStatusText: {
    color: '#fff',
    fontSize: 12,
  },
  scannedData: {
    color: '#fff',
    fontSize: 16,
    marginTop: 8,
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  permissionText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: '#28a745',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 