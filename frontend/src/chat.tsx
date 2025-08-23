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
  const [showFade, setShowFade] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Load messages from localStorage on component mount
  useEffect(() => {
    const savedMessages = localStorage.getItem('healthchat-messages');
    if (savedMessages) {
      try {
        const parsedMessages = JSON.parse(savedMessages).map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        setMessages(parsedMessages);
        setIsConnected(true);
        return;
      } catch (error) {
        console.error('Failed to load saved messages:', error);
      }
    }
    
    const welcomeMessage: Message = {
      id: 'welcome',
      content: `Hello! I'm your HealthAgent powered by ASI1 AI. I'm connected to a network of specialized agents to help you with:

 **Symptom Analysis** - AI-powered symptom assessment and recommendations
 **Doctor Appointments** - Connected to DoctorAgent for specialist booking
 **Medicine & Pharmacy** - Connected to PharmacyAgent for medication availability
 **Wellness Tracking** - Connected to WellnessAgent for health data logging
 **Emergency Support** - 24/7 emergency assistance and guidance

Just speak naturally - I'll understand and connect you with the right healthcare service!`,
      timestamp: new Date(),
      isUser: false,
      type: 'text'
    };
    
    setMessages([welcomeMessage]);
    setIsConnected(true);
  }, []);

  // Save messages to localStorage whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('healthchat-messages', JSON.stringify(messages));
    }
  }, [messages]);

  const quickActions: QuickAction[] = [
    { label: 'Log Sleep', icon: 'sleep', prompt: 'I slept 8 hours last night', category: 'wellness' },
    { label: 'Steps Today', icon: 'steps', prompt: 'I walked 5000 steps today', category: 'wellness' },
    { label: 'Book Doctor', icon: 'doctor', prompt: 'I need to see a cardiologist', category: 'doctor' },
    { label: 'Check Medicine', icon: 'medicine', prompt: 'Do you have paracetamol available?', category: 'pharmacy' },
    { label: 'Symptom Check', icon: 'symptom', prompt: 'I have a headache and feel tired', category: 'symptom' },
    { label: 'Water Intake', icon: 'water', prompt: 'I drank 6 glasses of water', category: 'wellness' },
  ];

  // Auto-focus input after messages are loaded
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Scroll event listener to show/hide the fade effect
  useEffect(() => {
    const container = scrollContainerRef.current;

    const handleScroll = () => {
      if (container) {
        const isScrolledUp = container.scrollHeight - container.scrollTop - container.clientHeight > 10;
        setShowFade(isScrolledUp);
      }
    };

    if (container) {
      container.addEventListener('scroll', handleScroll);
      handleScroll(); // Initial check
    }

    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const clearChatHistory = () => {
    localStorage.removeItem('healthchat-messages');
    const welcomeMessage: Message = {
      id: 'welcome',
      content: `Hello! I'm your HealthAgent powered by ASI1 AI. I'm connected to a network of specialized agents to help you with:

**Symptom Analysis** - AI-powered symptom assessment and recommendations
**Doctor Appointments** - Connected to DoctorAgent for specialist booking
**Medicine & Pharmacy** - Connected to PharmacyAgent for medication availability
**Wellness Tracking** - Connected to WellnessAgent for health data logging
**Emergency Support** - 24/7 emergency assistance and guidance

Just speak naturally - I'll understand and connect you with the right healthcare service!`,
      timestamp: new Date(),
      isUser: false,
      type: 'text'
    };
    setMessages([welcomeMessage]);
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

    try {
      const loadingMessage: Message = {
        id: `loading-${Date.now()}`,
        content: 'Processing with ASI1 AI...',
        timestamp: new Date(),
        isUser: false,
        type: 'loading'
      };
      
      setMessages(prev => [...prev, loadingMessage]);

      const response = await callHealthAgentAPI(content);
      
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
      const data = await sendChatMessage(userInput, 'frontend_user');
      
      let type: Message['type'] = 'text';
      if (data.intent === 'wellness') type = 'wellness';
      else if (data.intent === 'book_doctor') type = 'appointment';
      else if (data.intent === 'pharmacy') type = 'medicine';
      else if (data.intent === 'symptom_analysis') type = 'text';
      else if (data.intent === 'emergency') type = 'text';

      return {
        id: `agent-${Date.now()}`,
        content: data.response || 'No response received',
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
      
      return {
        id: `agent-${Date.now()}`,
        content: `**HealthAgent Connection Issue**...`,
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

  const formatText = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>');
  };

  return (
    // MODIFICATION 1: Changed gradient direction to top-right (tr)
    <div className="h-screen w-screen flex bg-gradient-to-tr from-stone-50 via-white to-emerald-50">
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
            <div className="flex items-center space-x-4">
              <button
                onClick={clearChatHistory}
                className="px-3 py-1 text-xs text-stone-500 hover:text-stone-700 border border-stone-300 rounded-md hover:bg-stone-50 transition-colors font-bold"
              >
                Clear Chat
              </button>
              <div className="text-sm text-stone-500 font-light">
                Powered by ASI1 • ICP Secure
              </div>
            </div>
          </div>
        </div>

        {/* Messages container */}
        <div className="flex-1 relative">
          <div ref={scrollContainerRef} className="absolute inset-0 overflow-y-auto p-6">
            <div className="max-w-6xl mx-auto space-y-8">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-3xl ${message.isUser ? 'ml-4' : 'mr-4'}`}>
                    <div className={`p-4 rounded-2xl border shadow-sm ${message.isUser ? 'bg-emerald-600 text-white border-emerald-600' : getMessageBgColor(message.type || 'text')}`}>
                      {message.type === 'loading' ? (
                        <div className="flex items-center space-x-3">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-stone-400"></div>
                          <span className="text-stone-600 font-light">{message.content}</span>
                        </div>
                      ) : (
                        <div className="whitespace-pre-wrap font-light leading-relaxed" dangerouslySetInnerHTML={{ __html: formatText(message.content) }} />
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

          {/* MODIFICATION 2: Adjusted fade color to match the new background at the bottom */}
          <div
            className={`absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-stone-50 to-transparent pointer-events-none transition-opacity duration-300 ${showFade ? 'opacity-100' : 'opacity-0'}`}
          ></div>
        </div>

        {/* Quick Actions */}
        {messages.length <= 1 && (
           <div className="px-6 py-4 bg-white border-t border-stone-200">
             <div className="max-w-4xl mx-auto">
               <h3 className="text-sm font-medium text-stone-700 mb-3">Quick Actions:</h3>
               <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                 {quickActions.map((action, index) => (
                   <button key={index} onClick={() => handleQuickAction(action)} className={`p-3 rounded-lg border text-center hover:shadow-md transition-all duration-200 font-light ${getCategoryColor(action.category)}`}>
                     <div className="w-6 h-6 mx-auto mb-2">
                       {action.icon === 'sleep' && <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
                       {action.icon === 'steps' && <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                       {action.icon === 'doctor' && <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
                       {action.icon === 'medicine' && <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>}
                       {action.icon === 'symptom' && <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>}
                       {action.icon === 'water' && <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>}
                     </div>
                     <div className="text-xs font-bold">{action.label}</div>
                   </button>
                 ))}
               </div>
             </div>
           </div>
        )}

        {/* Input Area */}
        <div className="p-4 bg-transparent">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center w-full border border-stone-300 rounded-2xl p-2 bg-white shadow-sm">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Tell me about your health..."
                className="flex-1 px-4 py-2 border-none bg-transparent focus:ring-0 focus:outline-none font-light text-lg placeholder:text-stone-400"
                disabled={isTyping}
              />
              <button
                onClick={() => handleSendMessage(inputValue)}
                disabled={!inputValue.trim() || isTyping}
                className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors duration-200 disabled:bg-stone-300 disabled:cursor-not-allowed"
              >
                {isTyping ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  'Send'
                )}
              </button>
            </div>
            <p className="text-xs text-stone-500 font-light mt-6 mb-3 text-center">
              Powered by ASI1 AI for natural language understanding • Your data is secured on ICP blockchain
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;