import Connector from "../mixins/Connector";
import { Version3Client } from "jira.js";
import { extractTextFromProseMirrorJSON } from "../utils/customProseParser";
import { Cache } from "../mixins/Cache";
import { Cache as FileSystemCache } from "file-system-cache";

export class JiraConnector {
  jiraUserEmailKeyName: string = "JIRA_USER_EMAIL";
  jiraHostKeyName: string = "JIRA_HOST";
  jiraApiKeyName: string = "JIRA_API_TOKEN";
  jiraHost: string | undefined;
  jiraEmail: string | undefined;
  id: string = "jira";
  connectorMixin!: Connector;
  cacheMixin!: FileSystemCache;

  constructor() {
    this.connectorMixin = new Connector({
      id: this.id,
      apiKeyName: this.jiraApiKeyName,
    });
    this.cacheMixin = new Cache();
    this.connectorMixin.setAPIKeyFromEnv();
    // Specific to Jira
    this.jiraEmail = process.env[this.jiraUserEmailKeyName];
    this.jiraHost = process.env[this.jiraHostKeyName];
    this.validateConfigurations({
      email: this.jiraEmail,
      host: this.jiraHost,
    });
  }

  async getIssueDetails(
    issue: JiraIssueResponse
  ): Promise<JiraIssueResponseFocussed> {
    // Cache here
    const cachedIssueResponse = await this.cacheMixin.get(issue.key);
    if (cachedIssueResponse) {
      console.log("retrieve from cache");
      return cachedIssueResponse;
    }

    const issueObject: JiraIssueResponseFocussed = {
      id: issue.key,
      summary: issue.fields.summary,
      issueType: issue.fields.issuetype.name,
      description: extractTextFromProseMirrorJSON(
        issue.fields.description as any
      ),
    };

    console.log("fresh get");
    await this.cacheMixin.set(issue.key, issueObject);

    return issueObject;
  }

  async getIssue(id: string): Promise<JiraIssueResponseFocussed> {
    const apiToken: string = this.connectorMixin.apiKeyValue as string;
    const email: string = this.jiraEmail as string;
    const host: string = this.jiraHost as string;

    const client = new Version3Client({
      host,
      authentication: {
        basic: {
          email,
          apiToken,
        },
      },
    });

    return await this.getIssueDetails(
      await client.issues.getIssue({ issueIdOrKey: id })
    );
  }

  validateConfigurations({
    email,
    host,
  }: {
    email: string | undefined;
    host: string | undefined;
  }) {
    if (!email) {
      throw new Error(
        `Please provide an email address for your user, ${this.jiraUserEmailKeyName}`
      );
    }

    if (!host) {
      throw new Error(
        `Please provide an atlassian host such as https://your-org-name.atlassian.com, ${this.jiraHostKeyName}`
      );
    }
  }
}
