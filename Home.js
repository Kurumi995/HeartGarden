import React, { useEffect, useState, useRef, useCallback } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, ImageBackground, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, FlatList, Pressable } from "react-native";
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import { useSeeds } from './SeedsContext';
import { OPENAI_API_KEY } from './Secrets';

// OpenAI API 配置
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

// Aegis系统提示词 - 根据你的ChatGPT配置
const AEGIS_SYSTEM_PROMPT = `你是Aegis，一个失恋花园HeartGarden的core pet，负责guide用户进行一系列heal from breakup的活动并且照顾他们的情绪。

重要规则：
- 用温暖支持的语气，像温柔的伙伴
- 每次回复不超过两个句子
- 千万不要使用破折号(—)
- 不管用户说什么都继续执行下一个step，不要重复询问
- 说英文，除非用户说中文

对话流程：

Step 1 - 初始问候：
主动说："Hey, good to see you again! How've you been? I was just checking on the garden and thought of you. How are you feeling right now?"

Step 2 - 倾听与安慰：
用一句话安慰用户，然后请他们描述正在发生的事情或正在经历的事。根据用户说的内容检测他们的情绪。不管用户说什么，不要重复询问，直接进入下一个step。

Step 3 - 分析与推荐：
根据用户的情绪分析，推荐1-2个匹配的自我护理任务类别。

情绪与任务匹配逻辑：
• Lonely(孤独) → 推荐 social + emotion 类任务
• Disappointed(失望) → 推荐 exercise + emotion 类任务  
• Angry(生气) → 推荐 exercise + emotion 类任务
• Anxious(焦虑) → 推荐 sleep + healthy eating 类任务
• Depressed(抑郁) → 推荐 emotion + exercise 或 social 类任务

可用的5个任务类别：emotion, social, healthy eating, exercise/hobby, sleep

额外判断：
- 如果用户表达了自我责任或意识到自己的错误 → 推荐 exercise, healthy routines, reflection 任务（帮助重建自尊和情感成熟）
- 如果用户表达了被对方伤害（背叛、忽视、拒绝）→ 推荐 social + emotion 任务（支持情感分离、自我同情、重新连接世界）

回复格式（每部分一句话）：
1. 承认他们当前的感受
2. 询问："Which one feels right for you to start with today?"
3. 结束语："Sounds good! Let's go to our garden! 🌱"

记住：简洁、温暖、不超过两句话。`;    

const MOOD_ITEM_SIZE = 90;
const MOOD_ITEM_SPACING = 24;
const MOOD_SNAP_INTERVAL = MOOD_ITEM_SIZE + MOOD_ITEM_SPACING;

// 心情图标选项 - 使用新上传的图片
const MOOD_ICONS = [
  { id: 'great', label: 'Great', image: require('./assets/great.png') },
  { id: 'good', label: 'Good', image: require('./assets/good.png') },
  { id: 'okay', label: 'Okay', image: require('./assets/okay.png') },
  { id: 'meh', label: 'Meh', image: require('./assets/meh.png') },
  { id: 'bad', label: 'Bad', image: require('./assets/bad.png') },
];

const DEFAULT_MOOD_INDEX = Math.min(
  Math.floor(MOOD_ICONS.length / 2),
  Math.max(MOOD_ICONS.length - 1, 0)
);
const DEFAULT_MOOD_ID = MOOD_ICONS[DEFAULT_MOOD_INDEX]?.id || null;
// 任务选项 - 匹配Aegis GPT的5个类别
const TASKS = [
  { id: 'emotion', label: 'Emotion', icon: 'favorite' },
  { id: 'social', label: 'Social', icon: 'people' },
  { id: 'healthy-eating', label: 'Healthy Eating', icon: 'restaurant' },
  { id: 'exercise', label: 'Exercise/Hobby', icon: 'fitness-center' },
  { id: 'sleep', label: 'Sleep', icon: 'bedtime' },
];

