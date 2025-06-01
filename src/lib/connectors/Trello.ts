import { Connector, ConnectorConfig } from "../mixins/Connector";
import { Cache } from "../mixins/Cache";
import FileSystemCache from "file-system-cache";
import TrelloNodeAPI from 'trello-node-api'; // Import Trello client

// Define the structure for a focused Trello card response
export interface TrelloCardResponseFocussed {
  id: string;
  name: string;       // Card name (title/summary)
  description: string; // Card description (desc)
  listName: string;   // Name of the list the card is in (status)
}

const TRELLO_API_KEY = process.env.TRELLO_API_KEY;
const TRELLO_USER_TOKEN = process.env.TRELLO_USER_TOKEN;

export class TrelloConnector {
  id = "trello";
  connectorMixin: Connector;
  cacheMixin: Cache<TrelloCardResponseFocussed>;
  trello!: TrelloNodeAPI; // Type from trello-node-api

  constructor() {
    this.connectorMixin = new Connector({ id: this.id });
    this.cacheMixin = new Cache<TrelloCardResponseFocussed>(
      new FileSystemCache({
        basePath: "./.cache/trello",
        ttl: 60 * 60 * 24 * 7, // 1 week
      }),
      this.connectorMixin
    );

    const configurations = {
      apiKey: TRELLO_API_KEY,
      userToken: TRELLO_USER_TOKEN,
    };

    this.connectorMixin.validateConfigurations(configurations, ["apiKey", "userToken"]);
    this.connectorMixin.setConfigurations(configurations);

    const apiKey = this.connectorMixin.getConfiguration("apiKey");
    const userToken = this.connectorMixin.getConfiguration("userToken");

    if (!apiKey || !userToken) {
      throw new Error("Trello API Key or User Token is not configured. Ensure TRELLO_API_KEY and TRELLO_USER_TOKEN environment variables are set.");
    }
    this.trello = new TrelloNodeAPI(apiKey, userToken);
  }

  // Helper to map raw Trello card data (and its list name) to TrelloCardResponseFocussed
  private _mapTrelloCardToFocussedResponse(card: any, listName: string): TrelloCardResponseFocussed {
    return {
      id: card.id,
      name: card.name || "Untitled Card",
      description: card.desc || "",
      listName: listName,
    };
  }

  async getCard(cardId: string): Promise<TrelloCardResponseFocussed> {
    const cachedCard = await this.cacheMixin.get(cardId);
    if (cachedCard) {
      this.connectorMixin.log(`Returning cached Trello card for ID: ${cardId}`);
      return cachedCard;
    }

    this.connectorMixin.log(`Fetching card from Trello API: ${cardId}`);
    try {
      const card = await this.trello.card.get(cardId);
      if (!card || !card.id) {
        throw new Error(`Card with ID ${cardId} not found or invalid response from Trello.`);
      }
      if (!card.idList) {
        throw new Error(`Card with ID ${cardId} does not have an associated list (idList is missing).`);
      }

      // Fetch the list to get its name (which we use as status)
      const list = await this.trello.list.get(card.idList);
      if (!list || !list.name) {
        throw new Error(`List with ID ${card.idList} for card ${cardId} not found or has no name.`);
      }

      const cardObject = this._mapTrelloCardToFocussedResponse(card, list.name);

      await this.cacheMixin.set(cardObject.id, cardObject);
      return cardObject;
    } catch (error: any) {
      this.connectorMixin.error(`Error fetching card ${cardId} from Trello: ${error.message}`);
      // trello-node-api might return errors in a specific format, e.g. error.message or error.response.data
      // For now, logging error.message is a good start.
      if (error.response && error.response.data) {
         this.connectorMixin.error(`Trello API Error details: ${JSON.stringify(error.response.data)}`);
      }
      throw error; // Re-throw the error
    }
  }
}
