import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  ImageBackground,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootTabParamList } from './types';
import StudentBottomNav from './BottomNav.tsx';

type AuthRouteProp = RouteProp<RootTabParamList, 'Auth'>;
type AuthNavProp = NativeStackNavigationProp<RootTabParamList>;

type Module = {
  RowKey: string;
  code: string;
  moduleName: string;
};

const StudentModules: React.FC = () => {
  const navigation = useNavigation<AuthNavProp>();
  const route = useRoute<AuthRouteProp>();
  const { role } = route.params;

  const [studentNumber, setStudentNumber] = useState<string>('');
  const [allModules, setAllModules] = useState<Module[]>([]);
  const [assignedModules, setAssignedModules] = useState<Module[]>([]);
  const [selectedModule, setSelectedModule] = useState<string>('');
  const [loadingModules, setLoadingModules] = useState(true);
  const [loadingAssigned, setLoadingAssigned] = useState(true);

  useEffect(() => {
    const loadStudentNumber = async () => {
      try {
        const session = await AsyncStorage.getItem('userSession');
        if (!session) throw new Error('No user session found');
        const parsed = JSON.parse(session);
        setStudentNumber(parsed.studentNumber);
      } catch (error) {
        Alert.alert('Error', (error as Error).message);
        setLoadingModules(false);
        setLoadingAssigned(false);
      }
    };
    loadStudentNumber();
  }, []);

  useEffect(() => {
    const fetchAllModules = async () => {
      try {
        const response = await fetch(
          'https://varsitytrackerapi20250619102431-b3b3efgeh0haf4ge.uksouth-01.azurewebsites.net/Module/all_modules'
        );
        if (!response.ok) throw new Error('Failed to fetch all modules');
        const data: Module[] = await response.json();
        setAllModules(data);
      } catch (error) {
        Alert.alert('Error', 'Could not load all modules.');
      } finally {
        setLoadingModules(false);
      }
    };
    fetchAllModules();
  }, []);

  useEffect(() => {
    if (!studentNumber || allModules.length === 0) return;
    const fetchAssignedModules = async () => {
      try {
        const response = await fetch(
          `https://varsitytrackerapi20250619102431-b3b3efgeh0haf4ge.uksouth-01.azurewebsites.net/Module/all_student_modules?studentNumber=${studentNumber.toUpperCase()}`
        );
        if (!response.ok) throw new Error('Failed to fetch assigned modules');
        const data = await response.json();
        const transformed: Module[] = data.map((item: any) => ({
          RowKey: item.rowKey,
          code: item.moduleCode,
          moduleName:
            allModules.find((m) => m.code === item.moduleCode)?.moduleName || 'N/A',
        }));
        setAssignedModules(transformed);
      } catch (error) {
        Alert.alert('Error', 'Could not load assigned modules.');
      } finally {
        setLoadingAssigned(false);
      }
    };
    fetchAssignedModules();
  }, [studentNumber, allModules]);

  const AddModule = async () => {
    if (!selectedModule) {
      Alert.alert('Please select a module to add');
      return;
    }
    try {
      const payload = { studentNumber, moduleCode: selectedModule };
      const response = await fetch(
        'https://varsitytrackerapi20250619102431-b3b3efgeh0haf4ge.uksouth-01.azurewebsites.net/Module/student_add_module',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      const resultText = await response.text();
      if (!response.ok) return Alert.alert('Failed', resultText);
      Alert.alert('Success', resultText);
      setSelectedModule('');
      setLoadingAssigned(true);
    } catch (error) {
      Alert.alert('Error', 'Could not connect to the server.');
    } finally {
      setLoadingAssigned(false);
    }
  };

  const renderModule = ({ item }: { item: Module }) => (
    <View style={styles.card}>
      <Text style={styles.moduleCode}>{item.code}</Text>
      <Text style={styles.moduleName}>{item.moduleName}</Text>
    </View>
  );

  if (loadingModules || loadingAssigned) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#064f62" />
      </View>
    );
  }

  const availableModules = allModules.filter(
    (mod) => !assignedModules.some((assigned) => assigned.code === mod.code)
  );

  return (
    <ImageBackground
      source={require('./assets/images/BackgroundImage.jpg')}
      style={styles.background}
    >
      <View style={styles.mainContainer}>
        <View style={styles.container}>
          <Text style={styles.header}>Assigned Modules</Text>

          {assignedModules.length === 0 ? (
            <Text style={styles.noModules}>No modules assigned yet.</Text>
          ) : (
            <View style={styles.scrollArea}>
              <FlatList
                data={assignedModules}
                keyExtractor={(item) => item.RowKey}
                renderItem={renderModule}
                showsVerticalScrollIndicator={true}
                contentContainerStyle={styles.cardList}
                style={styles.scrollList}
              />
            </View>
          )}

          <Text style={[styles.header, { marginTop: 25 }]}>Add Module</Text>

          <View style={styles.form}>
            <Picker
              selectedValue={selectedModule}
              onValueChange={(itemValue) => setSelectedModule(itemValue)}
              style={styles.picker}
            >
              <Picker.Item label="Select a Module" value="" />
              {availableModules.map((mod) => (
                <Picker.Item
                  label={`${mod.code} - ${mod.moduleName}`}
                  value={mod.code}
                  key={mod.RowKey}
                />
              ))}
            </Picker>

            <TouchableOpacity
              style={[styles.button, { opacity: !selectedModule ? 0.6 : 1 }]}
              onPress={AddModule}
              disabled={!selectedModule}
            >
              <Text style={styles.buttonText}>Add Module</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.navContainer}>
          <StudentBottomNav
            navigation={navigation}
            role={role as 'student' | 'lecturer' | 'admin'}
          />
        </View>
      </View>
    </ImageBackground>
  );
};

export default StudentModules;

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#f9f0f0ff',
  },
  mainContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 20,
    width: '100%',
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#064f62',
    marginBottom: 10,
  },
  scrollArea: {
    flex: 1,
    width: '100%',
    padding: 10
  },
  scrollList: {
    width: '100%',
  },
  cardList: {
    paddingBottom: 10,
  },
  card: {
    backgroundColor: '#a4c984',
    width: '100%',
    borderRadius: 20,
    marginVertical: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  moduleCode: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#064f62',
  },
  moduleName: {
    fontSize: 15,
    color: '#064f62',
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 10,
  },
  picker: {
    backgroundColor: '#064f62',
    borderRadius: 12,
    borderWidth: 1,
    color: 'white',
    borderColor: '#6bbfe4',
    width: 260,
    marginVertical: 10,
  },
  button: {
    backgroundColor: '#6bbfe4',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  noModules: {
    color: '#aeacabff',
    fontSize: 16,
    marginVertical: 10,
  },
  form: {
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  navContainer: {
    backgroundColor: '#f9f0f0ff',
  },
});
