
import React, { useState } from 'react';
import { useKnowledgeBase } from '../contexts/KnowledgeBaseContext';
import { Category } from '../types';
import { PlusIcon, EditIcon, TrashIcon, FolderIcon, ChevronDownIcon, ChevronRightIcon } from './ui/Icons';
import Modal from './ui/Modal';
import Button from './ui/Button';

interface CategoryTreeProps {
    selectedCategoryId: string | null;
    onSelectCategory: (id: string | null) => void;
}

const CategoryTree: React.FC<CategoryTreeProps> = ({ selectedCategoryId, onSelectCategory }) => {
    const { categories, addCategory, updateCategory, deleteCategory } = useKnowledgeBase();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | { parentId: string | null } | null>(null);
    const [categoryName, setCategoryName] = useState('');

    const handleOpenModal = (category: Category | { parentId: string | null } | null = null) => {
        setEditingCategory(category);
        setCategoryName(category && 'name' in category ? category.name : '');
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingCategory(null);
        setCategoryName('');
    };

    const handleSaveCategory = () => {
        if (!categoryName.trim()) return;
        if (editingCategory && 'id' in editingCategory) {
            updateCategory(editingCategory.id, categoryName);
        } else {
            const parentId = editingCategory?.parentId ?? null;
            addCategory(categoryName, parentId);
        }
        handleCloseModal();
    };

    const handleDelete = (id: string) => {
        if (window.confirm('您确定要删除此分类及其所有子分类和问题吗？')) {
            deleteCategory(id);
        }
    };
    
    const renderTree = (parentId: string | null = null) => {
        const childCategories = categories.filter(c => c.parentId === parentId);
        if (childCategories.length === 0) return null;

        return (
            <ul className={parentId !== null ? "pl-4" : ""}>
                {childCategories.map(cat => (
                    <CategoryNode 
                        key={cat.id} 
                        category={cat}
                        onEdit={() => handleOpenModal(cat)}
                        onAddSub={() => handleOpenModal({ parentId: cat.id })}
                        onDelete={() => handleDelete(cat.id)}
                    />
                ))}
            </ul>
        );
    };

    const CategoryNode: React.FC<{ category: Category; onEdit: () => void; onAddSub: () => void; onDelete: () => void; }> = ({ category, onEdit, onAddSub, onDelete }) => {
        const [isExpanded, setIsExpanded] = useState(true);
        const hasChildren = categories.some(c => c.parentId === category.id);
        
        return (
            <li className="my-1">
                <div className={`flex items-center p-2 rounded-lg cursor-pointer group ${selectedCategoryId === category.id ? 'bg-blue-100 dark:bg-blue-900' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                    {hasChildren ? (
                        <button onClick={() => setIsExpanded(!isExpanded)} className="mr-1" aria-label={isExpanded ? '折叠分类' : '展开分类'}>
                            {isExpanded ? <ChevronDownIcon className="w-4 h-4" /> : <ChevronRightIcon className="w-4 h-4" />}
                        </button>
                    ) : <div className="w-4 mr-1"></div>}
                    
                    <FolderIcon className="w-5 h-5 mr-2 text-yellow-500" />
                    <span className="flex-grow" onClick={() => onSelectCategory(category.id)}>{category.name}</span>
                    
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={onAddSub} className="p-1 hover:text-blue-500" aria-label="添加子分类"><PlusIcon className="w-4 h-4"/></button>
                        <button onClick={onEdit} className="p-1 hover:text-green-500" aria-label="编辑分类"><EditIcon className="w-4 h-4"/></button>
                        <button onClick={onDelete} className="p-1 hover:text-red-500" aria-label="删除分类"><TrashIcon className="w-4 h-4"/></button>
                    </div>
                </div>
                {isExpanded && hasChildren && renderTree(category.id)}
            </li>
        );
    };

    return (
        <div className="p-4 h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">分类管理</h2>
                <Button size="sm" onClick={() => handleOpenModal(null)}>
                    <PlusIcon className="w-4 h-4 mr-1" /> 新建
                </Button>
            </div>
            <div className="flex-grow overflow-y-auto">
                <div onClick={() => onSelectCategory(null)} className={`flex items-center p-2 rounded-lg cursor-pointer group ${selectedCategoryId === null ? 'bg-blue-100 dark:bg-blue-900' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                    所有问题
                </div>
                {renderTree(null)}
            </div>

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingCategory && 'id' in editingCategory ? '编辑分类' : '新建分类'}>
                <div className="space-y-2">
                    <label htmlFor="category-name" className="block text-sm font-medium">分类名称</label>
                    <input
                        id="category-name"
                        type="text"
                        value={categoryName}
                        onChange={(e) => setCategoryName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div className="mt-4 flex justify-end space-x-2">
                    <Button variant="secondary" onClick={handleCloseModal}>取消</Button>
                    <Button onClick={handleSaveCategory}>保存</Button>
                </div>
            </Modal>
        </div>
    );
};

export default CategoryTree;
