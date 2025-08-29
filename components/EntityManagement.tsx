import React, { useState, useEffect } from 'react';
import { useKnowledgeBase } from '../contexts/KnowledgeBaseContext';
import { Entity, EntityMember } from '../types';
import Button from './ui/Button';
import Modal from './ui/Modal';
import { PlusIcon, EditIcon, TrashIcon } from './ui/Icons';
import { useToast } from '../contexts/ToastContext';

const EntityManagement: React.FC = () => {
    const { entities, addEntity, updateEntity, deleteEntity } = useKnowledgeBase();
    const { addToast } = useToast();
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEntity, setEditingEntity] = useState<Entity | null>(null);
    const [formState, setFormState] = useState<Omit<Entity, 'id'>>({
        name: '', description: '', type: 'enum', members: [], regex: null
    });
    const [newMember, setNewMember] = useState('');

    useEffect(() => {
        if (isModalOpen && editingEntity) {
            setFormState(editingEntity);
        } else {
            setFormState({ name: '', description: '', type: 'enum', members: [], regex: null });
        }
    }, [isModalOpen, editingEntity]);

    const handleOpenModal = (entity: Entity | null = null) => {
        setEditingEntity(entity);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => setIsModalOpen(false);

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value }));
    };
    
    const handleAddMember = () => {
        if (newMember.trim()) {
            const member: EntityMember = { id: `mem-${Date.now()}`, value: newMember.trim() };
            setFormState(prev => ({ ...prev, members: [...prev.members, member] }));
            setNewMember('');
        }
    };
    
    const handleDeleteMember = (memberId: string) => {
        setFormState(prev => ({ ...prev, members: prev.members.filter(m => m.id !== memberId) }));
    };

    const handleSave = () => {
        if (!/^[a-zA-Z0-9_]+$/.test(formState.name)) {
            addToast('实体名称只能包含英文字符、数字和下划线。', 'error');
            return;
        }
        if (editingEntity) {
            updateEntity(editingEntity.id, formState);
            addToast('实体已更新', 'success');
        } else {
            addEntity(formState);
            addToast('实体已创建', 'success');
        }
        handleCloseModal();
    };
    
    const handleDelete = (id: string) => {
        if (window.confirm('您确定要删除此实体吗?')) {
            deleteEntity(id);
            addToast('实体已删除', 'info');
        }
    };

    return (
        <div className="p-6 h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">实体管理</h1>
                <Button onClick={() => handleOpenModal()}>
                    <PlusIcon className="w-5 h-5 mr-2" /> 新建实体
                </Button>
            </div>
            <p className="mb-6 text-gray-600 dark:text-gray-400">
                管理对话中具有特定含义的信息单元，如时间、地点、产品名称等。
            </p>

            <div className="flex-grow overflow-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">名称</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">描述</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">类型</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">成员/规则数</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">操作</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                        {entities.map(entity => (
                            <tr key={entity.id}>
                                <td className="px-6 py-4 font-mono text-sm">{entity.name}</td>
                                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-sm truncate">{entity.description}</td>
                                <td className="px-6 py-4 text-sm">{entity.type === 'enum' ? '枚举' : '正则'}</td>
                                <td className="px-6 py-4 text-sm">{entity.type === 'enum' ? entity.members.length : 1}</td>
                                <td className="px-6 py-4 text-right space-x-2">
                                    <Button variant="ghost" size="sm" onClick={() => handleOpenModal(entity)}><EditIcon className="w-4 h-4" /></Button>
                                    <Button variant="ghost" size="sm" onClick={() => handleDelete(entity.id)}><TrashIcon className="w-4 h-4 text-red-500" /></Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {entities.length === 0 && (<div className="text-center py-12 text-gray-500"><p>还没有实体。点击“新建实体”开始吧！</p></div>)}
            </div>

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingEntity ? '编辑实体' : '新建实体'} size="lg">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium">名称</label>
                        <input name="name" type="text" value={formState.name} onChange={handleFormChange} className="mt-1 w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 font-mono" pattern="[a-zA-Z0-9_]+" />
                        <p className="text-xs text-gray-500 mt-1">必须为英文字符、数字或下划线。</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium">描述</label>
                        <textarea name="description" value={formState.description} onChange={handleFormChange} rows={2} className="mt-1 w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">类型</label>
                        <div className="flex items-center space-x-4 mt-1">
                            <label><input type="radio" name="type" value="enum" checked={formState.type === 'enum'} onChange={handleFormChange} /> 枚举</label>
                            <label><input type="radio" name="type" value="regex" checked={formState.type === 'regex'} onChange={handleFormChange} /> 正则</label>
                        </div>
                    </div>
                    {formState.type === 'enum' ? (
                        <div>
                            <label className="block text-sm font-medium">枚举成员</label>
                            <div className="mt-1 max-h-48 overflow-y-auto border rounded p-2 space-y-2">
                                {formState.members.map(member => (
                                    <div key={member.id} className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 p-2 rounded">
                                        <span>{member.value}</span>
                                        <button onClick={() => handleDeleteMember(member.id)}><TrashIcon className="w-4 h-4 text-red-500" /></button>
                                    </div>
                                ))}
                            </div>
                            <div className="flex items-center space-x-2 mt-2">
                                <input type="text" value={newMember} onChange={e => setNewMember(e.target.value)} placeholder="添加新成员" className="flex-grow p-2 border rounded dark:bg-gray-700 dark:border-gray-600"/>
                                <Button variant="secondary" onClick={handleAddMember}>添加</Button>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <label className="block text-sm font-medium">正则表达式</label>
                            <input name="regex" type="text" value={formState.regex || ''} onChange={handleFormChange} className="mt-1 w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 font-mono"/>
                            <p className="text-xs text-gray-500 mt-1">例如, <code>\d{11}</code> 用于匹配手机号。</p>
                        </div>
                    )}
                </div>
                 <div className="mt-6 flex justify-end space-x-2">
                    <Button variant="secondary" onClick={handleCloseModal}>取消</Button>
                    <Button onClick={handleSave}>保存</Button>
                </div>
            </Modal>
        </div>
    );
};

export default EntityManagement;
