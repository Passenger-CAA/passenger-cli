import { Connector } from "../mixins/Connector";
import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs/promises'; // For reading files

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// Define a basic response structure, this can be refined
export interface ClaudeResponse {
  analysis: string;
  accuracy?: number; // Assuming accuracy might be harder to get consistently from Claude as a number
}

export class ClaudeConnector {
  id = "claude";
  connectorMixin: Connector;
  #anthropic!: Anthropic;

  constructor() {
    this.connectorMixin = new Connector({ id: this.id });

    const configurations = {
      apiKey: ANTHROPIC_API_KEY,
    };

    this.connectorMixin.validateConfigurations(configurations, ["apiKey"]);
    this.connectorMixin.setConfigurations(configurations); // Though API key is used directly here

    const apiKey = this.connectorMixin.getConfiguration("apiKey");
    if (!apiKey) {
      throw new Error("Anthropic API Key is not configured. Ensure ANTHROPIC_API_KEY environment variable is set.");
    }
    this.#anthropic = new Anthropic({ apiKey: apiKey });
  }

  // Basic response parser - this will likely need significant refinement
  private _parseClaudeResponse(responseText: string): ClaudeResponse {
    // Attempt to find "Accuracy: X%" and "Analysis: ..."
    // This is a very naive parser and highly dependent on Claude's output format.
    let accuracy: number | undefined = undefined;
    const accuracyMatch = responseText.match(/Accuracy:\s*(\d+)%/i);
    if (accuracyMatch && accuracyMatch[1]) {
      accuracy = parseInt(accuracyMatch[1], 10);
    }

    // For analysis, we might take everything after "Analysis:" or a significant portion of the text.
    let analysis = responseText;
    const analysisMatch = responseText.match(/Analysis:\s*(.*)/is);
    if (analysisMatch && analysisMatch[1]) {
      analysis = analysisMatch[1].trim();
    } else {
      // Fallback if "Analysis:" marker isn't found
      analysis = responseText.trim();
    }

    if (analysis.length === 0 && responseText.length > 0) {
        analysis = responseText.trim();
    }


    return {
      accuracy,
      analysis,
    };
  }

  async compareIssueToSourceCode({ issue, sourceCode }: { issue: string, sourceCode: string }): Promise<ClaudeResponse> {
    this.connectorMixin.log("Comparing issue to source code using Claude...");

    const prompt = `${Anthropic.HUMAN_PROMPT} Please analyze the following issue and source code.
Provide an accuracy score (e.g., Accuracy: 85%) and a detailed analysis.

Issue:
${issue}

Source Code:
${sourceCode}

${Anthropic.AI_PROMPT} Analysis:`;

    try {
      const completion = await this.#anthropic.completions.create({
        model: "claude-2.1", // Or another suitable model like claude-instant-1.2
        max_tokens_to_sample: 2000, // Adjust as needed
        prompt: prompt,
      });

      if (!completion.completion) {
        throw new Error("Received an empty completion from Claude API.");
      }

      this.connectorMixin.log(`Raw Claude completion: ${completion.completion}`);
      return this._parseClaudeResponse(completion.completion);

    } catch (error: any) {
      this.connectorMixin.error(`Error comparing issue to source code with Claude: ${error.message}`);
      if (error.response && error.response.data) {
        this.connectorMixin.error(`Claude API Error details: ${JSON.stringify(error.response.data)}`);
      }
      // Return a failed analysis object or rethrow
      return { analysis: `Error: ${error.message}` };
    }
  }

  async cucumberFromFile(filePath: string): Promise<ClaudeResponse> {
    this.connectorMixin.log(`Generating Cucumber steps from file: ${filePath} using Claude...`);
    try {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      return this.cucumberFromString(fileContent);
    } catch (error: any) {
      this.connectorMixin.error(`Error reading file ${filePath}: ${error.message}`);
      return { analysis: `Error reading file: ${error.message}` };
    }
  }

  async cucumberFromString(str: string): Promise<ClaudeResponse> {
    this.connectorMixin.log("Generating Cucumber steps from string using Claude...");
    const prompt = `${Anthropic.HUMAN_PROMPT} Given the following text, please generate Gherkin (Cucumber) syntax.
Do not include any explanatory text, only the Gherkin code.

Text:
${str}

${Anthropic.AI_PROMPT} Gherkin:`;

    try {
      const completion = await this.#anthropic.completions.create({
        model: "claude-2.1", // Or another suitable model
        max_tokens_to_sample: 1500, // Adjust as needed
        prompt: prompt,
      });

      if (!completion.completion) {
        throw new Error("Received an empty completion from Claude API for cucumber generation.");
      }

      this.connectorMixin.log(`Raw Claude completion for cucumber: ${completion.completion}`);
      // For Gherkin, the entire response is the analysis (the Gherkin code itself)
      // We might not expect an "Accuracy" score here.
      return { analysis: completion.completion.trim() };

    } catch (error: any) {
      this.connectorMixin.error(`Error generating cucumber from string with Claude: ${error.message}`);
      if (error.response && error.response.data) {
        this.connectorMixin.error(`Claude API Error details: ${JSON.stringify(error.response.data)}`);
      }
      return { analysis: `Error: ${error.message}` };
    }
  }
}
