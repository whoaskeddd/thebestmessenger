import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';
import { ChatRoomScreen } from '../screens/ChatRoomScreen';
import { ChatsScreen } from '../screens/ChatsScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { EmployeeCardScreen } from '../screens/EmployeeCardScreen';
import { EmployeesScreen } from '../screens/EmployeesScreen';
import { LeavesScreen } from '../screens/LeavesScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { NewsScreen } from '../screens/NewsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { TasksScreen } from '../screens/TasksScreen';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator = () => {
  const { isReady, isAuthenticated } = useAuth();

  if (!isReady) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <>
          <Stack.Screen name="Dashboard" component={DashboardScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="Employees" component={EmployeesScreen} />
          <Stack.Screen name="EmployeeCard" component={EmployeeCardScreen} />
          <Stack.Screen name="Leaves" component={LeavesScreen} />
          <Stack.Screen name="News" component={NewsScreen} />
          <Stack.Screen name="Tasks" component={TasksScreen} />
          <Stack.Screen name="Chats" component={ChatsScreen} />
          <Stack.Screen name="ChatRoom" component={ChatRoomScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};
