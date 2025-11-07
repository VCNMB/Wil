import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootTabParamList } from './types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';

type AuthRouteProp = RouteProp<RootTabParamList, 'Auth'>;
type AuthNavProp = NativeStackNavigationProp<RootTabParamList>;

const AuthScreen: React.FC = () => {
  const navigation = useNavigation<AuthNavProp>();
  const route = useRoute<AuthRouteProp>();
  const role = route.params?.role ?? 'student';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLoginUser = async () => {
    const endpoint =
      'https://varsitytrackerapi20250619102431-b3b3efgeh0haf4ge.uksouth-01.azurewebsites.net/Access/login';

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const text = await response.text();
      const json = JSON.parse(text);

      if (!response.ok || !json.success) {
        Alert.alert('Login Failed:', 'Invalid credentials');
        return;
      }

      const idNumber = email.split('@')[0];
      const userRole = json.role as 'student' | 'lecturer' | 'admin';
      const userName = json.name || idNumber;

      await AsyncStorage.setItem(
        'userSession',
        JSON.stringify({
          studentNumber: idNumber,
          role: userRole,
          token: json.token || null,
          email,
          name: userName,
        })
      );

      Alert.alert('Success', json.message);

      if (userRole.toLowerCase() === 'student')
        navigation.navigate('Main', { role: userRole });
      else if (userRole.toLowerCase() === 'lecturer')
        navigation.navigate('MainLecturer', { role: userRole });
      else if (userRole.toLowerCase() === 'admin')
        navigation.navigate('MainAdmin', { role: userRole });
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Could not connect to the server.');
    }
  };

  return (
    <ImageBackground
      source={require('./assets/images/login.jpg')}
      style={styles.backgroundImage}
      imageStyle={{ transform: [{ scale: 1 }] }} // 🔍 Zoom image slightly
      resizeMode="cover"
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.innerBox}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Log in to continue</Text>

          <TextInput
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            style={styles.input}
            placeholderTextColor="#AEACAB"
          />

          <View style={styles.passwordContainer}>
            <TextInput
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              style={styles.passwordInput}
              placeholderTextColor="#AEACAB"
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIconContainer}
            >
              <Ionicons
                name={showPassword ? 'eye-off' : 'eye'}
                size={22}
                color="#064F62"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.button} onPress={handleLoginUser}>
            <Text style={styles.buttonText}>Login</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
};

export default AuthScreen;

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  innerBox: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.85)', 
    borderRadius: 16,
    padding: 25,
    shadowColor: '#064F62',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#064F62', // midnight green
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#6BBFE4', // sky blue accent
    marginBottom: 24,
  },
  input: {
    fontSize: 18,
    borderWidth: 1.5,
    backgroundColor: '#f0f8faff', 
    borderColor: '#AEACAB', // silver
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    color: '#064F62',
  },
  passwordContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  passwordInput: {
    fontSize: 18,
    borderWidth: 1.5,
    backgroundColor: '#f0f8faff',
    borderColor: '#AEACAB',
    padding: 12,
    borderRadius: 10,
    paddingRight: 45,
    color: '#064F62',
  },
  eyeIconContainer: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: [{ translateY: -12 }],
  },
  button: {
    backgroundColor: '#A4C984', // pistachio green
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    fontSize: 20,
    color: '#064F62', // dark text
    fontWeight: 'bold',
  },
});
