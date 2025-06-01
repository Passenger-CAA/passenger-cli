import { Connector, ConnectorConfig } from "../mixins/Connector";
import { Cache } from "../mixins/Cache";
import FileSystemCache from "file-system-cache";
import { LinearClient } from "@linear/sdk";

// TODO: Use linear-sdk

export interface LinearIssueResponseFocussed {
  id: string;
  title: string;
  description?: string;
  status: string; // Or the Linear equivalent
}

export class LinearConnector {
  id = "linear";
  connectorMixin: Connector;
  cacheMixin: Cache<LinearIssueResponseFocussed>;
  client!: LinearClient;

  constructor() {
    this.connectorMixin = new Connector({ id: this.id });
    this.cacheMixin = new Cache<LinearIssueResponseFocussed>(
      new FileSystemCache({
        basePath: "./.cache/linear",
        ttl: 60 * 60 * 24 * 7, // 1 week
      }),
      this.connectorMixin
    );

    // Initialize LinearClient
    const apiKey = this.connectorMixin.getConfiguration("apiKey") || process.env.LINEAR_API_KEY;
    if (!apiKey) {
      // Try to set it from environment if not already set by validate/setConfigurations
      // This part might need better handling depending on how configurations are expected to be set.
      // For now, we assume it should be available via getConfiguration or process.env
      throw new Error("Linear API key is not configured. Ensure LINEAR_API_KEY environment variable is set or provide it via configuration.");
    }
     // Ensure configurations are set for the connector mixin if needed elsewhere.
    this.connectorMixin.setConfigurations({ apiKey });
    this.client = new LinearClient({ apiKey });
  }

  async getIssue(id: string): Promise<LinearIssueResponseFocussed> {
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


      const issueObject: LinearIssueResponseFocussed = {
        id: issue.id,
        title: issue.title,
        description: issue.description || "", // Assuming description can be undefined
        status: status,
      };

      await this.cacheMixin.set(issueObject.id, issueObject);
      return issueObject;
    } catch (error: any) {
      this.connectorMixin.error(`Error fetching issue ${id} from Linear: ${error.message}`);
      throw error; // Re-throw the error to be handled by the caller
    }
  }
}
