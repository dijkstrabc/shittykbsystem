
import React, { useState } from 'react';
import { KnowledgeBaseProvider } from './contexts/KnowledgeBaseContext';
import KnowledgeList from './components/KnowledgeList';
import ColdStart from './components/ColdStart';
import ChatInterface from './components/ChatInterface';
import SettingsPage from './components/SettingsPage';
import { BrainIcon, ChatIcon, RocketIcon, GearIcon } from './components/ui/Icons';
import { ToastProvider } from './contexts/ToastContext';
import ToastContainer from './components/ui/Toast';

type View = 'knowledge_base' | 'cold_start' | 'chat' | 'settings';

const App: React.FC = () => {
    const [view, setView] = useState<View>('knowledge_base');

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

    const renderView = () => {
        switch (view) {
            case 'knowledge_base':
                return <KnowledgeList />;
            case 'cold_start':
                return <ColdStart />;
            case 'chat':
                return <ChatInterface />;
            case 'settings':
                return <SettingsPage />;
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