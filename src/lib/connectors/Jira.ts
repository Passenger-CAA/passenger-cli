import Connector, { IConfigurationValue } from "../mixins/Connector";
import { Cache } from "../mixins/Cache";
import { Cache as FileSystemCache } from "file-system-cache";
import { Version3Client } from "jira.js";
import { extractTextFromProseMirrorJSON } from "../utils/customProseParser";

type RequiredEnvVars = 'JIRA_USER_EMAIL' | 'JIRA_HOST' | 'JIRA_API_TOKEN';

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

  async getIssueDescription(issue: JiraIssueResponse): Promise<JiraIssueResponseFocussed> {
    // Cache here
    const cachedIssueResponse = await this.cacheMixin.get(issue.key);
    if (cachedIssueResponse) {
      console.log("Cached Issue:");
      return cachedIssueResponse;
    }

    const issueObject: JiraIssueResponseFocussed = {
      id: issue.key,
      summary: issue.fields.summary,
      issueType: issue.fields.issuetype.name,
      description: extractTextFromProseMirrorJSON(issue.fields.description as any),
    };

    console.log("New Issue:");
    await this.cacheMixin.set(issue.key, issueObject);

    return issueObject;
  }
}
