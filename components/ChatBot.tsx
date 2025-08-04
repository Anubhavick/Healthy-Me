import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, AnalysisResult } from '../types';
import { LoadingSpinner } from './icons';
import { chatService } from '../services/chatService';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface ChatBotProps {
  userProfile: UserProfile | null;
  recentAnalysis: AnalysisResult | null;
  isDarkMode: boolean;
  onClose: () => void;
}

const ChatBot: React.FC<ChatBotProps> = ({ userProfile, recentAnalysis, isDarkMode, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: `Hello! I'm your nutrition assistant. I can help you with questions about your diet, food recommendations, and health insights. ${userProfile ? `I see you follow a ${userProfile.diet} diet.` : ''} How can I help you today?`,
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateChatResponse = async (userMessage: string, currentMessages: Message[]): Promise<string> => {
    // Include the current conversation history with the new user message
    const fullConversationHistory = [
      ...currentMessages.map(msg => ({ text: msg.text, isUser: msg.isUser })),
      { text: userMessage, isUser: true }
    ];

    const context = {
      userProfile,
      recentAnalysis,
      conversationHistory: fullConversationHistory.slice(-8) // Increase to 8 for better context
    };

    try {
      const response = await chatService.generateResponse(userMessage, context);
      return response;
    } catch (error) {
      console.error('Chat error:', error);
      return "I'm sorry, I'm having trouble connecting right now. Please try asking your question again!";
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await generateChatResponse(userMessage.text, messages);
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm sorry, I encountered an error. Please try again.",
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickQuestions = [
    "What are healthy protein sources?",
    "How can I lose weight safely?",
    "What foods should I avoid?",
    "Give me meal ideas for today"
  ];

  const handleQuickQuestion = (question: string) => {
    setInputText(question);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className={`w-full max-w-2xl max-h-[80vh] rounded-2xl shadow-2xl border overflow-hidden ${
          isDarkMode 
            ? 'bg-gray-900/95 border-gray-700' 
            : 'bg-white/95 border-gray-200'
        }`}>
          {/* Header */}
          <div className={`flex items-center justify-between p-4 border-b ${
            isDarkMode 
              ? 'bg-gray-800/50 border-gray-700' 
              : 'bg-blue-50/50 border-gray-200'
          }`}>
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                isDarkMode ? 'bg-blue-600' : 'bg-blue-500'
              }`}>
                <span className="text-white text-lg">🤖</span>
              </div>
              <div>
                <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                  Nutrition Assistant
                </h3>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  AI-powered nutrition guidance
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${
                isDarkMode 
                  ? 'hover:bg-gray-700 text-gray-400 hover:text-white' 
                  : 'hover:bg-gray-100 text-gray-600 hover:text-gray-800'
              }`}
            >
              <span className="text-xl">×</span>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[50vh]">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                    message.isUser
                      ? isDarkMode
                        ? 'bg-blue-600 text-white'
                        : 'bg-blue-500 text-white'
                      : isDarkMode
                        ? 'bg-gray-700 text-gray-100'
                        : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <p className="text-sm">{message.text}</p>
                  <p className={`text-xs mt-1 ${
                    message.isUser
                      ? 'text-blue-100'
                      : isDarkMode
                        ? 'text-gray-400'
                        : 'text-gray-500'
                  }`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className={`px-4 py-2 rounded-2xl ${
                  isDarkMode ? 'bg-gray-700 text-gray-100' : 'bg-gray-100 text-gray-800'
                }`}>
                  <LoadingSpinner className="w-4 h-4" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions */}
          {messages.length <= 1 && (
            <div className={`p-4 border-t ${
              isDarkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <p className={`text-sm font-medium mb-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Quick Questions:
              </p>
              <div className="grid grid-cols-2 gap-2">
                {quickQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickQuestion(question)}
                    className={`text-left text-xs p-2 rounded-lg transition-colors ${
                      isDarkMode 
                        ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                        : 'bg-gray-50 hover:bg-gray-100 text-gray-600'
                    }`}
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className={`p-4 border-t ${
            isDarkMode ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <div className="flex space-x-2">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me about nutrition, diet tips, or food recommendations..."
                rows={2}
                className={`flex-1 p-3 rounded-xl border resize-none focus:outline-none focus:ring-2 transition-colors ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500' 
                    : 'bg-white border-gray-300 text-gray-800 placeholder-gray-500 focus:ring-blue-400'
                }`}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputText.trim() || isLoading}
                className={`px-4 py-2 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  isDarkMode 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatBot;
