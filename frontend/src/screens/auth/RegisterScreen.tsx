import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AuthService from '../../services/auth';
import { RegisterForm } from '../../types';
import { useAuthStore } from '@/src/stores/StoreProvider';

const RegisterScreen: React.FC = () => {
  const navigation = useNavigation();
  const authStore = useAuthStore();
  const [form, setForm] = useState<RegisterForm>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleRegister = async () => {
    // Validation
    if (!form.name || !form.email || !form.password || !form.confirmPassword) {
      Alert.alert('Error', 'Mohon isi semua field');
      return;
    }

    if (!isValidEmail(form.email)) {
      Alert.alert('Error', 'Format email tidak valid');
      return;
    }

    if (form.password.length < 6) {
      Alert.alert('Error', 'Password minimal 6 karakter');
      return;
    }

    if (form.password !== form.confirmPassword) {
      Alert.alert('Error', 'Password dan konfirmasi password tidak sama');
      return;
    }

    try {
      const registerData = {
        name: form.name,
        email: form.email,
        password: form.password,
        confirmPassword: form.confirmPassword,
      };
      const response = await authStore.register(
        form.email,
        form.password,
        form.name,
      );

      if (response) {
        Alert.alert(
          'Berhasil',
          'Akun berhasil dibuat! Selamat datang di Museyo.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Login' as never),
            },
          ],
        );
      } else {
        Alert.alert('Error', authStore.authError || 'Pendaftaran gagal');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Terjadi kesalahan saat mendaftar');
    } finally {
    }
  };

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const getPasswordStrength = (password: string) => {
    if (password.length < 6) return { strength: 'Lemah', color: '#ef4444' };
    if (password.length < 8) return { strength: 'Sedang', color: '#f59e0b' };
    if (password.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)) {
      return { strength: 'Kuat', color: '#10b981' };
    }
    return { strength: 'Sedang', color: '#f59e0b' };
  };

  const passwordStrength = getPasswordStrength(form.password);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            disabled={authStore.isLoading}
          >
            <Text style={styles.backButtonText}>← Kembali</Text>
          </TouchableOpacity>

          <Image
            source={require('../../assets/logo.png')}
            style={{
              width: 120,
              height: 40,
              marginBottom: 20,
              resizeMode: 'contain',
            }}
          />
          <Text style={styles.title}>Buat Akun Baru</Text>
          <Text style={styles.subtitle}>
            Daftar untuk menyimpan koleksi dan riwayat penemuan Anda
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Nama Lengkap</Text>
            <TextInput
              style={styles.input}
              placeholder="Masukkan nama lengkap Anda"
              value={form.name}
              onChangeText={text => setForm({ ...form, name: text })}
              autoCapitalize="words"
              autoComplete="name"
              editable={!authStore.isLoading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Masukkan email Anda"
              value={form.email}
              onChangeText={text =>
                setForm({ ...form, email: text.toLowerCase() })
              }
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              editable={!authStore.isLoading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Masukkan password Anda"
                value={form.password}
                onChangeText={text => setForm({ ...form, password: text })}
                secureTextEntry={!showPassword}
                autoComplete="password-new"
                editable={!authStore.isLoading}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Text style={styles.eyeText}>{showPassword ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>
            {form.password.length > 0 && (
              <View style={styles.passwordStrength}>
                <Text
                  style={[
                    styles.strengthText,
                    { color: passwordStrength.color },
                  ]}
                >
                  Kekuatan password: {passwordStrength.strength}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Konfirmasi Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Konfirmasi password Anda"
                value={form.confirmPassword}
                onChangeText={text =>
                  setForm({ ...form, confirmPassword: text })
                }
                secureTextEntry={!showConfirmPassword}
                autoComplete="password-new"
                editable={!authStore.isLoading}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Text style={styles.eyeText}>
                  {showConfirmPassword ? '🙈' : '👁️'}
                </Text>
              </TouchableOpacity>
            </View>
            {form.confirmPassword.length > 0 &&
              form.password !== form.confirmPassword && (
                <Text style={styles.errorText}>Password tidak sama</Text>
              )}
          </View>

          <TouchableOpacity
            style={[
              styles.registerButton,
              authStore.isLoading && styles.disabledButton,
            ]}
            onPress={handleRegister}
            disabled={authStore.isLoading}
          >
            {authStore.isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.registerButtonText}>Daftar</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Sudah punya akun?</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Login' as never)}
            disabled={authStore.isLoading}
          >
            <Text style={styles.loginText}>Masuk di sini</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 30,
    paddingTop: 40,
    paddingBottom: 30,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  backButtonText: {
    fontSize: 16,
    color: '#7B7B7D',
    fontWeight: '500',
  },
  logo: {
    fontSize: 50,
    marginBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  form: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  eyeButton: {
    paddingHorizontal: 10,
  },
  eyeText: {
    fontSize: 16,
  },
  passwordStrength: {
    marginTop: 4,
  },
  strengthText: {
    fontSize: 12,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
  },
  registerButton: {
    backgroundColor: '#7B7B7D',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
  },
  registerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#6b7280',
    marginRight: 5,
  },
  loginText: {
    fontSize: 14,
    color: '#7B7B7D',
    fontWeight: '600',
  },
});

export default RegisterScreen;
