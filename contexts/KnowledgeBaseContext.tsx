import React, { createContext, useContext, ReactNode, useCallback, useMemo } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { Category, KnowledgePoint, ColdStartItem, ChatSession, UnansweredQuestion, Robot, Entity, Intent, EntityMember } from '../types';

interface KnowledgeBaseContextType {
    categories: Category[];
    knowledgePoints: KnowledgePoint[];
    coldStartItems: ColdStartItem[];
    chatSessions: ChatSession[];
    unansweredQuestions: UnansweredQuestion[];
    robots: Robot[];
    entities: Entity[];
    intents: Intent[];
    addCategory: (name: string, parentId?: string | null) => void;
    updateCategory: (id: string, name: string) => void;
    deleteCategory: (id: string) => void;
    addKnowledgePoint: (kp: Omit<KnowledgePoint, 'id' | 'createdAt' | 'createdBy'>) => void;
    updateKnowledgePoint: (id:string, kp: Partial<KnowledgePoint>) => void;
    deleteKnowledgePoint: (id: string) => void;
    transferKnowledgePoints: (kpIds: string[], targetCategoryId: string) => void;
    setKnowledgePoints: React.Dispatch<React.SetStateAction<KnowledgePoint[]>>;
    setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
    addColdStartItems: (items: Omit<ColdStartItem, 'id'>[]) => void;
    deleteColdStartItem: (id: string) => void;
    getKnowledgePointById: (id: string) => KnowledgePoint | undefined;
    addChatSession: (session: ChatSession) => void;
    updateChatSession: (session: ChatSession) => void;
    getChatSessionById: (sessionId: string) => ChatSession | undefined;
    addUnansweredQuestion: (question: Omit<UnansweredQuestion, 'id'>) => void;
    deleteUnansweredQuestions: (ids: string[]) => void;
    addRobot: (robot: Omit<Robot, 'id'>) => void;
    updateRobot: (id: string, robotUpdate: Partial<Robot>) => void;
    deleteRobot: (id: string) => void;
    addEntity: (entity: Omit<Entity, 'id'>) => void;
    updateEntity: (id: string, entityUpdate: Partial<Entity>) => void;
    deleteEntity: (id: string) => void;
    addIntent: (intent: Omit<Intent, 'id'>) => void;
    updateIntent: (id: string, intentUpdate: Partial<Intent>) => void;
    deleteIntent: (id: string) => void;
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
const demoRobots: Robot[] = [
    {
        id: 'robot-default',
        name: '默认客服助手',
        avatar: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iY3VycmVudENvbG9yIiB3aWR0aD0iNDgiIGhlaWdodD0iNDgiPjxwYXRoIGQ9Ik0xMiAyQzYuNDg2IDIgMiA2LjQ4NiAyIDEyczQuNDg2IDEwIDEwIDEwIDEwLTQuNDg2IDEwLTEwUzE3LjUxNCAyIDEyIDJ6bTAgMThjLTQuNDE0IDAtOC0zLjU4Ni04LThzMy41ODYtOCA4LTggOCAzLjU4NiA4IDhTMTYuNDE0IDIwIDEyIDIwem0tMy01aDJ2LTJoLTJ2MnptNCAwaDJ2LTJoLTJ2MnptLTYtNEM4LjM5MyA5IDcgMTAuMjk4IDcgMTJzMS4zOTMgMyA0IDNoMnYtMkg5di0yaDR2M2MxLjYwNyAwIDMtMS4yOTggMy0zcy0xLjM5My0zLTMtM2gtNnYyaDJ6Ii8+PC9zdmc+',
        welcomeMessage: '您好！我是您的智能客服助手。我可以回答您关于我们产品和服务的问题。',
        apiIdentifier: 'default-assistant-001',
        silenceThresholdDays: 30
    }
];

export const KnowledgeBaseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [categories, setCategories] = useLocalStorage<Category[]>('kb_categories', demoCategories);
    const [knowledgePoints, setKnowledgePoints] = useLocalStorage<KnowledgePoint[]>('kb_knowledge_points', demoKPs);
    const [coldStartItems, setColdStartItems] = useLocalStorage<ColdStartItem[]>('kb_cold_start_items', []);
    const [chatSessions, setChatSessions] = useLocalStorage<ChatSession[]>('kb_chat_sessions', []);
    const [unansweredQuestions, setUnansweredQuestions] = useLocalStorage<UnansweredQuestion[]>('kb_unanswered_questions', []);
    const [robots, setRobots] = useLocalStorage<Robot[]>('kb_robots', demoRobots);
    const [entities, setEntities] = useLocalStorage<Entity[]>('kb_entities', []);
    const [intents, setIntents] = useLocalStorage<Intent[]>('kb_intents', []);


