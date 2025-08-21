import { useState, useEffect, useRef } from 'react';
import Navbar from './nav';
import { sendChatMessage } from './services/flaskService';

interface Message {
  id: string;
  content: string;
  timestamp: Date;
  isUser: boolean;
  type?: 'text' | 'wellness' | 'appointment' | 'medicine' | 'loading';
  metadata?: {
    intent?: string;
    confidence?: number;
    requestId?: string;
  };
}

interface QuickAction {
  label: string;
  icon: string;
  prompt: string;
  category: 'wellness' | 'doctor' | 'pharmacy' | 'symptom';
}

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const quickActions: QuickAction[] = [
    { label: 'Log Sleep', icon: '😴', prompt: 'I slept 8 hours last night', category: 'wellness' },
    { label: 'Steps Today', icon: '👟', prompt: 'I walked 5000 steps today', category: 'wellness' },
    { label: 'Book Doctor', icon: '👨‍⚕️', prompt: 'I need to see a cardiologist', category: 'doctor' },
    { label: 'Check Medicine', icon: '💊', prompt: 'Do you have paracetamol available?', category: 'pharmacy' },
    { label: 'Symptom Check', icon: '🩺', prompt: 'I have a headache and feel tired', category: 'symptom' },
    { label: 'Water Intake', icon: '💧', prompt: 'I drank 6 glasses of water', category: 'wellness' },
  ];

  useEffect(() => {
    // Initialize with welcome message
    const welcomeMessage: Message = {
      id: 'welcome',
      content: `Hello! I'm your HealthAgent powered by ASI1 AI. I'm connected to a network of specialized agents to help you with:

🩺 **Symptom Analysis** - AI-powered symptom assessment and recommendations
👨‍⚕️ **Doctor Appointments** - Connected to DoctorAgent for specialist booking
💊 **Medicine & Pharmacy** - Connected to PharmacyAgent for medication availability
💪 **Wellness Tracking** - Connected to WellnessAgent for health data logging
🚨 **Emergency Support** - 24/7 emergency assistance and guidance

**Connected Services:**
• 🔗 DoctorAgent (Port 8001) - Appointment scheduling & specialist matching
• 🔗 PharmacyAgent (Port 8002) - Medicine availability & ordering
• 🔗 WellnessAgent (Port 8003) - Health data tracking & insights
• 🔗 ICP Blockchain - Secure health data storage

Just speak naturally - I'll understand and connect you with the right healthcare service!`,
      timestamp: new Date(),
      isUser: false,
      type: 'text'
    };
    
    setMessages([welcomeMessage]);
    setIsConnected(true);
    
    // Auto-focus input
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content: content.trim(),
      timestamp: new Date(),
      isUser: true,
      type: 'text'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate HealthAgent processing
    try {
      // Add loading message
      const loadingMessage: Message = {
        id: `loading-${Date.now()}`,
        content: 'Processing with ASI1 AI...',
        timestamp: new Date(),
        isUser: false,
        type: 'loading'
      };
      
      setMessages(prev => [...prev, loadingMessage]);

      // Call real HealthAgent API
      const response = await callHealthAgentAPI(content);
      
      // Remove loading message and add real response
      setMessages(prev => {
        const filtered = prev.filter(msg => msg.type !== 'loading');
        return [...filtered, response];
      });
      
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
        isUser: false,
        type: 'text'
      };
      setMessages(prev => {
        const filtered = prev.filter(msg => msg.type !== 'loading');
        return [...filtered, errorMessage];
      });
    } finally {
      setIsTyping(false);
    }
  };

  const callHealthAgentAPI = async (userInput: string): Promise<Message> => {
    try {
      // Call the Flask backend with uAgents integration
      const data = await sendChatMessage(userInput, 'frontend_user');
      
      // Determine message type based on intent
      let type: Message['type'] = 'text';
      if (data.intent === 'wellness') type = 'wellness';
      else if (data.intent === 'book_doctor') type = 'appointment';
      else if (data.intent === 'pharmacy') type = 'medicine';
      else if (data.intent === 'symptom_analysis') type = 'text';
      else if (data.intent === 'emergency') type = 'text';

      return {
        id: `agent-${Date.now()}`,
        content: data.response,
        timestamp: new Date(),
        isUser: false,
        type,
        metadata: {
          intent: data.intent,
          confidence: data.confidence,
          requestId: data.request_id
        }
      };
      
    } catch (error) {
      console.error('Error calling HealthAgent API:', error);
      
      // Fallback response if API is not available
      return {
        id: `agent-${Date.now()}`,
        content: `🔧 **HealthAgent Connection Issue**

I'm having trouble connecting to the HealthAgent service. This might be because:

• The Flask backend server is not running on port 5000
• Your agents are not connected to Agentverse
• There's a network connectivity issue

**To fix this:**
1. Make sure the Flask API is running: \`python flask_app.py\`
2. Check that your agents are connected via Agentverse mailbox
3. Verify the API is accessible at http://localhost:5000
4. Update agent addresses in flask_app.py with your actual Agentverse addresses

**In the meantime, you can:**
• Use the wellness dashboard to log health data
• Browse the doctor booking interface
• Search medicines in the pharmacy section

**Error details:** ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        isUser: false,
        type: 'text',
        metadata: {
          intent: 'error',
          confidence: 0,
          requestId: `error-${Date.now()}`
        }
      };
    }
  };

  const handleQuickAction = (action: QuickAction) => {
    handleSendMessage(action.prompt);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputValue);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'wellness': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'doctor': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'pharmacy': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'symptom': return 'bg-orange-100 text-orange-700 border-orange-200';
      default: return 'bg-stone-100 text-stone-700 border-stone-200';
    }
  };

  const getMessageBgColor = (type: string) => {
    switch (type) {
      case 'wellness': return 'bg-emerald-50 border-emerald-200';
      case 'appointment': return 'bg-blue-50 border-blue-200';
      case 'medicine': return 'bg-purple-50 border-purple-200';
      case 'loading': return 'bg-stone-50 border-stone-200';
      default: return 'bg-white border-stone-200';
    }
  };

  return (
    <div className="h-screen w-screen flex bg-gradient-to-br from-stone-50 via-white to-emerald-50">
      <Navbar />
      
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-stone-200">
          <div className="px-8 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-light text-stone-800 tracking-wide font-serif">
                HealthAgent Chat
              </h1>
              <div className="flex items-center mt-1">
                <div className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-stone-500 font-light">
                  {isConnected ? 'Connected to ASI1 AI' : 'Disconnected'}
                </span>
              </div>
            </div>
            <div className="text-sm text-stone-500 font-light">
              🤖 Powered by ASI1 • 🔐 ICP Secure
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-3xl ${message.isUser ? 'ml-12' : 'mr-12'}`}>
                  <div className={`
                    p-4 rounded-2xl border shadow-sm ${
                      message.isUser
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : getMessageBgColor(message.type || 'text')
                    }
                  `}>
                    {message.type === 'loading' ? (
                      <div className="flex items-center space-x-3">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-stone-400"></div>
                        <span className="text-stone-600 font-light">{message.content}</span>
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap font-light leading-relaxed">
                        {message.content}
                      </div>
                    )}
                    
                    {message.metadata?.intent && !message.isUser && (
                      <div className="mt-3 pt-3 border-t border-opacity-20 border-stone-400">
                        <div className="flex items-center justify-between text-xs opacity-70">
                          <span>Intent: {message.metadata.intent}</span>
                          <span>Confidence: {Math.round((message.metadata.confidence || 0) * 100)}%</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-stone-400 font-light mt-2 px-2">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Quick Actions */}
        {messages.length <= 1 && (
          <div className="px-6 py-4 bg-white border-t border-stone-200">
            <div className="max-w-4xl mx-auto">
              <h3 className="text-sm font-medium text-stone-700 mb-3">Quick Actions:</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickAction(action)}
                    className={`
                      p-3 rounded-lg border text-center hover:shadow-md transition-all duration-200 font-light
                      ${getCategoryColor(action.category)}
                    `}
                  >
                    <div className="text-lg mb-1">{action.icon}</div>
                    <div className="text-xs">{action.label}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Input */}
        <div className="bg-white border-t border-stone-200 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex space-x-4">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Tell me about your health... (e.g., 'I slept 8 hours', 'Book me a doctor', 'Do you have aspirin?')"
                className="flex-1 px-6 py-4 border border-stone-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-light text-lg"
                disabled={isTyping}
              />
              <button
                onClick={() => handleSendMessage(inputValue)}
                disabled={!inputValue.trim() || isTyping}
                className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-medium hover:bg-emerald-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isTyping ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  'Send'
                )}
              </button>
            </div>
            <p className="text-xs text-stone-500 font-light mt-3 text-center">
              Powered by ASI1 AI for natural language understanding • Your data is secured on ICP blockchain
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;