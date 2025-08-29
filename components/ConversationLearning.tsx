import React, { useState, useMemo, useEffect } from 'react';
import { useKnowledgeBase } from '../contexts/KnowledgeBaseContext';
import { UnansweredQuestion, ChatSession, KnowledgePoint, Robot } from '../types';
import Button from './ui/Button';
import Modal from './ui/Modal';
import { useToast } from '../contexts/ToastContext';
import { CopyIcon, PlusIcon, SearchIcon, TrashIcon } from './ui/Icons';

type View = 'unanswered' | 'silent' | 'history';


// Sub-component for Unanswered Questions
const UnansweredQuestionsView: React.FC = () => {
    const {
        unansweredQuestions,
        deleteUnansweredQuestions,
        knowledgePoints,
        updateKnowledgePoint,
        getChatSessionById,
        robots
    } = useKnowledgeBase();
    const { addToast } = useToast();

    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isContextModalOpen, setIsContextModalOpen] = useState(false);
    const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
    const [isAddToSimilarModalOpen, setIsAddToSimilarModalOpen] = useState(false);
    const [targetKnowledgePointId, setTargetKnowledgePointId] = useState<string>('');
    const [questionsToProcess, setQuestionsToProcess] = useState<UnansweredQuestion[]>([]);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFilter, setDateFilter] = useState({ start: '', end: '' });
    const [robotFilter, setRobotFilter] = useState('');


    const filteredQuestions = useMemo(() => {
        return unansweredQuestions
            .filter(q => {
                const questionDate = new Date(q.timestamp);
                const startDate = dateFilter.start ? new Date(dateFilter.start) : null;
                const endDate = dateFilter.end ? new Date(dateFilter.end) : null;
                if (startDate && questionDate < startDate) return false;
                if (endDate && questionDate > endDate) return false;
                if (searchTerm && !q.question.toLowerCase().includes(searchTerm.toLowerCase())) return false;
                if (robotFilter && q.robotId !== robotFilter) return false;
                return true;
            })
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [unansweredQuestions, searchTerm, dateFilter, robotFilter]);

    const handleSelect = (id: string) => {
        const newSelection = new Set(selectedIds);
        if (newSelection.has(id)) newSelection.delete(id); else newSelection.add(id);
        setSelectedIds(newSelection);
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) setSelectedIds(new Set(filteredQuestions.map(q => q.id))); else setSelectedIds(new Set());
    };
    
    const handleViewContext = (question: UnansweredQuestion) => {
        const session = getChatSessionById(question.sessionId);
        if (session) {
            setActiveSession(session);
            setIsContextModalOpen(true);
        } else {
            addToast('找不到相关的会话记录。', 'error');
        }
    };

    const handleIgnore = (ids: string[]) => {
        if (ids.length === 0) return;
        deleteUnansweredQuestions(ids);
        addToast(`已忽略 ${ids.length} 个问题。`, 'info');
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            ids.forEach(id => newSet.delete(id));
            return newSet;
        });
    };

    const handleOpenAddToSimilar = (questions: UnansweredQuestion[]) => {
        if (questions.length === 0) return;
        if (knowledgePoints.length === 0) {
            addToast('知识库中没有知识点，无法添加。', 'error');
            return;
        }
        setQuestionsToProcess(questions);
        setTargetKnowledgePointId(knowledgePoints[0].id);
        setIsAddToSimilarModalOpen(true);
    };

    const handleConfirmAddToSimilar = () => {
        const targetKp = knowledgePoints.find(kp => kp.id === targetKnowledgePointId);
        if (!targetKp || questionsToProcess.length === 0) return;

        const newSimilarQuestions = questionsToProcess.map(q => q.question);
        const updatedSimilar = Array.from(new Set([...targetKp.similarQuestions, ...newSimilarQuestions]));
        updateKnowledgePoint(targetKp.id, { similarQuestions: updatedSimilar });

        const idsToDelete = questionsToProcess.map(q => q.id);
        deleteUnansweredQuestions(idsToDelete);

        addToast(`成功将 ${questionsToProcess.length} 个问题添加到 "${targetKp.standardQuestion}"`, 'success');
        setIsAddToSimilarModalOpen(false);
        setQuestionsToProcess([]);
        setSelectedIds(new Set());
    };
    
    const handleCreateNew = (questionText: string) => {
        navigator.clipboard.writeText(questionText);
        addToast('问题已复制到剪贴板。请到“知识库”页面新建知识点。', 'success');
    };

    return (
        <>
            <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg mb-4 flex flex-wrap gap-4 items-center">
                <div className="relative flex-grow min-w-[200px]">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input type="text" placeholder="按问题描述搜索..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"/>
                </div>
                <input type="date" value={dateFilter.start} onChange={e => setDateFilter(p => ({...p, start: e.target.value}))} className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600"/>
                <input type="date" value={dateFilter.end} onChange={e => setDateFilter(p => ({...p, end: e.target.value}))} className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600"/>
                 <select value={robotFilter} onChange={e => setRobotFilter(e.target.value)} className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600">
                     <option value="">全部机器人</option>
                     {robots.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                 </select>
                 <select className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600 disabled:opacity-50" disabled><option>全部组织 (未来功能)</option></select>
            </div>
            <div className="mb-4 flex items-center space-x-2">
                 <Button size="sm" variant="secondary" onClick={() => handleOpenAddToSimilar(filteredQuestions.filter(q => selectedIds.has(q.id)))} disabled={selectedIds.size === 0}>
                    <PlusIcon className="w-4 h-4 mr-1" /> 批量添加到相似问法
                </Button>
                <Button size="sm" variant="danger" onClick={() => handleIgnore(Array.from(selectedIds))} disabled={selectedIds.size === 0}>
                    <TrashIcon className="w-4 h-4 mr-1" /> 批量忽略
                </Button>
            </div>
            <div className="flex-grow overflow-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                     <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                            <th className="px-6 py-3 text-left w-10"><input type="checkbox" onChange={handleSelectAll} checked={selectedIds.size > 0 && selectedIds.size === filteredQuestions.length && filteredQuestions.length > 0} className="rounded" /></th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">未知问题</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">机器人</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">时间</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">操作</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredQuestions.map(q => (
                             <tr key={q.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                <td className="px-6 py-4"><input type="checkbox" checked={selectedIds.has(q.id)} onChange={() => handleSelect(q.id)} className="rounded" /></td>
                                <td className="px-6 py-4 text-sm font-medium">{q.question}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{robots.find(r => r.id === q.robotId)?.name || 'N/A'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{new Date(q.timestamp).toLocaleString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right space-x-2">
                                    <Button variant="ghost" size="sm" onClick={() => handleViewContext(q)}>查看上下文</Button>
                                    <Button variant="ghost" size="sm" onClick={() => handleOpenAddToSimilar([q])}>添加到相似问法</Button>
                                    <Button variant="ghost" size="sm" onClick={() => handleCreateNew(q.question)} title="复制问题以新建知识点"><CopyIcon className="w-4 h-4"/></Button>
                                    <Button variant="ghost" size="sm" onClick={() => handleIgnore([q.id])}><TrashIcon className="w-4 h-4 text-red-500" /></Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {filteredQuestions.length === 0 && (<div className="text-center py-12 text-gray-500"><p>没有符合条件的未知问题。</p></div>)}
            </div>
             <Modal isOpen={isContextModalOpen} onClose={() => setIsContextModalOpen(false)} title="会话上下文" size="lg">
                <div className="max-h-[60vh] overflow-y-auto space-y-4 p-4 bg-gray-100 dark:bg-gray-900 rounded">
                    {activeSession?.messages.map(msg => (<div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-md p-3 rounded-lg ${msg.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}><div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: msg.text }} /></div></div>))}
                </div>
            </Modal>
             <Modal isOpen={isAddToSimilarModalOpen} onClose={() => setIsAddToSimilarModalOpen(false)} title="添加到相似问法">
                <p className="mb-2">将 {questionsToProcess.length} 个问题添加到以下知识点的相似问法中：</p>
                 <select value={targetKnowledgePointId} onChange={e => setTargetKnowledgePointId(e.target.value)} className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500">{knowledgePoints.map(kp => <option key={kp.id} value={kp.id}>{kp.standardQuestion}</option>)}</select>
                <div className="mt-4 flex justify-end space-x-2"><Button variant="secondary" onClick={() => setIsAddToSimilarModalOpen(false)}>取消</Button><Button onClick={handleConfirmAddToSimilar}>确认添加</Button></div>
            </Modal>
        </>
    );
};

// Sub-component for Silent Questions
const SilentQuestionsView: React.FC = () => {
    const { knowledgePoints, chatSessions, categories, robots } = useKnowledgeBase();
    const [robotFilter, setRobotFilter] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    
    const [silenceDays, setSilenceDays] = useState(30);

    // Update the silence days based on the selected robot
    useEffect(() => {
        if (robotFilter) {
            const selectedRobot = robots.find(r => r.id === robotFilter);
            setSilenceDays(selectedRobot?.silenceThresholdDays || 30);
        } else {
            setSilenceDays(30); // Default value when "All Robots" is selected
        }
    }, [robotFilter, robots]);


    const silentKnowledgePoints = useMemo(() => {
        const thresholdDate = new Date();
        thresholdDate.setDate(thresholdDate.getDate() - silenceDays);

        const recentSessions = chatSessions.filter(s => 
            new Date(s.startTime) > thresholdDate && 
            (!robotFilter || s.robotId === robotFilter)
        );
        
        const usedAnswers = new Set<string>();
        recentSessions.forEach(session => {
            session.messages.forEach(message => {
                if (message.sender === 'bot') {
                    usedAnswers.add(message.text);
                }
            });
        });

        return knowledgePoints.filter(kp => {
            if (kp.status === 'published' && !usedAnswers.has(kp.answer)) {
                 if (searchTerm && !kp.standardQuestion.toLowerCase().includes(searchTerm.toLowerCase())) {
                    return false;
                }
                return true;
            }
            return false;
        });
    }, [knowledgePoints, chatSessions, silenceDays, searchTerm, robotFilter]);
    
    const getCategoryName = (id: string) => categories.find(c => c.id === id)?.name || 'N/A';

    return (
        <>
             <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg mb-4 flex flex-wrap gap-4 items-center">
                 <div className="relative flex-grow min-w-[200px]">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input type="text" placeholder="按标准问题搜索..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"/>
                </div>
                <div className="flex items-center space-x-2">
                    <label>机器人:</label>
                    <select value={robotFilter} onChange={e => setRobotFilter(e.target.value)} className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600">
                         <option value="">全部机器人</option>
                         {robots.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                </div>
                 <div className="flex items-center space-x-2">
                    <label>沉寂时间范围 (天):</label>
                    <input type="number" value={silenceDays} onChange={e => setSilenceDays(Number(e.target.value))} className="w-24 p-2 border rounded dark:bg-gray-700 dark:border-gray-600" disabled={!!robotFilter}/>
                </div>
                 <select className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600 disabled:opacity-50" disabled><option>所有业务库 (未来功能)</option></select>
            </div>
            <div className="flex-grow overflow-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                 <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">标准问题</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">分类</th>
                             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">创建日期</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                        {silentKnowledgePoints.map(kp => (
                            <tr key={kp.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                <td className="px-6 py-4 text-sm font-medium">{kp.standardQuestion}</td>
                                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{getCategoryName(kp.categoryId)}</td>
                                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{new Date(kp.createdAt).toLocaleDateString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {silentKnowledgePoints.length === 0 && (<div className="text-center py-12 text-gray-500"><p>没有发现沉寂问题。</p></div>)}
            </div>
        </>
    );
};

// Sub-component for All Chat History
const AllHistoryView: React.FC = () => {
    const { chatSessions, robots } = useKnowledgeBase();
    const { addToast } = useToast();
    
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFilter, setDateFilter] = useState({ start: '', end: '' });
    const [robotFilter, setRobotFilter] = useState('');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
    const [isContextModalOpen, setIsContextModalOpen] = useState(false);
    
     const filteredSessions = useMemo(() => {
        return chatSessions
            .filter(s => {
                const sessionDate = new Date(s.startTime);
                const startDate = dateFilter.start ? new Date(dateFilter.start) : null;
                const endDate = dateFilter.end ? new Date(dateFilter.end) : null;
                if (startDate && sessionDate < startDate) return false;
                if (endDate && sessionDate > endDate) return false;
                if (robotFilter && s.robotId !== robotFilter) return false;
                if (searchTerm && !s.messages.some(m => m.text.toLowerCase().includes(searchTerm.toLowerCase()))) return false;
                return true;
            })
            .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
    }, [chatSessions, searchTerm, dateFilter, robotFilter]);
    
    const handleSelect = (id: string) => {
        const newSelection = new Set(selectedIds);
        if (newSelection.has(id)) newSelection.delete(id); else newSelection.add(id);
        setSelectedIds(newSelection);
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) setSelectedIds(new Set(filteredSessions.map(s => s.id))); else setSelectedIds(new Set());
    };
    
    const handleViewContext = (session: ChatSession) => {
        setActiveSession(session);
        setIsContextModalOpen(true);
    };
    
    const handleExport = () => {
        const dataToExport = chatSessions.filter(s => selectedIds.has(s.id));
        const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'chat_sessions_export.json';
        a.click();
        URL.revokeObjectURL(url);
        addToast(`成功导出 ${dataToExport.length} 条会话。`, 'success');
    };

    return (
        <>
            <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg mb-4 flex flex-wrap gap-4 items-center">
                 <div className="relative flex-grow min-w-[200px]">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input type="text" placeholder="按聊天内容搜索..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"/>
                </div>
                <input type="date" value={dateFilter.start} onChange={e => setDateFilter(p => ({...p, start: e.target.value}))} className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600"/>
                <input type="date" value={dateFilter.end} onChange={e => setDateFilter(p => ({...p, end: e.target.value}))} className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600"/>
                 <select value={robotFilter} onChange={e => setRobotFilter(e.target.value)} className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600">
                     <option value="">全部机器人</option>
                     {robots.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                 </select>
                 <select className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600 disabled:opacity-50" disabled><option>所有处理状态 (未来功能)</option></select>
            </div>
             <div className="mb-4 flex items-center space-x-2">
                <Button size="sm" variant="secondary" onClick={handleExport} disabled={selectedIds.size === 0}>导出选中</Button>
            </div>
            <div className="flex-grow overflow-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                         <tr>
                            <th className="px-6 py-3 text-left w-10"><input type="checkbox" onChange={handleSelectAll} checked={selectedIds.size > 0 && selectedIds.size === filteredSessions.length && filteredSessions.length > 0} className="rounded" /></th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">机器人</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">开始时间</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">消息数</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">操作</th>
                        </tr>
                    </thead>
                     <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                         {filteredSessions.map(s => (
                             <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                <td className="px-6 py-4"><input type="checkbox" checked={selectedIds.has(s.id)} onChange={() => handleSelect(s.id)} className="rounded" /></td>
                                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{robots.find(r => r.id === s.robotId)?.name || 'N/A'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{new Date(s.startTime).toLocaleString()}</td>
                                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{s.messages.length}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right"><Button variant="ghost" size="sm" onClick={() => handleViewContext(s)}>查看会话</Button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {filteredSessions.length === 0 && (<div className="text-center py-12 text-gray-500"><p>没有找到任何会话记录。</p></div>)}
            </div>
             <Modal isOpen={isContextModalOpen} onClose={() => setIsContextModalOpen(false)} title="会话上下文" size="lg">
                <div className="max-h-[60vh] overflow-y-auto space-y-4 p-4 bg-gray-100 dark:bg-gray-900 rounded">
                    {activeSession?.messages.map(msg => (<div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-md p-3 rounded-lg ${msg.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}><div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: msg.text }} /></div></div>))}
                </div>
            </Modal>
        </>
    );
}

const ConversationLearning: React.FC = () => {
    const [view, setView] = useState<View>('unanswered');
    
    const renderView = () => {
        switch(view) {
            case 'unanswered': return <UnansweredQuestionsView />;
            case 'silent': return <SilentQuestionsView />;
            case 'history': return <AllHistoryView />;
            default: return null;
        }
    };
    
    const TabButton: React.FC<{targetView: View, children: React.ReactNode}> = ({ targetView, children }) => (
        <button
            onClick={() => setView(targetView)}
            className={`px-4 py-2 text-sm font-medium rounded-md ${view === targetView ? 'bg-blue-600 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
        >
            {children}
        </button>
    );

    return (
        <div className="p-6 h-full flex flex-col">
            <h1 className="text-2xl font-bold mb-2">会话学习</h1>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
                分析聊天数据，发现未知问题和沉寂知识点，持续优化机器人性能。
            </p>
            
            <div className="flex items-center space-x-2 mb-6 border-b border-gray-200 dark:border-gray-700">
                <TabButton targetView="unanswered">未知问题</TabButton>
                <TabButton targetView="silent">沉寂问题管理</TabButton>
                <TabButton targetView="history">全部历史会话</TabButton>
            </div>
            
            {renderView()}

        </div>
    );
};

export default ConversationLearning;