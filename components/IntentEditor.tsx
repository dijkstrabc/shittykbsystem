import React, { useState, useEffect } from 'react';
import { useKnowledgeBase } from '../contexts/KnowledgeBaseContext';
import { Intent } from '../types';
import Button from './ui/Button';
import { useToast } from '../contexts/ToastContext';
import { TrashIcon } from './ui/Icons';

interface IntentEditorProps {
    intentId: string | 'new';
    onClose: () => void;
}

const IntentEditor: React.FC<IntentEditorProps> = ({ intentId, onClose }) => {
    const { intents, addIntent, updateIntent } = useKnowledgeBase();
    const { addToast } = useToast();

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [utterances, setUtterances] = useState<string[]>([]);
    const [newUtterance, setNewUtterance] = useState('');

    useEffect(() => {
        if (intentId !== 'new') {
            const intent = intents.find(i => i.id === intentId);
            if (intent) {
                setName(intent.name);
                setDescription(intent.description);
                setUtterances(intent.utterances);
            }
        }
    }, [intentId, intents]);

    const handleAddUtterance = () => {
        if (newUtterance.trim() && !utterances.includes(newUtterance.trim())) {
            setUtterances([...utterances, newUtterance.trim()]);
            setNewUtterance('');
        }
    };
    
    const handleDeleteUtterance = (index: number) => {
        setUtterances(utterances.filter((_, i) => i !== index));
    };

    const handleSave = () => {
        if (!name.trim()) {
            addToast('意图名称是必填项。', 'error');
            return;
        }
        const intentData = { name, description, utterances };
        if (intentId === 'new') {
            addIntent(intentData);
            addToast('意图已创建', 'success');
        } else {
            updateIntent(intentId, intentData);
            addToast('意图已更新', 'success');
        }
        onClose();
    };

    return (
        <div className="p-6 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">{intentId === 'new' ? '新建' : '编辑'}意图</h1>
                <div className="flex items-center space-x-2">
                    <Button variant="secondary" onClick={onClose}>返回列表</Button>
                    <Button onClick={handleSave}>保存</Button>
                </div>
            </div>
            
            <div className="flex-grow overflow-y-auto space-y-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="intent-name" className="block text-sm font-medium mb-1">意图名称</label>
                            <input id="intent-name" type="text" value={name} onChange={e => setName(e.target.value)}
                                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                        </div>
                        <div>
                            <label htmlFor="intent-desc" className="block text-sm font-medium mb-1">描述</label>
                            <textarea id="intent-desc" value={description} onChange={e => setDescription(e.target.value)} rows={3}
                                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                     <h2 className="text-lg font-semibold mb-4">语料管理</h2>
                     <div className="flex items-center space-x-2 mb-4">
                        <input type="text" value={newUtterance} onChange={e => setNewUtterance(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleAddUtterance()}
                            placeholder="添加用户可能会说的例子..."
                            className="flex-grow p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                        <Button variant="secondary" onClick={handleAddUtterance}>添加语料</Button>
                    </div>
                    
                    <div className="space-y-2">
                        {utterances.map((utterance, index) => (
                            <div key={index} className="flex items-center justify-between bg-gray-100 dark:bg-gray-700/50 p-3 rounded-md">
                                <p className="text-sm">{utterance}</p>
                                <button onClick={() => handleDeleteUtterance(index)} className="p-1 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full">
                                    <TrashIcon className="w-4 h-4 text-red-500" />
                                </button>
                            </div>
                        ))}
                         {utterances.length === 0 && <p className="text-sm text-gray-500 text-center py-4">暂无语料。请添加一些用户可能会说的例子。</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IntentEditor;
