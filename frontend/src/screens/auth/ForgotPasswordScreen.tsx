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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AuthService from '../../services/auth';
import { ForgotPasswordForm } from '../../types';

const ForgotPasswordScreen: React.FC = () => {
  const navigation = useNavigation();
  const [form, setForm] = useState<ForgotPasswordForm>({
    email: '',
  });
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleForgotPassword = async () => {
    if (!form.email) {
      Alert.alert('Error', 'Mohon masukkan email Anda');
      return;
    }

    if (!isValidEmail(form.email)) {
      Alert.alert('Error', 'Format email tidak valid');
      return;
    }

    setLoading(true);
    try {
      const response = await AuthService.forgotPassword(form);

      if (response.success) {
        setEmailSent(true);
        Alert.alert(
          'Email Terkirim',
          'Kami telah mengirim link reset password ke email Anda. Silakan cek inbox atau folder spam.',
          [{ text: 'OK' }],
        );
      } else {
        Alert.alert('Error', response.message || 'Gagal mengirim email reset');
      }
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.message || 'Terjadi kesalahan saat mengirim email',
      );
    } finally {
      setLoading(false);
    }
  };

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  if (emailSent) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />

        <View style={styles.successContainer}>
          <Text style={styles.successEmoji}>📧</Text>
          <Text style={styles.successTitle}>Email Terkirim!</Text>
          <Text style={styles.successText}>
            Kami telah mengirim link reset password ke{'\n'}
            <Text style={styles.emailText}>{form.email}</Text>
          </Text>
          <Text style={styles.instructionText}>
            Silakan cek inbox atau folder spam Anda dan ikuti instruksi untuk
            mengatur ulang password.
          </Text>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.navigate('Login' as never)}
          >
            <Text style={styles.backButtonText}>Kembali ke Login</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.resendButton}
            onPress={() => {
              setEmailSent(false);
              setForm({ email: '' });
            }}
          >
            <Text style={styles.resendButtonText}>Kirim Ulang</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

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
            style={styles.backButtonSmall}
            onPress={() => navigation.goBack()}
            disabled={loading}
          >
            <Text style={styles.backButtonSmallText}>← Kembali</Text>
          </TouchableOpacity>

          <Text style={styles.logo}>🔐</Text>
          <Text style={styles.title}>Lupa Password?</Text>
          <Text style={styles.subtitle}>
            Masukkan email Anda dan kami akan mengirim link untuk mengatur ulang
            password
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Masukkan email Anda"
              value={form.email}
              onChangeText={text => setForm({ email: text.toLowerCase() })}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              editable={!loading}
              autoFocus
            />
          </View>

          <TouchableOpacity
            style={[styles.sendButton, loading && styles.disabledButton]}
            onPress={handleForgotPassword}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.sendButtonText}>Kirim Link Reset</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Ingat password Anda?</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Login' as never)}
            disabled={loading}
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
    marginBottom: 40,
  },
  backButtonSmall: {
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  backButtonSmallText: {
    fontSize: 16,
    color: '#6366f1',
    fontWeight: '500',
  },
  logo: {
    fontSize: 60,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  form: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 30,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  sendButton: {
    backgroundColor: '#6366f1',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
  },
  sendButtonText: {
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
    color: '#6366f1',
    fontWeight: '600',
  },
  // Success screen styles
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  successEmoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  successText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 22,
  },
  emailText: {
    fontWeight: '600',
    color: '#6366f1',
  },
  instructionText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 40,
  },
  backButton: {
    backgroundColor: '#6366f1',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 40,
    marginBottom: 16,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  resendButton: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 40,
  },
  resendButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
  },
});

export default ForgotPasswordScreen;
