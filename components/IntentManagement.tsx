import React, { useState, useMemo } from 'react';
import { useKnowledgeBase } from '../contexts/KnowledgeBaseContext';
import { Intent } from '../types';
import Button from './ui/Button';
import { PlusIcon, EditIcon, TrashIcon, SearchIcon } from './ui/Icons';
import IntentEditor from './IntentEditor';
import { useToast } from '../contexts/ToastContext';

const IntentManagement: React.FC = () => {
    const { intents, deleteIntent } = useKnowledgeBase();
    const { addToast } = useToast();
    
    const [editingIntentId, setEditingIntentId] = useState<string | 'new' | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredIntents = useMemo(() => {
        if (!searchTerm) return intents;
        return intents.filter(intent =>
            intent.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [intents, searchTerm]);

    const handleEdit = (id: string) => setEditingIntentId(id);
    const handleCreate = () => setEditingIntentId('new');
    const handleCloseEditor = () => setEditingIntentId(null);

    const handleDelete = (id: string) => {
        if (window.confirm('您确定要删除此意图吗?')) {
            deleteIntent(id);
            addToast('意图已删除', 'info');
        }
    };

    if (editingIntentId !== null) {
        return <IntentEditor intentId={editingIntentId} onClose={handleCloseEditor} />;
    }

    return (
        <div className="p-6 h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">意图管理</h1>
                <Button onClick={handleCreate}>
                    <PlusIcon className="w-5 h-5 mr-2" /> 新建意图
                </Button>
            </div>
            <p className="mb-6 text-gray-600 dark:text-gray-400">
                管理用户在对话中要表达的目的或意图，例如查询信息、请求帮助等。
            </p>
            
            <div className="mb-4">
                 <div className="relative">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input type="text" placeholder="按意图名称搜索..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"/>
                </div>
            </div>

            <div className="flex-grow overflow-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">意图名称</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">描述</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">语料数</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">操作</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredIntents.map(intent => (
                            <tr key={intent.id}>
                                <td className="px-6 py-4 font-medium text-sm">{intent.name}</td>
                                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-sm truncate">{intent.description}</td>
                                <td className="px-6 py-4 text-sm">{intent.utterances.length}</td>
                                <td className="px-6 py-4 text-right space-x-2">
                                    <Button variant="ghost" size="sm" onClick={() => handleEdit(intent.id)}><EditIcon className="w-4 h-4" /></Button>
                                    <Button variant="ghost" size="sm" onClick={() => handleDelete(intent.id)}><TrashIcon className="w-4 h-4 text-red-500" /></Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {filteredIntents.length === 0 && (<div className="text-center py-12 text-gray-500"><p>没有找到意图。点击“新建意图”开始吧！</p></div>)}
            </div>
        </div>
    );
};

export default IntentManagement;
