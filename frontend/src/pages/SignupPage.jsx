import { useState } from "react";
import AuthForm from "../components/auth/AuthForm.jsx";
import InputFormField from "../components/auth/InputFormField.jsx";
import Spinner from "../components/home/Spinner.jsx";
import useCall from "../hooks/useCall.js";
import { userSignUp } from "../api/auth.js";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setCurrentEmail } from "../features/authSlice.js";

const SignupPage = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const {
    isLoading: isLoadingSignup,
    isError: isErrorSignup,
    errorMsg: errorMsgSignup,
    handleApiCall: handleApiCallSignup,
  } = useCall(userSignUp);


  const handleSignUp = async (event) => {
    event.preventDefault();

    if (!firstName || !lastName || !username || !email || !password) {
      alert("All fields are required");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert("Invalid email format");
      return;
    }

    if (password.length < 8) {
      alert("Password must be at least 8 characters");
      return;
    }

    const response = await handleApiCallSignup([
      { firstName, lastName, username, email, password },
    ]);

    if (response?.success) {
      dispatch(setCurrentEmail({ email }))
      navigate("/verify/info", { replace: true })
    }
  };


  return (
    <AuthForm
      title="Create Your Account"
      onSubmit={handleSignUp}
      submitText="Sign Up"
      extraText="Already have an account?"
      extraLinkText="Login"
      onExtraLinkClick={() => navigate("/login", { replace: true })}
    >
      <InputFormField
        label="First Name"
        type="text"
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
      />
      <InputFormField
        label="Last Name"
        type="text"
        value={lastName}
        onChange={(e) => setLastName(e.target.value)}
      />
      <InputFormField
        label="Username"
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
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

      {/* Error display */}
      {(isErrorSignup) && (
        <div className="text-red-800 mt-2 text-sm">
          {errorMsgSignup}
        </div>
      )}

      {/* Loading spinner */}
      {(isLoadingSignup) && <Spinner />}
    </AuthForm>
  );
};

export default SignupPage;
