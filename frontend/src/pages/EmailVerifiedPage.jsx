import { useNavigate } from "react-router-dom";

const VerifiedPage = () => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate("/login")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <div className="bg-gray-800 p-10 rounded-2xl shadow-lg text-center max-w-md w-full">
        <h1 className="text-3xl font-bold mb-4">Email Verified Successfully!</h1>
        <p className="text-gray-300 mb-6">
          Your email has been verified. You can now log in to your account.
        </p>
        <button
          onClick={handleClick}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
        >
          Go To Login
        </button>
      </div>
    </div>
  );
};

export default VerifiedPage;
