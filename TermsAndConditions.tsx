import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ImageBackground } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';

const TermsAndConditions: React.FC = () => {
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
            <Text style={styles.header}>Terms & Conditions</Text>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.sectionTitle}>AttndEase Terms and Conditions</Text>
            <Text style={styles.paragraph}>Last Updated: 03/11/2025</Text>

            <Text style={styles.paragraph}>
            Welcome to AttndEase, a digital attendance tracking application. By downloading, registering for, or using AttndEase, you agree to the following Terms and Conditions. Please read them carefully.
            </Text>

            <Text style={styles.sectionTitle}>1. Overview of AttndEase</Text>
            <Text style={styles.paragraph}>
            AttndEase allows students to track their class attendance using a combination of QR code scanning and Bluetooth beacon tracking. Each user is required to scan a QR code for a lesson. Once a lesson begins, a Bluetooth beacon tracks whether users are present within the classroom. Attendance reports are generated for lecturers, and users may view their personal attendance history within the app.
            </Text>

            <Text style={styles.sectionTitle}>2. User Eligibility</Text>
            <Text style={styles.paragraph}>
            You must be:
            {'\n'}• A registered student at a participating institution,
            {'\n'}• At least 18 years of age or have the consent of a parent/guardian if under 18,
            {'\n'}• Assigned a valid institutional email or ID.
            </Text>

            <Text style={styles.sectionTitle}>3. User Responsibilities</Text>
            <Text style={styles.paragraph}>
            By using AttndEase, you agree to:
            {'\n'}• Keep your login credentials secure,
            {'\n'}• Use your own device to scan a QR code and not pose as someone else,
            {'\n'}• Ensure your mobile device’s Bluetooth and location services are active during class for accurate tracking,
            {'\n'}• Use the app in compliance with all university or institutional policies.
            </Text>

            <Text style={styles.sectionTitle}>4. QR Code and Bluetooth Beacon Tracking</Text>
            <Text style={styles.paragraph}>
            • Each user is provided a unique QR code to verify their identity and attendance.
            {'\n'}• During active class sessions, AttndEase uses Bluetooth beacon technology to determine if users are physically present in the classroom.
            {'\n'}• Location data is only collected within the defined classroom radius and only during scheduled lessons.
            </Text>

            <Text style={styles.sectionTitle}>5. Data Collection and Usage</Text>
            <Text style={styles.paragraph}>
            We collect the following data:
            {'\n'}• Student name, ID, and institutional email,
            {'\n'}• QR code information,
            {'\n'}• Bluetooth-based presence data (within proximity range),
            {'\n'}• Attendance timestamps.
            </Text>

            <Text style={styles.paragraph}>
            Purpose of Data Collection:
            {'\n'}• To generate accurate attendance reports for lecturers,
            {'\n'}• To provide students with their personal attendance records,
            {'\n'}• To improve app functionality and user experience.
            </Text>

            <Text style={styles.paragraph}>
            Your data will not be sold or shared with third parties, except:
            {'\n'}• With your institution for legitimate educational or administrative use,
            {'\n'}• When required by law.
            </Text>

            <Text style={styles.sectionTitle}>6. Privacy and Consent</Text>
            <Text style={styles.paragraph}>
            By using AttndEase, you consent to:
            {'\n'}• The collection and use of your data as described above,
            {'\n'}• Your presence being monitored via Bluetooth during active class sessions,
            {'\n'}• The sharing of your attendance records with authorized institutional staff.
            </Text>

            <Text style={styles.sectionTitle}>7. Data Security</Text>
            <Text style={styles.paragraph}>
            AttndEase implements reasonable safeguards to protect your personal data, including encryption and access controls. However, no system is 100% secure, and users are responsible for using the app on secure devices.
            </Text>

            <Text style={styles.sectionTitle}>8. Attendance Accuracy</Text>
            <Text style={styles.paragraph}>
            AttndEase aims to provide accurate attendance records. However:
            {'\n'}• It is your responsibility to ensure the app is active and functioning during lessons,
            {'\n'}• Disputes regarding attendance must be directed to your institution with supporting evidence.
            </Text>

            <Text style={styles.sectionTitle}>9. App Availability and Updates</Text>
            <Text style={styles.paragraph}>
            We may update or modify AttndEase at any time. We do not guarantee:
            {'\n'}• Continuous availability of the app,
            {'\n'}• That the app will be error-free or compatible with all devices.
            {'\n'}Users are encouraged to keep the app updated for the best experience.
            </Text>

            <Text style={styles.sectionTitle}>10. Termination of Use</Text>
            <Text style={styles.paragraph}>
            We reserve the right to suspend or terminate your access to AttndEase if you:
            {'\n'}• Violate these Terms and Conditions,
            {'\n'}• Attempt to manipulate or falsify attendance data,
            {'\n'}• Breach your institution’s code of conduct.
            </Text>

            <Text style={styles.sectionTitle}>11. Limitation of Liability</Text>
            <Text style={styles.paragraph}>
            AttndEase is provided “as is” without warranties of any kind. We are not liable for:
            {'\n'}• Loss of data due to app errors or device issues,
            {'\n'}• Missed attendance due to user inaction,
            {'\n'}• Any indirect or consequential damages.
            </Text>

            <Text style={styles.sectionTitle}>12. Changes to Terms</Text>
            <Text style={styles.paragraph}>
            We may revise these Terms and Conditions at any time. Changes will be posted in the app and will take effect upon acceptance or continued use of the app.
            </Text>

            <Text style={styles.sectionTitle}>13. Contact Information</Text>
            <Text style={styles.paragraph}>
            For questions or concerns, contact us at:
            {'\n'}Email: support@AttndEaseapp.com
            {'\n'}Institutional Liaison: [Insert Institutional Contact Info]
            </Text>

            <Text style={styles.paragraph}>
            By using AttndEase, you confirm that you have read, understood, and agree to these Terms and Conditions.
            </Text>
        </ScrollView>
        </View>
    </ImageBackground>
  );
};

export default TermsAndConditions;

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
