
import React, { useState, useRef, useEffect } from 'react';
import { useKnowledgeBase } from '../contexts/KnowledgeBaseContext';
import { ChatMessage, KnowledgePoint } from '../types';
import { SendIcon } from './ui/Icons';
import Button from './ui/Button';

const ChatInterface: React.FC = () => {
    const { knowledgePoints, getKnowledgePointById } = useKnowledgeBase();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Initial welcome message
        const starterQuestions = knowledgePoints.slice(0, 3).map(kp => kp.standardQuestion);
        setMessages([
            {
                id: 'bot-init',
                sender: 'bot',
                text: '您好！我是您的智能客服助手。您可以问我任何问题，或者从下面的建议开始。',
                suggestions: starterQuestions.length > 0 ? starterQuestions : ['退货政策是什么？', '如何更新账单信息？']
            }
        ]);
    }, [knowledgePoints]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);
    
    const findBestMatch = (query: string): KnowledgePoint | null => {
        if (!query.trim()) return null;
        
        const lowerQuery = query.toLowerCase();
        let bestMatch: KnowledgePoint | null = null;
        let highestScore = 0;

        knowledgePoints.forEach(kp => {
            // Check standard question
            let score = calculateScore(lowerQuery, kp.standardQuestion.toLowerCase());
            if (score > highestScore) {
                highestScore = score;
                bestMatch = kp;
            }
            // Check similar questions
            kp.similarQuestions.forEach(sq => {
                score = calculateScore(lowerQuery, sq.toLowerCase());
                if (score > highestScore) {
                    highestScore = score;
                    bestMatch = kp;
                }
            });
        });
        
        // Require a minimum score to consider it a match
        return highestScore > 0.5 ? bestMatch : null;
    };
    
    // Simple scoring based on word overlap
    const calculateScore = (query: string, question: string): number => {
        const queryWords = new Set(query.split(' '));
        const questionWords = new Set(question.split(' '));
        let intersectionSize = 0;
        queryWords.forEach(word => {
            if (questionWords.has(word)) {
                intersectionSize++;
            }
        });
        return intersectionSize / Math.max(queryWords.size, questionWords.size) || 0;
    };

    const processQuery = (query: string) => {
        const userMessage: ChatMessage = { id: `user-${Date.now()}`, text: query, sender: 'user' };
        setMessages(prev => [...prev, userMessage]);

        const match = findBestMatch(query);
        
        setTimeout(() => {
            if (match) {
                const relatedQuestions = match.relatedQuestionIds
                    .map(id => getKnowledgePointById(id))
                    .filter((kp): kp is KnowledgePoint => !!kp);

                const botMessage: ChatMessage = {
                    id: `bot-${Date.now()}`,
                    text: match.answer,
                    sender: 'bot',
                    relatedQuestions: relatedQuestions
                };
                setMessages(prev => [...prev, botMessage]);
            } else {
                const botMessage: ChatMessage = {
                    id: `bot-${Date.now()}`,
                    text: "抱歉，我找不到您问题的答案。请尝试换一种问法。",
                    sender: 'bot'
                };
                setMessages(prev => [...prev, botMessage]);
            }
        }, 500);

        setInput('');
    };
    
    const handleSend = () => {
        if (!input.trim()) return;
        processQuery(input);
    };

    const handleSuggestionClick = (question: string) => {
        processQuery(question);
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-800 p-4">
            <h1 className="text-2xl font-bold mb-4 text-center">与知识库聊天</h1>
            <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-900 rounded-lg p-4 shadow-inner space-y-4">
                {messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-lg p-3 rounded-lg ${msg.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100'}`}>
                            <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: msg.text }} />
                             {(msg.sender === 'bot' && (msg.relatedQuestions || msg.suggestions)) && (
                                <div className="mt-3 pt-3 border-t border-gray-300 dark:border-gray-600">
                                    {(msg.relatedQuestions && msg.relatedQuestions.length > 0) && (
                                        <>
                                            <p className="font-semibold text-sm mb-2">相关问题：</p>
                                            <div className="flex flex-wrap gap-2">
                                                {msg.relatedQuestions.map(kp => (
                                                    <button key={kp.id} onClick={() => handleSuggestionClick(kp.standardQuestion)} className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-1 rounded-full hover:bg-blue-200">
                                                        {kp.standardQuestion}
                                                    </button>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                    {(msg.suggestions && msg.suggestions.length > 0) && (
                                         <div className="flex flex-wrap gap-2">
                                            {msg.suggestions.map((suggestion, index) => (
                                                <button key={index} onClick={() => handleSuggestionClick(suggestion)} className="text-xs bg-gray-300 text-gray-800 dark:bg-gray-600 dark:text-gray-200 px-2 py-1 rounded-full hover:bg-gray-400">
                                                    {suggestion}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                 <div ref={messagesEndRef} />
            </div>
            <div className="mt-4 flex items-center">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="请输入您的问题..."
                    className="flex-1 px-4 py-2 border rounded-l-lg dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Button onClick={handleSend} className="rounded-l-none">
                    <SendIcon className="w-5 h-5" />
                </Button>
            </div>
        </div>
    );
};

export default ChatInterface;