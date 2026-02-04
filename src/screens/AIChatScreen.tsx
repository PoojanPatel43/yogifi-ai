import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { theme } from '../constants/theme';
import { sendChatMessageApi, getChatHistoryApi } from '../services/api';
import { getItem, setItem } from '../utils/storage';

type Props = NativeStackScreenProps<RootStackParamList, 'AIChat'>;

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTED_QUESTIONS = [
  'What yoga poses help with back pain?',
  'How should I warm up before yoga?',
  'What are good stretches for desk workers?',
  'How can I improve my flexibility?',
];

const AIChatScreen: React.FC<Props> = ({ navigation }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [showWelcome, setShowWelcome] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const loadChatHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    setLoadError(null);
    try {
      const result = await getChatHistoryApi();
      if (result.success && result.data && result.data.length > 0) {
        const mapped: ChatMessage[] = result.data.map((item: any) => ({
          id: item.conversationId || Date.now().toString() + Math.random().toString(),
          role: item.role as 'user' | 'assistant',
          content: item.message,
        }));
        setMessages(mapped);
        setConversationId(result.data[0].conversationId);
      }
    } catch {
      setLoadError('Failed to load chat history. Please try again.');
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    loadChatHistory();
  }, [loadChatHistory]);

  useEffect(() => {
    const checkWelcome = async () => {
      const hasSeen = await getItem('has_seen_ai_chat');
      if (!hasSeen) {
        setShowWelcome(true);
      }
    };
    checkWelcome();
  }, []);

  const dismissWelcome = async () => {
    await setItem('has_seen_ai_chat', 'true');
    setShowWelcome(false);
  };

  const handleNewChat = useCallback(() => {
    setMessages([]);
    setConversationId(undefined);
    setLoadError(null);
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const result = await sendChatMessageApi(text.trim(), conversationId);

      if (result.success && result.data) {
        if (!conversationId) {
          setConversationId(result.data.conversationId);
        }

        const aiMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: result.data.message,
        };
        setMessages(prev => [...prev, aiMsg]);
      } else {
        const errorMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Sorry, I had trouble processing that. Please try again.',
        };
        setMessages(prev => [...prev, errorMsg]);
      }
    } catch {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Something went wrong. Please check your connection and try again.',
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, conversationId]);

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === 'user';
    return (
      <Animatable.View animation="fadeIn" duration={300} style={[styles.messageBubbleRow, isUser && styles.messageBubbleRowUser]}>
        {!isUser && (
          <View style={styles.avatarCircle}>
            <Ionicons name="sparkles" size={16} color={theme.colors.primaryDark} />
          </View>
        )}
        <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.aiBubble]}>
          <Text style={[styles.messageText, isUser && styles.userMessageText]}>{item.content}</Text>
        </View>
      </Animatable.View>
    );
  };

  const renderTypingIndicator = () => {
    if (!isLoading) return null;
    return (
      <View style={[styles.messageBubbleRow]}>
        <View style={styles.avatarCircle}>
          <Ionicons name="sparkles" size={16} color={theme.colors.primaryDark} />
        </View>
        <View style={[styles.messageBubble, styles.aiBubble, styles.typingBubble]}>
          <Animatable.View animation="pulse" iterationCount="infinite" duration={1000} style={styles.typingDots}>
            <View style={styles.typingDot} />
            <View style={styles.typingDot} />
            <View style={styles.typingDot} />
          </Animatable.View>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Animatable.View animation="fadeIn" duration={600}>
        <View style={styles.emptyIcon}>
          <Ionicons name="chatbubbles-outline" size={48} color={theme.colors.primaryDark} />
        </View>
        <Text style={styles.emptyTitle}>AI Wellness Coach</Text>
        <Text style={styles.emptySubtitle}>
          Ask me anything about yoga, fitness, or nutrition
        </Text>
      </Animatable.View>

      <View style={styles.suggestionsContainer}>
        {SUGGESTED_QUESTIONS.map((q, i) => (
          <Animatable.View key={i} animation="fadeInUp" delay={200 + i * 100} duration={400}>
            <TouchableOpacity
              style={styles.suggestionChip}
              onPress={() => sendMessage(q)}
            >
              <Text style={styles.suggestionText}>{q}</Text>
              <Ionicons name="arrow-forward" size={14} color={theme.colors.primaryDark} />
            </TouchableOpacity>
          </Animatable.View>
        ))}
      </View>
    </View>
  );

  const renderMainContent = () => {
    if (isLoadingHistory) {
      return (
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color={theme.colors.primaryDark} />
        </View>
      );
    }

    if (loadError && messages.length === 0) {
      return (
        <View style={styles.centeredContainer}>
          <Ionicons name="cloud-offline-outline" size={48} color={theme.colors.textSecondary} />
          <Text style={styles.errorText}>{loadError}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadChatHistory}>
            <Ionicons name="refresh" size={18} color={theme.colors.textInverse} />
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <>
        {showWelcome && (
          <Animatable.View animation="fadeIn" duration={400} style={styles.welcomeBanner}>
            <Text style={styles.welcomeText}>
              Ask anything about yoga, fitness, nutrition, or wellness. Your AI coach is here to help.
            </Text>
            <TouchableOpacity style={styles.welcomeClose} onPress={dismissWelcome}>
              <Ionicons name="close-circle-outline" size={18} color={theme.colors.textTertiary} />
            </TouchableOpacity>
          </Animatable.View>
        )}
        {messages.length === 0 ? (
          renderEmptyState()
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            ListFooterComponent={renderTypingIndicator}
          />
        )}
      </>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={theme.colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.headerIcon}>
            <Ionicons name="sparkles" size={18} color={theme.colors.primaryDark} />
          </View>
          <Text style={styles.headerTitle}>AI Wellness Coach</Text>
        </View>
        <TouchableOpacity style={styles.newChatButton} onPress={handleNewChat}>
          <Ionicons name="create-outline" size={22} color={theme.colors.primaryDark} />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        style={styles.chatArea}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {renderMainContent()}

        {/* Input Bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.textInput}
            placeholder="Ask about yoga, fitness, or nutrition..."
            placeholderTextColor={theme.colors.textTertiary}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={1000}
            editable={!isLoading}
            onSubmitEditing={() => sendMessage(input)}
            returnKeyType="send"
          />
          <TouchableOpacity
            style={[styles.sendButton, (!input.trim() || isLoading) && styles.sendButtonDisabled]}
            onPress={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
          >
            <Ionicons
              name="send"
              size={20}
              color={input.trim() && !isLoading ? theme.colors.textInverse : theme.colors.textTertiary}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'web' ? 20 : 60,
    paddingBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.screen,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  headerIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
  },
  newChatButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatArea: {
    flex: 1,
    maxWidth: 800,
    width: '100%',
    alignSelf: 'center',
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing['2xl'],
    gap: theme.spacing.md,
  },
  errorText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.primaryDark,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.lg,
  },
  retryButtonText: {
    ...theme.typography.bodySm,
    color: theme.colors.textInverse,
    fontWeight: '600',
  },
  messagesList: {
    paddingHorizontal: theme.spacing.screen,
    paddingVertical: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  messageBubbleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  messageBubbleRowUser: {
    flexDirection: 'row-reverse',
  },
  avatarCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: theme.colors.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.xl,
  },
  userBubble: {
    backgroundColor: theme.colors.accentLight,
    borderBottomRightRadius: theme.spacing.xs,
  },
  aiBubble: {
    backgroundColor: theme.colors.card,
    borderBottomLeftRadius: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.primaryLight,
  },
  messageText: {
    ...theme.typography.body,
    color: theme.colors.text,
    lineHeight: 22,
  },
  userMessageText: {
    color: theme.colors.text,
  },
  typingBubble: {
    paddingVertical: theme.spacing.lg,
  },
  typingDots: {
    flexDirection: 'row',
    gap: 6,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primaryDark,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing['2xl'],
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: theme.spacing.xl,
  },
  emptyTitle: {
    ...theme.typography.h2,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  emptySubtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing['3xl'],
  },
  suggestionsContainer: {
    width: '100%',
    gap: theme.spacing.sm,
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.primaryLight,
    ...theme.shadows.sm,
  },
  suggestionText: {
    ...theme.typography.bodySm,
    color: theme.colors.text,
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: theme.spacing.screen,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
    gap: theme.spacing.sm,
  },
  textInput: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.xl,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    ...theme.typography.body,
    color: theme.colors.text,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: theme.colors.borderLight,
  },
  welcomeBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    gap: theme.spacing.sm,
    marginHorizontal: theme.spacing.screen,
    marginTop: theme.spacing.md,
  },
  welcomeText: {
    ...theme.typography.bodySm,
    color: theme.colors.textSecondary,
    flex: 1,
  },
  welcomeClose: {
    padding: 4,
  },
});

export default AIChatScreen;
