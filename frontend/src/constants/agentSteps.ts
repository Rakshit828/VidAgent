/**
 * Centralized mapping of Agent workflow steps to user-friendly messages.
 * Update this mapping as new agent steps are added to the backend.
 */
export const AGENT_STEP_MESSAGES: Record<string, string> = {
    'llm_initial_decision_maker': 'Analyzing your request...',
    'fetch_conversation_history': 'Checking past discussions...',
    'fetch_relevant_context': 'Fetching relevant video content...',
    'final_llm_response': 'Generating response...',
    '__end__': 'Complete',
} as const;

/**
 * Default message for unknown agent steps
 */
export const DEFAULT_AGENT_MESSAGE = 'Processing...';
