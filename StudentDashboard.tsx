import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  ImageBackground,
  ActivityIndicator,
} from 'react-native';
import {
  useRoute,
  useNavigation,
  RouteProp,
} from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Progress from 'react-native-progress';

import StudentBottomNav from './BottomNav';
import { RootTabParamList } from './types';

type AuthRouteProp = RouteProp<RootTabParamList, 'Auth'>;
type AuthNavProp = NativeStackNavigationProp<RootTabParamList>;

const StudentDashboard: React.FC = () => {
  const navigation = useNavigation<AuthNavProp>();
  const route = useRoute<AuthRouteProp>();
  const { role } = route.params;

  const [studentName, setStudentName] = useState<string>('');
  const [studentId, setStudentId] = useState<string>('');
  const [progressData, setProgressData] = useState<{
    Attended: number;
    TotalLessons: number;
    AttendancePercentage: number;
  } | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(true);
  const [todaysModules, setTodaysModules] = useState<any[]>([]);
  const [loadingModules, setLoadingModules] = useState(true);

  useEffect(() => {
    const fetchStudentDetails = async () => {
      try {
        const session = await AsyncStorage.getItem('userSession');
        if (!session) return;

        const user = JSON.parse(session);
        const studentNumber = user.studentNumber;
        setStudentId(studentNumber);

        const response = await fetch(
          `https://varsitytrackerapi20250619102431-b3b3efgeh0haf4ge.uksouth-01.azurewebsites.net/Access/get_details_students?id=${studentNumber}`
        );

        if (!response.ok) throw new Error('Failed to fetch student details');
        const text = await response.text();

        // Try to parse name more gracefully
        const nameMatch = text.match(/Name:\s*(\w+)/i);
        if (nameMatch) setStudentName(nameMatch[1]);
        else setStudentName(user.username || 'Student');

        // Fetch additional data
        fetchWeeklyProgress(studentNumber);
        fetchTodaysModules(studentNumber);
      } catch (error: any) {
        console.error('Error fetching student details:', error);
        Alert.alert('Error', error.message || 'Failed to load student info.');
      }
    };

    const fetchTodaysModules = async (studentId: string) => {
      try {
        const response = await fetch(
          `https://varsitytrackerapi20250619102431-b3b3efgeh0haf4ge.uksouth-01.azurewebsites.net/Lesson/student_timetable/${studentId.toUpperCase()}`
        );
        if (!response.ok) throw new Error('Failed to fetch timetable');
        const data = await response.json();

        const today = new Date();
        const todays = data.filter((lesson: any) => {
          const lessonUTC = new Date(lesson.date);
          const lessonSA = new Date(lessonUTC.getTime() + 2 * 60 * 60 * 1000);
          return lessonSA.toDateString() === today.toDateString();
        });

        setTodaysModules(todays);
      } catch (error: any) {
        console.error('Error fetching timetable:', error);
        Alert.alert('Error', error.message || 'Could not fetch today’s modules.');
      } finally {
        setLoadingModules(false);
      }
    };

    const fetchWeeklyProgress = async (studentId: string) => {
      try {
        const response = await fetch(
          `https://varsitytrackerapi20250619102431-b3b3efgeh0haf4ge.uksouth-01.azurewebsites.net/api/StudentClocking/progress/${studentId.toUpperCase()}`
        );
        if (!response.ok) throw new Error('Failed to fetch progress');
        const data = await response.json();
        setProgressData({
          Attended: data.attended,
          TotalLessons: data.totalLessons,
          AttendancePercentage: data.attendancePercentage,
        });
      } catch (error: any) {
        console.error('Error fetching progress:', error);
        Alert.alert('Error', error.message || 'Could not load attendance data.');
      } finally {
        setLoadingProgress(false);
      }
    };

    fetchStudentDetails();
  }, []);

  // Navigation handlers
  const handleReport = () => navigation.navigate('Report', { role });
  const handleCalendar = () => navigation.navigate('Calendar', { role });
  const handleAttendance = () => navigation.navigate('StudentAttendance', { role });
  const handleModule = () => navigation.navigate('StudentModules', { role });
 const handleQrCamera = () => navigation.navigate('QrCamera', { role });


  return (
    <ImageBackground
      source={require('./assets/images/BackgroundImage.jpg')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.header}>
          {studentName ? `${studentName}'s Dashboard` : 'Student Dashboard'}
        </Text>

        {/* Today’s Modules */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Today’s Modules</Text>
          {loadingModules ? (
            <ActivityIndicator size="large" color="#4caf50" />
          ) : todaysModules.length === 0 ? (
            <Text style={styles.cardText}>No modules scheduled for today 🎉</Text>
          ) : (
            todaysModules.map((lesson, index) => (
              <Text key={index} style={styles.cardText}>
                {lesson.moduleCode} —{' '}
                {new Date(lesson.date).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            ))
          )}
        </View>

        {/* Weekly Attendance Progress */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Weekly Attendance Progress</Text>
          {loadingProgress ? (
            <ActivityIndicator size="large" color="#4caf50" />
          ) : progressData ? (
            <>
              <Text style={styles.cardText}>
                {progressData.Attended} / {progressData.TotalLessons} lessons attended
              </Text>
              <Progress.Bar
                progress={progressData.AttendancePercentage / 100}
                width={290}
                height={18}
                color="#064f62"
                borderRadius={8}
                style={{ marginTop: 10 }}
              />
              <Text style={[styles.cardText, { marginTop: 5 }]}>
                {progressData.AttendancePercentage.toFixed(2)}%
              </Text>
            </>
          ) : (
            <Text style={styles.cardText}>No progress data available.</Text>
          )}
        </View>

        {/* Buttons Grid */}
        <View style={styles.buttonGrid}>
          <TouchableOpacity style={styles.gridButton} onPress={handleAttendance}>
            <Image
              source={require('./assets/images/clockin.jpg')}
              style={styles.gridImage}
              resizeMode="cover"
            />
            <Text style={styles.gridText}>Clock In</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.gridButton} onPress={handleReport}>
            <Image
              source={require('./assets/images/report.jpg')}
              style={styles.gridImage}
              resizeMode="cover"
            />
            <Text style={styles.gridText}>Report Overview</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.gridButton} onPress={handleCalendar}>
            <Image
              source={require('./assets/images/calendar.jpg')}
              style={styles.gridImage}
              resizeMode="cover"
            />
            <Text style={styles.gridText}>Get Calendar</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.gridButton} onPress={handleModule}>
            <Image
              source={require('./assets/images/modules.jpg')}
              style={styles.gridImage}
              resizeMode="cover"
            />
            <Text style={styles.gridText}>Your Modules</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.smallButton} onPress={handleQrCamera}>
            <Text style={styles.qrText}>Open QR Camera</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <StudentBottomNav
        navigation={navigation}
        role={role as 'student' | 'lecturer' | 'admin'}
      />
    </ImageBackground>
  );
};

export default StudentDashboard;

const styles = StyleSheet.create({
  backgroundImage: { flex: 1, width: '100%', height: '100%' },
  scrollContainer: { flex: 1, padding: 16 },
  header: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#2E2E2E',
    marginTop: 60,
    marginBottom: 30,
  },
  sectionCard: {
    backgroundColor: '#A4C984',
    borderRadius: 14,
    padding: 16,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#064f62',
    marginBottom: 10,
    textAlign: 'center',
  },
  cardText: {
    color: '#000',
    fontSize: 17,
    fontWeight: '500',
    textAlign: 'center',
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 30,
  },
  gridButton: {
    width: '48%',
    backgroundColor: '#064f62',
    borderRadius: 16,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
    elevation: 5,
  },
  gridImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    position: 'absolute',
    opacity: 0.35,
  },
  gridText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  smallButton: {
    width: '100%',
    backgroundColor: '#A4C984',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  qrText: { color: '#064f62', fontSize: 16, fontWeight: '600' },
});
