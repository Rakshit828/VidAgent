/**
 * Centralized mapping of Agent workflow steps to user-friendly messages.
 * Update this mapping as new agent steps are added to the backend.
 */
export const AGENT_STEP_MESSAGES: Record<string, string> = {
    'retrieve_conversation': 'Searching through past discussions...',
    'retrieve_context': 'Fetching Content From Video',
    'final_llm_response': 'Generating Answer...',
    '__end__': 'Complete',
} as const;

/**
 * Default message for unknown agent steps
 */
export const DEFAULT_AGENT_MESSAGE = 'Processing...';
