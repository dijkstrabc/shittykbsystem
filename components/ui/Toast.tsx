import React, { useEffect, useState } from 'react';
import { useToast } from '../../contexts/ToastContext';
import { CheckIcon, XIcon, InfoIcon } from './Icons';

const Toast: React.FC<{ message: string; type: 'success' | 'error' | 'info'; onClose: () => void }> = ({ message, type, onClose }) => {
    const [isVisible, setIsVisible] = useState(false);

    // Effect for enter and auto-exit animation
    useEffect(() => {
        // Trigger enter animation shortly after mount
        const enterTimeout = setTimeout(() => setIsVisible(true), 50);

        const autoCloseTimer = setTimeout(() => {
            // Trigger exit animation
            setIsVisible(false);
        }, 5000);

        return () => {
            clearTimeout(enterTimeout);
            clearTimeout(autoCloseTimer);
        };
    }, []);
    
    // Effect to call the remove function after exit animation completes
    useEffect(() => {
        if (!isVisible) {
            // Check if it's not the initial state
            const removeTimer = setTimeout(() => {
                onClose();
            }, 300); // Should match the transition duration
            return () => clearTimeout(removeTimer);
        }
    }, [isVisible, onClose]);


    const handleManualClose = () => {
        setIsVisible(false);
    };

    const iconClasses = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        info: 'bg-blue-500',
    };

    const icons = {
        success: <CheckIcon className="h-6 w-6 text-white" />,
        error: <XIcon className="h-6 w-6 text-white" />,
        info: <InfoIcon className="h-6 w-6 text-white" />,
    };

    // Animation classes based on visibility state and screen size
    // Mobile: From bottom. Desktop: From right.
    const animationClasses = isVisible
        ? 'opacity-100 translate-y-0 sm:translate-x-0'
        : 'opacity-0 translate-y-2 sm:translate-y-0 sm:translate-x-full';

    return (
        <div className={`max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden transform transition-all duration-300 ease-out ${animationClasses}`}>
            <div className="p-4">
                <div className="flex items-start">
                    <div className={`flex-shrink-0 p-2 rounded-full ${iconClasses[type]}`}>
                        {icons[type]}
                    </div>
                    <div className="ml-3 flex-1 pt-0.5">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{message}</p>
                    </div>
                    <div className="ml-4 flex-shrink-0 flex">
                        <button onClick={handleManualClose} className="bg-white dark:bg-gray-800 rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800">
                            <span className="sr-only">Close</span>
                            <XIcon className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ToastContainer: React.FC = () => {
    const { toasts, removeToast } = useToast();

    return (
        <div className="fixed inset-0 flex items-end justify-center px-4 py-6 pointer-events-none sm:p-6 sm:items-start sm:justify-end z-[100]">
            <div className="flex flex-col items-center space-y-4 sm:items-end">
                {toasts.map(toast => (
                    <Toast
                        key={toast.id}
                        message={toast.message}
                        type={toast.type}
                        onClose={() => removeToast(toast.id)}
                    />
                ))}
            </div>
        </div>
    );
};

export default ToastContainer;