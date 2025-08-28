
import React, { useState } from 'react';
import { KnowledgeBaseProvider } from './contexts/KnowledgeBaseContext';
import KnowledgeList from './components/KnowledgeList';
import ColdStart from './components/ColdStart';
import ChatInterface from './components/ChatInterface';
import { BrainIcon, ChatIcon, RocketIcon, GearIcon } from './components/ui/Icons';
import { ToastProvider } from './contexts/ToastContext';
import ToastContainer from './components/ui/Toast';
import Button from './components/ui/Button';
import { testApiConnection, API_URL } from './services/geminiService';

type View = 'knowledge_base' | 'cold_start' | 'chat' | 'settings';
type TestStatus = 'idle' | 'testing' | 'success' | 'error';

const App: React.FC = () => {
    const [view, setView] = useState<View>('knowledge_base');
    const [testStatus, setTestStatus] = useState<TestStatus>('idle');
    const [testMessage, setTestMessage] = useState<string>('');

    const NavItem = ({ currentView, targetView, icon, children, onClick }: { currentView: View, targetView: View, icon: React.ReactNode, children: React.ReactNode, onClick: (view: View) => void }) => {
        const isActive = currentView === targetView;
        return (
            <button
                onClick={() => onClick(targetView)}
                className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
                    isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
            >
                {icon}
                <span className="ml-3">{children}</span>
            </button>
        );
    };

    const handleTestConnection = async () => {
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

    const renderSettingsView = () => {
        const getStatusColor = () => {
            switch (testStatus) {
                case 'success': return 'text-green-500';
                case 'error': return 'text-red-500';
                case 'testing': return 'text-blue-500';
                default: return 'text-gray-500 dark:text-gray-400';
            }
        };

        return (
             <div className="p-6 h-full flex flex-col items-center bg-gray-50 dark:bg-gray-900/50">
                <div className="w-full max-w-3xl">
                    <h1 className="text-2xl font-bold mb-6">设置</h1>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-semibold mb-4">AI 服务连接</h2>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">API Endpoint</label>
                            <div className="mt-1 p-3 bg-gray-100 dark:bg-gray-700 rounded-md font-mono text-sm break-all">
                                {API_URL}
                            </div>
                        </div>
                        <Button onClick={handleTestConnection} disabled={testStatus === 'testing'}>
                            {testStatus === 'testing' ? '测试中...' : '测试连接'}
                        </Button>

                        <div className="mt-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                            <h3 className="text-lg font-medium mb-2">连接状态</h3>
                            <div className={`text-lg font-bold ${getStatusColor()}`}>
                                {testStatus === 'idle' && '尚未测试'}
                                {testStatus === 'testing' && '正在测试...'}
                                {testStatus === 'success' && '连接成功'}
                                {testStatus === 'error' && '连接失败'}
                            </div>
                            {testMessage && (
                                <div className="mt-2 text-sm">
                                    <p className={getStatusColor()}>{testMessage}</p>
                                    {testStatus === 'error' && testMessage.includes('Failed to fetch') && (
                                        <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 text-yellow-800 dark:text-yellow-300">
                                            <h4 className="font-bold">如何解决 "Failed to fetch" 错误？</h4>
                                            <ul className="list-disc list-inside mt-2 space-y-2 text-sm">
                                                <li><strong>跨域 (CORS) 问题:</strong> 这是最常见的原因。请确保 AI 服务器 (<code>{new URL(API_URL).origin}</code>) 的配置允许来自您访问此应用的域的请求。您需要联系服务器管理员，在服务器响应中添加 <code>Access-Control-Allow-Origin</code> 头。</li>
                                                <li><strong>网络访问问题:</strong> 确认您的设备可以访问 IP 地址 <code>{new URL(API_URL).hostname}</code>。检查防火墙、VPN 或代理设置，确保它们没有阻止连接。</li>
                                                <li><strong>混合内容 (Mixed Content) 问题:</strong> 如果您通过 <code>https://</code> 访问此应用，浏览器会出于安全原因阻止向 <code>http://</code> 的 AI 服务地址发送请求。请确保应用和 AI 服务都使用 <code>https</code>。</li>
                                                <li><strong>服务未运行:</strong> 确认 AI 服务正在 <code>{API_URL}</code> 上运行并且可以接受请求。</li>
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderView = () => {
        switch (view) {
            case 'knowledge_base':
                return <KnowledgeList />;
            case 'cold_start':
                return <ColdStart />;
            case 'chat':
                return <ChatInterface />;
            case 'settings':
                return renderSettingsView();
            default:
                return <KnowledgeList />;
        }
    };

    return (
        <KnowledgeBaseProvider>
            <ToastProvider>
                <div className="flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
                    <aside className="w-64 flex-shrink-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
                        <div className="h-16 flex items-center justify-center border-b border-gray-200 dark:border-gray-700">
                            <BrainIcon className="h-8 w-8 text-blue-600" />
                            <h1 className="ml-2 text-xl font-bold">智能知识库</h1>
                        </div>
                        <nav className="flex-1 p-4 space-y-2">
                            <NavItem currentView={view} targetView="knowledge_base" icon={<BrainIcon className="h-5 w-5" />} onClick={setView}>
                                知识库
                            </NavItem>
                            <NavItem currentView={view} targetView="cold_start" icon={<RocketIcon className="h-5 w-5" />} onClick={setView}>
                                冷启动
                            </NavItem>
                            <NavItem currentView={view} targetView="chat" icon={<ChatIcon className="h-5 w-5" />} onClick={setView}>
                                聊天机器人
                            </NavItem>
                             <NavItem currentView={view} targetView="settings" icon={<GearIcon className="h-5 w-5" />} onClick={setView}>
                                设置
                            </NavItem>
                        </nav>
                    </aside>
                    <main className="flex-1 flex flex-col overflow-hidden">
                        {renderView()}
                    </main>
                </div>
                <ToastContainer />
            </ToastProvider>
        </KnowledgeBaseProvider>
    );
};

export default App;
