import React, { useState, useMemo, useCallback } from 'react';
import { useKnowledgeBase } from '../contexts/KnowledgeBaseContext';
import { KnowledgePoint } from '../types';
import CategoryTree from './CategoryTree';
import KnowledgeEditor from './KnowledgeEditor';
import { PlusIcon, EditIcon, TrashIcon, SearchIcon } from './ui/Icons';
import Button from './ui/Button';
import Modal from './ui/Modal';
import { useToast } from '../contexts/ToastContext';

interface AdvancedFilters {
    dateStart: string;
    dateEnd: string;
    minSimilar: number | '';
    minRelated: number | '';
    status: KnowledgePoint['status'] | '';
    createdBy: string;
}

const KnowledgeList: React.FC = () => {
    const { knowledgePoints, deleteKnowledgePoint, categories, transferKnowledgePoints, setKnowledgePoints, setCategories } = useKnowledgeBase();
    const { addToast } = useToast();
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
    const [editingKp, setEditingKp] = useState<KnowledgePoint | null>(null);
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedKps, setSelectedKps] = useState<Set<string>>(new Set());
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    const [transferTargetCategory, setTransferTargetCategory] = useState('');
    const [includeSubcategories, setIncludeSubcategories] = useState(true);

    const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = useState(false);
    const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>({ dateStart: '', dateEnd: '', minSimilar: '', minRelated: '', status: '', createdBy: '' });

    const getSubCategoryIds = useCallback((categoryId: string): string[] => {
        let ids: string[] = [categoryId];
        const children = categories.filter(c => c.parentId === categoryId);
        children.forEach(child => {
            ids = [...ids, ...getSubCategoryIds(child.id)];
        });
        return ids;
    }, [categories]);

    const filteredKnowledgePoints = useMemo(() => {
        let kps = knowledgePoints;

        // Category filtering
        if (selectedCategoryId) {
            const categoryIdsToFilter = includeSubcategories ? getSubCategoryIds(selectedCategoryId) : [selectedCategoryId];
            kps = kps.filter(kp => categoryIdsToFilter.includes(kp.categoryId));
        }

        // Search term filtering
        if (searchTerm) {
            const lowercasedTerm = searchTerm.toLowerCase();
            kps = kps.filter(kp =>
                kp.standardQuestion.toLowerCase().includes(lowercasedTerm) ||
                kp.answer.toLowerCase().includes(lowercasedTerm)
            );
        }

        // Advanced filtering
        if(advancedFilters.dateStart) kps = kps.filter(kp => new Date(kp.createdAt) >= new Date(advancedFilters.dateStart));
        if(advancedFilters.dateEnd) kps = kps.filter(kp => new Date(kp.createdAt) <= new Date(advancedFilters.dateEnd));
        // FIX: Operator '>=' cannot be applied to types 'number' and 'string | number'.
        // TypeScript cannot correctly infer the narrowed type inside the filter callback.
        // Assigning to a const within the guarded block resolves this.
        if(advancedFilters.minSimilar !== '') {
            const minSimilar = advancedFilters.minSimilar;
            kps = kps.filter(kp => kp.similarQuestions.length >= minSimilar);
        }
        // FIX: Operator '>=' cannot be applied to types 'number' and 'string | number'.
        // TypeScript cannot correctly infer the narrowed type inside the filter callback.
        // Assigning to a const within the guarded block resolves this.
        if(advancedFilters.minRelated !== '') {
            const minRelated = advancedFilters.minRelated;
            kps = kps.filter(kp => kp.relatedQuestionIds.length >= minRelated);
        }

        if (advancedFilters.status) {
            kps = kps.filter(kp => kp.status === advancedFilters.status);
        }

        if (advancedFilters.createdBy.trim()) {
            const createdByLower = advancedFilters.createdBy.toLowerCase();
            kps = kps.filter(kp => kp.createdBy.toLowerCase().includes(createdByLower));
        }


        return kps;
    }, [knowledgePoints, selectedCategoryId, searchTerm, getSubCategoryIds, includeSubcategories, advancedFilters]);

    const handleAdvancedFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setAdvancedFilters({ ...advancedFilters, [e.target.name]: e.target.type === 'number' ? (e.target.value === '' ? '' : parseInt(e.target.value)) : e.target.value });
    };

    const handleAddNew = () => {
        setEditingKp(null);
        setIsEditorOpen(true);
    };

    const handleEdit = (kp: KnowledgePoint) => {
        setEditingKp(kp);
        setIsEditorOpen(true);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('您确定要删除此知识点吗？')) {
            deleteKnowledgePoint(id);
        }
    };
    
    const handleSelectKp = (id: string) => {
        const newSelection = new Set(selectedKps);
        if (newSelection.has(id)) {
            newSelection.delete(id);
        } else {
            newSelection.add(id);
        }
        setSelectedKps(newSelection);
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedKps(new Set(filteredKnowledgePoints.map(kp => kp.id)));
        } else {
            setSelectedKps(new Set());
        }
    };

    const handleExport = () => {
        const dataToExport = {
            categories: categories,
            knowledgePoints: knowledgePoints.filter(kp => selectedKps.has(kp.id)),
        };
        const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'knowledge_base_export.json';
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result;
                const data = JSON.parse(text as string);
                if (data.categories && data.knowledgePoints) {
                    const existingCatIds = new Set(categories.map(c=>c.id));
                    const newCategories = data.categories.filter((c:any) => !existingCatIds.has(c.id));
                    
                    const existingKpIds = new Set(knowledgePoints.map(kp=>kp.id));
                    const newKnowledgePoints = data.knowledgePoints.filter((kp:any) => !existingKpIds.has(kp.id));

                    setCategories([...categories, ...newCategories]);
                    setKnowledgePoints([...knowledgePoints, ...newKnowledgePoints]);
                    addToast('导入成功！', 'success');
                }
            } catch (error) {
                console.error("Import error:", error);
                addToast('导入文件失败，请检查文件格式。', 'error');
            }
        };
        reader.readAsText(file);
    };
    
    const handleOpenTransferModal = () => {
        if (categories.length > 0) {
            setTransferTargetCategory(categories[0].id);
        }
        setIsTransferModalOpen(true);
    };
    
    const handleConfirmTransfer = () => {
        transferKnowledgePoints(Array.from(selectedKps), transferTargetCategory);
        setIsTransferModalOpen(false);
        setSelectedKps(new Set());
    };

    if (isEditorOpen) {
        return <KnowledgeEditor kp={editingKp} onClose={() => setIsEditorOpen(false)} />;
    }

    return (
        <div className="flex h-full">
            <aside className="w-1/4 min-w-[250px] bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
                <CategoryTree selectedCategoryId={selectedCategoryId} onSelectCategory={setSelectedCategoryId} />
            </aside>
            <main className="flex-1 flex flex-col p-6 overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-2xl font-bold">知识点</h1>
                    <Button onClick={handleAddNew}>
                        <PlusIcon className="w-5 h-5 mr-2" /> 新增
                    </Button>
                </div>
                <div className="mb-4 flex items-center space-x-2">
                    <input
                        type="text"
                        placeholder="按问题或答案搜索..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                     <Button variant="secondary" onClick={() => setIsAdvancedSearchOpen(true)}><SearchIcon className="w-5 h-5 mr-2" />高级搜索</Button>
                </div>

                <div className="mb-4 flex items-center justify-between">
                     <div className="flex items-center space-x-2">
                        <Button size="sm" variant="secondary" onClick={handleOpenTransferModal} disabled={selectedKps.size === 0}>转移</Button>
                        <Button size="sm" variant="secondary" onClick={handleExport} disabled={selectedKps.size === 0}>导出</Button>
                         <label className="inline-flex items-center">
                            <Button as="span" size="sm" variant="secondary" className="cursor-pointer">导入</Button>
                            <input type="file" className="hidden" accept=".json" onChange={handleImport} />
                        </label>
                    </div>
                    <div className="flex items-center">
                        <input type="checkbox" id="include-sub" checked={includeSubcategories} onChange={e => setIncludeSubcategories(e.target.checked)} className="mr-2 rounded"/>
                        <label htmlFor="include-sub" className="text-sm">包含子分类</label>
                    </div>
                </div>

                <div className="flex-grow overflow-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                            <tr>
                                <th className="px-6 py-3 text-left w-10">
                                    <input type="checkbox" onChange={handleSelectAll} checked={selectedKps.size > 0 && selectedKps.size === filteredKnowledgePoints.length} className="rounded" />
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">标准问题</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">分类</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">相似问题数</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">关联问题数</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">状态</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">创建人</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">操作</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                            {filteredKnowledgePoints.map(kp => (
                                <tr key={kp.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                    <td className="px-6 py-4">
                                        <input type="checkbox" checked={selectedKps.has(kp.id)} onChange={() => handleSelectKp(kp.id)} className="rounded" />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{kp.standardQuestion}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{categories.find(c => c.id === kp.categoryId)?.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{kp.similarQuestions.length}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{kp.relatedQuestionIds.length}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{ {published: '已发布', draft: '草稿', archived: '已归档'}[kp.status] }</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{kp.createdBy}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right space-x-2">
                                        <Button variant="ghost" size="sm" onClick={() => handleEdit(kp)}><EditIcon className="w-4 h-4" /></Button>
                                        <Button variant="ghost" size="sm" onClick={() => handleDelete(kp.id)}><TrashIcon className="w-4 h-4 text-red-500" /></Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </main>

            <Modal isOpen={isTransferModalOpen} onClose={() => setIsTransferModalOpen(false)} title="转移知识点">
                <p>将 {selectedKps.size} 个选定项目转移到：</p>
                <select 
                    value={transferTargetCategory} 
                    onChange={e => setTransferTargetCategory(e.target.value)}
                    className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
                <div className="mt-4 flex justify-end space-x-2">
                    <Button variant="secondary" onClick={() => setIsTransferModalOpen(false)}>取消</Button>
                    <Button onClick={handleConfirmTransfer}>确认转移</Button>
                </div>
            </Modal>

            <Modal isOpen={isAdvancedSearchOpen} onClose={() => setIsAdvancedSearchOpen(false)} title="高级搜索">
                <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-sm font-medium">创建日期从</label>
                        <input type="date" name="dateStart" value={advancedFilters.dateStart} onChange={handleAdvancedFilterChange} className="w-full mt-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600"/>
                    </div>
                     <div>
                        <label className="block text-sm font-medium">到</label>
                        <input type="date" name="dateEnd" value={advancedFilters.dateEnd} onChange={handleAdvancedFilterChange} className="w-full mt-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600"/>
                    </div>
                     <div>
                        <label className="block text-sm font-medium">最少相似问题数</label>
                        <input type="number" name="minSimilar" value={advancedFilters.minSimilar} onChange={handleAdvancedFilterChange} className="w-full mt-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600"/>
                    </div>
                     <div>
                        <label className="block text-sm font-medium">最少关联问题数</label>
                        <input type="number" name="minRelated" value={advancedFilters.minRelated} onChange={handleAdvancedFilterChange} className="w-full mt-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium">状态</label>
                        <select name="status" value={advancedFilters.status} onChange={handleAdvancedFilterChange} className="w-full mt-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600">
                            <option value="">所有状态</option>
                            <option value="published">已发布</option>
                            <option value="draft">草稿</option>
                            <option value="archived">已归档</option>
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-medium">创建人</label>
                        <input type="text" name="createdBy" placeholder="输入创建人" value={advancedFilters.createdBy} onChange={handleAdvancedFilterChange} className="w-full mt-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600"/>
                    </div>
                </div>
                 <div className="mt-4 flex justify-end">
                    <Button onClick={() => setIsAdvancedSearchOpen(false)}>关闭</Button>
                </div>
            </Modal>
        </div>
    );
};

export default KnowledgeList;