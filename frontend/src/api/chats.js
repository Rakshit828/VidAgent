
import axios from "axios"
import {  BASE_URL, CHATS_PREFIX, handleRequest } from "./base"


export const createNewChat = (chatData, headers) =>
    handleRequest(() => axios.post(`${BASE_URL}${CHATS_PREFIX}/newchat`, chatData, { headers }))

export const deleteChat = (chat_uid, headers) =>
    handleRequest(() => axios.delete(`${BASE_URL}${CHATS_PREFIX}/delete/${chat_uid}`, { headers }))

export const updateChat = (chat_uid, chatData, headers) =>
    handleRequest(() => axios.put(`${BASE_URL}${CHATS_PREFIX}/updatechat/${chat_uid}`, chatData, { headers }))

export const loadAllChats = (headers) =>
    handleRequest(() => axios.get(`${BASE_URL}${CHATS_PREFIX}/allchats`, { headers }))

export const getCurrentChatData = (chat_uid, headers) =>
    handleRequest(() => axios.get(`${BASE_URL}${CHATS_PREFIX}/currentchat/${chat_uid}`, { headers }))

export const getResponseFromLLM = (videoID, query, headers) =>
    handleRequest(() => axios.get(`${BASE_URL}${CHATS_PREFIX}/response/${videoID}/${query}`, { headers }))

export const getVideoTranscript = (videoID, headers) =>
    handleRequest(() => axios.get(`${BASE_URL}${CHATS_PREFIX}/video/${videoID}`, { headers }))

export const createNewQA = (qaData, headers) =>
    handleRequest(() => axios.post(`${BASE_URL}${CHATS_PREFIX}/newqa`, qaData, { headers }))
