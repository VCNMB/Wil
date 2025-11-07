import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Alert,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootTabParamList } from "./types";
import LecturerBottomNav from "./BottomNav.tsx";

type AuthRouteProp = RouteProp<RootTabParamList, "Auth">;
type AuthNavProp = NativeStackNavigationProp<RootTabParamList>;

type Module = {
  moduleCode: string;
  courseCode: string;
};

const CreateLesson: React.FC = () => {
  const [studentNumber, setStudentNumber] = useState<string>('');
  const [moduleCode, setModuleCode] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [modules, setModules] = useState<Module[]>([]);
  const [classroom, setClassroom] = useState<string>('')


  const navigation = useNavigation<AuthNavProp>();
  const route = useRoute<AuthRouteProp>();
  const { role } = route.params ?? { role: "lecturer" }; // fallback

  const lessonTimes = [
    '08:20', '09:20', '10:20', '11:20', '12:00',
    '13:00', '14:00', '15:00', '15:40'
  ];

  const handleCreateLesson = async () => {
    if (!studentNumber || !moduleCode || !courseCode || !selectedDate || !selectedTime) {
      Alert.alert('Error', 'All fields are required');
      return;
    }

    const [hours, minutes] = selectedTime.split(':').map(Number);
    const combinedDate = new Date(selectedDate);
    combinedDate.setHours(hours);
    combinedDate.setMinutes(minutes);
    combinedDate.setSeconds(0);

    // ✅ Fix timezone offset so the stored time matches your selected time
    const localOffset = combinedDate.getTimezoneOffset() * 60000; // offset in ms
    const correctedDate = new Date(combinedDate.getTime() - localOffset);

    try {
      const response = await fetch(
        'https://varsitytrackerapi20250619102431-b3b3efgeh0haf4ge.uksouth-01.azurewebsites.net/Lesson/create_lesson',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lecturerID: studentNumber,
            moduleCode,
            courseCode,
            date: correctedDate.toISOString(), // ✅ Send corrected UTC time
            classroom,
          }),
        }
      );

      const result = await response.text();

      if (response.ok) {
        Alert.alert('Success', result);
        setModuleCode('');
        setCourseCode('');
        setSelectedDate(null);
        setSelectedTime('');
        setClassroom('');
      } else {
        Alert.alert('Error', result);
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to connect to the API.');
    }
  };

  const handleDateChange = (event: any, datePicked?: Date) => {
    setShowDatePicker(false);
    if (datePicked) setSelectedDate(datePicked);
  };

  useEffect(() => {
    const loadLecturerID = async () => {
      try {
        const session = await AsyncStorage.getItem('userSession');
        if (!session) throw new Error('No user session found');
        const parsed = JSON.parse(session);
        if (!parsed.studentNumber) throw new Error('Lecturer ID not found');
        setStudentNumber(parsed.studentNumber);
      } catch (error) {
        Alert.alert('Error', (error as Error).message);
      }
    };
    loadLecturerID();
  }, []);

  useEffect(() => {
    const fetchModules = async () => {
      try {
        if (!studentNumber) return;
        const response = await fetch(
          `https://varsitytrackerapi20250619102431-b3b3efgeh0haf4ge.uksouth-01.azurewebsites.net/Module/all_lecturer_modules?lecturerID=${studentNumber}`
        );
        if (!response.ok) throw new Error('Failed to fetch modules');
        const data = await response.json();
        setModules(data);
      } catch (error) {
        Alert.alert('Error', (error as Error).message);
      }
    };
    fetchModules();
  }, [studentNumber]);

  return (
    <ImageBackground
      source={require('./assets/images/background_2.jpg')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.header}>Create Lesson</Text>

          <Picker
            selectedValue={moduleCode}
            onValueChange={(value) => setModuleCode(value)}
            style={styles.input}
          >
            <Picker.Item label="Select a Module" value="" />
            {modules.map((mod) => (
              <Picker.Item
                key={mod.moduleCode}
                label={mod.moduleCode}
                value={mod.moduleCode}
              />
            ))}
          </Picker>

          <Picker
            selectedValue={courseCode}
            onValueChange={(value) => setCourseCode(value)}
            style={styles.input}
          >
            <Picker.Item label="Select Course Code" value="" />
            <Picker.Item label="BCAD0701" value="BCAD0701" />
          </Picker>

          <Picker
            selectedValue={classroom}
            onValueChange={(value) => setClassroom(value)}
            style={styles.input}
          >
            <Picker.Item label="Select Classroom" value="" />
            <Picker.Item label="CR1" value="CR1" />
            <Picker.Item label="CR2" value="CR2" />
            <Picker.Item label="CR3" value="CR3" />
          </Picker>

          <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.input}>
            <Text style={styles.inputText}>
              {selectedDate ? selectedDate.toDateString() : 'Select Date'}
            </Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={selectedDate || new Date()}
              mode="date"
              display="default"
              onChange={handleDateChange}
            />
          )}

          <Picker
            selectedValue={selectedTime}
            onValueChange={(value) => setSelectedTime(value)}
            style={styles.input}
          >
            <Picker.Item label="Select Time" value="" />
            {lessonTimes.map((time) => (
              <Picker.Item key={time} label={time} value={time} />
            ))}
          </Picker>

          <TouchableOpacity style={styles.button} onPress={handleCreateLesson}>
            <Text style={styles.buttonText}>Create Lesson</Text>
          </TouchableOpacity>
        </View>
      </View>

      <LecturerBottomNav
        navigation={navigation}
        role={role as "student" | "lecturer" | "admin"}
      />
    </ImageBackground>
  );
};

export default CreateLesson;

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: 320,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    elevation: 8,
  },
  header: {
    fontSize: 26,
    fontWeight: '700',
    color: '#064f62ff',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#a4c984ff',
    borderRadius: 10,
    marginBottom: 15,
    paddingHorizontal: 10,
    height: 50,
    justifyContent: 'center',
  },
  inputText: {
    color: '#064f62ff',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#6bbfe4ff',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});