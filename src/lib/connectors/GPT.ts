import { Connector, IConfigurationValue } from "../mixins/Connector";
import OpenAI from "openai";
import { LLMProvider } from "../types/LLMProvider.types";

type RequiredEnvVars = 'OPENAI_API_KEY'

export class OpenAIConnector implements LLMProvider {
  #openai: OpenAI;
  readonly id: string = "openai";
  connectorMixin!: Connector<RequiredEnvVars>;
  openaiAPIKeyKeyName: RequiredEnvVars = "OPENAI_API_KEY";

  constructor() {
    this.connectorMixin = new Connector({
      id: this.id,
    });

    const configurations: Record<RequiredEnvVars, IConfigurationValue> = {
      OPENAI_API_KEY: {
        value: process.env[this.openaiAPIKeyKeyName],
        error: `Please set the environment variable: ${this.openaiAPIKeyKeyName}`,
      }
    }

    this.connectorMixin.validateConfigurations(configurations);
    this.connectorMixin.setConfigurations(configurations);

    this.#openai = new OpenAI({
      apiKey: this.connectorMixin.getConfiguration('OPENAI_API_KEY'),
    });
  }

  /**
   * Generate content from a prompt (required by LLMProvider)
   */
  async generateContent(prompt: string): Promise<string> {
    const response = await this.#openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    return response.choices[0]?.message?.content || "";
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
    const fs = await import('fs/promises');
    const fileContent = await fs.readFile(filePath, 'utf-8');
    return await this.cucumberFromString(fileContent);
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
