import Connector from "../mixins/Connector";
import OpenAI from "openai";

type RequiredEnvVars = 'OPENAI_API_KEY'

export class OpenAIConnector {
  #openai: OpenAI;
  id: string = "openai";
  connectorMixin!: Connector<RequiredEnvVars>;
  openaiAPIKeyKeyName: RequiredEnvVars = "OPENAI_API_KEY";

  constructor() {
    this.connectorMixin = new Connector({
      id: this.id,
    });

    this.connectorMixin.setConfigurations({
      OPENAI_API_KEY: {
        value: process.env[this.openaiAPIKeyKeyName],
        error: `Please set the environment variable: ${this.openaiAPIKeyKeyName}`,
      }
    })

    this.#openai = new OpenAI({
      apiKey: this.connectorMixin.getConfiguration('OPENAI_API_KEY'),
    });
  }

  async compareIssueToSourceCode({ issue, sourceCode }: {issue: string, sourceCode: string}) {

    // TODO: make the report format template in JSON ideally.
    const report = ``;

    return (await this.#openai.chat.completions.create({
      model: "gpt-4",
      max_tokens: 414,
      messages: [
        {
          role: "user",
          content: `please give your response in JSON report format include accuracy and analysis fields. How correct is this sourceCode to the issue? can you also rate its accuracy as a percentage decimal, (issue: ${issue}) (sourceCode: ${sourceCode})`,
        },
      ],
    })).choices;
  }

  async cucumberFromFile(filePath: string) {
    return await this.cucumberFromString(filePath);
  }

  async cucumberFromString(str: string) {
    return (await this.#openai.chat.completions.create({
      model: "gpt-4",
      max_tokens: 414,
      messages: [
        {
          role: "user",
          content: `convert this issue to cucumber, ignore attachments: ${str}`,
        },
      ],
    })).choices;
  }
}
