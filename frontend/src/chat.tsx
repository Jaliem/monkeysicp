import Navbar from "./nav";
import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Activity, Pill, Heart } from "lucide-react";

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'bot';
    timestamp: Date;
    agent?: 'doctor' | 'pharmacy' | 'wellness' | 'general';
}

interface AgentStatus {
    doctor: boolean;
    pharmacy: boolean;
    wellness: boolean;
}

export default function Chat() {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            text: "👋 Welcome to **HealthAgent** powered by ASI1 AI! I'm your intelligent healthcare assistant. I can help you with:\n\n🩺 **Symptom Tracking & Analysis**\n💊 **Pharmacy & Medications**  \n👨‍⚕️ **Doctor Appointments**\n💪 **Wellness Tracking**\n\nJust talk to me naturally - I understand everything!",
            sender: 'bot',
            timestamp: new Date(),
            agent: 'general'
        }
    ]);
    const [inputText, setInputText] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [agentStatus, setAgentStatus] = useState<AgentStatus>({
        doctor: true,
        pharmacy: true,
        wellness: true
    });
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Check agent status on component mount
    useEffect(() => {
        const checkAgentStatus = async () => {
            try {
                const response = await fetch('/api/agent-status');
                if (response.ok) {
                    const status = await response.json();
                    setAgentStatus(status);
                }
            } catch (error) {
                console.error('Failed to check agent status:', error);
            }
        };

        checkAgentStatus();
        // Check status every 30 seconds
        const interval = setInterval(checkAgentStatus, 30000);
        return () => clearInterval(interval);
    }, []);

    const getAgentIcon = (agent?: string) => {
        switch (agent) {
            case 'doctor': return <Heart className="w-4 h-4 text-red-500" />;
            case 'pharmacy': return <Pill className="w-4 h-4 text-blue-500" />;
            case 'wellness': return <Activity className="w-4 h-4 text-green-500" />;
            default: return <Bot className="w-4 h-4 text-purple-500" />;
        }
    };


    const sendMessage = async () => {
        if (!inputText.trim()) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            text: inputText,
            sender: 'user',
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputText("");
        setIsLoading(true);

        try {
            // Call the backend API
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: inputText,
                    user_id: 'user123'
                })
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();
            
            const botMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: data.response,
                sender: 'bot',
                timestamp: new Date(),
                agent: data.agent as 'doctor' | 'pharmacy' | 'wellness' | 'general'
            };

            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: "Sorry, I'm experiencing technical difficulties. Please try again in a moment.",
                sender: 'bot',
                timestamp: new Date(),
                agent: 'general'
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };


    const formatMessageText = (text: string) => {
        // Convert markdown-style formatting to HTML
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br />');
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            
            {/* Agent Status Bar */}
            <div className="bg-white border-b border-gray-200 px-6 py-3">
                <div className="flex items-center justify-between max-w-4xl mx-auto">
                    <h1 className="text-xl font-semibold text-gray-900">HealthAgent Chat</h1>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${agentStatus.doctor ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            <Heart className="w-4 h-4 text-red-500" />
                            <span className="text-sm text-gray-600">Doctor</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${agentStatus.pharmacy ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            <Pill className="w-4 h-4 text-blue-500" />
                            <span className="text-sm text-gray-600">Pharmacy</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${agentStatus.wellness ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            <Activity className="w-4 h-4 text-green-500" />
                            <span className="text-sm text-gray-600">Wellness</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 max-w-4xl mx-auto px-6 py-6">
                <div className="space-y-6 pb-32">
                    {messages.map((message) => (
                        <div key={message.id} className={`flex gap-3 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {message.sender === 'bot' && (
                                <div className="flex-shrink-0">
                                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                                        {getAgentIcon(message.agent)}
                                    </div>
                                </div>
                            )}
                            
                            <div className={`max-w-xs lg:max-w-2xl px-4 py-3 rounded-2xl ${
                                message.sender === 'user' 
                                    ? 'bg-blue-500 text-white ml-12' 
                                    : 'bg-white border border-gray-200 text-gray-900 mr-12'
                            }`}>
                                <div 
                                    className="whitespace-pre-line"
                                    dangerouslySetInnerHTML={{ 
                                        __html: formatMessageText(message.text) 
                                    }} 
                                />
                                <div className={`text-xs mt-2 ${
                                    message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                                }`}>
                                    {message.timestamp.toLocaleTimeString([], { 
                                        hour: '2-digit', 
                                        minute: '2-digit' 
                                    })}
                                </div>
                            </div>
                            
                            {message.sender === 'user' && (
                                <div className="flex-shrink-0">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                        <User className="w-4 h-4 text-blue-600" />
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                    
                    {isLoading && (
                        <div className="flex gap-3 justify-start">
                            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                                <Bot className="w-4 h-4 text-purple-600" />
                            </div>
                            <div className="bg-white border border-gray-200 px-4 py-3 rounded-2xl">
                                <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input Area */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-end gap-3">
                        <div className="flex-1 relative">
                            <textarea
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onKeyDown={handleKeyPress}
                                placeholder="Ask about symptoms, medicines, appointments, or wellness tracking..."
                                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                rows={1}
                                style={{ minHeight: '48px', maxHeight: '120px' }}
                                disabled={isLoading}
                            />
                        </div>
                        <button
                            onClick={sendMessage}
                            disabled={!inputText.trim() || isLoading}
                            className="flex-shrink-0 w-12 h-12 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-xl flex items-center justify-center transition-colors"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </div>
                    
                    {/* Quick Actions */}
                    <div className="mt-3 flex flex-wrap gap-2">
                        <button 
                            onClick={() => setInputText("I have a headache and fever")}
                            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-full transition-colors"
                        >
                            🩺 Log symptoms
                        </button>
                        <button 
                            onClick={() => setInputText("Check if paracetamol is available")}
                            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-full transition-colors"
                        >
                            💊 Check medicine
                        </button>
                        <button 
                            onClick={() => setInputText("Book me a doctor appointment")}
                            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-full transition-colors"
                        >
                            👨‍⚕️ Book appointment
                        </button>
                        <button 
                            onClick={() => setInputText("I walked 5000 steps today")}
                            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-full transition-colors"
                        >
                            💪 Log wellness
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}