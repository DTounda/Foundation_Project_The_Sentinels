import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { login, register } from '../services/api';

export default function LoginScreen({ navigation, route }) {
  const [isRegister, setIsRegister] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError('');
    if (!email.trim() || !password || (isRegister && !fullName.trim())) {
      setError('Please fill in all fields.');
      return;
    }
    if (isRegister && password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    try {
      if (isRegister) await register(fullName.trim(), email.trim(), password);
      else await login(email.trim(), password);
      navigation.navigate(route?.params?.redirectTo || 'AllergyProfile');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={s.container}>
      <Text style={s.title}>{isRegister ? 'Create account' : 'Log in'}</Text>
      {isRegister && (
        <TextInput style={s.input} placeholder="Full name" value={fullName} onChangeText={setFullName} />
      )}
      <TextInput style={s.input} placeholder="Email" autoCapitalize="none"
        keyboardType="email-address" value={email} onChangeText={setEmail} />
      <TextInput style={s.input} placeholder="Password (min 8 characters)" secureTextEntry
        value={password} onChangeText={setPassword} />
      {!!error && <Text style={s.error}>{error}</Text>}
      <TouchableOpacity style={s.button} onPress={submit} disabled={loading}>
        <Text style={s.buttonText}>{loading ? 'Please wait...' : isRegister ? 'Register' : 'Log in'}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setIsRegister(!isRegister)}>
        <Text style={s.link}>{isRegister ? 'Already have an account? Log in' : 'New here? Create an account'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 26, fontWeight: '700', marginBottom: 20 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 10, padding: 12, marginBottom: 12 },
  button: { backgroundColor: '#0b7a54', padding: 14, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '700' },
  error: { color: '#a4261d', marginBottom: 10 },
  link: { marginTop: 16, textAlign: 'center', color: '#0b7a54' },
});