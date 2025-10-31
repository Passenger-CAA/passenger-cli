import { Connector, IConfigurationValue } from "../mixins/Connector";
import { IssueTracker, NormalizedIssue, TicketAnalysis } from "../types/IssueTracker.types";
import { LLMProvider } from "../types/LLMProvider.types";
import { Version3Client } from "jira.js";
import { Cache as FileSystemCache } from "file-system-cache";
import { Cache } from "../mixins/Cache";
import { extractTextFromProseMirrorJSON } from "../utils/customProseParser";
import { JiraIssueResponse, JiraIssueResponseFocussed, JiraIssueSearchResponseFocussed } from "../../types/issueResponse";

type RequiredEnvVars = 'JIRA_USER_EMAIL' | 'JIRA_HOST' | 'JIRA_API_TOKEN';

export class JiraConnector implements IssueTracker {
    // ... other properties ...
    readonly id = "jira";
    connectorMixin!: Connector<RequiredEnvVars>;
  cacheMixin!: FileSystemCache;
  client!: Version3Client;
  private llmProvider?: LLMProvider;

  constructor(llmProvider?: LLMProvider) {
    this.llmProvider = llmProvider;
    this.connectorMixin = new Connector({
      id: "jira"
    });
    this.cacheMixin = new Cache();

    const configurations: Record<RequiredEnvVars, IConfigurationValue> = {
      JIRA_USER_EMAIL: {
        value: process.env.JIRA_USER_EMAIL,
        error: "Please provide an email address for your Jira user, set JIRA_USER_EMAIL",
      },
      JIRA_HOST: {
        value: process.env.JIRA_HOST,
        error: "Please provide a Jira host, set JIRA_HOST",
      },
      JIRA_API_TOKEN: {
        value: process.env.JIRA_API_TOKEN,
        error: "Please provide a Jira API token, set JIRA_API_TOKEN",
      },
    };

    this.connectorMixin.validateConfigurations(configurations);
    this.connectorMixin.setConfigurations(configurations);

    const host = this.connectorMixin.getConfiguration('JIRA_HOST');
    const email = this.connectorMixin.getConfiguration('JIRA_USER_EMAIL');
    const apiToken = this.connectorMixin.getConfiguration('JIRA_API_TOKEN');

    this.client = new Version3Client({
      host,
      authentication: {
        basic: {
          email,
          apiToken,
        },
      },
    });
  }

  async getIssue(id: string): Promise<NormalizedIssue> {
    try {
      const issue = await this.client.issues.getIssue({ issueIdOrKey: id });
      return this.getIssueDescription(issue as any);
    } catch (error: any) {
      this.connectorMixin.log(`Error fetching issue from Jira: ${error.message}`);
      throw error;
    }
  }

  private _mapIssueToNormalizedResponse(issue: JiraIssueResponse): NormalizedIssue {
    const status = issue.fields.status ? issue.fields.status.name : "Status Unknown";
    return {
      id: issue.key,
      title: issue.fields.summary,
      description: extractTextFromProseMirrorJSON(issue.fields.description as any),
      status: status,
    };
  }

  async getIssueDescription(issue: JiraIssueResponse): Promise<NormalizedIssue> {
    // Cache here
    const cachedIssueResponse = await this.cacheMixin.get(issue.key);
    if (cachedIssueResponse) {
      this.connectorMixin.log(`Returning cached issue for ${issue.key}`);
      return cachedIssueResponse;
    }

    this.connectorMixin.log(`Mapping and caching new issue ${issue.key}`);
    const normalizedIssue = this._mapIssueToNormalizedResponse(issue);

    await this.cacheMixin.set(issue.key, normalizedIssue);
    return normalizedIssue;
  }

  async searchIssues(jql: string): Promise<NormalizedIssue[]> {
    this.connectorMixin.log(`Searching issues with JQL: ${jql}`);
    try {
      const searchResults = await this.client.issueSearch.searchForIssuesUsingJqlPost({
        jql: jql,
        fields: ["summary", "description", "issuetype", "status"], // Requesting status as well
      });

      if (!searchResults || !searchResults.issues || searchResults.issues.length === 0) {
        this.connectorMixin.log("No issues found for the given JQL.");
        return [];
      }

      const focussedIssues: NormalizedIssue[] = [];
      for (const issueData of searchResults.issues) {
        // The 'issueData' from search results might not perfectly match 'JiraIssueResponse'
        // It's common for search results to have a slightly different or subset structure.
        // We need to ensure that the object passed to getIssueDescription is compatible.
        // For now, we'll cast to 'any'. A more robust solution would be to map
        // searchResult.issue to JiraIssueResponse structure or have a dedicated mapping function.

        // TODO: Refactor to avoid calling getIssueDescription if all fields are present
        // in searchResults.issues. This would involve a direct mapping from issueData
        // to JiraIssueResponseFocussed and then caching that.

        if (!issueData.key) {
            this.connectorMixin.log(`Skipping issue with missing key in search results: ${JSON.stringify(issueData)}`);
            continue;
        }

        try {
          // Assuming getIssueDescription can correctly process the issueData from search if it has key and fields.
          // If getIssueDescription expects a very specific structure not present in search results,
          // this will need adjustment, or we map directly here.
          const detailedIssue = await this.getIssueDescription(issueData as any);
          focussedIssues.push(detailedIssue);
        } catch (error: any) {
          this.connectorMixin.log(`Error processing issue ${issueData.key} from search results: ${error.message}`);
          // Optionally, continue to process other issues
        }
      }
      return focussedIssues;
    } catch (error: any) {
      this.connectorMixin.log(`Error searching issues with JQL "${jql}": ${error.message}`);
      throw error;
    }
  }
}
