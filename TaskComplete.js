import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function TaskComplete({ navigation }) {
  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      
      <View style={styles.content}>
        <Text style={styles.title}>Congratulations!</Text>
        <Text style={styles.subtitle}>Your seed is growing...</Text>
        
        <Image 
          source={require('./assets/seed.png')} 
          style={styles.seedImage}
          resizeMode="contain"
        />
        
        <Text style={styles.message}>
          Great job! Keep completing tasks to help your garden grow.
        </Text>
        
        <TouchableOpacity 
          style={styles.gardenButton}
          onPress={() => navigation.navigate('Garden')}
        >
          <Text style={styles.gardenButtonText}>Go to Garden</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffdeed',
    paddingTop: 50,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FF69B4',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 20,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
  },
  seedImage: {
    width: 200,
    height: 200,
    marginBottom: 40,
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  gardenButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    paddingHorizontal: 50,
    borderRadius: 25,
  },
  gardenButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

