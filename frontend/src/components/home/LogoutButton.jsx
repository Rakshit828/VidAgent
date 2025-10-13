import { LogOut } from "lucide-react";

const LogoutButton = ({ onLogout, sidebar, isLoading }) => {
  return (
    <button
      onClick={!isLoading ? onLogout : undefined}
      disabled={isLoading}
      className={`relative group flex items-center justify-between w-full text-gray-300 
        hover:text-white hover:bg-gray-800/70 px-4 py-3 mt-auto transition-all duration-300 
        border-t border-gray-800/50 disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      <div className="flex items-center gap-3">
        <LogOut size={20} className="group-hover:text-red-400 transition-colors" />
        {sidebar && <span className="text-sm font-medium">Logout</span>}
      </div>

      {isLoading && (
        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin absolute right-2" />
      )}
    </button>
  );
};

export default LogoutButton;
