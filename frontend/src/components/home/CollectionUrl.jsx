import { useState } from "react";
import { Youtube, ChevronRight, ChevronDown, PlusCircle, Copy, Trash2 } from "lucide-react";


const CollectionUrl = ({ sidebar }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [urls, setUrls] = useState([]);
  const [newUrl, setNewUrl] = useState("");
  const [copiedIndex, setCopiedIndex] = useState(null);

  const handleAddUrl = () => {
    if (!newUrl.trim()) return;
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//;
    if (!youtubeRegex.test(newUrl)) {
      alert("Please enter a valid YouTube URL");
      return;
    }
    setUrls([...urls, newUrl.trim()]);
    setNewUrl("");
  };

  const handleRemoveUrl = (index) => {
    setUrls(urls.filter((_, i) => i !== index));
  };

  const handleCopyUrl = (url, index) => {
    navigator.clipboard.writeText(url);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  // Only show dropdown if sidebar is open
  if (!sidebar) {
    return (
      <div className="flex justify-center mt-4">
        <Youtube size={18} className="text-red-500" title="Collections" />
      </div>
    );
  }

  return (
    <div className="text-white text-sm mt-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 
                   hover:bg-gray-800/60 rounded-lg transition-all"
      >
        <div className="flex items-center gap-2">
          <Youtube size={18} className="text-red-500" />
          <span className="font-semibold">Collections</span>
        </div>
        {isOpen ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
      </button>

      {isOpen && (
        <div className="mt-2 px-3 space-y-3 animate-fade-in">
          {/* Input field */}
          <div className="flex items-center gap-2">
            <input
              type="url"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="Paste YouTube URL"
              className="flex-1 px-2 py-1.5 bg-gray-900/70 border border-gray-700/50 rounded-lg 
                         text-gray-300 placeholder-gray-500 text-xs focus:outline-none focus:ring-1 
                         focus:ring-blue-600"
            />
            <button
              onClick={handleAddUrl}
              className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 active:bg-blue-700 transition-all"
            >
              <PlusCircle size={16} />
            </button>
          </div>

          {/* URL List */}
          <div className="max-h-40 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-gray-700">
            {urls.length === 0 ? (
              <p className="text-gray-500 text-xs text-center py-2">No saved URLs</p>
            ) : (
              urls.map((url, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-800/60 px-2 py-1.5 rounded-md text-xs">
                  <a href={url} target="_blank" rel="noopener noreferrer" className="truncate text-blue-400 hover:underline max-w-[70%]">
                    {url}
                  </a>
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleCopyUrl(url, index)} className="text-gray-400 hover:text-blue-400 transition-colors" title="Copy URL">
                      <Copy size={14} />
                    </button>
                    <button onClick={() => handleRemoveUrl(index)} className="text-gray-400 hover:text-red-500 transition-colors" title="Remove">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {copiedIndex !== null && (
            <p className="text-[11px] text-green-400 text-center mt-1">URL copied to clipboard</p>
          )}
        </div>
      )}
    </div>
  );
};

export default CollectionUrl;