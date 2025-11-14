import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SeedsProvider } from './SeedsContext';
import Home from './Home';
import Garden from './Garden';
import Task from './Task';
import ExerciseTask from './ExerciseTask';
import TaskComplete from './TaskComplete';

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
          <Stack.Screen name="ExerciseTask" component={ExerciseTask} />
          <Stack.Screen name="TaskComplete" component={TaskComplete} />
        </Stack.Navigator>
      </NavigationContainer>
    </SeedsProvider>
  );
}
