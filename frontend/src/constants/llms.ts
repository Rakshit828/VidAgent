/**
 * Supported LLM models for the agent.
 */
export const SUPPORTED_LLMS: Record<string, string> = {
    "openai/gpt-oss-120b": "GPT-OSS-120B",
    "openai/gpt-oss-20b": "GPT-OSS-20B",
    "meta-llama/llama-4-scout-17b-16e-instruct": "Llama-4 Scout 17B 16E Instruct",
    "qwen/qwen3-32b": "Qwen-3 32B",
    "llama-3.1-8b-instant": "Llama-3.1 8B Instant",
    "llama-3.3-70b-versatile": "Llama-3.3 70B Versatile",
    "moonshotai/kimi-k2-instruct-0905": "Kimi K2 Instruct 0905"
} as const;

/**
 * Default LLM to use if none is selected.
 */
export const DEFAULT_LLM = 'openai/gpt-oss-120b';
