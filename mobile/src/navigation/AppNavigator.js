import React, { useEffect, useState } from 'react';
import { Text, View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import SearchScanScreen from '../screens/SearchScanScreen';
import AllergyProfileScreen from '../screens/AllergyProfileScreen';
import PharmaciesScreen from '../screens/PharmaciesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import LoginScreen from '../screens/LoginScreen';
import SignUpScreen from '../screens/SignUpScreen';
import ResultScreen from '../screens/ResultScreen';
import ReportScreen from '../screens/ReportScreen';
import { ROUTES } from './routes';
import { COLORS } from '../constants/colors';
import { hasToken } from '../services/api';

export { ROUTES };

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const ACTIVE = COLORS.primary;
const INACTIVE = COLORS.muted;

// Text icons, so no icon package is needed.
function icon(symbol) {
  return ({ color }) => <Text style={{ color, fontSize: 18 }}>{symbol}</Text>;
}

function Tabs() {
  return (
    <Tab.Navigator
      initialRouteName={ROUTES.HOME}
      screenOptions={{
        tabBarActiveTintColor: ACTIVE,
        tabBarInactiveTintColor: INACTIVE,
        tabBarLabelStyle: { fontSize: 11 },
      }}
    >
      <Tab.Screen
        name={ROUTES.HOME}
        component={SearchScanScreen}
        options={{ title: 'MediCheck', tabBarLabel: 'Home', tabBarIcon: icon('⌕') }}
      />
      <Tab.Screen
        name={ROUTES.ALLERGY_PROFILE}
        component={AllergyProfileScreen}
        options={{ title: 'My allergies', tabBarLabel: 'Allergies', tabBarIcon: icon('✚') }}
      />
      <Tab.Screen
        name={ROUTES.PHARMACIES}
        component={PharmaciesScreen}
        options={{
          title: 'Pharmacies and hospitals',
          tabBarLabel: 'Pharmacies',
          tabBarIcon: icon('⌂'),
        }}
      />
      <Tab.Screen
        name={ROUTES.PROFILE}
        component={ProfileScreen}
        options={{ title: 'My profile', tabBarLabel: 'Profile', tabBarIcon: icon('☺') }}
      />
    </Tab.Navigator>
  );
}

// Checked once at launch, so the app opens on Login unless already signed in.
export default function AppNavigator() {
  const [checked, setChecked] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    hasToken().then((ok) => {
      setSignedIn(ok);
      setChecked(true);
    });
  }, []);

  if (!checked) {
    return (
      <View style={gateStyles.loading}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={signedIn ? ROUTES.TABS : ROUTES.LOGIN}>
        <Stack.Screen name={ROUTES.TABS} component={Tabs} options={{ headerShown: false }} />
        <Stack.Screen name={ROUTES.RESULT} component={ResultScreen} options={{ title: 'Result' }} />
        <Stack.Screen
          name={ROUTES.REPORT}
          component={ReportScreen}
          options={{ title: 'Report a product' }}
        />
        <Stack.Screen name={ROUTES.LOGIN} component={LoginScreen} options={{ title: 'Log in' }} />
        <Stack.Screen
          name={ROUTES.SIGN_UP}
          component={SignUpScreen}
          options={{ title: 'Create account' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const gateStyles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.white },
});
