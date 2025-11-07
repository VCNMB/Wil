import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ImageBackground } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';

const About: React.FC = () => {
  const navigation = useNavigation();

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
            <Text style={styles.header}>About</Text>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.sectionTitle}>OVERVIEW</Text>
            <Text style={styles.paragraph}>
            AttndEase is a modern attendance management system designed to simplify and improve tracking for both students and lecturers. 
            The system integrates QR code functionality and Bluetooth technology to create a seamless, secure, and user-friendly process.
            </Text>

            <Text style={styles.sectionTitle}>HOW IT WORKS</Text>
            <Text style={styles.paragraph}>
            The system begins with administrators registering students and lecturers, thereby establishing a central database. 
            Unique QR codes are generated for each lesson, ensuring that every session is securely logged. 
            Students and lecturers scan these QR codes using their mobile devices to check in and out, replacing the traditional manual signing of registers. 
            The use of mobile phones makes the process intuitive and accessible.
            </Text>
            <Text style={styles.paragraph}>
            Bluetooth signals further enhance accuracy by verifying attendance in real time. 
            Through Bluetooth Low Energy (BLE) identifiers, the system can detect user presence within a specific range, 
            preventing proxy attendance and ensuring authenticity.
            </Text>

            <Text style={styles.sectionTitle}>EFFICIENCY AND TRANSPARENCY</Text>
            <Text style={styles.paragraph}>
            AttndEase strengthens efficiency by generating real-time attendance records. 
            These records provide transparency for students, while lecturers benefit from detailed reporting that can be exported, analyzed, and archived. 
            The automation reduces administrative burdens and eliminates errors common in manual systems.
            </Text>

            <Text style={styles.sectionTitle}>TECHNOLOGICAL FOUNDATION</Text>
            <Text style={styles.paragraph}>
            The platform combines ESP32-CAM devices, React Native mobile applications, and Azure cloud services. 
            ESP32 devices scan QR codes displayed on mobile screens or detect BLE UUIDs to confirm user presence. 
            This data is securely transmitted to Azure-hosted APIs for validation and storage. 
            The system is compatible with both iOS and Android, ensuring inclusivity across devices.
            </Text>

            <Text style={styles.sectionTitle}>SMART FEATURES</Text>
            <Text style={styles.paragraph}>
            • Seamless check-ins using QR code scanning.{'\n'}
            • Secure Bluetooth-based verification to prevent fraudulent entries.{'\n'}
            • Cloud integration via Azure for real-time logging and backup.{'\n'}
            • User dashboards providing personalized attendance summaries.{'\n'}
            • Lecturer reporting tools for class insights and attendance analysis.
            </Text>
        </ScrollView>
        </View>
    </ImageBackground>
  );
};

export default About;

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
    marginBottom: 6,
  },
  paragraph: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
    marginBottom: 18,
  },
});
