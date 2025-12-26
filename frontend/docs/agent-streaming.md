# Agent Streaming Architecture

## Overview
This document describes the production-ready Server-Sent Events (SSE) streaming implementation for the ChatTube AI Agent.

## Architecture

### 1. Centralized Constants (`src/constants/agentSteps.ts`)
- **Purpose**: Single source of truth for agent workflow step messages
- **Maintainability**: Update messages in one place as new agent steps are added
- **Type Safety**: Provides TypeScript const assertions for better IDE support

```typescript
export const AGENT_STEP_MESSAGES = {
    'retrieve_conversation': 'Searching through past discussions...',
    'retrieve_context': 'Fetching Content From Video',
    'final_llm_response': 'Generating Answer...',
} as const;
```

### 2. Custom Hook (`src/hooks/useAgentStream.ts`)
**Separation of Concerns**: Business logic is completely isolated from UI components

**Key Features**:
- ✅ **Abort Support**: Proper cleanup with AbortController
- ✅ **Error Handling**: Comprehensive error catching with optional callbacks
- ✅ **Buffer Management**: Handles incomplete SSE chunks correctly
- ✅ **Type Safety**: Full TypeScript support with documented interfaces
- ✅ **Real-time Updates**: Token-by-token streaming with live status updates
- ✅ **Memory Safety**: Automatic cleanup on unmount

**Return Values**:
```typescript
{
    isStreaming: boolean        // True while agent is processing
    agentStatus: string         // Internal step name (e.g., 'retrieve_context')
    statusMessage: string       // User-friendly message (e.g., 'Fetching Content From Video')
    startStream: Function       // Initiates the streaming request
    cancelStream: Function      // Aborts ongoing stream
}
```

### 3. SSE Event Format
The backend streams two event types:

**Agent Step Event**:
```
event: agent_step
data: {"name":"retrieve_context"}
```

**Token Event**:
```
event: token
data: {"text":"The "}
```

### 4. Component Integration

**Dashboard.tsx**:
- Uses `useAgentStream` hook for streaming logic
- Manages message state and UI updates
- Handles stream lifecycle (start, complete, error)
- Cleans up streams on chat change or unmount

**ChatArea.tsx**:
- Displays streaming status with animated indicator
- Renders markdown responses using `react-markdown` + `remark-gfm`
- Shows user-friendly agent step messages
- Disables input during streaming

## Data Flow

```
User Input
    ↓
Dashboard.handleSendMessage()
    ↓
useAgentStream.startStream()
    ↓
POST /api/v1/chats/agent/{chat_id}
    ↓
[SSE Stream Events]
    ├─ agent_step → Update statusMessage
    └─ token → Accumulate markdown content
    ↓
onStreamComplete()
    ↓
Update messages state
    ↓
ChatArea renders with ReactMarkdown
```

## Error Handling

### 1. **Token Expiration (401)**
When an access token expires during streaming:
- Hook automatically calls `/auth/refresh` endpoint
- Retrieves new access token via cookie
- Silently retries the original stream request
- Maximum 1 retry attempt to prevent loops
- User experiences no interruption

**Flow**:
```
Stream Request → 401 Error
    ↓
Detect expired token
    ↓
Call /auth/refresh (silent)
    ↓
New access_token cookie set
    ↓
Retry stream with same query/videoId
    ↓
Stream continues normally
```

### 2. **Network Errors**
Caught and passed to `onError` callback with user toast notification

### 3. **Abort Errors**
Silently ignored (user-initiated cancellation)

### 4. **Parse Errors**
Logged to console with fallback to raw string interpretation

### 5. **Stream Failures**
Toast notification displays friendly error message to user

### 6. **Refresh Failures**
If token refresh fails:
- Error: "Session expired. Please log in again."
- User redirected to login (handled by global error handler)

## Performance Considerations

1. **Debouncing**: Messages updated in real-time without throttling
2. **Memory**: AbortController properly cleaned up
3. **Re-renders**: Optimized with useCallback and proper dependencies
4. **Caching**: Previous chat messages cached via TanStack Query

## Production Checklist

- ✅ Error boundaries implemented
- ✅ Proper TypeScript typing
- ✅ Memory leak prevention (cleanup functions)
- ✅ User feedback (loading states, error toasts)
- ✅ Graceful degradation
- ✅ Cookie-based authentication included
- ✅ CORS credentials enabled

## Future Enhancements

1. **Retry Logic**: Auto-retry on network failures
2. **Token Streaming Visualization**: Character-by-character typing effect
3. **Stream Metrics**: Track response time, token count
4. **Offline Support**: Queue messages when offline
5. **Stream Resume**: Continue from last token on disconnect

## Testing

### Manual Testing Checklist:
- [ ] Stream starts on message send
- [ ] Agent steps display correct messages
- [ ] Markdown renders properly
- [ ] Stream cancels on chat change
- [ ] Error toast shows on failure
- [ ] Input disabled during streaming
- [ ] Cleanup on unmount works

### Edge Cases to Test:
- [ ] Very long responses (>10k tokens)
- [ ] Rapid chat switching
- [ ] Network interruption mid-stream
- [ ] Invalid video ID
- [ ] Session expiration during stream
