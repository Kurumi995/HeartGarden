import React from 'react';
import { View, Text, Image, ImageBackground, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSeeds } from './SeedsContext';

export default function Garden({ navigation }) {
  const { seeds } = useSeeds();

  return (
    <ImageBackground 
      source={require('./assets/garden.png')} 
      style={styles.container}
      resizeMode="cover"
    >
      <StatusBar style="auto" />

      {/* 提示框 */}
      <View style={styles.hintBox}>
        <Text style={styles.hintText}>Click the seed to view tasks</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 显示所有seeds */}
        {seeds.map((seed, index) => (
          <View 
            key={seed.id} 
            style={[
              styles.seedContainer,
              { left: (index * 100), top: 325 + (index % 2) * 50 }
            ]}
          >
            {/* 进度条 */}
            <Image 
              source={require('./assets/load.png')}
              style={styles.progressBar}
              resizeMode="contain"
            />
            
            {/* 可点击的种子 */}
            <TouchableOpacity onPress={() => navigation.navigate('Task', { taskType: seed.taskType })}>
              <Image 
                source={require('./assets/seed.png')}
                style={styles.seedImage}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {/* Aegis头像 - 右下角 */}
      <TouchableOpacity 
        style={styles.aegisButton}
        onPress={() => navigation.navigate('Home', { skipToTaskSelect: true })}
      >
        <Image 
          source={require('./assets/Aegis.png')}
          style={styles.aegisImage}
          resizeMode="contain"
        />
      </TouchableOpacity>

    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
  },
  hintBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    marginTop: 20,
    marginHorizontal: 30,
    alignSelf: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 105, 180, 0.5)',
  },
  hintText: {
    fontSize: 16,
    color: '#FF69B4',
    fontWeight: '600',
    textAlign: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    minHeight: 600,
  },
  seedContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  progressBar: {
    width: 200,
    height: 50,
  },
  seedImage: {
    width: 45,
    height: 45,
  },
  aegisButton: {
    position: 'absolute',
    right: 50,
    bottom: 50,
  },
  aegisImage: {
    width: 100,
    height: 100,
  },
});
