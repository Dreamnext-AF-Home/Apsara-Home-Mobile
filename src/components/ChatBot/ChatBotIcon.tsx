import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Modal,
  SafeAreaView,
  TextInput,
  FlatList,
  ActivityIndicator,
  Pressable,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

interface ChatBotIconProps {
  onPress?: () => void;
  position?: 'bottom-right' | 'bottom-left';
  visible?: boolean;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'bot';
  text: string;
  timestamp: Date;
}

const { width } = Dimensions.get('window');

export default function ChatBotIcon({ onPress, position = 'bottom-left', visible = true }: ChatBotIconProps) {
  const [chatVisible, setChatVisible] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'bot',
      text: 'Hello! 👋 How can I help you today?',
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const floatingAnim = useRef(new Animated.Value(0)).current;
  const headNodAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);
  const [bubbleMessage, setBubbleMessage] = useState('👋 Hello!');

  const helpfulPrompts = [
    '👋 Hello!',
    '❓ Need help?',
    '💬 Chat with us!',
    '✨ Ask me anything',
    '🎯 How can I help?',
    '💡 Got questions?',
  ];

  // Vertical Floating Animation
  useEffect(() => {
    const floatingAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(floatingAnim, {
          toValue: -8,
          duration: 1700,
          useNativeDriver: true,
        }),
        Animated.timing(floatingAnim, {
          toValue: 0,
          duration: 1700,
          useNativeDriver: true,
        }),
      ])
    );

    floatingAnimation.start();

    return () => {
      floatingAnimation.stop();
    };
  }, [floatingAnim]);

  // Head Nodding Animation
  useEffect(() => {
    const nodAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(headNodAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(headNodAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.delay(2000),
      ])
    );

    nodAnimation.start();

    return () => {
      nodAnimation.stop();
    };
  }, [headNodAnim]);

