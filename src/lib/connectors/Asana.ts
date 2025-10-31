import { Connector, IConfigurationValue } from "../mixins/Connector";
import { IssueTracker, NormalizedIssue, TicketAnalysis } from "../types/IssueTracker.types";
import { LLMProvider } from "../types/LLMProvider.types";
import FileSystemCache from "file-system-cache";
import * as Asana from 'asana'; // Import Asana client

// Define the structure for a focused Asana task response
export interface AsanaTaskResponseFocussed {
  id: string;         // from Asana's gid
  name: string;       // from Asana's name (title/summary)
  description: string; // from Asana's notes
  status: string;     // derived from completed, assignee_status
}

type RequiredEnvVars = 'personalAccessToken';

const ASANA_PERSONAL_ACCESS_TOKEN = process.env.ASANA_PERSONAL_ACCESS_TOKEN;

export class AsanaConnector implements IssueTracker {
  readonly id = "asana";
  connectorMixin: Connector<RequiredEnvVars>;
  cacheMixin: any;
  client!: Asana.Client;
  private llmProvider?: LLMProvider;

  constructor(llmProvider?: LLMProvider) {
    this.llmProvider = llmProvider;
    this.connectorMixin = new Connector({ id: "asana" });
    this.cacheMixin = FileSystemCache({
      basePath: "./.cache/asana",
      ttl: 60 * 60 * 24 * 7, // 1 week
    });

    const configurations: Record<RequiredEnvVars, IConfigurationValue> = {
      personalAccessToken: {
        value: ASANA_PERSONAL_ACCESS_TOKEN,
        error: "Please provide an Asana Personal Access Token, set ASANA_PERSONAL_ACCESS_TOKEN",
      },
    };

    this.connectorMixin.validateConfigurations(configurations);
    this.connectorMixin.setConfigurations(configurations);

    const token = this.connectorMixin.getConfiguration("personalAccessToken");
    if (!token) {
      throw new Error("Asana Personal Access Token is not configured. Ensure ASANA_PERSONAL_ACCESS_TOKEN environment variable is set.");
    }
    this.client = Asana.Client.create().useAccessToken(token);
  }

  private _mapAsanaTaskToNormalizedResponse(task: Asana.resources.Tasks.Type): NormalizedIssue {
    let status = "Unknown";
    if (task.completed) {
      status = "Completed";
    } else if (task.assignee_status === "today") {
      status = "Today";
    } else if (task.assignee_status === "upcoming") {
      status = "Upcoming";
    } else if (task.assignee_status === "later") {
      status = "Later";
    } else {
      status = "Open"; // Default if not completed and no specific assignee_status
    }

    return {
      id: task.gid,
      title: task.name || "Untitled Task",
      description: task.notes || undefined,
      status: status,
    };
  }

  // Renamed from getTask to getIssue for consistency
  async getIssue(taskId: string | number): Promise<NormalizedIssue> {
    const id = String(taskId);
    const cachedTask = await this.cacheMixin.get(id);
    if (cachedTask) {
      this.connectorMixin.log(`Returning cached Asana task for ID: ${id}`);
      return cachedTask;
    }

    this.connectorMixin.log(`Fetching task from Asana API: ${id}`);
    try {
      // Explicitly request needed fields. Add/remove fields as necessary.
      const task = await this.client.tasks.getTask(id, { opt_fields: "gid,name,notes,completed,assignee_status" });

      if (!task || !task.gid) {
        throw new Error(`Task with ID ${id} not found or invalid response from Asana.`);
      }

      const normalizedIssue = this._mapAsanaTaskToNormalizedResponse(task);

      await this.cacheMixin.set(normalizedIssue.id, normalizedIssue);
      return normalizedIssue;
    } catch (error: any) {
      this.connectorMixin.log(`Error fetching task ${id} from Asana: ${error.message}`);
      // Check if the error is an Asana specific error object
      if (error.value && error.value.errors) {
        this.connectorMixin.log(`Asana API Errors: ${JSON.stringify(error.value.errors)}`);
      }
      throw error; // Re-throw the error to be handled by the caller
    }
  }
}
