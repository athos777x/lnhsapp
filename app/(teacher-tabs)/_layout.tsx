import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TeacherTabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#28a745',
        tabBarInactiveTintColor: 'gray',
        headerShown: true,
        headerStyle: {
          backgroundColor: '#28a745',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        tabBarStyle: {
          height: 65,
          paddingBottom: 10,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          paddingBottom: 5,
        },
      }}
    >
      <Tabs.Screen
        name="attendance"
        options={{
          title: 'Class Attendance',
          tabBarLabel: 'Attendance',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: 'Scan QR',
          tabBarLabel: 'Scan',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="qr-code" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Teacher Profile',
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
