import React, { useRef, useEffect, useState } from 'react';
import { AlignCenterIcon, AlignLeftIcon, BoldIcon, ImageIcon, UnderlineIcon, VideoIcon } from './Icons';
import Modal from './Modal';
import Button from './Button';

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange }) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
    const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
    const [mediaUrl, setMediaUrl] = useState('');

    useEffect(() => {
        if (editorRef.current && editorRef.current.innerHTML !== value) {
            editorRef.current.innerHTML = value;
        }
    }, [value]);

    const handleInput = () => {
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
        }
    };
    
    const execCmd = (command: string, value?: string) => {
        document.execCommand(command, false, value);
        editorRef.current?.focus();
        handleInput();
    };

    const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        execCmd('foreColor', e.target.value);
    };

    const openMediaModal = (type: 'image' | 'video') => {
        setMediaType(type);
        setMediaUrl('');
        setIsMediaModalOpen(true);
    };

    const closeMediaModal = () => {
        setIsMediaModalOpen(false);
        setMediaType(null);
        setMediaUrl('');
    };

    const handleInsertMedia = () => {
        if (!mediaUrl.trim()) return;

        if (mediaType === 'image') {
            execCmd('insertImage', mediaUrl);
        } else if (mediaType === 'video') {
            const embedHtml = `<div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden;"><iframe src="${mediaUrl}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" frameborder="0" allowfullscreen></iframe></div>`;
            execCmd('insertHTML', embedHtml);
        }
        closeMediaModal();
    };
    
    const ToolbarButton = ({ onClick, children, title }: { onClick?: () => void, children: React.ReactNode, title: string }) => (
        <button type="button" onMouseDown={e => e.preventDefault()} onClick={onClick} className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600" title={title}>
            {children}
        </button>
    );

    return (
        <>
            <div className="border border-gray-300 dark:border-gray-600 rounded-lg">
                <div className="flex items-center p-2 border-b border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-t-lg flex-wrap">
                    <ToolbarButton onClick={() => execCmd('bold')} title="加粗"><BoldIcon className="w-5 h-5" /></ToolbarButton>
                    <ToolbarButton onClick={() => execCmd('underline')} title="下划线"><UnderlineIcon className="w-5 h-5" /></ToolbarButton>
                    <ToolbarButton onClick={() => {}} title="字体颜色">
                        <input type="color" onChange={handleColorChange} className="w-6 h-6 border-none bg-transparent cursor-pointer p-0" />
                    </ToolbarButton>
                    <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-2"></div>
                    <ToolbarButton onClick={() => execCmd('justifyLeft')} title="左对齐"><AlignLeftIcon className="w-5 h-5" /></ToolbarButton>
                    <ToolbarButton onClick={() => execCmd('justifyCenter')} title="居中对齐"><AlignCenterIcon className="w-5 h-5" /></ToolbarButton>
                    <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-2"></div>
                    <ToolbarButton onClick={() => openMediaModal('image')} title="插入图片"><ImageIcon className="w-5 h-5" /></ToolbarButton>
                    <ToolbarButton onClick={() => openMediaModal('video')} title="插入视频"><VideoIcon className="w-5 h-5" /></ToolbarButton>
                </div>
                <div
                    ref={editorRef}
                    contentEditable
                    onInput={handleInput}
                    className="p-4 h-64 overflow-y-auto focus:outline-none"
                    dangerouslySetInnerHTML={{ __html: value }}
                />
            </div>

            <Modal
                isOpen={isMediaModalOpen}
                onClose={closeMediaModal}
                title={`插入${mediaType === 'image' ? '图片' : '视频'}`}
            >
                <div className="space-y-2">
                    <label htmlFor="media-url" className="block text-sm font-medium">
                        {mediaType === 'image' ? '图片 URL' : '视频嵌入 URL'}
                    </label>
                    <input
                        id="media-url"
                        type="text"
                        value={mediaUrl}
                        onChange={(e) => setMediaUrl(e.target.value)}
                        placeholder={mediaType === 'image' ? 'https://example.com/image.png' : 'https://www.youtube.com/embed/...'}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                     {mediaType === 'video' && <p className="text-xs text-gray-500">例如: https://www.youtube.com/embed/VIDEO_ID</p>}
                </div>
                <div className="mt-4 flex justify-end space-x-2">
                    <Button variant="secondary" onClick={closeMediaModal}>取消</Button>
                    <Button onClick={handleInsertMedia}>插入</Button>
                </div>
            </Modal>
        </>
    );
};

export default RichTextEditor;