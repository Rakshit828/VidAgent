import  { CHATS_PREFIX, api } from "./base"


// All the APIs functions that will communicate with the server (chats routes)
// Every routes are protected here. i.e. it requires header


export const createNewChat = (chatData, options) => {
    const response = api.post(`${CHATS_PREFIX}/newchat`, chatData, options)
    return response
}


export const deleteChat = (chat_uid, options) => {
    const response = api.delete(`${CHATS_PREFIX}/delete/${chat_uid}`, options)
    return response
}


export const updateChat = (chat_uid, chatData, options) => {
    const response = api.put(`${CHATS_PREFIX}/updatechat/${chat_uid}`, chatData, options)
    return response
}


export const loadAllChats = (options) => {
    const response = api.get(`${CHATS_PREFIX}/allchats`, options)
    return response
}


export const getCurrentChatData = (chat_uid, options) => {
    const response = api.get(`${CHATS_PREFIX}/currentchat/${chat_uid}`, options)
    return response
}


export const getResponseFromLLM = (videoID, query, options) => {
    const response = api.get(`${CHATS_PREFIX}/response/${videoID}/${query}`, options)
    return response
}


export const getVideoTranscript = (videoID, options) => {
    const response = api.get(`${CHATS_PREFIX}/video/${videoID}`, options)
    return response
}


export const createNewQA = (qaData, options) => {
    const response = api.post(`${CHATS_PREFIX}/newqa`, qaData, options)
    return response
}
