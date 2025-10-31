import { useState } from "react";
import AuthForm from "../components/auth/AuthForm.jsx";
import InputFormField from "../components/auth/InputFormField.jsx";
import Spinner from "../components/home/Spinner.jsx";
import useCall from "../hooks/useCall.js";
import { setAccessToken } from "../features/authSlice.js";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { sendVerificationEmail, userLogIn } from "../api/auth.js";



const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [requiresVerification, setRequiresVerification] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Login API
  const {
    isLoading: isLoadingLogin,
    isError: isErrorLogin,
    errorMsg: errorMsgLogin,
    handleApiCall: handleApiCallLogin,
  } = useCall(userLogIn, "Logging in...");

  // Verification API
  const {
    isLoading: isLoadingVerify,
    isError: isErrorVerify,
    errorMsg: errorMsgVerify,
    handleApiCall: handleApiCallVerify,
  } = useCall(sendVerificationEmail, "Sending verification email...");

  // Trigger verify flow
  const handleVerify = async () => {
    const response = await handleApiCallVerify([ email ]);
    if (response.success) {
      navigate("/verify/info");
    }
  };

  // Handle login flow
  const handleLogin = async (event) => {
    event.preventDefault();

    // Validation
    if (!email || !password) {
      alert("Email and password are required");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert("Enter a valid email address");
      return;
    }

    if (password.length < 8) {
      alert("Password must be at least 8 characters");
      return;
    }

    // API call
    const response = await handleApiCallLogin([{ email, password }]);
    if (!response.success) {
      if (response.data?.error === "email_not_verified_error") {
        setRequiresVerification(true);
      }
      return;
    }

    dispatch(setAccessToken(response.data));
    navigate("/", { replace: true });
  };

  const isLoading = isLoadingLogin || isLoadingVerify;
  const isError = isErrorLogin || isErrorVerify;
  const errorMsg = errorMsgLogin || errorMsgVerify;

  return (
    <AuthForm
      title="Login to Your Account"
      onSubmit={handleLogin}
      submitText="Login"
      extraText="Don't have an account?"
      extraLinkText="Sign Up"
      onExtraLinkClick={() => navigate("/signup")}
    >
      <InputFormField
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <InputFormField
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      {isError && (
        <div className="text-red-600 mt-2 text-sm">{errorMsg}</div>
      )}

      {requiresVerification && (
        <div
        className="inline-block cursor-pointer text-blue-500 text-xs font-bold underline hover:text-blue-400 mt-2"
        onClick={handleVerify}
        >
          Verify your email here
        </div>
      )}
      {isLoading && <Spinner />}
    </AuthForm>
  );
};

export default LoginPage;
