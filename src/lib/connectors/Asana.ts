import { Connector, ConnectorConfig } from "../mixins/Connector";
import { Cache } from "../mixins/Cache";
import FileSystemCache from "file-system-cache";
import * as Asana from 'asana'; // Import Asana client

// Define the structure for a focused Asana task response
export interface AsanaTaskResponseFocussed {
  id: string;         // from Asana's gid
  name: string;       // from Asana's name (title/summary)
  description: string; // from Asana's notes
  status: string;     // derived from completed, assignee_status
}

const ASANA_PERSONAL_ACCESS_TOKEN = process.env.ASANA_PERSONAL_ACCESS_TOKEN;

export class AsanaConnector {
  id = "asana";
  connectorMixin: Connector;
  cacheMixin: Cache<AsanaTaskResponseFocussed>;
  client!: Asana.Client;

  constructor() {
    this.connectorMixin = new Connector({ id: this.id });
    this.cacheMixin = new Cache<AsanaTaskResponseFocussed>(
      new FileSystemCache({
        basePath: "./.cache/asana",
        ttl: 60 * 60 * 24 * 7, // 1 week
      }),
      this.connectorMixin
    );

    const configurations = {
      personalAccessToken: ASANA_PERSONAL_ACCESS_TOKEN,
    };

    this.connectorMixin.validateConfigurations(configurations, ["personalAccessToken"]);
    this.connectorMixin.setConfigurations(configurations);

    const token = this.connectorMixin.getConfiguration("personalAccessToken");
    if (!token) {
      throw new Error("Asana Personal Access Token is not configured. Ensure ASANA_PERSONAL_ACCESS_TOKEN environment variable is set.");
    }
    this.client = Asana.Client.create().useAccessToken(token);
  }

  private _mapAsanaTaskToFocussedResponse(task: Asana.resources.Tasks.Type): AsanaTaskResponseFocussed {
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
      name: task.name || "Untitled Task",
      description: task.notes || "",
      status: status,
    };
  }

  async getTask(taskId: string): Promise<AsanaTaskResponseFocussed> {
    const cachedTask = await this.cacheMixin.get(taskId);
    if (cachedTask) {
      this.connectorMixin.log(`Returning cached Asana task for ID: ${taskId}`);
      return cachedTask;
    }

    this.connectorMixin.log(`Fetching task from Asana API: ${taskId}`);
    try {
      // Explicitly request needed fields. Add/remove fields as necessary.
      const task = await this.client.tasks.getTask(taskId, { opt_fields: "gid,name,notes,completed,assignee_status" });

      if (!task || !task.gid) {
        throw new Error(`Task with ID ${taskId} not found or invalid response from Asana.`);
      }

      const taskObject = this._mapAsanaTaskToFocussedResponse(task);

      await this.cacheMixin.set(taskObject.id, taskObject);
      return taskObject;
    } catch (error: any) {
      this.connectorMixin.error(`Error fetching task ${taskId} from Asana: ${error.message}`);
      // Check if the error is an Asana specific error object
      if (error.value && error.value.errors) {
        this.connectorMixin.error(`Asana API Errors: ${JSON.stringify(error.value.errors)}`);
      }
      throw error; // Re-throw the error to be handled by the caller
    }
  }
}
