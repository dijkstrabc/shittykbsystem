import React, { createContext, useContext, ReactNode } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { Category, KnowledgePoint, ColdStartItem } from '../types';

interface KnowledgeBaseContextType {
    categories: Category[];
    knowledgePoints: KnowledgePoint[];
    coldStartItems: ColdStartItem[];
    addCategory: (name: string, parentId?: string | null) => void;
    updateCategory: (id: string, name: string) => void;
    deleteCategory: (id: string) => void;
    addKnowledgePoint: (kp: Omit<KnowledgePoint, 'id' | 'createdAt' | 'createdBy'>) => void;
    updateKnowledgePoint: (id:string, kp: Partial<KnowledgePoint>) => void;
    deleteKnowledgePoint: (id: string) => void;
    transferKnowledgePoints: (kpIds: string[], targetCategoryId: string) => void;
    setKnowledgePoints: (kps: KnowledgePoint[]) => void;
    setCategories: (cats: Category[]) => void;
    addColdStartItems: (items: Omit<ColdStartItem, 'id'>[]) => void;
    deleteColdStartItem: (id: string) => void;
    getKnowledgePointById: (id: string) => KnowledgePoint | undefined;
}

const KnowledgeBaseContext = createContext<KnowledgeBaseContextType | undefined>(undefined);

const demoCategories: Category[] = [
    { id: 'cat-1', name: '通用', parentId: null },
    { id: 'cat-2', name: '账单', parentId: null },
    { id: 'cat-3', name: '技术支持', parentId: null },
    { id: 'cat-4', name: '订阅', parentId: 'cat-2' },
];
const demoKPs: KnowledgePoint[] = [
    { id: 'kp-1', categoryId: 'cat-1', standardQuestion: '退货政策是什么？', similarQuestions: ['我如何退货？'], answer: '<div>我们的退货政策允许在购买后<strong>30天</strong>内退货。</div>', relatedQuestionIds: ['kp-2'], createdAt: new Date().toISOString(), status: 'published', createdBy: '系统管理员' },
    { id: 'kp-2', categoryId: 'cat-2', standardQuestion: '如何更新账单信息？', similarQuestions: ['更改支付方式'], answer: '<div>您可以在<strong style="color: rgb(59, 130, 246);">账户设置</strong>页面更新您的账单信息。</div>', relatedQuestionIds: [], createdAt: new Date().toISOString(), status: 'draft', createdBy: '张三' },
];

export const KnowledgeBaseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [categories, setCategories] = useLocalStorage<Category[]>('kb_categories', demoCategories);
    const [knowledgePoints, setKnowledgePoints] = useLocalStorage<KnowledgePoint[]>('kb_knowledge_points', demoKPs);
    const [coldStartItems, setColdStartItems] = useLocalStorage<ColdStartItem[]>('kb_cold_start_items', []);

    const addCategory = (name: string, parentId: string | null = null) => {
        const newCategory: Category = { id: `cat-${Date.now()}`, name, parentId };
        setCategories([...categories, newCategory]);
    };

    const updateCategory = (id: string, name: string) => {
        setCategories(categories.map(c => c.id === id ? { ...c, name } : c));
    };

    const deleteCategory = (id: string) => {
        // Also delete subcategories and orphan KPs if desired
        const catsToDelete = new Set<string>([id]);
        const getSubCats = (parentId: string) => {
            categories.forEach(c => {
                if (c.parentId === parentId) {
                    catsToDelete.add(c.id);
                    getSubCats(c.id);
                }
            });
        };
        getSubCats(id);
        
        setCategories(categories.filter(c => !catsToDelete.has(c.id)));
        setKnowledgePoints(knowledgePoints.filter(kp => !catsToDelete.has(kp.categoryId)));
    };

    const addKnowledgePoint = (kp: Omit<KnowledgePoint, 'id' | 'createdAt' | 'createdBy'>) => {
        const newKp: KnowledgePoint = {
            id: `kp-${Date.now()}`,
            createdAt: new Date().toISOString(),
            createdBy: '当前用户', // Mock user for now
            ...kp,
        };
        setKnowledgePoints([...knowledgePoints, newKp]);
    };

    const updateKnowledgePoint = (id: string, kpUpdate: Partial<KnowledgePoint>) => {
        setKnowledgePoints(knowledgePoints.map(kp => kp.id === id ? { ...kp, ...kpUpdate } : kp));
    };

    const deleteKnowledgePoint = (id: string) => {
        setKnowledgePoints(knowledgePoints.filter(kp => kp.id !== id));
    };

    const transferKnowledgePoints = (kpIds: string[], targetCategoryId: string) => {
        setKnowledgePoints(knowledgePoints.map(kp => 
            kpIds.includes(kp.id) ? { ...kp, categoryId: targetCategoryId } : kp
        ));
    };

    const addColdStartItems = (items: Omit<ColdStartItem, 'id'>[]) => {
        const newItems: ColdStartItem[] = items.map(item => ({
            id: `cs-${Date.now()}-${Math.random()}`,
            ...item
        }));
        // FIX: The setter from useLocalStorage doesn't accept a function updater.
        // Use the current state value directly.
        setColdStartItems([...coldStartItems, ...newItems]);
    };

    const deleteColdStartItem = (id: string) => {
        // FIX: The setter from useLocalStorage doesn't accept a function updater.
        // Use the current state value directly.
        setColdStartItems(coldStartItems.filter(item => item.id !== id));
    };

    const getKnowledgePointById = (id: string): KnowledgePoint | undefined => {
        return knowledgePoints.find(kp => kp.id === id);
    };

    const value = {
        categories,
        knowledgePoints,
        coldStartItems,
        addCategory,
        updateCategory,
        deleteCategory,
        addKnowledgePoint,
        updateKnowledgePoint,
        deleteKnowledgePoint,
        transferKnowledgePoints,
        setKnowledgePoints,
        setCategories,
        addColdStartItems,
        deleteColdStartItem,
        getKnowledgePointById
    };

    return (
        <KnowledgeBaseContext.Provider value={value}>
            {children}
        </KnowledgeBaseContext.Provider>
    );
};

export const useKnowledgeBase = (): KnowledgeBaseContextType => {
    const context = useContext(KnowledgeBaseContext);
    if (context === undefined) {
        throw new Error('useKnowledgeBase must be used within a KnowledgeBaseProvider');
    }
    return context;
};