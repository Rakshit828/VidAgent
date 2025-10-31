import { AUTH_PREFIX, BASE_URL, api } from "./base"

export const userSignUp = (userData) => {
    const response =  api.post(`${AUTH_PREFIX}/signup`, userData)
    return response;
}

export const userLogIn = (userData) => {
    const response =  api.post(`${AUTH_PREFIX}/login`, userData, { withCredentials: true })
    return response;
}

export const userLogOut = () => {
    const response =  api.get(`${AUTH_PREFIX}/logout`, { withCredentials: true})
    return response;
}

export const sendVerificationEmail = (email) =>  {
    const response =  api.get(`${AUTH_PREFIX}/get-verification-email/${email}`, { withCredentials: false })
    return response;
}


export const handleTokenRefresh = () => {
    const response =  api.get(`${AUTH_PREFIX}/refresh`, { withCredentials: true})
    console.log(response)
    return response;
}