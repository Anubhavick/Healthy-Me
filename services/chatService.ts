import { UserProfile, AnalysisResult } from '../types';

interface ChatContext {
  userProfile?: UserProfile | null;
  recentAnalysis?: AnalysisResult | null;
  conversationHistory?: Array<{ text: string; isUser: boolean }>;
}

export class ChatService {
  private static instance: ChatService;
  private apiKey: string;

  constructor() {
    this.apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || '';
  }

  static getInstance(): ChatService {
    if (!ChatService.instance) {
      ChatService.instance = new ChatService();
    }
    return ChatService.instance;
  }

  async generateResponse(userMessage: string, context: ChatContext): Promise<string> {
    try {
      const systemPrompt = this.buildSystemPrompt(context);
      const fullPrompt = `${systemPrompt}\n\nUser: ${userMessage}\n\nAssistant:`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: fullPrompt
            }]
          }],
          generationConfig: {
            temperature: 0.8,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 500,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        return data.candidates[0].content.parts[0].text.trim();
      } else {
        throw new Error('No response generated');
      }
    } catch (error) {
      console.error('Chat API Error:', error);
      return this.getFallbackResponse(userMessage, context);
    }
  }

  private buildSystemPrompt(context: ChatContext): string {
    const { userProfile, recentAnalysis, conversationHistory } = context;
    
    let prompt = `You are a helpful, knowledgeable nutrition assistant chatbot for the "Healthy Me" app. 

CORE INSTRUCTIONS:
- Be friendly, supportive, and encouraging
- Provide evidence-based nutrition advice
- Keep responses concise (2-4 sentences max)
- Always recommend consulting healthcare professionals for medical concerns
- Focus on practical, actionable advice
- Use emojis sparingly and naturally
- IMPORTANT: Read the conversation history carefully and provide contextual, varied responses
- Avoid repeating the same information if already discussed
- Build upon previous conversations naturally
- If user asks similar questions, acknowledge it and provide different angles or deeper insights

`;

    if (userProfile) {
      prompt += `USER PROFILE:
- Diet: ${userProfile.diet}
- Medical Conditions: ${userProfile.medicalConditions?.filter(c => c !== 'None').join(', ') || 'None specified'}
- Current Goals: ${userProfile.goals ? Object.entries(userProfile.goals)
  .filter(([_, value]) => value !== undefined)
  .map(([key, value]) => `${key}: ${value}`)
  .join(', ') || 'Not set' : 'Not set'}

`;
    }

    if (recentAnalysis) {
      prompt += `RECENT FOOD ANALYSIS:
- Food: ${recentAnalysis.dishName}
- Calories: ${recentAnalysis.estimatedCalories}
- Diet Compatible: ${recentAnalysis.dietCompatibility.isCompatible ? 'Yes' : 'No'}
- Health Tips: ${recentAnalysis.healthTips?.slice(0, 2).join(', ') || 'None'}

`;
    }

    if (conversationHistory && conversationHistory.length > 0) {
      prompt += `CONVERSATION HISTORY (most recent last):
${conversationHistory.map((msg, index) => 
  `${index + 1}. ${msg.isUser ? 'User' : 'Assistant'}: ${msg.text}`
).join('\n')}

`;
    }

    prompt += `RESPONSE GUIDELINES:
- Personalize advice based on the user's diet and health conditions
- Reference recent food analysis when relevant
- Suggest healthy alternatives and practical tips
- Encourage positive habits and lifestyle changes
- If asked about specific foods, provide nutritional insights
- For weight management questions, focus on balanced approaches
- VARY your responses even for similar topics - provide different tips, examples, or perspectives
- If the user asks follow-up questions, build on the previous discussion
- Keep track of what you've already mentioned to avoid repetition`;

    return prompt;
  }

  private getFallbackResponse(userMessage: string, context: ChatContext): string {
    const lowerMessage = userMessage.toLowerCase();
    const { userProfile, recentAnalysis, conversationHistory } = context;
    
    // Check if this is a repeated question from conversation history
    const isRepeatedQuestion = conversationHistory?.some(msg => 
      msg.isUser && msg.text.toLowerCase().includes(lowerMessage.split(' ')[0])
    );
    
    // Diet-specific responses
    if (lowerMessage.includes('protein')) {
      if (userProfile?.diet === 'Vegan') {
        return isRepeatedQuestion 
          ? "Since we talked about protein, let me add that combining different plant proteins (like rice & beans) creates complete amino acids! Also consider spirulina and nutritional yeast. 🌱"
          : "Great vegan protein sources include lentils, chickpeas, quinoa, tofu, tempeh, and hemp seeds! 🌱 Try to include a variety throughout your day for complete amino acids.";
      }
      return isRepeatedQuestion
        ? "Building on protein - aim for 20-30g per meal for optimal muscle synthesis. Fish, Greek yogurt, and lean poultry are especially bioavailable! 🐟"
        : "Excellent protein sources include lean meats, fish, eggs, dairy, legumes, and nuts. Aim for about 0.8-1.2g per kg of body weight daily! 💪";
    }

    if (lowerMessage.includes('weight loss') || lowerMessage.includes('lose weight')) {
      return isRepeatedQuestion
        ? "For sustainable weight loss, try meal prep on Sundays and keep a food journal. Small plates can help with portion control too! 📝"
        : "Focus on creating a moderate calorie deficit through balanced nutrition and regular activity. Include plenty of vegetables, lean proteins, and whole grains. Small, sustainable changes work best! 🎯";
    }

    if (lowerMessage.includes('calories') || lowerMessage.includes('calorie')) {
      const recentCalories = recentAnalysis?.estimatedCalories;
      return isRepeatedQuestion
        ? `${recentCalories ? `Your recent meal's ${recentCalories} calories can guide portion sizes. ` : ''}Remember that timing matters too - spread calories throughout the day for steady energy! ⏰`
        : `${recentCalories ? `Your recent meal had ${recentCalories} calories. ` : ''}Focus on nutrient-dense foods that provide energy and essential nutrients. Quality matters as much as quantity! ⚡`;
    }

    if (lowerMessage.includes('healthy') || lowerMessage.includes('nutrition')) {
      const dietAdvice = userProfile?.diet && userProfile.diet !== 'None' 
        ? ` Your ${userProfile.diet} diet can be very nutritious when well-planned.`
        : '';
      return isRepeatedQuestion
        ? `Building healthy habits gradually works best! Try the 80/20 rule - eat nutritiously 80% of the time.${dietAdvice} What's your biggest nutrition challenge? 🎯`
        : `Focus on whole foods, plenty of vegetables, adequate hydration, and balanced meals.${dietAdvice} What specific aspect interests you most? 🥗`;
    }

    if (lowerMessage.includes('meal') || lowerMessage.includes('food')) {
      return isRepeatedQuestion
        ? "For meal variety, try theme nights like 'Meatless Monday' or 'Fish Friday'! Batch cooking proteins and roasted veggies saves time too. 🍽️"
        : "I'd love to help with meal ideas! What type of meal are you planning - breakfast, lunch, or dinner? Any specific preferences or dietary restrictions? 🍽️";
    }

    if (lowerMessage.includes('sugar') || lowerMessage.includes('sweet')) {
      return isRepeatedQuestion
        ? "To reduce sugar cravings, try eating regular balanced meals with protein and fiber. Cinnamon and vanilla can add sweetness naturally! ✨"
        : "Try satisfying sweet cravings with fresh fruits, dates, or small amounts of dark chocolate. Natural sugars come with fiber and nutrients! 🍓";
    }

    if (lowerMessage.includes('water') || lowerMessage.includes('hydration')) {
      return isRepeatedQuestion
        ? "Pro hydration tip: Start each day with a glass of water and keep a marked water bottle to track intake. Herbal teas count too! 🫖"
        : "Great question! Aim for about 8 glasses of water daily, more if you're active. Add lemon, cucumber, or mint for variety! 💧";
    }

    // Generic helpful response
    return isRepeatedQuestion
      ? "I notice we've covered similar topics! Feel free to ask for specific meal ideas, cooking tips, or dive deeper into any nutrition topic. What interests you most? 🤔"
      : "I'm here to help with nutrition questions! Ask me about healthy eating, meal planning, specific foods, or nutrition tips. What would you like to know? 😊";
  }
}

export const chatService = ChatService.getInstance();