    const addCategory = useCallback((name: string, parentId: string | null = null) => {
        const newCategory: Category = { id: `cat-${Date.now()}`, name, parentId };
        setCategories(prev => [...prev, newCategory]);
    }, [setCategories]);

    const updateCategory = useCallback((id: string, name: string) => {
        setCategories(prev => prev.map(c => c.id === id ? { ...c, name } : c));
    }, [setCategories]);

    const deleteCategory = useCallback((id: string) => {
        const catsToDelete = new Set<string>([id]);
        const getSubCats = (parentId: string, allCategories: Category[]) => {
            allCategories.forEach(c => {
                if (c.parentId === parentId) {
                    catsToDelete.add(c.id);
                    getSubCats(c.id, allCategories);
                }
            });
        };
        
        setCategories(prev => {
            const currentCats = [...prev];
            getSubCats(id, currentCats);
            return currentCats.filter(c => !catsToDelete.has(c.id));
        });
        setKnowledgePoints(prev => prev.filter(kp => !catsToDelete.has(kp.categoryId)));
    }, [setCategories, setKnowledgePoints]);

    const addKnowledgePoint = useCallback((kp: Omit<KnowledgePoint, 'id' | 'createdAt' | 'createdBy'>) => {
        const newKp: KnowledgePoint = {
            id: `kp-${Date.now()}`,
            createdAt: new Date().toISOString(),
            createdBy: '当前用户', // Mock user for now
            ...kp,
        };
        setKnowledgePoints(prev => [...prev, newKp]);
    }, [setKnowledgePoints]);

    const updateKnowledgePoint = useCallback((id: string, kpUpdate: Partial<KnowledgePoint>) => {
        setKnowledgePoints(prev => prev.map(kp => kp.id === id ? { ...kp, ...kpUpdate } : kp));
    }, [setKnowledgePoints]);

    const deleteKnowledgePoint = useCallback((id: string) => {
        setKnowledgePoints(prev => prev.filter(kp => kp.id !== id));
    }, [setKnowledgePoints]);

    const transferKnowledgePoints = useCallback((kpIds: string[], targetCategoryId: string) => {
        setKnowledgePoints(prev => prev.map(kp => 
            kpIds.includes(kp.id) ? { ...kp, categoryId: targetCategoryId } : kp
        ));
    }, [setKnowledgePoints]);

    const addColdStartItems = useCallback((items: Omit<ColdStartItem, 'id'>[]) => {
        const newItems: ColdStartItem[] = items.map(item => ({
            id: `cs-${Date.now()}-${Math.random()}`,
            ...item
        }));
        setColdStartItems(prev => [...prev, ...newItems]);
    }, [setColdStartItems]);

    const deleteColdStartItem = useCallback((id: string) => {
        setColdStartItems(prev => prev.filter(item => item.id !== id));
    }, [setColdStartItems]);

    const getKnowledgePointById = useCallback((id: string): KnowledgePoint | undefined => {
        return knowledgePoints.find(kp => kp.id === id);
    }, [knowledgePoints]);

    const addChatSession = useCallback((session: ChatSession) => {
        setChatSessions(prev => [...prev, session]);
    }, [setChatSessions]);

