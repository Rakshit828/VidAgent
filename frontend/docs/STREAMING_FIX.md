# Chat Streaming Bug Fix Summary

## Issue Description
When querying a video and the backend starts streaming events/tokens, if the user switches to a different chat by clicking on it in the sidebar, the streaming response would appear in the new chat. However, after refreshing the page, the query-answer pairs would correctly appear in their respective chats.

## Root Cause
The streaming mechanism was not tracking which chat the stream belonged to. When the user switched chats:
1. The `chatId` parameter changed
2. The UI switched to display the new chat's messages
3. But the ongoing stream's `onStreamComplete` callback still fired and updated the current messages state
4. This caused the streamed response to appear in the wrong chat

The backend correctly saved the Q&A to the original chat, which is why it appeared correctly after refresh.

## Solution Implemented

### 1. **Added Stream Chat Tracking** (`streamingChatIdRef`)
- Created a `useRef` to track which chat ID the current stream belongs to
- This ref is set when a stream starts and cleared when it completes or errors

### 2. **Stream Validation in `onStreamComplete`**
- Modified the `onStreamComplete` callback to check if the stream belongs to the currently active chat
- If the user has switched to a different chat, the UI update is skipped
- The Q&A is still saved to the database for the correct (original) chat

### 3. **Automatic Stream Cancellation on Chat Switch**
- Added a `useEffect` that monitors `chatId` changes
- When the user switches chats, any ongoing stream is automatically cancelled
- This prevents unnecessary backend processing and ensures clean state

### 4. **Updated `handleSendMessage`**
- Sets `streamingChatIdRef.current = chatId` before starting a stream
- This ensures we always know which chat a stream belongs to

## Code Changes

### File: `frontend/src/pages/Dashboard.tsx`

**Key additions:**
1. Import `useRef` from React
2. Added `streamingChatIdRef = useRef<string | null>(null)`
3. Modified `onStreamComplete` to validate stream ownership
4. Added stream cancellation on chat switch
5. Updated `handleSendMessage` to set the streaming chat reference

## Behavior After Fix

### Before:
- User starts query in Chat A → Backend streams
- User switches to Chat B → Stream appears in Chat B ❌
- User refreshes → Q&A appears correctly in Chat A ✓

### After:
- User starts query in Chat A → Backend streams
- User switches to Chat B → Stream is cancelled, no UI update ✓
- Q&A is saved to Chat A in the database ✓
- No refresh needed, everything is in the correct chat ✓

## Testing Recommendations

1. **Happy Path**: Start a query and let it complete normally
2. **Chat Switch During Stream**: Start a query, immediately switch to another chat
3. **Multiple Quick Switches**: Start a query and switch between multiple chats rapidly
4. **Error Handling**: Ensure streams that error still clean up properly

## Technical Notes

- The fix uses React refs to avoid stale closure issues
- Stream cancellation is handled via the AbortController pattern already in `useAgentStream`
- The database save operation still uses the original chat ID, ensuring data integrity
- Console logs are added for debugging stream cancellations
