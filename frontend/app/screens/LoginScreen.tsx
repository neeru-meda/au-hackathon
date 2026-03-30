import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image
} from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, SPACING, FONTS } from '../utils/theme';
import { authAPI, seedAPI } from '../utils/api';
import { useUser } from '../utils/UserContext';

const AU_LOGO_URL = 'https://customer-assets.emergentagent.com/job_au-mobile-suite/artifacts/wrksjzfy_image.png';

export default function LoginScreen() {
  const router = useRouter();
  const { setUser } = useUser();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Please enter username and password');
      return;
    }

    setLoading(true);
    try {
      // First, seed data if needed
      await seedAPI.seedData();
      
      // Then login (no role needed - auto-detected)
      const response = await authAPI.login(username, password);
      
      if (response.success) {
        // Store user in context
        setUser(response.user);
        // Navigate to appropriate dashboard based on role
        const role = response.user.role;
        if (role === 'Clerk') {
          router.replace('/(clerk)/scan');
        } else if (role === 'Student') {
          router.replace('/(student)/attendance');
        } else {
          router.replace('/(tabs)/dashboard');
        }
      } else {
        Alert.alert('Error', response.message);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image 
              source={{ uri: AU_LOGO_URL }} 
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>

          {/* Title */}
          <Text style={styles.title}>AcadEase 360°</Text>
          <Text style={styles.subtitle}>AU CSSE Smart Utility</Text>

          {/* Username */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Username</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="Enter username"
              placeholderTextColor={COLORS.darkGray}
              autoCapitalize="none"
            />
          </View>

          {/* Password */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter password"
              placeholderTextColor={COLORS.darkGray}
              secureTextEntry
            />
          </View>

          {/* Login Button */}
          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.loginButtonText}>Login</Text>
            )}
          </TouchableOpacity>

          {/* Demo Credentials */}
          <View style={styles.credentialsHint}>
            <Text style={styles.hintText}>Demo Credentials:</Text>
            <Text style={styles.hintText}>Teacher: teacher / teacher123</Text>
            <Text style={styles.hintText}>Admin: admin / admin123</Text>
            <Text style={styles.hintText}>Clerk: clerk / clerk123</Text>
            <Text style={styles.hintText}>Student: R001 / student123</Text>
          </View>

          {/* Footer */}
          <Text style={styles.footerText}>Andhra University - CSSE Department</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: SPACING.lg
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 8
  },
  logoImage: {
    width: 72,
    height: 72
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 2
  },
  subtitle: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.darkGray,
    textAlign: 'center',
    marginBottom: 20
  },
  inputContainer: {
    marginBottom: 14
  },
  label: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 12,
    fontSize: FONTS.sizes.md,
    backgroundColor: COLORS.white,
    color: COLORS.text,
    minHeight: 46
  },
  loginButton: {
    backgroundColor: COLORS.primary,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 4,
    minHeight: 48
  },
  loginButtonText: {
    fontSize: FONTS.sizes.lg,
    fontWeight: 'bold',
    color: COLORS.white
  },
  credentialsHint: {
    marginTop: 14,
    padding: 10,
    backgroundColor: '#F8F8F8',
    borderRadius: 8
  },
  hintText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.darkGray,
    textAlign: 'center',
    marginVertical: 1
  },
  footerText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.darkGray,
    textAlign: 'center',
    marginTop: 14
  }
});