    const updateChatSession = useCallback((updatedSession: ChatSession) => {
        setChatSessions(prev => prev.map(s => s.id === updatedSession.id ? updatedSession : s));
    }, [setChatSessions]);

    const getChatSessionById = useCallback((sessionId: string): ChatSession | undefined => {
        return chatSessions.find(s => s.id === sessionId);
    }, [chatSessions]);

    const addUnansweredQuestion = useCallback((question: Omit<UnansweredQuestion, 'id'>) => {
        const newQuestion: UnansweredQuestion = {
            id: `uq-${Date.now()}`,
            ...question
        };
        setUnansweredQuestions(prev => [...prev, newQuestion]);
    }, [setUnansweredQuestions]);

    const deleteUnansweredQuestions = useCallback((ids: string[]) => {
        const idSet = new Set(ids);
        setUnansweredQuestions(prev => prev.filter(q => !idSet.has(q.id)));
    }, [setUnansweredQuestions]);

    const addRobot = useCallback((robot: Omit<Robot, 'id'>) => {
        const newRobot: Robot = {
            id: `robot-${Date.now()}`,
            ...robot,
        };
        setRobots(prev => [...prev, newRobot]);
    }, [setRobots]);

    const updateRobot = useCallback((id: string, robotUpdate: Partial<Robot>) => {
        setRobots(prev => prev.map(r => (r.id === id ? { ...r, ...robotUpdate } : r)));
    }, [setRobots]);

    const deleteRobot = useCallback((id: string) => {
        setRobots(prev => prev.filter(r => r.id !== id));
    }, [setRobots]);

    const addEntity = useCallback((entity: Omit<Entity, 'id'>) => {
        const newEntity: Entity = { id: `ent-${Date.now()}`, ...entity };
        setEntities(prev => [...prev, newEntity]);
    }, [setEntities]);

    const updateEntity = useCallback((id: string, entityUpdate: Partial<Entity>) => {
        setEntities(prev => prev.map(e => (e.id === id ? { ...e, ...entityUpdate } : e)));
    }, [setEntities]);

    const deleteEntity = useCallback((id: string) => {
        setEntities(prev => prev.filter(e => e.id !== id));
    }, [setEntities]);

    const addIntent = useCallback((intent: Omit<Intent, 'id'>) => {
        const newIntent: Intent = { id: `int-${Date.now()}`, ...intent };
        setIntents(prev => [...prev, newIntent]);
    }, [setIntents]);

    const updateIntent = useCallback((id: string, intentUpdate: Partial<Intent>) => {
        setIntents(prev => prev.map(i => (i.id === id ? { ...i, ...intentUpdate } : i)));
    }, [setIntents]);

    const deleteIntent = useCallback((id: string) => {
        setIntents(prev => prev.filter(i => i.id !== id));
    }, [setIntents]);

    const value = useMemo(() => ({
        categories,
        knowledgePoints,
        coldStartItems,
        chatSessions,
        unansweredQuestions,
        robots,
        entities,
        intents,
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
        getKnowledgePointById,
        addChatSession,
        updateChatSession,
        getChatSessionById,
        addUnansweredQuestion,
        deleteUnansweredQuestions,
        addRobot,
        updateRobot,
        deleteRobot,
        addEntity,
        updateEntity,
        deleteEntity,
        addIntent,
        updateIntent,
        deleteIntent,
    }), [
        categories, knowledgePoints, coldStartItems, chatSessions, unansweredQuestions, robots, entities, intents,
        addCategory, updateCategory, deleteCategory, addKnowledgePoint, updateKnowledgePoint,
        deleteKnowledgePoint, transferKnowledgePoints, setKnowledgePoints, setCategories,
        addColdStartItems, deleteColdStartItem, getKnowledgePointById, addChatSession,
        updateChatSession, getChatSessionById, addUnansweredQuestion, deleteUnansweredQuestions,
        addRobot, updateRobot, deleteRobot, addEntity, updateEntity, deleteEntity, addIntent, updateIntent, deleteIntent,
    ]);

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
