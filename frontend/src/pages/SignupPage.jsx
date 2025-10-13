import { useState } from "react";
import AuthForm from "../components/auth/AuthForm.jsx";
import InputFormField from "../components/auth/InputFormField.jsx";
import Spinner from "../components/home/Spinner.jsx";
import useApiCall from "../hooks/useApiCall.js";
import { userSignUp } from "../api/auth.js";
import { useNavigate } from "react-router-dom";


const SignupPage = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate()

  const {
    isLoading,
    isError,
    errorMsg,
    handleApiCall
  } = useApiCall(userSignUp)


  // Creates the account and tells the user to login
  const handleSignUp = async (event) => {
    event.preventDefault()
    const response = await handleApiCall([{ firstName, lastName, username, email, password }])
    if (response.success) {
      navigate("/login", { replace: true })
    }
  }


  return (
    <AuthForm
      title="Create Your Account"
      onSubmit={handleSignUp}
      submitText="Sign Up"
      extraText="Already have an account?"
      extraLinkText="Login"
      onExtraLinkClick={() => navigate("/login", { replace: true })}
    >
      <InputFormField label="First Name" type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
      <InputFormField label="Last Name" type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} />
      <InputFormField label="Username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
      <InputFormField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <InputFormField label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />

      {isError && <div className="text-red-800">{errorMsg}</div>}
      {isLoading && <Spinner />}
    </AuthForm>
  );
};

export default SignupPage;
