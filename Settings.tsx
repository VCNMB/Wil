import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  ScrollView,
  Alert,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootTabParamList } from './types';
import StudentBottomNav from './BottomNav.tsx';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';

type AuthRouteProp = RouteProp<RootTabParamList, 'Auth'>;
type AuthNavProp = NativeStackNavigationProp<RootTabParamList>;

const Settings: React.FC = () => {
  const navigation = useNavigation<AuthNavProp>();
  const route = useRoute<AuthRouteProp>();
  const { role } = route.params;

  const handleLogout = async () => {
    Alert.alert('Confirm Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem('userSession');
          navigation.reset({
            index: 0,
            routes: [{ name: 'Auth' }],
          });
        },
      },
    ]);
  };

  const handleTermsNavigation = () => {
    navigation.navigate('TermsAndConditions' as never);
  };

  const handleAboutNavigation = () => {
    navigation.navigate('About' as never);
  };

  const handleChangePasswordNavigation = () => {
    if (role === 'Student') {
      navigation.navigate('ChangeStudentPassword' as never);
    } else if (role === 'Lecturer') {
      navigation.navigate('ChangeLecturerPassword' as never);
    } else {
      Alert.alert('Error', 'Invalid user role — cannot change password.');
    }
  };

  const settingsOptions = [
    { name: 'Profile', icon: 'person-circle-outline', color: '#4CAF50' },
    { name: 'Terms & Conditions', icon: 'document-text-outline', color: '#064f62', action: handleTermsNavigation },
    { name: 'Change Password', icon: 'lock-closed-outline', color: '#00BCD4', action: handleChangePasswordNavigation },
    { name: 'About', icon: 'information-circle-outline', color: '#1976D2', action: handleAboutNavigation },
    { name: 'Logout', icon: 'log-out-outline', color: '#E53935', action: handleLogout },
  ];

  return (
    <ImageBackground
      source={require('./assets/images/BackgroundImage.jpg')}
      style={styles.background}
    >
      <View style={styles.overlay}>
        <Text style={styles.header}>Settings</Text>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.cardContainer}>
            {settingsOptions.map((option) => (
              <TouchableOpacity
                key={option.name}
                style={[styles.card, { borderColor: option.color }]}
                activeOpacity={0.7}
                onPress={option.action ? option.action : undefined}
              >
                <View style={styles.cardRow}>
                  <View style={styles.optionLeft}>
                    <View
                      style={[
                        styles.iconWrapper,
                        { backgroundColor: option.color + '33' },
                      ]}
                    >
                      <Icon name={option.icon} size={24} color={option.color} />
                    </View>
                    <Text style={[styles.optionText, { color: option.color }]}>
                      {option.name}
                    </Text>
                  </View>
                  <Icon name="chevron-forward-outline" size={20} color="#aaa" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <View style={styles.navContainer}>
          <StudentBottomNav navigation={navigation} role={role} />
        </View>
      </View>
    </ImageBackground>
  );
};

export default Settings;

const styles = StyleSheet.create({
  background: { flex: 1 },
  overlay: { flex: 1, paddingTop: 60 },
  header: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#064f62',
    textAlign: 'center',
    marginBottom: 25,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 140 },
  cardContainer: {
    borderWidth: 1,
    borderColor: 'black',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  card: {
    borderWidth: 1,
    borderColor: 'black',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  optionLeft: { flexDirection: 'row', alignItems: 'center' },
  iconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionText: { fontSize: 25, fontWeight: '600' },
  navContainer: { position: 'absolute', bottom: 0, width: '100%' },
});
