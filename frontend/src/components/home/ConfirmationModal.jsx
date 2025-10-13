import React, { useEffect } from "react";
import { createPortal } from "react-dom";

const ConfirmationModal = ({ 
    isOpen, 
    onClose, 
    onClickConfirm, 
    title, 
    highlightedText, 
    description
}) => {
    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    // Handle ESC key to close modal
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleConfirm = () => {
        onClickConfirm();
        onClose();
    };

    const handleBackdropClick = (e) => {
        // Only close if clicking directly on backdrop, not on modal content
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const modalContent = (
        <div 
            className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
            onClick={handleBackdropClick}
        >
            {/* Semi-transparent blurred background */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fadeIn"
            ></div>

            {/* Modal content with sky-blue border */}
            <div 
                className="relative bg-gray-800 text-white rounded-lg shadow-2xl max-w-sm w-full p-6 z-10 border-2 border-sky-500 animate-scaleIn"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-xl font-semibold mb-3">
                    {title} {highlightedText && <strong className="text-sky-400">{highlightedText}</strong>}
                </h2>
                <p className="text-sm text-gray-300 mb-6 leading-relaxed">
                    {description}
                </p>
                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-md bg-gray-600 hover:bg-gray-700 transition-colors duration-200 font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 transition-colors duration-200 font-medium"
                    >
                        Confirm
                    </button>
                </div>
            </div>

            <style jsx>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }
                
                @keyframes scaleIn {
                    from {
                        opacity: 0;
                        transform: scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }
                
                .animate-fadeIn {
                    animation: fadeIn 0.2s ease-out;
                }
                
                .animate-scaleIn {
                    animation: scaleIn 0.2s ease-out;
                }
            `}</style>
        </div>
    );

    // Render modal in a portal to ensure it's always on top
    return createPortal(modalContent, document.body);
};

export default ConfirmationModal;