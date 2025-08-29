
import React, { useState, useRef, useEffect } from 'react';
import { useKnowledgeBase } from '../contexts/KnowledgeBaseContext';
import { ChatMessage, KnowledgePoint, ChatSession, Robot } from '../types';
import { SendIcon, RobotIcon } from './ui/Icons';
import Button from './ui/Button';

const ChatInterface: React.FC = () => {
    const { knowledgePoints, getKnowledgePointById, addChatSession, updateChatSession, addUnansweredQuestion, robots } = useKnowledgeBase();
    const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
    const [selectedRobotId, setSelectedRobotId] = useState<string>(robots.length > 0 ? robots[0].id : '');
    const [selectedRobot, setSelectedRobot] = useState<Robot | null>(null);
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Find the selected robot object
        const robot = robots.find(r => r.id === selectedRobotId) || null;
        setSelectedRobot(robot);

        if (!robot) {
            setCurrentSession(null);
            return;
        };

        const starterQuestions = knowledgePoints.slice(0, 3).map(kp => kp.standardQuestion);
        const newSession: ChatSession = {
            id: `session-${Date.now()}`,
            userId: `user-${Math.random().toString(36).substr(2, 9)}`,
            startTime: new Date().toISOString(),
            robotId: robot.id,
            messages: [
                {
                    id: 'bot-init',
                    sender: 'bot',
                    text: robot.welcomeMessage || '您好！我是您的智能客服助手。',
                    senderAvatar: robot.avatar,
                    suggestions: starterQuestions.length > 0 ? starterQuestions : ['退货政策是什么？', '如何更新账单信息？']
                }
            ]
        };
        setCurrentSession(newSession);
        addChatSession(newSession);
    }, [selectedRobotId, robots, knowledgePoints, addChatSession]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [currentSession?.messages]);
    
    const findBestMatch = (query: string): KnowledgePoint | null => {
        if (!query.trim()) return null;
        
        const lowerQuery = query.toLowerCase();
        let bestMatch: KnowledgePoint | null = null;
        let highestScore = 0;

        knowledgePoints.forEach(kp => {
            if (kp.status !== 'published') return; // Only match published KPs
            let score = calculateScore(lowerQuery, kp.standardQuestion.toLowerCase());
            if (score > highestScore) {
                highestScore = score;
                bestMatch = kp;
            }
            kp.similarQuestions.forEach(sq => {
                score = calculateScore(lowerQuery, sq.toLowerCase());
                if (score > highestScore) {
                    highestScore = score;
                    bestMatch = kp;
                }
            });
        });
        
        return highestScore > 0.5 ? bestMatch : null;
    };
    
    const calculateScore = (query: string, question: string): number => {
        const queryWords = new Set(query.split(' '));
        const questionWords = new Set(question.split(' '));
        if (questionWords.size === 0) return 0;
        let intersectionSize = 0;
        queryWords.forEach(word => {
            if (questionWords.has(word)) {
                intersectionSize++;
            }
        });
        return intersectionSize / questionWords.size;
    };

    const processQuery = (query: string) => {
        if (!currentSession || !selectedRobot) return;
        const { id: sessionId, userId, robotId } = currentSession;

        const userMessage: ChatMessage = { id: `user-${Date.now()}`, text: query, sender: 'user' };
        
        setCurrentSession(prevSession => {
            if (!prevSession) return null;
            return { ...prevSession, messages: [...prevSession.messages, userMessage] };
        });

        const match = findBestMatch(query);
        
        setTimeout(() => {
            let botMessage: ChatMessage;

            if (match) {
                const relatedQuestions = match.relatedQuestionIds
                    .map(id => getKnowledgePointById(id))
                    .filter((kp): kp is KnowledgePoint => !!kp && kp.status === 'published');

                botMessage = {
                    id: `bot-${Date.now()}`,
                    text: match.answer,
                    sender: 'bot',
                    senderAvatar: selectedRobot.avatar,
                    relatedQuestions: relatedQuestions
                };
            } else {
                botMessage = {
                    id: `bot-${Date.now()}`,
                    text: "抱歉，我找不到您问题的答案。请尝试换一种问法。",
                    sender: 'bot',
                    senderAvatar: selectedRobot.avatar,
                };
                addUnansweredQuestion({
                    question: query,
                    sessionId: sessionId,
                    userId: userId,
                    robotId: robotId,
                    timestamp: new Date().toISOString()
                });
            }
            
            setCurrentSession(prevSession => {
                if (!prevSession) return null;
                const finalSession = { ...prevSession, messages: [...prevSession.messages, botMessage] };
                updateChatSession(finalSession);
                return finalSession;
            });

        }, 500);

        setInput('');
    };
    
    const handleSend = () => {
        if (!input.trim()) return;
        processQuery(input);
    };

    const handleSuggestionClick = (question: string) => {
        setInput(question); // Put suggestion in input for user to confirm
        processQuery(question);
    };

    const BotMessage = ({ msg }: { msg: ChatMessage }) => (
         <div className="flex items-end space-x-3">
            <img src={msg.senderAvatar} alt="Bot Avatar" className="h-8 w-8 rounded-full" />
            <div className="max-w-lg p-3 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: msg.text }} />
                 {(msg.relatedQuestions || msg.suggestions) && (
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
                             <div className="flex flex-wrap gap-2 mt-2">
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
    );

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-800 p-4">
            <div className="flex items-center justify-between mb-4">
                 <h1 className="text-2xl font-bold text-center">与知识库聊天</h1>
                 <div className="flex items-center space-x-2">
                     <RobotIcon className="h-5 w-5 text-gray-500" />
                     <select 
                        value={selectedRobotId} 
                        onChange={e => setSelectedRobotId(e.target.value)}
                        className="p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                        aria-label="选择机器人"
                    >
                         {robots.map(robot => (
                            <option key={robot.id} value={robot.id}>{robot.name}</option>
                         ))}
                    </select>
                 </div>
            </div>
            
            <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-900 rounded-lg p-4 shadow-inner space-y-4">
                {!selectedRobot ? (
                     <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <RobotIcon className="h-16 w-16 mb-4"/>
                        <p className="text-lg">请先在“机器人管理”中创建一个机器人，</p>
                        <p>或者选择一个机器人以开始聊天。</p>
                    </div>
                ) : currentSession?.messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                       {msg.sender === 'bot' ? <BotMessage msg={msg} /> : (
                            <div className="max-w-lg p-3 rounded-lg bg-blue-500 text-white">
                                 <p>{msg.text}</p>
                            </div>
                       )}
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
                    placeholder={selectedRobot ? "请输入您的问题..." : "请先选择一个机器人"}
                    className="flex-1 px-4 py-2 border rounded-l-lg dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={!selectedRobot}
                />
                <Button onClick={handleSend} className="rounded-l-none" disabled={!selectedRobot}>
                    <SendIcon className="w-5 h-5" />
                </Button>
            </div>
        </div>
    );
};

export default ChatInterface;