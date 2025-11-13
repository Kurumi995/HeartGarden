import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SeedsProvider } from './SeedsContext';
import Home from './Home';
import Garden from './Garden';
import Task from './Task';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <SeedsProvider>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="Home" component={Home} />
          <Stack.Screen name="Garden" component={Garden} />
          <Stack.Screen name="Task" component={Task} />
        </Stack.Navigator>
      </NavigationContainer>
    </SeedsProvider>
  );
}
