import React, { useState } from 'react';
import { useKnowledgeBase } from '../contexts/KnowledgeBaseContext';
import { Robot } from '../types';
import Button from './ui/Button';
import Modal from './ui/Modal';
import { PlusIcon, EditIcon, TrashIcon, RobotIcon, InfoIcon } from './ui/Icons';
import { useToast } from '../contexts/ToastContext';

const RobotManagement: React.FC = () => {
    const { robots, addRobot, updateRobot, deleteRobot } = useKnowledgeBase();
    const { addToast } = useToast();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRobot, setEditingRobot] = useState<Robot | null>(null);
    const [robotForm, setRobotForm] = useState<Omit<Robot, 'id'>>({
        name: '',
        avatar: '',
        welcomeMessage: '',
        apiIdentifier: '',
        silenceThresholdDays: 30,
    });
    const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);


    const handleOpenModal = (robot: Robot | null = null) => {
        if (robot) {
            setEditingRobot(robot);
            setRobotForm(robot);
        } else {
            setEditingRobot(null);
            setRobotForm({ name: '', avatar: '', welcomeMessage: '', apiIdentifier: '', silenceThresholdDays: 30 });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingRobot(null);
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setRobotForm(prev => ({
            ...prev,
            [name]: type === 'number' ? parseInt(value) || 0 : value,
        }));
    };

    const handleSave = () => {
        if (!robotForm.name.trim() || !robotForm.apiIdentifier.trim()) {
            addToast('机器人名称和API标识符是必填项。', 'error');
            return;
        }

        if (editingRobot) {
            updateRobot(editingRobot.id, robotForm);
            addToast('机器人更新成功！', 'success');
        } else {
            addRobot(robotForm);
            addToast('机器人创建成功！', 'success');
        }
        handleCloseModal();
    };

    const handleDelete = (id: string) => {
        if (window.confirm('您确定要删除这个机器人吗？')) {
            deleteRobot(id);
            addToast('机器人已删除。', 'info');
        }
    };

    return (
        <div className="p-6 h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">机器人管理</h1>
                <div className="flex items-center space-x-2">
                    <Button variant="secondary" onClick={() => setIsGuideModalOpen(true)}>
                        <InfoIcon className="w-5 h-5 mr-2" /> API 调用指引
                    </Button>
                    <Button onClick={() => handleOpenModal()}>
                        <PlusIcon className="w-5 h-5 mr-2" /> 新建机器人
                    </Button>
                </div>
            </div>
            <p className="mb-6 text-gray-600 dark:text-gray-400">
                创建和管理不同的机器人身份。每个机器人都可以有自己的头像、欢迎语和API标识符。
            </p>

            <div className="flex-grow overflow-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">头像</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">名称</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">API 标识符</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">操作</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                        {robots.map(robot => (
                            <tr key={robot.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                <td className="px-6 py-4">
                                    {robot.avatar ? (
                                        <img src={robot.avatar} alt={robot.name} className="h-10 w-10 rounded-full object-cover bg-gray-200" />
                                    ) : (
                                        <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                            <RobotIcon className="h-6 w-6 text-gray-400"/>
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{robot.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-mono">{robot.apiIdentifier}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right space-x-2">
                                    <Button variant="ghost" size="sm" onClick={() => handleOpenModal(robot)}><EditIcon className="w-4 h-4" /></Button>
                                    <Button variant="ghost" size="sm" onClick={() => handleDelete(robot.id)}><TrashIcon className="w-4 h-4 text-red-500" /></Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {robots.length === 0 && (<div className="text-center py-12 text-gray-500"><p>还没有机器人。点击“新建机器人”开始吧！</p></div>)}
            </div>

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingRobot ? '编辑机器人' : '新建机器人'} size="lg">
                <div className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium">机器人名称</label>
                        <input id="name" name="name" type="text" value={robotForm.name} onChange={handleFormChange} className="mt-1 w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"/>
                    </div>
                     <div>
                        <label htmlFor="apiIdentifier" className="block text-sm font-medium">API 标识符</label>
                        <input id="apiIdentifier" name="apiIdentifier" type="text" value={robotForm.apiIdentifier} onChange={handleFormChange} className="mt-1 w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 font-mono"/>
                        <p className="text-xs text-gray-500 mt-1">用于通过HTTP请求识别此机器ンの唯一ID。</p>
                    </div>
                     <div>
                        <label htmlFor="avatar" className="block text-sm font-medium">头像 URL</label>
                        <input id="avatar" name="avatar" type="text" value={robotForm.avatar} onChange={handleFormChange} className="mt-1 w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"/>
                    </div>
                     <div>
                        <label htmlFor="welcomeMessage" className="block text-sm font-medium">欢迎消息</label>
                        <textarea id="welcomeMessage" name="welcomeMessage" value={robotForm.welcomeMessage} onChange={handleFormChange} rows={3} className="mt-1 w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"></textarea>
                    </div>
                     <div>
                        <label htmlFor="silenceThresholdDays" className="block text-sm font-medium">沉寂问题时间范围 (天)</label>
                        <input id="silenceThresholdDays" name="silenceThresholdDays" type="number" value={robotForm.silenceThresholdDays} onChange={handleFormChange} className="mt-1 w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"/>
                        <p className="text-xs text-gray-500 mt-1">在“会话学习”中，用于确定一个知识点多久未被使用才算“沉寂”。</p>
                    </div>
                </div>
                <div className="mt-6 flex justify-end space-x-2">
                    <Button variant="secondary" onClick={handleCloseModal}>取消</Button>
                    <Button onClick={handleSave}>保存</Button>
                </div>
            </Modal>
            
            <Modal 
                isOpen={isGuideModalOpen} 
                onClose={() => setIsGuideModalOpen(false)} 
                title="机器人 API 调用指引" 
                size="2xl"
                footer={<Button onClick={() => setIsGuideModalOpen(false)}>关闭</Button>}
            >
                <div className="prose prose-sm dark:prose-invert max-w-none">
                    <h4>概述</h4>
                    <p>
                        本指引将帮助您将知识库机器人集成到您自己的应用程序中。您需要创建一个后端服务，该服务读取从本系统导出的知识库数据，并提供一个HTTP API端点供您的客户端（如网站、移动应用）调用。
                    </p>
                    <p>
                        您可以使用“知识库”页面的<strong>导出</strong>功能来获取包含所有问题和分类的JSON文件，作为您后端服务的数据源。
                    </p>
                    
                    <h4>API 请求格式</h4>
                    <p>您的后端服务应接收以下格式的HTTP POST请求：</p>
                    <ul>
                        <li><strong>Endpoint</strong>: <code>https://your-api-server.com/chat</code> (此为示例，请替换为您自己的URL)</li>
                        <li><strong>Method</strong>: <code>POST</code></li>
                        <li><strong>Headers</strong>: <code>Content-Type: application/json</code></li>
                        <li><strong>Body</strong> (JSON):</li>
                    </ul>
                    <pre><code className="language-json">{JSON.stringify({
                        robotApiIdentifier: "用于识别机器人的唯一字符串",
                        userQuestion: "用户提出的问题",
                        userId: "可选，用于追踪用户会话"
                    }, null, 2)}</code></pre>
                    <p>
                        <code>robotApiIdentifier</code> 字段是必需的，它对应您在下方列表中设置的“API 标识符”，用于确定使用哪个机器人的身份和配置进行响应。
                    </p>

                    <h4>API 响应格式</h4>
                    <p>您的服务在找到答案后，可以返回类似以下的JSON响应：</p>
                    <pre><code className="language-json">{JSON.stringify({
                        answer: "从知识库中匹配到的答案HTML内容。",
                        relatedQuestions: [
                            { id: "kp-2", standardQuestion: "如何更新账单信息？" }
                        ]
                    }, null, 2)}</code></pre>
                    <p>如果未找到答案，可以返回：</p>
                     <pre><code className="language-json">{JSON.stringify({
                        answer: "抱歉，我找不到您问题的答案。",
                        relatedQuestions: []
                    }, null, 2)}</code></pre>

                    <h4>代码示例</h4>
                    <h5>cURL</h5>
                    <pre>
                        <code className="language-bash">
{`curl -X POST https://your-api-server.com/chat \\
-H "Content-Type: application/json" \\
-d '{
      "robotApiIdentifier": "default-assistant-001",
      "userQuestion": "退货政策是什么？"
    }'`}
                        </code>
                    </pre>

                    <h5>JavaScript (Fetch API)</h5>
                    <pre>
                        <code className="language-javascript">
{`async function askRobot(question) {
  const API_ENDPOINT = 'https://your-api-server.com/chat';
  
  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        robotApiIdentifier: 'default-assistant-001', // 替换为目标机器人的标识符
        userQuestion: question,
      }),
    });

    if (!response.ok) {
      throw new Error(\`HTTP error! Status: \${response.status}\`);
    }

    const data = await response.json();
    console.log('Bot Answer:', data.answer);
    return data;

  } catch (error) {
    console.error('Failed to fetch from chat API:', error);
  }
}

askRobot('退货政策是什么？');`}
                        </code>
                    </pre>
                     <p>
                        <strong>重要提示</strong>: 您需要在后端服务中实现匹配逻辑（类似于本应用聊天界面中的<code>findBestMatch</code>函数），以根据<code>userQuestion</code>在导出的知识库数据中查找最合适的答案。
                    </p>
                </div>
            </Modal>
        </div>
    );
};

export default RobotManagement;