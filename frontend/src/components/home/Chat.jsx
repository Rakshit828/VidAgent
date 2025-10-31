import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { MoreHorizontal, Edit, Trash2 } from "lucide-react";
import useCall from "../../hooks/useCall.js";
import { getCurrentChatData, deleteChat, updateChat } from "../../api/chats";
import { initializeCurrentChat, deleteUserChat, updateUserChats } from "../../features/chatsSlice";
import ConfirmationModal from "./ConfirmationModal";

const Portal = ({ children }) => {
    const [mounted, setMounted] = useState(false);
    const [container] = useState(() => document.createElement("div"));

    useEffect(() => {
        document.body.appendChild(container);
        setMounted(true);
        return () => {
            if (document.body.contains(container)) document.body.removeChild(container);
        };
    }, [container]);

    return mounted ? createPortal(children, container) : null;
};


const Chat = ({ chatID, chatTitle, isSelected, dispatch }) => {
    const { handleApiCall: handleSelectApiCall, isLoading: isLoadingSelect } = useCall(getCurrentChatData);
    const { handleApiCall: handleDeleteApiCall, isLoading: isDeleting } = useCall(deleteChat, "Deleting chat");
    const { handleApiCall: handleRenameApiCall, isLoading: isRenaming } = useCall(updateChat, "Renaming chat");

    const [menuOpen, setMenuOpen] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [newTitle, setNewTitle] = useState(chatTitle);
    const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });

    const menuButtonRef = useRef(null);
    const menuRef = useRef(null);
    const inputRef = useRef(null);
    const isRenamingRef = useRef(false);

    const handleSelectCurrentChat = async () => {
        if (isEditingTitle || isLoadingSelect) return;
        const response = await handleSelectApiCall([chatID]);
        if (response.success) dispatch(initializeCurrentChat(response.data));
    };

    const confirmDelete = async () => {
        dispatch(deleteUserChat({ uuid: chatID }));
        const response = await handleDeleteApiCall([chatID]);
        if (response.success) {
            setModalOpen(false);
            setMenuOpen(false);
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
            if (response?.success) dispatch(updateUserChats({ uuid: chatID, title: newTitle }));
            setIsEditingTitle(false);
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
            if (!menuOpen) return;
            const outsideButton = menuButtonRef.current && !menuButtonRef.current.contains(event.target);
            const outsideMenu = menuRef.current && !menuRef.current.contains(event.target);
            if (outsideButton && outsideMenu) setMenuOpen(false);
        };
        const handleScroll = () => setMenuOpen(false);

        if (menuOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            window.addEventListener("scroll", handleScroll, true);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            window.removeEventListener("scroll", handleScroll, true);
        };
    }, [menuOpen]);

    const openMenu = (e) => {
        e.stopPropagation();
        e.preventDefault();
        if (!menuButtonRef.current) return;
        const rect = menuButtonRef.current.getBoundingClientRect();
        setMenuPos({
            top: rect.bottom + window.scrollY + 4,
            left: rect.right - 144 + window.scrollX,
        });
        setMenuOpen(!menuOpen);
    };

    const handleDeleteClick = (e) => {
        e.stopPropagation();
        e.preventDefault();
        setMenuOpen(false);
        setTimeout(() => setModalOpen(true), 50);
    };

    return (
        <>
            <div
                className={`relative flex justify-between items-center w-full rounded-md sm:rounded-lg
        text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 transition-colors
        ${isSelected ? "bg-gray-700 text-white" : "text-gray-200 hover:bg-gray-800/70"}
        ${(isLoadingSelect || isDeleting || isRenaming) ? "opacity-50 cursor-wait" : "cursor-pointer"}`}
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
                        className="flex-1 px-1 py-0.5 rounded bg-gray-600 text-white focus:outline-none truncate w-full text-xs sm:text-sm"
                        style={{ minWidth: 0 }}
                    />
                ) : (
                    <span className="truncate flex-1">{chatTitle}</span>
                )}

                {!isEditingTitle && (
                    <div ref={menuButtonRef} className="ml-1 sm:ml-2">
                        <button className="p-1 rounded hover:bg-gray-600/60" onClick={openMenu}>
                            <MoreHorizontal size={14} className="text-gray-300" />
                        </button>
                    </div>
                )}
            </div>

            {menuOpen && (
                <Portal>
                    <div
                        ref={menuRef}
                        className="fixed w-32 sm:w-36 bg-gray-800 text-white rounded-lg shadow-lg border border-gray-700 text-xs sm:text-sm"
                        style={{
                            top: `${menuPos.top}px`,
                            left: `${menuPos.left}px`,
                            zIndex: 9999,
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-gray-700 rounded-t-lg"
                            onClick={startRename}
                        >
                            <Edit size={14} /> Rename
                        </button>
                        <button
                            className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-gray-700 rounded-b-lg text-red-400 hover:text-red-300"
                            onClick={handleDeleteClick}
                        >
                            <Trash2 size={14} /> Delete
                        </button>
                    </div>
                </Portal>
            )}

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
