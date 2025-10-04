import { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import useApiCall from '../../hooks/useApiCall';
import { getCurrentChatData, deleteChat, updateChat } from '../../api/chats';
import { initializeCurrentChat, deleteUserChat, updateUserChats } from '../../features/chatsSlice';
import ConfirmationModal from './ConfirmationModal';



const Chat = ({ chatID, chatTitle, isSelected, dispatch }) => {
    const {
        handleApiCall: handleSelectApiCall,
        isLoading: isLoadingSelect
    } = useApiCall(getCurrentChatData);

    const {
        handleApiCall: handleDeleteApiCall,
        isLoading: isDeleting
    } = useApiCall(deleteChat, "Deleting chat");

    const {
        handleApiCall: handleRenameApiCall,
        isLoading: isRenaming
    } = useApiCall(updateChat, "Renaming chat");

    const [menuOpen, setMenuOpen] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [newTitle, setNewTitle] = useState(chatTitle);

    const menuRef = useRef(null);
    const inputRef = useRef(null);
    const isRenamingRef = useRef(false);

    const handleSelectCurrentChat = async () => {
        if (isLoadingSelect) return;
        const response = await handleSelectApiCall([chatID]);
        if (response.success) dispatch(initializeCurrentChat(response.data));
    };

    const confirmDelete = async () => {
        const response = await handleDeleteApiCall([chatID]);
        if (response.success) {
            setModalOpen(false);
            dispatch(deleteUserChat({ uuid: chatID }));

            if (isSelected) {
                dispatch(initializeCurrentChat({}));
            }

        }
    };

    const startRename = (e) => {
        e.stopPropagation();
        setIsEditingTitle(true);
        setMenuOpen(false);
        setTimeout(() => inputRef.current?.focus(), 0);
    };

    const saveRename = async () => {
        if (!newTitle.trim() || newTitle === chatTitle) {
            setIsEditingTitle(false);
            setNewTitle(chatTitle);
            return;
        }

        if (isRenamingRef.current) return;
        isRenamingRef.current = true;

        try {
            const response = await handleRenameApiCall([chatID, { title: newTitle }]);
            if (response?.success) {
                dispatch(updateUserChats({ uuid: chatID, title: newTitle }));
                setIsEditingTitle(false);
            }
        } finally {
            isRenamingRef.current = false;
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            saveRename();
        } else if (e.key === "Escape") {
            setIsEditingTitle(false);
            setNewTitle(chatTitle);
        }
    };

    const handleBlur = () => {
        if (isEditingTitle) saveRename();
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setMenuOpen(false);
            }
            if (isEditingTitle && inputRef.current && !inputRef.current.contains(event.target)) {
                saveRename();
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isEditingTitle, newTitle]);

    return (
        <>
            <div
                className={`relative flex justify-between items-center p-2 sm:p-3 w-full text-sm sm:text-base rounded-lg transition-colors duration-200
                    ${isSelected ? 'bg-gray-700' : 'text-white hover:bg-gray-800'}
                    ${(isLoadingSelect || isDeleting || isRenaming) ? 'opacity-50 cursor-wait' : 'cursor-pointer'}
                `}
                onClick={handleSelectCurrentChat}
            >
                {isEditingTitle ? (
                    <input
                        ref={inputRef}
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onBlur={handleBlur}
                        className="flex-1 px-2 py-1 rounded bg-gray-600 text-white focus:outline-none truncate w-full"
                        style={{ minWidth: 0 }}
                    />
                ) : (
                    <span className="truncate flex-1">{chatTitle}</span>
                )}

                {!isEditingTitle && (
                    <div ref={menuRef} className="relative ml-2">
                        <button
                            className="p-1 rounded hover:bg-gray-600"
                            onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
                        >
                            <MoreHorizontal size={16} color="white" />
                        </button>

                        {menuOpen && (
                            <div className="absolute right-0 top-full mt-1 w-36 bg-gray-800 text-white rounded-lg shadow-lg z-50">
                                <button
                                    className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-700 rounded-t-lg"
                                    onClick={startRename}
                                >
                                    <Edit size={20} /> Rename
                                </button>
                                <button
                                    className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-700 rounded-b-lg"
                                    onClick={(e) => {
                                        e.stopPropagation(); // prevent parent onClick
                                        setModalOpen(true);
                                    }}
                                >
                                    <Trash2 size={16} /> Delete
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {(isLoadingSelect || isDeleting || isRenaming) && <span className="ml-2 text-xs">...</span>}
            </div>

            <ConfirmationModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onClickConfirm={confirmDelete}
                title="Delete Chat ? "
                highlightedText={chatTitle}
                description="This action cannot be undone. All the queries and answers will be deleted too."
            />
        </>
    );
};

export default Chat;
