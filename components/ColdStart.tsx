
import React, { useState } from 'react';
import { useKnowledgeBase } from '../contexts/KnowledgeBaseContext';
import { generateQAPairsFromDoc } from '../services/geminiService';
import Button from './ui/Button';
import { RocketIcon, CheckIcon, TrashIcon } from './ui/Icons';
import type { ColdStartItem } from '../types';
import { useToast } from '../contexts/ToastContext';

const ColdStart: React.FC = () => {
    const { coldStartItems, addColdStartItems, deleteColdStartItem, addKnowledgePoint, categories } = useKnowledgeBase();
    const { addToast } = useToast();
    const [file, setFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [editingItems, setEditingItems] = useState<Record<string, { q: string, a: string, catId: string }>>({});

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFile(e.target.files[0]);
        }
    };

    const handleStart = async () => {
        if (!file) {
            setError('请选择一个文件。');
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const content = await file.text();
            const qaPairs = await generateQAPairsFromDoc(content);
            if(qaPairs && qaPairs.length > 0) {
                const newItems = qaPairs.map(pair => ({
                    sourceFileName: file.name,
                    generatedQuestion: pair.question,
                    generatedAnswer: pair.answer
                }));
                addColdStartItems(newItems);
                addToast('已成功从文档生成问答对！', 'success');
            } else {
                 const msg = 'AI无法从此文档中生成任何问答对。';
                 setError(msg);
                 addToast(msg, 'info');
            }
        } catch (err) {
            console.error(err);
            const errorMessage = err instanceof Error ? err.message : '处理过程中发生错误。';
            setError(errorMessage);
            addToast(errorMessage, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleApprove = (item: ColdStartItem) => {
        const edited = editingItems[item.id];
        const newKp = {
            standardQuestion: edited ? edited.q : item.generatedQuestion,
            answer: `<div>${edited ? edited.a : item.generatedAnswer}</div>`,
            categoryId: edited ? edited.catId : (categories.length > 0 ? categories[0].id : ''),
            similarQuestions: [],
            relatedQuestionIds: [],
            // FIX: Add missing 'status' property to align with the KnowledgePoint type.
            status: 'published' as const,
        };
        addKnowledgePoint(newKp);
        deleteColdStartItem(item.id);
        addToast('知识点已通过并加入知识库！', 'success');
    };
    
    const handleEdit = (id: string, field: 'q' | 'a' | 'catId', value: string) => {
        setEditingItems(prev => ({
            ...prev,
            [id]: {
                ...prev[id],
                q: prev[id]?.q ?? coldStartItems.find(i => i.id === id)?.generatedQuestion ?? '',
                a: prev[id]?.a ?? coldStartItems.find(i => i.id === id)?.generatedAnswer ?? '',
                catId: prev[id]?.catId ?? (categories.length > 0 ? categories[0].id : ''),
                [field]: value
            }
        }));
    };

    return (
        <div className="p-6 h-full flex flex-col">
            <h1 className="text-2xl font-bold mb-4">冷启动</h1>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md mb-6">
                <h2 className="text-lg font-semibold mb-2">1. 上传文档</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">上传文本文档（.txt, .md）以自动生成问答对。</p>
                <div className="flex items-center space-x-4">
                    <input type="file" accept=".txt,.md" onChange={handleFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                    <Button onClick={handleStart} disabled={isLoading || !file}>
                        <RocketIcon className={`w-5 h-5 mr-2 ${isLoading ? 'animate-ping' : ''}`} />
                        {isLoading ? '处理中...' : '开始'}
                    </Button>
                </div>
                {error && <p className="text-red-500 mt-2">{error}</p>}
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md flex-grow overflow-y-auto">
                <h2 className="text-lg font-semibold mb-2">2. 审核生成的数据</h2>
                {coldStartItems.length === 0 ? (
                    <p className="text-gray-500">尚未生成数据。请上传文档以开始。</p>
                ) : (
                    <div className="space-y-4">
                        {coldStartItems.map(item => (
                            <div key={item.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                                <div className="mb-2">
                                    <label className="block text-sm font-medium text-gray-500">问题</label>
                                    <input type="text" value={editingItems[item.id]?.q ?? item.generatedQuestion} onChange={e => handleEdit(item.id, 'q', e.target.value)} className="w-full mt-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600"/>
                                </div>
                                <div className="mb-2">
                                    <label className="block text-sm font-medium text-gray-500">答案</label>
                                    <textarea value={editingItems[item.id]?.a ?? item.generatedAnswer}  onChange={e => handleEdit(item.id, 'a', e.target.value)} rows={3} className="w-full mt-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600"></textarea>
                                </div>
                                 <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-500">分类</label>
                                    <select value={editingItems[item.id]?.catId ?? (categories.length > 0 ? categories[0].id : '')} onChange={e => handleEdit(item.id, 'catId', e.target.value)} className="w-full mt-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600">
                                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div className="flex justify-end space-x-2">
                                    <Button size="sm" variant="ghost" onClick={() => deleteColdStartItem(item.id)}>
                                        <TrashIcon className="w-4 h-4 text-red-500 mr-1"/> 删除
                                    </Button>
                                    <Button size="sm" onClick={() => handleApprove(item)}>
                                        <CheckIcon className="w-4 h-4 text-green-300 mr-1"/> 通过
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ColdStart;
