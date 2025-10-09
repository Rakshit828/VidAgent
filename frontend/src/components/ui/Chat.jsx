import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import useApiCall from '../../hooks/useApiCall';
import { getCurrentChatData, deleteChat, updateChat } from '../../api/chats';
import { initializeCurrentChat, deleteUserChat, updateUserChats } from '../../features/chatsSlice';
import ConfirmationModal from './ConfirmationModal';


const Portal = ({ children }) => {
    const [mounted, setMounted] = useState(false);
    const [container] = useState(() => document.createElement('div'));

    useEffect(() => {
        document.body.appendChild(container);
        setMounted(true);
        return () => {
            if (document.body.contains(container)) {
                document.body.removeChild(container);
            }
        };
    }, [container]);

    return mounted ? createPortal(children, container) : null;
};

const Chat = ({ chatID, chatTitle, isSelected, dispatch }) => {
    const { handleApiCall: handleSelectApiCall, isLoading: isLoadingSelect } = useApiCall(getCurrentChatData);
    const { handleApiCall: handleDeleteApiCall, isLoading: isDeleting } = useApiCall(deleteChat, 'Deleting chat');
    const { handleApiCall: handleRenameApiCall, isLoading: isRenaming } = useApiCall(updateChat, 'Renaming chat');

    const [menuOpen, setMenuOpen] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [newTitle, setNewTitle] = useState(chatTitle);
    const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });

    const menuButtonRef = useRef(null);
    const menuRef = useRef(null);
    const inputRef = useRef(null);
    const isRenamingRef = useRef(false);

    const handleSelectCurrentChat = async (e) => {
        // Don't trigger if clicking on menu button or editing
        if (isEditingTitle || isLoadingSelect) return;

        const response = await handleSelectApiCall([chatID]);
        if (response.success) dispatch(initializeCurrentChat(response.data));
    };

    const confirmDelete = async () => {
        const response = await handleDeleteApiCall([chatID]);
        if (response.success) {
            setModalOpen(false);
            setMenuOpen(false);
            dispatch(deleteUserChat({ uuid: chatID }));
            if (isSelected) dispatch(initializeCurrentChat({}));
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
            } else {
                // Reset on failure
                setNewTitle(chatTitle);
                setIsEditingTitle(false);
            }
        } finally {
            isRenamingRef.current = false;
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            saveRename();
        } else if (e.key === 'Escape') {
            setIsEditingTitle(false);
            setNewTitle(chatTitle);
        }
    };

    const handleBlur = () => {
        if (isEditingTitle) saveRename();
    };

    // Handle outside clicks and scroll close
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!menuOpen) return;

            // Check if click is outside both menu button and menu
            const isOutsideButton = menuButtonRef.current && !menuButtonRef.current.contains(event.target);
            const isOutsideMenu = menuRef.current && !menuRef.current.contains(event.target);

            if (isOutsideButton && isOutsideMenu) {
                setMenuOpen(false);
            }
        };

        const handleScroll = () => setMenuOpen(false);

        if (menuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            window.addEventListener('scroll', handleScroll, true);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, [menuOpen]);

    // Calculate menu position
    const openMenu = (e) => {
        e.stopPropagation();
        e.preventDefault();

        if (!menuButtonRef.current) return;

        const rect = menuButtonRef.current.getBoundingClientRect();
        setMenuPos({
            top: rect.bottom + window.scrollY + 4,
            left: rect.right - 144 + window.scrollX, // 144 = menu width (w-36)
        });
        setMenuOpen(!menuOpen);
    };

    const handleDeleteClick = (e) => {
        e.stopPropagation();
        e.preventDefault();
        setMenuOpen(false);
        // Small delay to ensure menu closes first
        setTimeout(() => setModalOpen(true), 50);
    };

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
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 px-2 py-1 rounded bg-gray-600 text-white focus:outline-none truncate w-full"
                        style={{ minWidth: 0 }}
                    />
                ) : (
                    <span className="truncate flex-1">{chatTitle}</span>
                )}

                {!isEditingTitle && (
                    <div ref={menuButtonRef} className="ml-2">
                        <button
                            className="p-1 rounded hover:bg-gray-600"
                            onClick={openMenu}
                        >
                            <MoreHorizontal size={16} color="white" />
                        </button>
                    </div>
                )}

                {(isLoadingSelect || isDeleting || isRenaming) && (
                    <span className="ml-2 text-xs">...</span>
                )}
            </div>

            {/* --- Dropdown rendered via Portal --- */}
            {menuOpen && (
                <Portal>
                    <div
                        ref={menuRef}
                        className="fixed w-36 bg-gray-800 text-white rounded-lg shadow-lg border border-gray-700"
                        style={{
                            top: `${menuPos.top}px`,
                            left: `${menuPos.left}px`,
                            zIndex: 9999,
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-700 rounded-t-lg text-left"
                            onClick={startRename}
                        >
                            <Edit size={16} /> Rename
                        </button>
                        <button
                            className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-700 rounded-b-lg text-left text-red-400 hover:text-red-300"
                            onClick={handleDeleteClick}
                        >
                            <Trash2 size={16} /> Delete
                        </button>
                    </div>
                </Portal>
            )}

            {/* --- Confirmation Modal --- */}
            {modalOpen && (
                <ConfirmationModal
                    isOpen={modalOpen}
                    onClose={() => setModalOpen(false)}
                    onClickConfirm={confirmDelete}
                    title="Delete Chat?"
                    highlightedText={chatTitle}
                    description="This action cannot be undone. All the queries and answers will be deleted too."
                />
            )}
        </>
    );
};

export default Chat;