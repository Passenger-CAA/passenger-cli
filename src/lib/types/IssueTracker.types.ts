/**
 * Normalized issue structure that all issue trackers must return
 * This provides a consistent interface regardless of the underlying platform
 */
export type NormalizedIssue = {
  /**
   * The unique identifier for the issue (can be number or string)
   */
  id: string | number;

  /**
   * The title/summary of the issue
   */
  title: string;

  /**
   * The detailed description/body of the issue
   */
  description?: string;

  /**
   * The current status of the issue (if available)
   */
  status?: string;

  /**
   * Analysis result from LLM (if ticket analysis was performed)
   */
  analysis?: TicketAnalysis;
};

/**
 * Result of analyzing a ticket with an LLM
 */
export type TicketAnalysis = {
  ticket_id: string | number;
  title: string;
  is_workable: boolean;
  missing_information: string[];
  user_stories: UserStory[];
  acceptance_criteria: string[];
};

/**
 * User story format following "As a, I want, So that" pattern
 */
export type UserStory = {
  as_a: string;
  i_want: string;
  so_that: string;
};

/**
 * Common type for all issue tracker connectors
 * All work trackers (Github, Jira, Linear, Asana, Trello) should implement this
 */
export type IssueTracker = {
  /**
   * The unique identifier for this issue tracker
   */
  readonly id: string;

  /**
   * Fetch an issue/task/card from the tracker
   * @param id The issue identifier (string or number depending on platform)
   * @returns A normalized issue object
   */
  getIssue(id: string | number): Promise<NormalizedIssue>;

  /**
   * Analyze a ticket using the configured LLM provider
   * @param issue The issue data to analyze
   * @returns The analysis result
   */
  analyzeTicket?(issue: any): Promise<TicketAnalysis>;
};
