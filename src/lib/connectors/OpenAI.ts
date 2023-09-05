import Connector from "../mixins/Connector";
import OpenAI from "openai";

export class OpenAIConnector {
  openai: OpenAI;
  id: string = "openai";
  connectorMixin!: Connector;
  apiKeyName: string = "OPENAI_API_KEY";

  constructor() {
    this.connectorMixin = new Connector({
      id: this.id,
      apiKeyName: this.apiKeyName,
    });

    this.connectorMixin.setAPIKeyFromEnv();

    this.openai = new OpenAI({
      apiKey: this.connectorMixin.apiKeyValue,
    });
  }

  async cucumberFromFile(filePath: string) {
    return await this.cucumberFromString(filePath);
  }

  async cucumberFromString(str: string) {
    return await this.openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      max_tokens: 414,
      messages: [
        {
          role: "user",
          content: `convert this issue to cucumber, ignore attachments: ${str}`,
        },
      ],
    });
  }
}
