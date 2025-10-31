import { X, Sparkles, Youtube } from "lucide-react";
import { useState } from "react";
import Spinner from "./Spinner.jsx";
import { useDispatch } from "react-redux";
import useCall from "../../hooks/useCall.js"
import { createNewChat } from "../../api/chats.js";
import { addNewChat, initializeCurrentChat } from "../../features/chatsSlice.js";
import { useToast } from "../../context/ToastContext.jsx";


const NewChatModal = ({ isOpen, onClose }) => {
    const [title, setTitle] = useState("")
    const [videoURL, setVideoURL] = useState("")
    const dispatch = useDispatch()

    const toast = useToast();

    const {
        isLoading,
        isError,
        errorMsg,
        handleApiCall
    } = useCall(createNewChat)

    if (!isOpen) return null;

    const handleCreateNewChat = async (event) => {
        event.preventDefault()
        const chatData = {
            title: title,
            youtubeVideoUrl: videoURL
        }
        const response = await handleApiCall([chatData])
        if (response.success) {
            dispatch(addNewChat(response.data))
            setTitle("")
            setVideoURL("")
            onClose()
            response.data['type'] = "newchat"
            dispatch(initializeCurrentChat(response.data))
            toast.success("Chat created successfully")
        } else {
            toast.error("Failed to create new chat.")
        }
    }

    return (
        <div className="fixed inset-0 z-[51] flex items-center justify-center p-4 animate-fade-in">
            {/* Blurred background */}
            <div
                className="absolute inset-0 backdrop-blur-md bg-black/60 animate-fade-in"
                onClick={onClose}
            />

            {/* Modal content */}
            <div className="relative bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 
                            rounded-3xl w-full max-w-md p-8 shadow-2xl z-10 
                            border border-gray-700/50 animate-scale-in">
                {/* Decorative gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 rounded-3xl pointer-events-none" />
                
                {/* Close button */}
                <button
                    className="absolute top-4 right-4 p-2 rounded-xl text-gray-400 
                               hover:text-white hover:bg-gray-800/60 transition-all duration-200
                               transform hover:scale-110 active:scale-95"
                    onClick={onClose}
                >
                    <X size={20} />
                </button>

                {/* Header */}
                <div className="flex items-center gap-3 mb-6 relative">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 
                                    flex items-center justify-center shadow-lg">
                        <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-white text-xl font-bold">Create New Chat</h2>
                        <p className="text-gray-400 text-sm">Start a conversation with a video</p>
                    </div>
                </div>

                <form
                    onSubmit={handleCreateNewChat}
                    className="flex flex-col gap-5 relative"
                >
                    {/* Title Input */}
                    <div className="flex flex-col gap-2">
                        <label htmlFor="title" className="text-gray-300 text-sm font-medium flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                            Chat Title
                        </label>
                        <input
                            id="title"
                            name="title"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            placeholder="e.g., Learning React Hooks"
                            className="bg-gray-800/60 text-white rounded-2xl px-4 py-3 
                                       border border-gray-700/50 
                                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                                       transition-all duration-200 placeholder-gray-500
                                       hover:bg-gray-800/80"
                        />
                    </div>

                    {/* Video URL Input */}
                    <div className="flex flex-col gap-2">
                        <label htmlFor="videoUrl" className="text-gray-300 text-sm font-medium flex items-center gap-2">
                            <Youtube className="w-4 h-4 text-red-500" />
                            Video URL
                        </label>
                        <input
                            id="videoUrl"
                            name="videoUrl"
                            type="url"
                            value={videoURL}
                            onChange={(e) => setVideoURL(e.target.value)}
                            required
                            placeholder="https://youtube.com/watch?v=..."
                            className="bg-gray-800/60 text-white rounded-2xl px-4 py-3 
                                       border border-gray-700/50 
                                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                                       transition-all duration-200 placeholder-gray-500
                                       hover:bg-gray-800/80"
                        />
                    </div>

                    {/* Loading State */}
                    {isLoading && (
                        <div className="flex items-center justify-center gap-3 p-4 bg-blue-500/10 
                                        rounded-2xl border border-blue-500/20 animate-pulse-slow">
                            <Spinner />
                            <span className="text-blue-300 text-sm font-medium">Creating your chat...</span>
                        </div>
                    )}

                    {/* Error State */}
                    {isError && (
                        <div className="text-red-300 text-sm p-4 bg-red-900/20 rounded-2xl 
                                        border border-red-500/30 flex items-center gap-2 animate-shake">
                            <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></span>
                            {errorMsg}
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="relative group bg-gradient-to-r from-blue-600 to-purple-600 
                                   hover:from-blue-500 hover:to-purple-500 
                                   active:from-blue-700 active:to-purple-700
                                   disabled:from-gray-600 disabled:to-gray-600
                                   text-white rounded-2xl py-3.5 font-semibold
                                   transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]
                                   disabled:cursor-not-allowed disabled:transform-none
                                   shadow-lg hover:shadow-xl hover:shadow-blue-500/25
                                   overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 
                                        translate-x-[-100%] group-hover:translate-x-[100%] 
                                        transition-transform duration-700 ease-in-out" />
                        <span className="relative z-10 flex items-center justify-center gap-2">
                            <Sparkles className="w-4 h-4" />
                            Create Chat
                        </span>
                    </button>
                </form>
            </div>
        </div>
    );
};

export default NewChatModal;