// Glow/Shine Animation (thinking indicator)
  useEffect(() => {
    const glowAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.delay(2000),
      ])
    );

    glowAnimation.start();

    return () => {
      glowAnimation.stop();
    };
  }, [glowAnim]);

  // Message Bubble Rotation
  useEffect(() => {
    const messageInterval = setInterval(() => {
      if (!chatVisible) {
        const randomPrompt = helpfulPrompts[Math.floor(Math.random() * helpfulPrompts.length)];
        setBubbleMessage(randomPrompt);
      }
    }, 20000);

    return () => clearInterval(messageInterval);
  }, [chatVisible]);

  const bounceAnimation = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.15,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const openChat = () => {
    setChatVisible(true);
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
    bounceAnimation();
    onPress?.();
  };

  const closeChat = () => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: false,
    }).start(() => {
      setChatVisible(false);
    });
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      text: inputText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    // Simulate bot response after a short delay
    setTimeout(() => {
      const botResponses = [
        'Thanks for your message! Our support team will assist you shortly.',
        'I\'m here to help! Can you provide more details?',
        'Great question! Let me find that information for you.',
        'I understand. How else can I help you?',
        'Feel free to browse our product categories while we connect you with an agent.',
      ];

      const randomResponse = botResponses[Math.floor(Math.random() * botResponses.length)];

      const botMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'bot',
        text: randomResponse,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botMessage]);
      setIsLoading(false);

      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }, 800);
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => (
    <View
      style={[
        styles.messageContainer,
        item.type === 'user' ? styles.userMessageContainer : styles.botMessageContainer,
      ]}
    >
      {item.type === 'bot' && (
        <Image
          source={require('../../../assets/sir.png')}
          style={styles.botAvatarImage}
          resizeMode="contain"
        />
      )}
      <View
        style={[
          styles.messageBubble,
          item.type === 'user' ? styles.userMessage : styles.botMessage,
        ]}
      >
        <Text
          style={[
            styles.messageText,
            item.type === 'user' ? styles.userMessageText : styles.botMessageText,
          ]}
        >
          {item.text}
        </Text>
      </View>
    </View>
  );

  const chatHeight = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 500],
  });

  const chatOpacity = slideAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.5, 1],
  });

  if (!visible) return null;

  return (
    <>
      {/* Floating Chat Button with Animations */}
      <Animated.View
        style={[
          styles.floatingButton,
          {
            transform: [
              { rotate: headNodAnim.interpolate({
                inputRange: [0, 0.25, 0.5, 0.75, 1],
                outputRange: ['0deg', '-13deg', '12deg', '-10deg', '0deg'],
              })},
            ],
            [position === 'bottom-right' ? 'right' : 'left']: 16,
          },
        ]}
      >

        <TouchableOpacity
          style={styles.chatButton}
          onPress={openChat}
          activeOpacity={0.8}
        >
          <Image
            source={require('../../../assets/sir.png')}
            style={styles.chatButtonImage}
            resizeMode="contain"
          />
          {/* AI Thinking Glow */}
          <Animated.View
            style={[
              styles.aiGlow,
              {
                opacity: glowAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.3, 0.8],
                }),
              },
            ]}
          />
          {messages.length > 1 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.badgeText}>{messages.length - 1}</Text>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>

      {/* Chat Modal */}
      <Modal
        visible={chatVisible}
        transparent
        animationType="fade"
        onRequestClose={closeChat}
      >
        <Pressable style={styles.modalOverlay} onPress={closeChat}>
          <Pressable style={styles.chatModalContainer} onPress={() => {}}>
            {/* Chat Header */}
            <View style={styles.chatHeader}>
              <View style={styles.headerContent}>
                <Image
                  source={require('../../../assets/sir.png')}
                  style={styles.headerImage}
                  resizeMode="contain"
                />
                <View style={styles.headerTextContainer}>
                  <Text style={styles.chatTitle}>Customer Support</Text>
                  <Text style={styles.onlineStatus}>Online • Always here to help</Text>
                </View>
              </View>
              <TouchableOpacity onPress={closeChat} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                <Ionicons name="close" size={24} color={Colors.white} />
              </TouchableOpacity>
            </View>

            {/* Messages List */}
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderMessage}
              keyExtractor={item => item.id}
              style={styles.messagesList}
              contentContainerStyle={styles.messagesListContent}
              scrollEnabled={true}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            />

            {/* Loading Indicator */}
            {isLoading && (
              <View style={styles.loadingContainer}>
                <View style={styles.loadingDots}>
                  <View style={[styles.dot, styles.dot1]} />
                  <View style={[styles.dot, styles.dot2]} />
                  <View style={[styles.dot, styles.dot3]} />
                </View>
              </View>
            )}

            {/* Input Area */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="Type your message..."
                placeholderTextColor={Colors.textSecondary}
                value={inputText}
                onChangeText={setInputText}
                editable={!isLoading}
                maxLength={500}
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  (!inputText.trim() || isLoading) && styles.sendButtonDisabled,
                ]}
                onPress={handleSendMessage}
                disabled={!inputText.trim() || isLoading}
              >
                <Ionicons
                  name="send"
                  size={18}
                  color={(!inputText.trim() || isLoading) ? Colors.textSecondary : Colors.white}
                />
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: 24,
    zIndex: 999,
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatButtonImage: {
    width: 90,
    height: 90,
  },
  messageBubbleContainer: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    marginBottom: 12,
    zIndex: 998,
  },
  messageBubble: {
    backgroundColor: Colors.sky,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    maxWidth: 140,
    elevation: 5,
    shadowColor: Colors.sky,
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  messageBubbleText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.white,
    textAlign: 'center',
    lineHeight: 18,
  },
  bubblePointer: {
    width: 12,
    height: 12,
    backgroundColor: Colors.sky,
    borderRadius: 2,
    transform: [{ rotate: '45deg' }],
    marginTop: -6,
    elevation: 4,
    shadowColor: Colors.sky,
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  notificationBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: Colors.error,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  chatModalContainer: {
    height: '85%',
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    flexDirection: 'column',
  },
  chatHeader: {
    backgroundColor: Colors.sky,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  headerTextContainer: {
    flex: 1,
    gap: 2,
  },
  chatTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  onlineStatus: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  messagesList: {
    flex: 1,
  },
  messagesListContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10,
  },
  messageContainer: {
    flexDirection: 'row',
    marginVertical: 6,
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  botMessageContainer: {
    justifyContent: 'flex-start',
  },
  botAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 8,
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  userMessage: {
    backgroundColor: Colors.sky,
    borderBottomRightRadius: 4,
  },
  botMessage: {
    backgroundColor: '#f3f4f6',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userMessageText: {
    color: Colors.white,
    fontWeight: '500',
  },
  botMessageText: {
    color: Colors.text,
    fontWeight: '500',
  },
  loadingContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  loadingDots: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.sky,
  },
  dot1: {
    opacity: 1,
  },
  dot2: {
    opacity: 0.6,
  },
  dot3: {
    opacity: 0.3,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: Colors.white,
    gap: 8,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.text,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.sky,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
});
