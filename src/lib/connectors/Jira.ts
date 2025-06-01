import Connector, { IConfigurationValue } from "../mixins/Connector";
import { Cache } from "../mixins/Cache";
import { Cache as FileSystemCache } from "file-system-cache";
import { Version3Client } from "jira.js";
import { extractTextFromProseMirrorJSON } from "../utils/customProseParser";

type RequiredEnvVars = 'JIRA_USER_EMAIL' | 'JIRA_HOST' | 'JIRA_API_TOKEN';

// Define the structure for a focused issue response
export interface JiraIssueResponseFocussed {
  id: string;
  summary: string;
  issueType: string;
  description: string;
  // Add status if it's available and needed.
  // status: string;
}

// Define the structure for the search response
export type JiraIssueSearchResponseFocussed = JiraIssueResponseFocussed[];

// Define a basic structure for what we expect from Jira's issue object (used in getIssueDescription)
// This helps in typing and understanding the structure.
export interface JiraIssueResponse {
  key: string;
  fields: {
    summary: string;
    issuetype: {
      name: string;
    };
    description: any; // Keeping as 'any' due to complex structure, handled by extractTextFromProseMirrorJSON
    // Add status field if it exists in the Jira API response, e.g.,
    // status: { name: string; };
  };
}

export class JiraConnector {
  id: string = "jira";
  connectorMixin!: Connector<RequiredEnvVars>;
  cacheMixin!: FileSystemCache;
  client!: Version3Client;

  constructor() {
    this.connectorMixin = new Connector({
      id: this.id
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

  async getIssue(id: string): Promise<JiraIssueResponseFocussed> {
    try {
      const issue = await this.client.issues.getIssue({ issueIdOrKey: id });
      return this.getIssueDescription(issue as any);
    } catch (error) {
      console.error('Error fetching issue from Jira:', error);
      throw error;
    }
  }

  private _mapIssueToFocussedResponse(issue: JiraIssueResponse): JiraIssueResponseFocussed {
    // TODO: Add status mapping if issue.fields.status is available and needed
    // const status = issue.fields.status ? issue.fields.status.name : "Status Unknown";
    return {
      id: issue.key,
      summary: issue.fields.summary,
      issueType: issue.fields.issuetype.name,
      description: extractTextFromProseMirrorJSON(issue.fields.description as any),
      // status: status,
    };
  }

  async getIssueDescription(issue: JiraIssueResponse): Promise<JiraIssueResponseFocussed> {
    // Cache here
    const cachedIssueResponse = await this.cacheMixin.get(issue.key);
    if (cachedIssueResponse) {
      this.connectorMixin.log(`Returning cached issue for ${issue.key}`);
      return cachedIssueResponse;
    }

    this.connectorMixin.log(`Mapping and caching new issue ${issue.key}`);
    const issueObject = this._mapIssueToFocussedResponse(issue);

    await this.cacheMixin.set(issue.key, issueObject);
    return issueObject;
  }

  async searchIssues(jql: string): Promise<JiraIssueSearchResponseFocussed> {
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

      const focussedIssues: JiraIssueSearchResponseFocussed = [];
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
            this.connectorMixin.warn(`Skipping issue with missing key in search results: ${JSON.stringify(issueData)}`);
            continue;
        }

        try {
          // Assuming getIssueDescription can correctly process the issueData from search if it has key and fields.
          // If getIssueDescription expects a very specific structure not present in search results,
          // this will need adjustment, or we map directly here.
          const detailedIssue = await this.getIssueDescription(issueData as any);
          focussedIssues.push(detailedIssue);
        } catch (error: any) {
          this.connectorMixin.error(`Error processing issue ${issueData.key} from search results: ${error.message}`);
          // Optionally, continue to process other issues
        }
      }
      return focussedIssues;
    } catch (error: any) {
      this.connectorMixin.error(`Error searching issues with JQL "${jql}": ${error.message}`);
      throw error;
    }
  }
}
