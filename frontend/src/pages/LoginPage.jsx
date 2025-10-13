import { useState } from "react";
import AuthForm from "../components/auth/AuthForm.jsx";
import InputFormField from "../components/auth/InputFormField.jsx";
import Spinner from "../components/home/Spinner.jsx";
import {userLogIn} from "../api/auth.js";
import { useDispatch } from "react-redux";
import { setAccessToken } from "../features/authSlice.js";
import useApiCall from "../hooks/useApiCall.js";
import { useNavigate } from "react-router-dom";


const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const {
    isLoading, 
    isError, 
    errorMsg, 
    handleApiCall
  } = useApiCall(userLogIn)
  
  const handleLogin = async (event) => {
    console.log("Handle Login")
    event.preventDefault()
    const response = await handleApiCall([{email: email, password: password}])
    console.log("Data sent by server on login: ", response.data)
    dispatch(setAccessToken(response.data))
    navigate("/", { replace:  true })
  }


  return (
    <AuthForm
      title="Login to Your Account"
      onSubmit={handleLogin}
      submitText="Login"
      extraText="Don't have an account?"
      extraLinkText="Sign Up"
      onExtraLinkClick={() => navigate("/signup", { replace: true })}
    >
      <InputFormField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <InputFormField label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />

      {isError && <div className="text-red-800">{errorMsg}</div>}
      {isLoading && <Spinner />}
    </AuthForm>
  );
};

export default LoginPage;
