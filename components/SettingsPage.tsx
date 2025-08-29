import React, { useState, useRef, useEffect } from 'react';
import Button from './ui/Button';
import { testApiConnection, getLlmConfig, setLlmConfig, chat } from '../services/geminiService';
import { useToast } from '../contexts/ToastContext';
import type { LlmConfig } from '../types';
import { SendIcon } from './ui/Icons';

type TestStatus = 'idle' | 'testing' | 'success' | 'error';
type ChatMessage = { role: 'user' | 'assistant'; content: string };

const SettingsPage: React.FC = () => {
    const { addToast } = useToast();
    const [config, setConfig] = useState<LlmConfig>(getLlmConfig());
    const [testStatus, setTestStatus] = useState<TestStatus>('idle');
    const [testMessage, setTestMessage] = useState<string>('');
    
    // Test Chat State
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [isReplying, setIsReplying] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatMessages]);

    const handleConfigChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setConfig(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : type === 'number' ? parseInt(value) || 0 : value
        }));
    };

    const handleSave = () => {
        setLlmConfig(config);
        addToast('配置已保存！', 'success');
    };

    const handleTestConnection = async () => {
        // Save before testing to ensure the service uses the latest values
        setLlmConfig(config);
        setTestStatus('testing');
        setTestMessage('');
        try {
            const result = await testApiConnection();
            setTestStatus('success');
            setTestMessage(result);
        } catch (error) {
            setTestStatus('error');
            setTestMessage(error instanceof Error ? error.message : '发生了未知错误。');
        }
    };

    const handleChatSend = async () => {
        if (!chatInput.trim() || isReplying) return;

        const newMessages: ChatMessage[] = [...chatMessages, { role: 'user', content: chatInput }];
        setChatMessages(newMessages);
        setChatInput('');
        setIsReplying(true);
        
        // Add a placeholder for the assistant's response
        setChatMessages(prev => [...prev, { role: 'assistant', content: '' }]);

        try {
            const response = await chat(newMessages, (delta) => {
                // Stream delta handler
                setChatMessages(prev => {
                    const lastMsgIndex = prev.length - 1;
                    const updatedMessages = [...prev];
                    updatedMessages[lastMsgIndex].content += delta;
                    return updatedMessages;
                });
            });
            
            // Handle non-streamed response
            if (typeof response === 'string') {
                 setChatMessages(prev => {
                    const lastMsgIndex = prev.length - 1;
                    const updatedMessages = [...prev];
                    updatedMessages[lastMsgIndex].content = response;
                    return updatedMessages;
                });
            }

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '与大模型通信时发生错误。';
            setChatMessages(prev => {
                const lastMsgIndex = prev.length - 1;
                const updatedMessages = [...prev];
                updatedMessages[lastMsgIndex].content = `错误: ${errorMessage}`;
                return updatedMessages;
            });
            addToast(errorMessage, 'error');
        } finally {
            setIsReplying(false);
        }
    };


    const getStatusColor = () => {
        switch (testStatus) {
            case 'success': return 'text-green-500';
            case 'error': return 'text-red-500';
            case 'testing': return 'text-blue-500';
            default: return 'text-gray-500 dark:text-gray-400';
        }
    };
    
    return (
         <div className="p-6 h-full flex flex-col items-center bg-gray-50 dark:bg-gray-900/50 overflow-y-auto">
            <div className="w-full max-w-4xl space-y-8">
                <div>
                    <h1 className="text-3xl font-bold mb-2">设置</h1>
                    <p className="text-gray-600 dark:text-gray-400">配置AI服务连接参数并进行测试。</p>
                </div>

                {/* Configuration Section */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold mb-6 border-b pb-3 dark:border-gray-700">AI 服务配置</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label htmlFor="apiUrl" className="block text-sm font-medium">API Endpoint (兼容OpenAI)</label>
                            <input id="apiUrl" name="apiUrl" type="text" value={config.apiUrl} onChange={handleConfigChange}
                                className="mt-1 w-full input-field" placeholder="例如: https://open.bigmodel.cn/api/paas/v4/chat/completions" />
                            <p className="mt-1 text-xs text-gray-500">此应用旨在兼容 OpenAI API 标准。部分服务（如智谱AI）可能需要特定的模型名称，请参考其官方文档。</p>
                        </div>
                        <div className="md:col-span-2">
                            <label htmlFor="apiKey" className="block text-sm font-medium">API Key</label>
                            <input id="apiKey" name="apiKey" type="password" value={config.apiKey} onChange={handleConfigChange}
                                className="mt-1 w-full input-field" placeholder="输入您的 API Key" />
                        </div>
                        <div>
                            <label htmlFor="modelName" className="block text-sm font-medium">模型名称</label>
                            <input id="modelName" name="modelName" type="text" value={config.modelName} onChange={handleConfigChange}
                                className="mt-1 w-full input-field" placeholder="例如: glm-4.5, gpt-4, local-llm" />
                        </div>
                        <div>
                            <label htmlFor="contextLength" className="block text-sm font-medium">上下文长度</label>
                            <input id="contextLength" name="contextLength" type="number" value={config.contextLength} onChange={handleConfigChange}
                                className="mt-1 w-full input-field" />
                        </div>
                        <div className="flex items-center space-x-3">
                            <input id="streamMode" name="streamMode" type="checkbox" checked={config.streamMode} onChange={handleConfigChange}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                             <label htmlFor="streamMode" className="text-sm font-medium">启用流式模式 (Stream Mode)</label>
                        </div>
                         <div className="flex items-center space-x-3">
                            <input id="thinking" name="thinking" type="checkbox" checked={config.thinking} onChange={handleConfigChange}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                             <label htmlFor="thinking" className="text-sm font-medium">启用思考模式 (Thinking Mode)</label>
                        </div>
                    </div>
                    <div className="mt-6 flex items-center space-x-2">
                        <Button onClick={handleSave}>保存配置</Button>
                        <Button variant="secondary" onClick={handleTestConnection} disabled={testStatus === 'testing'}>
                            {testStatus === 'testing' ? '测试中...' : '测试连接'}
                        </Button>
                    </div>
                    {testStatus !== 'idle' && (
                        <div className={`mt-4 p-3 rounded-md text-sm ${getStatusColor()} ${testStatus === 'success' ? 'bg-green-50 dark:bg-green-900/20' : ''} ${testStatus === 'error' ? 'bg-red-50 dark:bg-red-900/20' : ''}`}>
                            <p className="font-semibold">{ {success: '连接成功', error: '连接失败', testing: '正在测试...'}[testStatus] }</p>
                            <p className="break-all">{testMessage}</p>
                        </div>
                    )}
                    {testStatus === 'error' && testMessage.includes('Failed to fetch') && (
                        <div className="mt-4 p-4 rounded-md bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200">
                            <h3 className="font-semibold">如何解决 "Failed to fetch" 问题?</h3>
                            <ul className="list-disc list-inside mt-2 text-sm space-y-2">
                                <li>
                                    <strong>CORS (跨域资源共享)</strong>: 这是最常见的原因。请确保您的AI服务API服务器已正确配置CORS，允许来自您当前应用域名的请求。
                                    <ul className="list-disc list-inside ml-4 mt-1">
                                        <li>正确的解决方案是在服务器端添加 <code>Access-Control-Allow-Origin: *</code> 或 <code>Access-Control-Allow-Origin: {window.location.origin}</code> 响应头。</li>
                                        <li>对于开发环境，您也可以尝试使用浏览器插件来临时禁用CORS检查，但这不适用于生产环境。</li>
                                    </ul>
                                </li>
                                <li>
                                    <strong>混合内容 (Mixed Content)</strong>: 如果您的应用通过HTTPS提供服务，但API Endpoint是HTTP，浏览器会出于安全原因阻止该请求。请确保您的API Endpoint也使用HTTPS。
                                </li>
                                <li>
                                    <strong>网络可访问性</strong>: 确认浏览器可以访问您提供的API Endpoint地址。如果地址是 <code>localhost</code> 或本地IP，请确保API服务正在本地运行且防火墙未拦截。
                                </li>
                            </ul>
                        </div>
                    )}
                </div>

                {/* Test Chat Section */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold mb-4 border-b pb-3 dark:border-gray-700">测试对话</h2>
                    <div className="h-80 flex flex-col bg-gray-100 dark:bg-gray-900 rounded-md p-2">
                        <div className="flex-1 overflow-y-auto space-y-4 p-2">
                            {chatMessages.map((msg, index) => (
                                <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-lg p-3 rounded-lg shadow ${msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>
                                        <p className="text-sm" style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</p>
                                    </div>
                                </div>
                            ))}
                             {isReplying && chatMessages[chatMessages.length - 1]?.role === 'assistant' && (
                                <div className="flex justify-start">
                                    <div className="max-w-lg p-3 rounded-lg shadow bg-gray-200 dark:bg-gray-700">
                                        <div className="flex items-center space-x-2">
                                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div>
                                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse delay-75"></div>
                                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse delay-150"></div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={chatEndRef} />
                        </div>
                         <div className="mt-2 flex items-center">
                            <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleChatSend()}
                                placeholder="在这里输入消息..." disabled={isReplying}
                                className="flex-1 px-4 py-2 border rounded-l-lg dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            <Button onClick={handleChatSend} disabled={isReplying} className="rounded-l-none">
                                <SendIcon className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
             <style>{`.input-field { background-color: #f9fafb; border: 1px solid #d1d5db; border-radius: 0.375rem; padding: 0.5rem 0.75rem; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; font-size: 0.875rem; } .dark .input-field { background-color: #374151; border-color: #4b5563; color: #d1d5db; } .input-field:focus { outline: 2px solid transparent; outline-offset: 2px; --tw-ring-color: #3b82f6; box-shadow: 0 0 0 2px var(--tw-ring-color); }`}</style>
        </div>
    );
};

export default SettingsPage;
