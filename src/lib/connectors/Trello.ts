import { Connector, IConfigurationValue } from "../mixins/Connector";
import { IssueTracker, NormalizedIssue, TicketAnalysis } from "../types/IssueTracker.types";
import { LLMProvider } from "../types/LLMProvider.types";
import FileSystemCache from "file-system-cache";
import TrelloNodeAPI from 'trello-node-api'; // Import Trello client

// Define the structure for a focused Trello card response
export interface TrelloCardResponseFocussed {
  id: string;
  name: string;       // Card name (title/summary)
  description: string; // Card description (desc)
  listName: string;   // Name of the list the card is in (status)
}

type RequiredEnvVars = 'apiKey' | 'userToken';

const TRELLO_API_KEY = process.env.TRELLO_API_KEY;
const TRELLO_USER_TOKEN = process.env.TRELLO_USER_TOKEN;

export class TrelloConnector implements IssueTracker {
  readonly id = "trello";
  connectorMixin: Connector<RequiredEnvVars>;
  cacheMixin: any;
  trello!: TrelloNodeAPI; // Type from trello-node-api
  private llmProvider?: LLMProvider;

  constructor(llmProvider?: LLMProvider) {
    this.llmProvider = llmProvider;
    this.connectorMixin = new Connector({ id: "trello" });
    this.cacheMixin = FileSystemCache({
      basePath: "./.cache/trello",
      ttl: 60 * 60 * 24 * 7, // 1 week
    });

    const configurations: Record<RequiredEnvVars, IConfigurationValue> = {
      apiKey: {
        value: TRELLO_API_KEY,
        error: "Please provide a Trello API key, set TRELLO_API_KEY",
      },
      userToken: {
        value: TRELLO_USER_TOKEN,
        error: "Please provide a Trello user token, set TRELLO_USER_TOKEN",
      },
    };

    this.connectorMixin.validateConfigurations(configurations);
    this.connectorMixin.setConfigurations(configurations);

    const apiKey = this.connectorMixin.getConfiguration("apiKey");
    const userToken = this.connectorMixin.getConfiguration("userToken");

    if (!apiKey || !userToken) {
      throw new Error("Trello API Key or User Token is not configured. Ensure TRELLO_API_KEY and TRELLO_USER_TOKEN environment variables are set.");
    }
    this.trello = new TrelloNodeAPI(apiKey, userToken);
  }

  // Helper to map raw Trello card data (and its list name) to NormalizedIssue
  private _mapTrelloCardToNormalizedResponse(card: any, listName: string): NormalizedIssue {
    return {
      id: card.id,
      title: card.name || "Untitled Card",
      description: card.desc || undefined,
      status: listName,
    };
  }

  // Renamed from getCard to getIssue for consistency
  async getIssue(cardId: string | number): Promise<NormalizedIssue> {
    const id = String(cardId);
    const cachedCard = await this.cacheMixin.get(id);
    if (cachedCard) {
      this.connectorMixin.log(`Returning cached Trello card for ID: ${id}`);
      return cachedCard;
    }

    this.connectorMixin.log(`Fetching card from Trello API: ${id}`);
    try {
      const card = await (this.trello as any).card.get(id);
      if (!card || !card.id) {
        throw new Error(`Card with ID ${id} not found or invalid response from Trello.`);
      }
      if (!card.idList) {
        throw new Error(`Card with ID ${id} does not have an associated list (idList is missing).`);
      }

      // Fetch the list to get its name (which we use as status)
      const list = await (this.trello as any).list.get(card.idList);
      if (!list || !list.name) {
        throw new Error(`List with ID ${card.idList} for card ${id} not found or has no name.`);
      }

      const normalizedIssue = this._mapTrelloCardToNormalizedResponse(card, list.name);

      await this.cacheMixin.set(normalizedIssue.id, normalizedIssue);
      return normalizedIssue;
    } catch (error: any) {
      this.connectorMixin.log(`Error fetching card ${id} from Trello: ${error.message}`);
      // trello-node-api might return errors in a specific format, e.g. error.message or error.response.data
      // For now, logging error.message is a good start.
      if (error.response && error.response.data) {
         this.connectorMixin.log(`Trello API Error details: ${JSON.stringify(error.response.data)}`);
      }
      throw error; // Re-throw the error
    }
  }
}