// 调用OpenAI API
async function callChatGPT(messages) {
  try {
    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: messages,
        temperature: 0.7,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API Error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("ChatGPT call failed:", error);
    return "Sorry, I'm unable to respond right now. Please try again later.";
  }
}

export default function Home({ navigation, route }) {
  const { seeds, addSeed } = useSeeds();
  const skipToTaskSelect = route?.params?.skipToTaskSelect || false;
  
  const [showSplash, setShowSplash] = useState(!skipToTaskSelect);
  const [step, setStep] = useState(skipToTaskSelect ? 'task-select' : 'loading');
  const [currentMessage, setCurrentMessage] = useState('');
  const [moodText, setMoodText] = useState('');
  const [selectedMood, setSelectedMood] = useState(DEFAULT_MOOD_ID);
  const [selectedTask, setSelectedTask] = useState(null);
  const [conversationHistory, setConversationHistory] = useState([
    { role: "system", content: AEGIS_SYSTEM_PROMPT }
  ]);
  const [moodListPadding, setMoodListPadding] = useState(0);
  const [moodListWidth, setMoodListWidth] = useState(0);
  const moodListRef = useRef(null);

  // 根据心情返回对应的 GIF
  const getAegisImage = () => {
    // 如果是 mood-select, task-select 或 final-message 阶段，显示 default.gif
    if (step === 'mood-select' || step === 'task-select' || step === 'final-message') {
      return require('./assets/default.gif');
    }
    
    // 根据选择的心情返回对应的 GIF（mood-write 阶段）
    if (selectedMood === 'great' || selectedMood === 'good') {
      return require('./assets/happy.gif');
    } else if (selectedMood === 'okay' || selectedMood === 'meh' || selectedMood === 'bad') {
      return require('./assets/sad.gif');
    }
    
    // 默认返回 default.gif
    return require('./assets/default.gif');
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  // 监听导航focus事件，检查skipToTaskSelect参数
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      const params = navigation.getState().routes.find(r => r.name === 'Home')?.params;
      if (params?.skipToTaskSelect) {
        setStep('task-select');
        setCurrentMessage('Would you like to choose a new task?');
        // 清除参数，避免下次进入还是这个状态
        navigation.setParams({ skipToTaskSelect: undefined });
      }
    });

    return unsubscribe;
  }, [navigation]);

  // 初始化时检查skipToTaskSelect参数
  useEffect(() => {
    if (skipToTaskSelect) {
      setStep('task-select');
      setCurrentMessage('Would you like to choose a new task?');
    }
  }, []);

  useEffect(() => {
    if (showSplash || skipToTaskSelect) return; // 如果是跳过到任务选择，不执行初始化
    
    (async () => {
      setStep('loading');
      // Send initial greeting
      const userMessage = "Start conversation";
      const newHistory = [
        ...conversationHistory,
        { role: "user", content: userMessage }
      ];
      
      const response = await callChatGPT(newHistory);
      setCurrentMessage(response);
      setConversationHistory([
        ...newHistory,
        { role: "assistant", content: response }
      ]);
      
      setTimeout(() => {
        setStep('mood-select');
      }, 1500);
    })();
  }, [showSplash]);

  const updateMoodSelectionByOffset = useCallback((offsetX) => {
    if (moodListWidth === 0) return;
    const centerX = offsetX + moodListWidth / 2;
    const adjustedCenter = centerX - moodListPadding;
    const index = Math.round((adjustedCenter - MOOD_ITEM_SIZE / 2) / MOOD_SNAP_INTERVAL);
    const clampedIndex = Math.min(MOOD_ICONS.length - 1, Math.max(0, index));
    const newMoodId = MOOD_ICONS[clampedIndex]?.id;
    if (newMoodId) {
      setSelectedMood((prev) => (prev === newMoodId ? prev : newMoodId));
    }
  }, [moodListPadding, moodListWidth]);

  const handleMoodListLayout = useCallback((event) => {
    const width = event.nativeEvent.layout.width;
    const padding = Math.max(0, (width - MOOD_ITEM_SIZE) / 2);
    setMoodListWidth(width);
    setMoodListPadding(padding);
  }, []);

  const handleMoodScrollEnd = useCallback((event) => {
    updateMoodSelectionByOffset(event.nativeEvent.contentOffset.x);
  }, [updateMoodSelectionByOffset]);

  useEffect(() => {
    if (!moodListRef.current || moodListWidth === 0) return;
    try {
      moodListRef.current.scrollToIndex({
        index: DEFAULT_MOOD_INDEX,
        animated: false,
      });
      setSelectedMood(DEFAULT_MOOD_ID);
    } catch (error) {
      console.warn('Failed to center default mood:', error);
    }
  }, [moodListWidth]);

  const handleMoodSelect = (moodId) => {
    setSelectedMood(moodId);

    const moodIndex = MOOD_ICONS.findIndex((mood) => mood.id === moodId);
    if (moodIndex >= 0) {
      try {
        moodListRef.current?.scrollToIndex({
          index: moodIndex,
          animated: true,
          viewPosition: 0.5,
        });
      } catch (error) {
        console.warn('Failed to scroll mood list to selected index:', error);
      }
    }
  };

  const handleMoodConfirm = async () => {
    if (!selectedMood) return;

    const userMessage = selectedMood;
    const newHistory = [
      ...conversationHistory,
      { role: "user", content: userMessage }
    ];

    const response = await callChatGPT(newHistory);
    setCurrentMessage(response);
    setConversationHistory([
      ...newHistory,
      { role: "assistant", content: response }
    ]);

    setStep('mood-write');
  };

  const handleMoodSubmit = async () => {
    if (!moodText.trim()) return;
    setStep('loading'); // 只在这里保留loading
    
    const newHistory = [
      ...conversationHistory,
      { role: "user", content: moodText }
    ];
    
    const response = await callChatGPT(newHistory);
    setCurrentMessage(response);
    setConversationHistory([
      ...newHistory,
      { role: "assistant", content: response }
    ]);
    
    setTimeout(() => {
      setStep('task-select');
    }, 1500);
  };

  const handleTaskSelect = async (taskId) => {
    setSelectedTask(taskId);
    
    const taskLabels = {
      'emotion': 'emotion tasks',
      'social': 'social tasks',
      'healthy-eating': 'healthy eating tasks',
      'exercise': 'exercise/hobby tasks',
      'sleep': 'sleep tasks'
    };
    
    const userMessage = `I'd like to try ${taskLabels[taskId] || taskId}`;
    const newHistory = [
      ...conversationHistory,
      { role: "user", content: userMessage }
    ];
    
    const response = await callChatGPT(newHistory);
    setCurrentMessage(response);
    setConversationHistory([
      ...newHistory,
      { role: "assistant", content: response }
    ]);
    
    // 显示最后的消息
    setStep('final-message');
    
    // 3秒后添加新seed并跳转到花园
    setTimeout(() => {
      addSeed(taskId); // 添加新的seed
      navigation.navigate('Garden');
    }, 3000);
  };

  if (showSplash) {
    return (
      <View style={styles.splashContainer}>
        <Image 
          source={require('./assets/Aegis.png')} 
          style={styles.splashIcon}
          resizeMode="contain"
        />
        <StatusBar style="auto" />
      </View>
    );
  }

  // Loading 过渡界面
  if (step === 'loading') {
    return (
      <ImageBackground 
        source={require('./assets/garden.png')} 
        style={styles.container}
        resizeMode="cover"
      >
        <StatusBar style="auto" />
        <View style={styles.loadingScreen}>
          <ActivityIndicator size={50} color="#FF69B4" />
          <Text style={styles.loadingText}>Analyzing...</Text>
        </View>
      </ImageBackground>
    );
  }

  // 心情选择界面
  if (step === 'mood-select') {
    return (
      <ImageBackground 
        source={require('./assets/garden.png')} 
        style={styles.container}
        resizeMode="cover"
      >
        <StatusBar style="auto" />
        <View style={styles.contentContainer}>
          <View style={styles.messageContainer}>
            <View style={styles.messageBubble}>
              <Text style={styles.messageText}>{currentMessage || "今天心情怎么样？"}</Text>
            </View>
            <Image 
              source={getAegisImage()} 
              style={styles.aegisAvatar}
              resizeMode="contain"
            />
          </View>
          <View style={styles.moodListContainer} onLayout={handleMoodListLayout}>
            <FlatList
              ref={moodListRef}
              data={MOOD_ICONS}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={MOOD_SNAP_INTERVAL}
              snapToAlignment="center"
              decelerationRate="fast"
              initialScrollIndex={DEFAULT_MOOD_INDEX}
              getItemLayout={(_, index) => ({
                length: MOOD_SNAP_INTERVAL,
                offset: MOOD_SNAP_INTERVAL * index,
                index,
              })}
              contentContainerStyle={[
                styles.moodList,
                { paddingHorizontal: moodListPadding }
              ]}
              renderItem={({ item }) => {
                const isSelected = item.id === selectedMood;
                return (
                  <View style={styles.moodItemWrapper}>
                    <Pressable
                      onPress={() => handleMoodSelect(item.id)}
                      style={({ pressed }) => [
                        styles.moodPressable,
                        pressed && styles.moodPressablePressed
                      ]}
                    >
                      <Image
                        source={item.image}
                        style={[
                          styles.moodImage,
                          isSelected && styles.moodImageSelected
                        ]}
                        resizeMode="contain"
                      />
                    </Pressable>
                    <Text
                      style={[
                        styles.moodLabel,
                        isSelected && styles.moodLabelSelected
                      ]}
                    >
                      {item.label}
                    </Text>
                  </View>
                );
              }}
              onMomentumScrollEnd={handleMoodScrollEnd}
              onScrollEndDrag={handleMoodScrollEnd}
              scrollEventThrottle={16}
            />
          </View>
          <TouchableOpacity
            style={[
              styles.submitButton,
              !selectedMood && styles.submitButtonDisabled
            ]}
            onPress={handleMoodConfirm}
            disabled={!selectedMood}
          >
            <Text style={styles.submitButtonText}>Next</Text>
          </TouchableOpacity>
        </View>
      </ImageBackground>
    );
  }

  // 心情书写界面
  if (step === 'mood-write') {
    return (
      <ImageBackground 
        source={require('./assets/garden.png')} 
        style={styles.container}
        resizeMode="cover"
      >
        <KeyboardAvoidingView 
          style={{flex: 1}}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <StatusBar style="auto" />
          <ScrollView 
            style={styles.scrollContainer}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.messageContainer}>
              <View style={styles.messageBubble}>
                <Text style={styles.messageText}>{currentMessage || "可以写下心情"}</Text>
              </View>
              <Image 
                source={getAegisImage()} 
                style={styles.aegisAvatar}
                resizeMode="contain"
              />
            </View>
            <TextInput
              style={styles.textInput}
              value={moodText}
              onChangeText={setMoodText}
              placeholder="Write down your mood..."
              placeholderTextColor="#999"
              multiline={true}
              numberOfLines={6}
              textAlignVertical="top"
            />
            <TouchableOpacity 
              style={[styles.submitButton, !moodText.trim() && styles.submitButtonDisabled]}
              onPress={handleMoodSubmit}
              disabled={!moodText.trim()}
            >
              <Text style={styles.submitButtonText}>Next</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </ImageBackground>
    );
  }

  // 任务选择界面
  if (step === 'task-select') {
    return (
      <ImageBackground 
        source={require('./assets/garden.png')} 
        style={styles.container}
        resizeMode="cover"
      >
        <StatusBar style="auto" />
        <View style={styles.contentContainer}>
          <View style={styles.messageContainer}>
            <View style={styles.messageBubble}>
              <Text style={styles.messageText}>{currentMessage || "选择想要的task"}</Text>
            </View>
            <Image 
              source={getAegisImage()} 
              style={styles.aegisAvatar}
              resizeMode="contain"
            />
          </View>
          <View style={styles.taskList}>
            {TASKS.map((task) => (
              <TouchableOpacity
                key={task.id}
                style={[
                  styles.taskButton,
                  selectedTask === task.id && styles.taskButtonSelected
                ]}
                onPress={() => handleTaskSelect(task.id)}
              >
                <MaterialIcons 
                  name={task.icon} 
                  size={30} 
                  color={selectedTask === task.id ? '#FF69B4' : '#666'} 
                />
                <Text style={[
                  styles.taskLabel,
                  selectedTask === task.id && styles.taskLabelSelected
                ]}>
                  {task.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ImageBackground>
    );
  }

  // 最后的消息界面
  if (step === 'final-message') {
    return (
      <ImageBackground 
        source={require('./assets/garden.png')} 
        style={styles.container}
        resizeMode="cover"
      >
        <StatusBar style="auto" />
        <View style={styles.contentContainer}>
          <View style={styles.messageContainer}>
            <View style={styles.messageBubble}>
              <Text style={styles.messageText}>{currentMessage}</Text>
            </View>
            <Image 
              source={getAegisImage()} 
              style={styles.aegisAvatar}
              resizeMode="contain"
            />
          </View>
        </View>
      </ImageBackground>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: '#ffdeed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashIcon: {
    width: 150,
    height: 150,
  },
  container: {
    flex: 1,
    paddingTop: 50,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF69B4',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
  },
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
  messageContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },
  messageBubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderColor: 'rgba(255, 105, 180, 0.5)',
    borderWidth: 2,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    marginBottom: 15,
    alignSelf: 'center',
    maxWidth: '90%',
  },
  messageText: {
    fontSize: 16,
    color: '#FF69B4',
    fontWeight: '600',
    textAlign: 'center',
  },
  aegisAvatar: {
    width: 300,
    height: 300,
  },
  moodListContainer: {
    width: '100%',
    marginTop: 36,
    paddingVertical: 24,
  },
  moodList: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  moodItemWrapper: {
    width: MOOD_SNAP_INTERVAL,
    alignItems: 'center',
  },
  moodPressable: {
    width: MOOD_ITEM_SIZE,
    height: MOOD_ITEM_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodPressablePressed: {
    opacity: 0.85,
  },
  moodImage: {
    width: MOOD_ITEM_SIZE,
    height: MOOD_ITEM_SIZE,
    opacity: 0.7,
  },
  moodImageSelected: {
    transform: [{ scale: 1.25 }],
    opacity: 1,
  },
  moodLabel: {
    marginTop: 12,
    fontSize: 12,
    color: '#888',
    transform: [{ scale: 1 }],
  },
  moodLabelSelected: {
    color: '#FF69B4',
    fontWeight: '600',
    transform: [{ scale: 1.15 }],
  },
  textInput: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    fontSize: 16,
    minHeight: 150,
    marginBottom: 20,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#FF69B4',
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  taskList: {
    paddingVertical: 10,
  },
  taskButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 15,
    marginBottom: 15,
    marginLeft: 20,
    marginRight: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 105, 180, 0.3)',
  },
  taskButtonSelected: {
    borderColor: '#FF69B4',
    backgroundColor: '#fff5f8',
    marginLeft: 20,
    marginRight: 20,
  },
  taskLabel: {
    marginLeft: 15,
    fontSize: 16,
    color: '#666',
  },
  taskLabelSelected: {
    color: '#FF69B4',
    fontWeight: 'bold',
  },
});

