import { Connector, IConfigurationValue } from "../mixins/Connector";
import { IssueTracker, NormalizedIssue, TicketAnalysis } from "../types/IssueTracker.types";
import { LLMProvider } from "../types/LLMProvider.types";
import FileSystemCache from "file-system-cache";
import { LinearClient } from "@linear/sdk";

// TODO: Use linear-sdk

export interface LinearIssueResponseFocussed {
  id: string;
  title: string;
  description?: string;
  status: string; // Or the Linear equivalent
}

type RequiredEnvVars = 'apiKey';

export class LinearConnector implements IssueTracker {
  readonly id = "linear";
  connectorMixin: Connector<RequiredEnvVars>;
  cacheMixin: any;
  client!: LinearClient;
  private llmProvider?: LLMProvider;

  constructor(llmProvider?: LLMProvider) {
    this.llmProvider = llmProvider;
    this.connectorMixin = new Connector({ id: "linear" });
    this.cacheMixin = FileSystemCache({
      basePath: "./.cache/linear",
      ttl: 60 * 60 * 24 * 7, // 1 week
    });

    const configurations: Record<RequiredEnvVars, IConfigurationValue> = {
      apiKey: {
        value: process.env.LINEAR_API_KEY,
        error: "Please provide a Linear API key, set LINEAR_API_KEY",
      },
    };

    this.connectorMixin.validateConfigurations(configurations);
    this.connectorMixin.setConfigurations(configurations);

    const apiKey = this.connectorMixin.getConfiguration("apiKey");
    if (!apiKey) {
      throw new Error("Linear API key is not configured. Ensure LINEAR_API_KEY environment variable is set or provide it via configuration.");
    }
    this.client = new LinearClient({ apiKey });
  }

  async getIssue(id: string): Promise<NormalizedIssue> {
    const cachedIssue = await this.cacheMixin.get(id);
    if (cachedIssue) {
      this.connectorMixin.log(`Returning cached issue for ID: ${id}`);
      return cachedIssue;
    }

    this.connectorMixin.log(`Fetching issue from Linear API: ${id}`);
    try {
      const issue = await this.client.issue(id);
      // Ensure issue and issue.status (or equivalent) exist before mapping
      if (!issue || !issue.id) { // Basic check, refine with actual SDK response
        throw new Error(`Issue with ID ${id} not found or invalid response.`);
      }

      // Attempt to get status. Assuming 'state.name' is the correct path.
      // This needs verification with actual Linear SDK response structure.
      const status = (issue as any).state?.name || 'Status unknown';


      const normalizedIssue: NormalizedIssue = {
        id: issue.id,
        title: issue.title,
        description: issue.description || undefined,
        status: status,
      };

      await this.cacheMixin.set(normalizedIssue.id, normalizedIssue);
      return normalizedIssue;
    } catch (error: any) {
      this.connectorMixin.log(`Error fetching issue ${id} from Linear: ${error.message}`);
      throw error; // Re-throw the error to be handled by the caller
    }
  }
}
