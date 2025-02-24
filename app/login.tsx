import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { setUserData } = useAuth();

  const handleLogin = async () => {
    try {
      // Reset error state
      setError('');
      
      // Basic validation
      if (!username || !password) {
        setError('Please enter both username and password');
        return;
      }

      setIsLoading(true);
      console.log('Attempting login with:', { username });

      // Call the login API
      const response = await api.login(username, password);
      console.log('Login response:', response);
      
      if (response.success && response.data) {
        console.log('Login successful, getting user details...');
        // Store user data in context instead of AsyncStorage
        setUserData({
          userId: response.data.userId,
          role: response.data.role
        });
        
        const role = response.data.role;
        console.log('Checking role:', role);
        
        if (role === 'student') {
          router.replace("/(student-tabs)/attendance");
        } else if (role === 'subject_teacher') {
          router.replace("/(teacher-tabs)/attendance");
        } else {
          setError('Access denied. Only students and teachers can use this app.');
          setIsLoading(false);
          return;
        }
      } else {
        console.log('Login failed:', response.error);
        setError(response.error || 'Invalid credentials');
      }
    } catch (error: any) {
      console.error('Login error details:', error.response?.data || error.message);
      if (error.response?.status === 401) {
        setError('Invalid username or password');
      } else if (error.message.includes('Network Error')) {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.loginWrapper}>
      <View style={styles.loginContainer}>
        <Text style={styles.portalTitle}>LNHS PORTAL</Text>
        <Image
          source={require('../assets/images/lnhs-logo.png')}
          style={styles.loginLogo}
          resizeMode="contain"
        />
        <Text style={styles.loginHeader}>Student & Teacher Login</Text>

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            {error.includes('Access denied') && (
              <Text style={styles.errorSubText}>This app is only accessible to students and teachers.</Text>
            )}
          </View>
        ) : null}

        <View style={styles.formGroup}>
          <Text style={styles.label}>Username</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your username"
            value={username}
            onChangeText={(text) => {
              setUsername(text);
              setError('');
            }}
            autoCapitalize="none"
            editable={!isLoading}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordWrapper}>
            <TextInput
              style={[styles.input, { paddingRight: 50 }]}
              placeholder="Enter your password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setError('');
              }}
              secureTextEntry={!showPassword}
              editable={!isLoading}
            />
            <TouchableWithoutFeedback onPress={() => setShowPassword(!showPassword)}>
              <View style={styles.showPasswordBtn}>
                <Ionicons
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={24}
                  color="#7a7a7a"
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.loginBtn, isLoading && styles.loginBtnDisabled]} 
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.loginBtnText}>Login</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loginWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
    padding: 20,
  },
  loginContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  loginLogo: {
    width: 100,
    height: 100,
    marginBottom: 10,
  },
  portalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  loginHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  formGroup: {
    width: '100%',
    marginBottom: 20,
  },
  label: {
    marginBottom: 5,
    fontWeight: 'bold',
    paddingHorizontal: '10%',
  },
  input: {
    width: '80%',
    alignSelf: 'center',
    height: 45,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 15,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
  },
  passwordWrapper: {
    width: '100%',
    alignItems: 'center',
    position: 'relative',
  },
  showPasswordBtn: {
    position: 'absolute',
    right: '15%',
    height: '100%',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  loginBtn: {
    width: '80%',
    backgroundColor: '#28a745',
    padding: 12,
    borderRadius: 15,
    marginTop: 20,
  },
  loginBtnText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#ffebee',
    borderRadius: 8,
    width: '80%',
  },
  errorText: {
    color: '#dc3545',
    textAlign: 'center',
    fontWeight: '500',
  },
  errorSubText: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  loginBtnDisabled: {
    backgroundColor: '#6c757d',
  },
}); 