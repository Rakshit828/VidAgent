import React from "react";

const ConfirmationModal = ({ 
    isOpen, 
    onClose, 
    onClickConfirm, 
    title, 
    highlightedText, 
    description
}) => {

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Semi-transparent blurred background */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            ></div>

            {/* Modal content with sky-blue border */}
            <div className="relative bg-gray-800 text-white rounded-lg shadow-lg max-w-sm w-full p-4 z-10 border-2 border-sky-500">
                <h2 className="text-lg mb-2">{title} <strong className="">{highlightedText}</strong></h2>
                <p className="text-sm mb-4">{description}</p>
                <div className="flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="px-3 py-1 rounded bg-gray-600 hover:bg-gray-700 transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => { onClickConfirm(); onClose(); }}
                        className="px-3 py-1 rounded bg-red-600 hover:bg-red-700 transition"
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
