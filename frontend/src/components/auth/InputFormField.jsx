import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react"; // install lucide-react if not already

const InputFormField = ({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";

  return (
    <div className="flex flex-col relative">
      <label className="text-gray-300 mb-1">{label}</label>
      <input
        type={isPassword && !showPassword ? "password" : "text"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
        required
      />
      {isPassword && (
        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          className="absolute right-3 top-9 text-gray-400 hover:text-gray-200 focus:outline-none"
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      )}
    </div>
  );
};

export default InputFormField;
