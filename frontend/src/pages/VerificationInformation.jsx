import { useSelector } from "react-redux";
import { useState } from "react";
import { selectEmail } from "../features/authSlice";
import useCall from "../hooks/useCall";
import { sendVerificationEmail } from "../api/auth";
import Spinner from "../components/home/Spinner";

export default function VerificationInformation() {
  const email = useSelector(selectEmail);
  const [message, setMessage] = useState("");

  const {
    isLoading,
    isError,
    errorMsg,
    handleApiCall,
  } = useCall(sendVerificationEmail, "Sending verification email...");

  const handleResend = async () => {
    setMessage("");
    const response = await handleApiCall([ email ]);
    if (response.success) {
      setMessage("A new verification email has been sent.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 text-gray-100">
      <div className="max-w-lg w-full text-center p-8 bg-gray-900 rounded-2xl shadow-xl">
        <h1 className="text-3xl font-bold text-indigo-400 mb-4">Verify Your Email</h1>

        <p className="text-gray-300 mb-6">
          Thank you for registering. We’ve sent a verification email to:
        </p>

        <p className="text-gray-100 font-mono mb-6">{email}</p>

        <p className="text-gray-400 mb-6">
          Please check your inbox and click the verification link to activate your account.
        </p>

        <p className="text-gray-400 mb-6">
          Didn’t receive the email? You can request another verification email below.
        </p>

        {isLoading ? (
          <div className="flex justify-center">
            <Spinner />
          </div>
        ) : (
          <button
            onClick={handleResend}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-semibold text-sm transition"
          >
            Resend Verification Email
          </button>
        )}

        {message && (
          <p className="text-green-500 text-sm mt-4">{message}</p>
        )}
        {isError && (
          <p className="text-red-500 text-sm mt-4">{errorMsg}</p>
        )}
      </div>
    </div>
  );
}
