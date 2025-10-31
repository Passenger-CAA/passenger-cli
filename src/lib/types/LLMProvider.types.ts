/**
 * Common type for all LLM providers (Gemini, Claude, OpenAI, etc.)
 * This allows any LLM to be used with any issue tracker
 */
export type LLMProvider = {
  /**
   * The unique identifier for this LLM provider
   */
  readonly id: string;

  /**
   * Generate content based on a prompt
   * @param prompt The prompt to send to the LLM
   * @returns The generated text response
   */
  generateContent(prompt: string): Promise<string>;
};
