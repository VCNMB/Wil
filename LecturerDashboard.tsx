import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  ImageBackground,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootTabParamList } from './types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LecturerBottomNav from './BottomNav.tsx';

type AuthRouteProp = RouteProp<RootTabParamList, 'Auth'>;
type AuthNavProp = NativeStackNavigationProp<RootTabParamList>;

const LecturerDashboard: React.FC = () => {
  const navigation = useNavigation<AuthNavProp>();
  const route = useRoute<AuthRouteProp>();
  const { role } = route.params;

  const [lecturerName, setLecturerName] = useState<string>('Lecturer');
  const [todaysLessons, setTodaysLessons] = useState<any[]>([]);
  const [loadingLessons, setLoadingLessons] = useState(true);

  useEffect(() => {
    const fetchTodaysLessons = async () => {
      try {
        const session = await AsyncStorage.getItem('userSession');
        if (!session) return;

        const user = JSON.parse(session);
        const lecturerID = user.studentNumber;
        setLecturerName(user.name || 'Lecturer');

        const response = await fetch(
          `https://varsitytrackerapi20250619102431-b3b3efgeh0haf4ge.uksouth-01.azurewebsites.net/Lesson/lecturer_timetable/${lecturerID}`
        );
        if (!response.ok) throw new Error('Failed to fetch timetable');

        const data = await response.json();
        const today = new Date();
        const todays = data.filter((lesson: any) => {
          const lessonDate = new Date(lesson.date);
          return lessonDate.toDateString() === today.toDateString();
        });
        setTodaysLessons(todays);
      } catch (error: any) {
        Alert.alert('Error', error.message);
      } finally {
        setLoadingLessons(false);
      }
    };

    fetchTodaysLessons();
  }, []);

  const handleReport = () => navigation.navigate('ReportLecturer');
  const handleCalendar = () => navigation.navigate('Calendar', { role });
  const handleAttendance = () => navigation.navigate('LecturerAttendance');
  const handleModule = () => navigation.navigate('LecturerModules', { role });
  const handleLesson = () => navigation.navigate('LecturerLessons', { role });
  const handleQrCamera = () => navigation.navigate('QrCamera', { role });

  return (
    <ImageBackground
      source={require('./assets/images/BackgroundImage.jpg')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <Text style={styles.header}>📙 {lecturerName}'s Dashboard</Text>

        <Text style={styles.sectionTitle}>Today’s Lessons</Text>
        <View style={styles.card}>
          {loadingLessons ? (
            <ActivityIndicator size="large" color="#6B9B89" />
          ) : todaysLessons.length === 0 ? (
            <Text style={styles.cardText}>No lessons scheduled for today 🎉</Text>
          ) : (
            todaysLessons.map((lesson, index) => {
              const lessonUTC = new Date(lesson.date);
              const lessonSA = new Date(lessonUTC.getTime() - 2 * 60 * 60 * 1000);
              const lessonTime = lessonSA.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

              return (
                <View key={index} style={styles.lessonItem}>
                  <Text style={styles.lessonText}>{lesson.moduleCode}</Text>
                  <Text style={styles.lessonTime}>{lessonTime}</Text>
                </View>
              );
            })
          )}
        </View>

        <View style={styles.gridContainer}>
          <TouchableOpacity style={styles.gridButton} onPress={handleReport}>
            <Text style={styles.gridTextEmoji}>📊</Text>
            <Text style={styles.gridText}>Report Overview</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.gridButton} onPress={handleCalendar}>
            <Text style={styles.gridTextEmoji}>📅</Text>
            <Text style={styles.gridText}>Timetable</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.gridButton} onPress={handleAttendance}>
            <Text style={styles.gridTextEmoji}>🕒</Text>
            <Text style={styles.gridText}>Clock In</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.gridButton} onPress={handleModule}>
            <Text style={styles.gridTextEmoji}>📘</Text>
            <Text style={styles.gridText}>Your Modules</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.gridButton, styles.fullWidthButton]} onPress={handleLesson}>
            <Text style={styles.gridTextEmoji}>📚</Text>
            <Text style={styles.gridText}>Your Lessons</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.gridButton, styles.fullWidthButton]} onPress={handleQrCamera}>
            <Text style={styles.gridTextEmoji}>📷</Text>
            <Text style={styles.gridText}>Open QR Camera</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <LecturerBottomNav navigation={navigation} role={role as 'lecturer'} />
    </ImageBackground>
  );
};

export default LecturerDashboard;

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 80,
  },
  header: {
    fontSize: 30,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#2E2E2E',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#4F4F4F',
    textAlign: 'center',
    marginVertical: 10,
  },
  card: {
    backgroundColor: '#a4c984',
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardText: {
    textAlign: 'center',
    color: '#000000ff',
    fontSize: 17,
    fontWeight: '600',
  },
  lessonItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomColor: '#C9E4B4',
    borderBottomWidth: 1,
  },
  lessonText: {
    fontSize: 16,
    color: '#2E2E2E',
    fontWeight: '600',
  },
  lessonTime: {
    fontSize: 16,
    color: '#000000ff',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridButton: {
    width: '48%',
    backgroundColor: '#064F62',
    borderRadius: 14,
    paddingVertical: 20,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
  },
  gridTextEmoji: {
    fontSize: 30,
    color: '#FFF',
  },
  gridText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 6,
  },
  fullWidthButton: {
    width: '100%',
    backgroundColor: '#064F62',
  },
});
