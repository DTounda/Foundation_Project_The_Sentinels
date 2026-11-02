import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from '../screens/LoginScreen';
import SearchScanScreen from '../screens/SearchScanScreen';
import ResultScreen from '../screens/ResultScreen';
import AllergyProfileScreen from '../screens/AllergyProfileScreen';
import ReportScreen from '../screens/ReportScreen';

const Stack = createNativeStackNavigator();

// Route names are shared with the whole team. Do not rename them without telling everyone.
export const ROUTES = {
  LOGIN: 'Login',
  SEARCH_SCAN: 'SearchScan',
  RESULT: 'Result',
  ALLERGY_PROFILE: 'AllergyProfile',
  REPORT: 'Report',
};

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={ROUTES.SEARCH_SCAN}>
        <Stack.Screen name={ROUTES.LOGIN} component={LoginScreen} options={{ title: 'Log in' }} />
        <Stack.Screen name={ROUTES.SEARCH_SCAN} component={SearchScanScreen} options={{ title: 'MediCheck' }} />
        <Stack.Screen name={ROUTES.RESULT} component={ResultScreen} options={{ title: 'Result' }} />
        <Stack.Screen name={ROUTES.ALLERGY_PROFILE} component={AllergyProfileScreen} options={{ title: 'My allergies' }} />
        <Stack.Screen name={ROUTES.REPORT} component={ReportScreen} options={{ title: 'Report a product' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
