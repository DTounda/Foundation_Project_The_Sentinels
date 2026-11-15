import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import SearchScanScreen from '../screens/SearchScanScreen';
import SearchResultsScreen from '../screens/SearchResultsScreen';
import AllergyProfileScreen from '../screens/AllergyProfileScreen';
import PharmaciesScreen from '../screens/PharmaciesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
import LoginScreen from '../screens/LoginScreen';
import SignUpScreen from '../screens/SignUpScreen';
import ResultScreen from '../screens/ResultScreen';
import ReportScreen from '../screens/ReportScreen';
import PhotoVerifyScreen from '../screens/PhotoVerifyScreen';
import Icon from '../components/Icon';
import { ROUTES } from './routes';
import { COLORS, FONTS } from '../constants/theme';
import { hasToken, hasConsented } from '../services/api';

export { ROUTES };

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TAB_META = {
  [ROUTES.HOME]: ['Home', 'home'],
  [ROUTES.ALLERGY_PROFILE]: ['Allergies', 'allergy'],
  [ROUTES.PHARMACIES]: ['Pharmacies', 'pin'],
  [ROUTES.PROFILE]: ['Profile', 'user'],
};

// Custom bar: the active tab sits in a soft pill, with the safety line above it.
function TabBar({ state, navigation }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.tabWrap}>
      <View style={styles.infoLine}>
        <Icon name="info" size={14} color={COLORS.muted} />
        <Text style={styles.infoText}>Information only. Always check with your pharmacist.</Text>
      </View>
      <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 12) }]} accessibilityRole="tablist">
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const [label, icon] = TAB_META[route.name];
          const color = focused ? COLORS.primary : COLORS.muted;
          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={label}
              onPress={() => {
                const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
              }}
              style={styles.tab}
            >
              <View style={[styles.pill, focused && styles.pillOn]}>
                <Icon name={icon} size={22} color={color} />
              </View>
              <Text style={[styles.tabLabel, { color, fontFamily: focused ? FONTS.bold : FONTS.medium }]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function Tabs() {
  return (
    <Tab.Navigator
      initialRouteName={ROUTES.HOME}
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name={ROUTES.HOME} component={SearchScanScreen} />
      <Tab.Screen name={ROUTES.ALLERGY_PROFILE} component={AllergyProfileScreen} />
      <Tab.Screen name={ROUTES.PHARMACIES} component={PharmaciesScreen} />
      <Tab.Screen name={ROUTES.PROFILE} component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// Checked once at launch: signed in goes to Home, a returning phone to Login, a new one to Welcome.
export default function AppNavigator() {
  const [start, setStart] = useState(null);

  useEffect(() => {
    Promise.all([hasToken(), hasConsented()]).then(([signedIn, consented]) => {
      if (signedIn) setStart(ROUTES.TABS);
      else setStart(consented ? ROUTES.LOGIN : ROUTES.WELCOME);
    });
  }, []);

  if (!start) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={start}
        screenOptions={{ headerShown: false, contentStyle: { backgroundColor: COLORS.background } }}
      >
        <Stack.Screen name={ROUTES.TABS} component={Tabs} />
        <Stack.Screen name={ROUTES.SEARCH_RESULTS} component={SearchResultsScreen} />
        <Stack.Screen name={ROUTES.RESULT} component={ResultScreen} />
        <Stack.Screen name={ROUTES.PHOTO_VERIFY} component={PhotoVerifyScreen} />
        <Stack.Screen name={ROUTES.REPORT} component={ReportScreen} />
        <Stack.Screen name={ROUTES.WELCOME} component={WelcomeScreen} />
        <Stack.Screen name={ROUTES.LOGIN} component={LoginScreen} />
        <Stack.Screen name={ROUTES.SIGN_UP} component={SignUpScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background },
  tabWrap: { backgroundColor: COLORS.background },
  infoLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 6 },
  infoText: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.muted },
  tabBar: {
    flexDirection: 'row', paddingTop: 10, paddingHorizontal: 8,
    backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  tab: { flex: 1, alignItems: 'center', gap: 4, minHeight: 48 },
  pill: { width: 56, height: 30, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  pillOn: { backgroundColor: COLORS.primarySoft },
  tabLabel: { fontSize: 12 },
});
