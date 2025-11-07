import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ImageBackground } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';

const ChangeLecturerPassword: React.FC = () => {
  const navigation = useNavigation();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match.');
      return;
    }

    try {
      const session = await AsyncStorage.getItem('userSession');
      if (!session) throw new Error('No user session found');

      const parsed = JSON.parse(session);
      const studentNum = parsed.studentNumber;
      if (!studentNum) throw new Error('Lecturer not found');

      setLoading(true);

      const response = await fetch(
        `https://varsitytrackerapi20250619102431-b3b3efgeh0haf4ge.uksouth-01.azurewebsites.net/Access/change_lecturer_password/${studentNum}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ newPassword }),
        }
      );

      const resultText = await response.text(); // handle plain text or JSON safely

      if (response.ok) {
        Alert.alert('Success', resultText || 'Password updated successfully.');
        navigation.goBack();
      } else {
        Alert.alert('Error', resultText || 'Failed to update password.');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
          source={require('./assets/images/BackgroundImage.jpg')}
          style={styles.background}
        >
        <View style={styles.overlay}>
        <View style={styles.headerContainer}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-back-outline" size={26} color="#064f62" />
            </TouchableOpacity>
            <Text style={styles.header}>Change Password</Text>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.sectionTitle}>Update Your Password</Text>

            <View style={styles.passwordContainer}>
                <TextInput
                placeholder="New Password"
                value={newPassword}
                onChangeText={setNewPassword}
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
            <View style={styles.passwordContainer}>
            <TextInput
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                style={styles.passwordInput}
                placeholderTextColor="#AEACAB"
            />
            <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeIconContainer}
                >
                <Ionicons
                    name={showConfirmPassword ? 'eye-off' : 'eye'}
                    size={22}
                    color="#064F62"
                />
                </TouchableOpacity>
            </View>

            <TouchableOpacity
            style={[styles.button, loading && { opacity: 0.7 }]}
            onPress={handleChangePassword}
            disabled={loading}
            >
            <Text style={styles.buttonText}>{loading ? 'Updating...' : 'Change Password'}</Text>
            </TouchableOpacity>
        </ScrollView>
        </View>
    </ImageBackground>
  );
};

export default ChangeLecturerPassword;

const styles = StyleSheet.create({
  background: { flex: 1 },
  overlay: { flex: 1, paddingTop: 60 },
  container: {
    flex: 1,
    backgroundColor: '#f0f8fa',
    paddingTop: 60,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  backButton: {
    marginRight: 10,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#064f62',
  },
  content: {
    padding: 20,
    paddingBottom: 50,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#064f62',
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#064f62',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
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
});
