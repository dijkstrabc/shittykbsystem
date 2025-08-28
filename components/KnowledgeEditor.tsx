import React, { useState, useEffect } from 'react';
import { useKnowledgeBase } from '../contexts/KnowledgeBaseContext';
import { KnowledgePoint } from '../types';
import Button from './ui/Button';
import RichTextEditor from './ui/RichTextEditor';
import { SparklesIcon, XIcon, FullscreenEnterIcon, FullscreenExitIcon } from './ui/Icons';
import { generateSimilarQuestions } from '../services/geminiService';
import { useToast } from '../contexts/ToastContext';

interface KnowledgeEditorProps {
    kp: KnowledgePoint | null;
    onClose: () => void;
}

const KnowledgeEditor: React.FC<KnowledgeEditorProps> = ({ kp, onClose }) => {
    const { addKnowledgePoint, updateKnowledgePoint, categories, knowledgePoints } = useKnowledgeBase();
    const { addToast } = useToast();
    const [standardQuestion, setStandardQuestion] = useState('');
    const [similarQuestions, setSimilarQuestions] = useState<string[]>([]);
    const [currentSimilar, setCurrentSimilar] = useState('');
    const [answer, setAnswer] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [relatedQuestionIds, setRelatedQuestionIds] = useState<string[]>([]);
    const [status, setStatus] = useState<KnowledgePoint['status']>('published');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);

    useEffect(() => {
        if (kp) {
            setStandardQuestion(kp.standardQuestion);
            setSimilarQuestions(kp.similarQuestions);
            setAnswer(kp.answer);
            setCategoryId(kp.categoryId);
            setRelatedQuestionIds(kp.relatedQuestionIds);
            setStatus(kp.status);
        } else {
            if (categories.length > 0) {
                setCategoryId(categories[0].id);
            }
        }
    }, [kp, categories]);

    const handleSave = () => {
        if (!standardQuestion.trim() || !categoryId) {
            addToast('标准问题和分类是必填项。', 'error');
            return;
        }
        const data = { standardQuestion, similarQuestions, answer, categoryId, relatedQuestionIds, status };
        if (kp) {
            updateKnowledgePoint(kp.id, data);
        } else {
            addKnowledgePoint(data);
        }
        addToast('知识点已保存！', 'success');
        onClose();
    };

    const handleAddSimilar = () => {
        if (currentSimilar.trim()) {
            setSimilarQuestions([...similarQuestions, currentSimilar.trim()]);
            setCurrentSimilar('');
        }
    };

    const handleRemoveSimilar = (index: number) => {
        setSimilarQuestions(similarQuestions.filter((_, i) => i !== index));
    };

    const handleGenerateSimilar = async () => {
        if (!standardQuestion.trim()) {
            addToast('请先输入标准问题。', 'info');
            return;
        }
        setIsGenerating(true);
        try {
            const newQuestions = await generateSimilarQuestions(standardQuestion);
            const combined = Array.from(new Set([...similarQuestions, ...newQuestions]));
            setSimilarQuestions(combined);
            addToast('相似问题生成成功！', 'success');
        } catch (error) {
            console.error(error);
            const errorMessage = error instanceof Error ? error.message : '生成相似问题失败。';
            addToast(errorMessage, 'error');
        } finally {
            setIsGenerating(false);
        }
    };
    
    const toggleRelatedQuestion = (id: string) => {
        if (relatedQuestionIds.includes(id)) {
            setRelatedQuestionIds(relatedQuestionIds.filter(relatedId => relatedId !== id));
        } else {
            setRelatedQuestionIds([...relatedQuestionIds, id]);
        }
    };

    const renderCategoryOptions = (parentId: string | null = null, level = 0) => {
        return categories
            .filter(c => c.parentId === parentId)
            .map(c => (
                <React.Fragment key={c.id}>
                    <option value={c.id}>
                        {'\u00A0'.repeat(level * 4)}{c.name}
                    </option>
                    {renderCategoryOptions(c.id, level + 1)}
                </React.Fragment>
            ));
    };

    const editorClass = isFullScreen
        ? "fixed inset-0 z-50 bg-white dark:bg-gray-900 flex flex-col"
        : "p-6 flex-1 flex flex-col overflow-y-auto";

    return (
        <div className={editorClass}>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">{kp ? '编辑' : '创建'}知识点</h1>
                <div className="flex items-center space-x-2">
                    <button onClick={() => setIsFullScreen(!isFullScreen)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" aria-label={isFullScreen ? '退出全屏' : '进入全屏'}>
                        {isFullScreen ? <FullscreenExitIcon /> : <FullscreenEnterIcon />}
                    </button>
                    <Button variant="secondary" onClick={onClose}>关闭</Button>
                    <Button onClick={handleSave}>保存</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column */}
                <div className="lg:col-span-2 space-y-6">
                    <div>
                        <label className="block text-sm font-medium mb-1">标准问题</label>
                        <input
                            type="text"
                            value={standardQuestion}
                            onChange={(e) => setStandardQuestion(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">相似问题</label>
                        <div className="space-y-2">
                            {similarQuestions.map((q, i) => (
                                <div key={i} className="flex items-center bg-gray-100 dark:bg-gray-800 p-2 rounded">
                                    <span className="flex-grow">{q}</span>
                                    <button onClick={() => handleRemoveSimilar(i)} className="p-1"><XIcon className="w-4 h-4" /></button>
                                </div>
                            ))}
                        </div>
                        <div className="flex items-center mt-2 space-x-2">
                            <input
                                type="text"
                                placeholder="添加相似问题"
                                value={currentSimilar}
                                onChange={(e) => setCurrentSimilar(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddSimilar()}
                                className="flex-grow px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600"
                            />
                            <Button variant="secondary" onClick={handleAddSimilar}>添加</Button>
                        </div>
                        <Button variant="ghost" className="mt-2" onClick={handleGenerateSimilar} disabled={isGenerating}>
                            <SparklesIcon className={`w-5 h-5 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
                            {isGenerating ? '生成中...' : 'AI 生成'}
                        </Button>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">答案</label>
                        <RichTextEditor value={answer} onChange={setAnswer} />
                    </div>
                </div>

                {/* Right Column */}
                <div className="lg:col-span-1 space-y-6">
                    <div>
                        <label className="block text-sm font-medium mb-1">分类</label>
                        <select
                            value={categoryId}
                            onChange={(e) => setCategoryId(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600"
                        >
                            {renderCategoryOptions(null)}
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-medium mb-1">状态</label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value as KnowledgePoint['status'])}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600"
                        >
                            <option value="published">已发布</option>
                            <option value="draft">草稿</option>
                            <option value="archived">已归档</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">关联问题</label>
                        <div className="h-64 border rounded-md overflow-y-auto p-2 bg-gray-50 dark:bg-gray-800">
                            {knowledgePoints.filter(p => p.id !== kp?.id).map(p => (
                                <div key={p.id} className="flex items-center p-1">
                                    <input
                                        type="checkbox"
                                        id={`related-${p.id}`}
                                        checked={relatedQuestionIds.includes(p.id)}
                                        onChange={() => toggleRelatedQuestion(p.id)}
                                        className="mr-2 rounded"
                                    />
                                    <label htmlFor={`related-${p.id}`} className="text-sm">{p.standardQuestion}</label>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default KnowledgeEditor;