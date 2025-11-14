import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';

// Task data for different types
const TASK_DATA = {
  'exercise': [
    { id: '1', title: 'Do 10 minutes of yoga', completed: false },
    { id: '2', title: 'Walk for 30 minutes', completed: false },
    { id: '3', title: 'Jump rope for 5 minutes', completed: false },
  ],
  'emotion': [
    { id: '1', title: 'Write down 3 things you\'re grateful for', completed: false },
    { id: '2', title: 'Draw how you feel', completed: false },
    { id: '3', title: 'Write a letter to yourself', completed: false },
    { id: '4', title: 'Listen to a healing song', completed: false },
  ],
  'social': [
    { id: '1', title: 'Message a friend', completed: false },
    { id: '2', title: 'Call your family', completed: false },
    { id: '3', title: 'Join a hobby group', completed: false },
    { id: '4', title: 'Meet a friend for coffee', completed: false },
  ],
  'healthy-eating': [
    { id: '1', title: 'Cook yourself a healthy meal', completed: false },
    { id: '2', title: 'Drink 8 glasses of water', completed: false },
    { id: '3', title: 'Eat 5 different colored vegetables', completed: false },
    { id: '4', title: 'Try a new healthy recipe', completed: false },
  ],
  'sleep': [
    { id: '1', title: 'No phone 30 mins before bed', completed: false },
    { id: '2', title: 'Go to bed before 10 PM', completed: false },
    { id: '3', title: 'Meditate for 10 minutes', completed: false },
    { id: '4', title: 'Drink a glass of warm milk', completed: false },
  ],
};

export default function Task({ route, navigation }) {
  const { taskType } = route.params || { taskType: 'exercise' };
  const [tasks, setTasks] = useState(TASK_DATA[taskType] || TASK_DATA['exercise']);

  const handleTaskPress = (task) => {
    // 只有 exercise 类型跳转到任务界面
    if (taskType === 'exercise') {
      navigation.navigate('ExerciseTask', { task });
    }
  };

  const getTaskTypeLabel = (type) => {
    const labels = {
      'emotion': 'Emotion Tasks',
      'social': 'Social Tasks',
      'healthy-eating': 'Healthy Eating Tasks',
      'exercise': 'Exercise/Hobby Tasks',
      'sleep': 'Sleep Tasks'
    };
    return labels[type] || 'Tasks';
  };

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={28} color="#FF69B4" />
        </TouchableOpacity>
        <Text style={styles.title}>{getTaskTypeLabel(taskType)}</Text>
      </View>

      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.taskItem}
            onPress={() => handleTaskPress(item)}
          >
            <Text style={styles.taskText}>
              {item.title}
            </Text>
            <MaterialIcons 
              name="chevron-right" 
              size={28} 
              color="#FF69B4" 
            />
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffdeed',
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  backButton: {
    marginRight: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF69B4',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
  },
  taskText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
});

