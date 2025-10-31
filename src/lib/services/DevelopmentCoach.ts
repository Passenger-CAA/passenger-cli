import { LLMProvider } from '../types/LLMProvider.types';
import { NormalizedIssue, TicketAnalysis } from '../types/IssueTracker.types';
import { GitChange } from './GitWatcher';

export type CoachFeedback = {
  message: string;
  timestamp: Date;
  changeType: 'commit' | 'change';
};

/**
 * DevelopmentCoach provides BDD-focused feedback on code changes
 * Passenger keeps you focused on the requirements as your north star
 */
export class DevelopmentCoach {
  private llmProvider: LLMProvider;
  private issue: NormalizedIssue;
  private conversationHistory: CoachFeedback[] = [];

  constructor(llmProvider: LLMProvider, issue: NormalizedIssue) {
    this.llmProvider = llmProvider;
    this.issue = issue;
  }

  /**
   * Analyze a code change and provide feedback
   */
  async provideFeedback(change: GitChange, type: 'commit' | 'change'): Promise<CoachFeedback> {
    const prompt = this.buildPrompt(change, type);
    const response = await this.llmProvider.generateContent(prompt);

    const feedback: CoachFeedback = {
      message: response,
      timestamp: change.timestamp,
      changeType: type,
    };

    this.conversationHistory.push(feedback);
    return feedback;
  }

  /**
   * Build the prompt for the LLM
   * This is where the "BDD on steroids" magic happens
   */
  private buildPrompt(change: GitChange, type: 'commit' | 'change'): string {
    const hasAnalysis = this.issue.analysis;
    const acceptanceCriteria = hasAnalysis?.acceptance_criteria || [];
    const userStories = hasAnalysis?.user_stories || [];
    const missingInfo = hasAnalysis?.missing_information || [];

    // Build context about previous feedback
    const recentFeedback = this.conversationHistory.slice(-2);
    const historyContext = recentFeedback.length > 0
      ? `\n\n**Recent Conversation:**\n${recentFeedback.map(f => `- ${f.message.substring(0, 150)}...`).join('\n')}`
      : '';

    const changeTypeText = type === 'commit'
      ? `committed these changes${change.message ? ` with message: "${change.message}"` : ''}`
      : 'made these changes (not yet committed)';

    return `You are Passenger Pigeon, a wise carrier pigeon delivering guidance on Behavior-Driven Development (BDD).
Your role is to keep the developer focused on the actual requirements while they code - like a pigeon that always finds its way home to the requirements.

**THE NORTH STAR (Always keep this in mind):**
Issue #${this.issue.id}: ${this.issue.title}
${this.issue.description ? `\nDescription: ${this.issue.description}` : ''}
${this.issue.status ? `\nStatus: ${this.issue.status}` : ''}

${acceptanceCriteria.length > 0 ? `\n**Acceptance Criteria:**
${acceptanceCriteria.map((c, i) => `${i + 1}. ${c}`).join('\n')}` : ''}

${userStories.length > 0 ? `\n**User Stories:**
${userStories.map((s, i) => `${i + 1}. As a ${s.as_a}, I want ${s.i_want}, so that ${s.so_that}`).join('\n')}` : ''}

${missingInfo.length > 0 ? `\n**⚠️ Known Issues with Ticket:**
${missingInfo.map((m, i) => `${i + 1}. ${m}`).join('\n')}` : ''}
${historyContext}

---

**The developer just ${changeTypeText}:**

**Changed files:**
${change.files.map(f => `- ${f}`).join('\n')}

**Diff:**
\`\`\`diff
${change.diff.substring(0, 4000)}${change.diff.length > 4000 ? '\n... (truncated)' : ''}
\`\`\`

---

**Your Task:**
Provide brief, conversational feedback (2-4 sentences) like a wise pigeon cooing guidance:

1. **Does this change move toward the goal?** Comment on alignment with the issue requirements
2. **Spot any concerns?** Point out potential issues, edge cases, or missed requirements (but don't be a bird brain about it!)
3. **What's next?** Gently remind about remaining acceptance criteria if relevant

**Style:**
- Keep it conversational and friendly (you're Passenger Pigeon, not a critic)
- Be specific about the code you're commenting on
- Don't repeat yourself from previous feedback
- If it looks good, say so! Positive reinforcement matters (maybe a cheerful coo!)
- Focus on BDD: behavior, requirements, and outcomes - not code style
- Subtle pigeon humor is welcome but don't overdo it (you're here to help, not just be silly)

**Format:**
Just write the feedback directly - no preamble, no "Here's my feedback:", just the message.
`;
  }

  /**
   * Get a summary of the development session
   */
  getSummary(): string {
    const totalChanges = this.conversationHistory.length;
    const commits = this.conversationHistory.filter(f => f.changeType === 'commit').length;
    const changes = this.conversationHistory.filter(f => f.changeType === 'change').length;

    return `
🐦 Flight Summary for Issue #${this.issue.id}

Total messages delivered: ${totalChanges}
- Commits spotted: ${commits}
- Changes spotted: ${changes}

This pigeon is heading back to the nest. Keep coding! 🪺
`;
  }

  /**
   * Get the conversation history
   */
  getHistory(): CoachFeedback[] {
    return [...this.conversationHistory];
  }
}
