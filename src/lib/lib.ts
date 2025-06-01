import { readFile } from "fs/promises";
import dotenv from "dotenv";
import { JiraConnector } from "./connectors/Jira";
import { GithubConnector } from "./connectors/Github";
import { LinearConnector } from "./connectors/Linear";
import { AsanaConnector } from "./connectors/Asana";
import { TrelloConnector } from "./connectors/Trello";
import { OpenAIConnector } from "./connectors/OpenAI";
import { ClaudeConnector } from "./connectors/Claude";
import { resolve } from "path";

dotenv.config();

/**
 * A union type that represents an issue tracker connector.
 */
type IssueTrackerConnector = JiraConnector | GithubConnector | LinearConnector | AsanaConnector | TrelloConnector;

/**
 * A union type that represents an LLM connector.
 */
type LLMConnector = OpenAIConnector | ClaudeConnector;

/**
 * Initializes the issue tracker connector based on the provided system ID.
 *
 * @param issueTrackerSystem The ID of the issue tracking system to initialize.
 * @returns {IssueTrackerConnector} An instance of the issue tracker connector.
 * @throws Will throw an error if the issue tracker system is not supported.
 */
export function initializeIssueTracker(issueTrackerSystem: 'jira' | 'github' | 'linear' | 'asana' | 'trello'): IssueTrackerConnector {
  let connector: IssueTrackerConnector;
  switch (issueTrackerSystem) {
    case 'github':
      connector = new GithubConnector();
      break;
    case 'jira':
      connector = new JiraConnector();
      break;
    case 'linear':
      connector = new LinearConnector();
      break;
    case 'asana':
      connector = new AsanaConnector();
      break;
    case 'trello':
      connector = new TrelloConnector();
      break;
    default:
      // This should be caught by TypeScript if the input type is correct
      const exhaustiveCheck: never = issueTrackerSystem;
      throw new Error(`Unsupported issue tracking system: ${exhaustiveCheck}`);
  }
  console.log(`Initialized ${connector.id} connector.`);
  return connector;
}

/**
 * Initializes the LLM connector based on the provided system ID or environment configuration.
 *
 * @param llmSystem Optional ID of the LLM system to initialize. Defaults to process.env.LLM_SYSTEM or 'openai'.
 * @returns {LLMConnector} An instance of the LLM connector.
 */
export function initializeLLMConnector(llmSystem?: string): LLMConnector {
  const targetLLM = llmSystem || process.env.LLM_SYSTEM || 'openai'; // Default to openai
  let connector: LLMConnector;

  switch (targetLLM.toLowerCase()) {
    case 'claude':
      connector = new ClaudeConnector();
      break;
    case 'openai':
    default: // Default to OpenAI if system is not recognized or not provided
      connector = new OpenAIConnector();
      break;
  }
  console.log(`Initialized ${connector.id} LLM connector.`);
  return connector;
}

// Protected instanciation - the registry sets up the connector and the class itself has its own defaults.

export async function scoreFile({
  issueTrackingSystem,
  issue, // This is the issue ID/key
  file,
}: {
  issueTrackingSystem: IssueTrackerConnector, // This is already an initialized connector instance
  issue: string;
  file: string;
}) {

  const llmConnector = initializeLLMConnector(process.env.LLM_SYSTEM);

  let issueTitle = "";
  let issueDescription = "";
  let issueId = "";

  console.log(`Fetching details for issue "${issue}" from ${issueTrackingSystem.id}...`);

  if (issueTrackingSystem instanceof GithubConnector) {
    const issueData = await issueTrackingSystem.getIssue(parseInt(issue)); // Github uses number ID
    issueTitle = issueData.title;
    issueDescription = issueData.body || "";
    issueId = issueData.id.toString();
    console.log(`${issueTrackingSystem.connectorMixin.getConfiguration('GITHUB_OWNER')}/${issueTrackingSystem.connectorMixin.getConfiguration('GITHUB_REPO')}`);
  } else if (issueTrackingSystem instanceof JiraConnector) {
    const issueData = await issueTrackingSystem.getIssue(issue);
    issueTitle = issueData.summary;
    issueDescription = issueData.description || "";
    issueId = issueData.id;
  } else if (issueTrackingSystem instanceof LinearConnector) {
    const issueData = await issueTrackingSystem.getIssue(issue);
    issueTitle = issueData.title;
    issueDescription = issueData.description || "";
    issueId = issueData.id;
  } else if (issueTrackingSystem instanceof AsanaConnector) {
    const taskData = await issueTrackingSystem.getTask(issue);
    issueTitle = taskData.name;
    issueDescription = taskData.description || "";
    issueId = taskData.id;
  } else if (issueTrackingSystem instanceof TrelloConnector) {
    const cardData = await issueTrackingSystem.getCard(issue);
    issueTitle = cardData.name;
    issueDescription = cardData.description || ""; // Trello calls it 'desc' but our focused type calls it 'description'
    issueId = cardData.id;
  } else {
    // This should not happen if issueTrackingSystem is correctly typed
    throw new Error("Unsupported issue tracking system instance provided to scoreFile.");
  }

  if (issueDescription) {
    console.log(`
    ░░
    ░░████░░
      ██▒▒▓▓
      ▓▓▒▒██
    ▒▒▒▒░░░░▒▒
    ▓▓░░░░    ██░░░░
    ▒▒░░░░░░░░░░▒▒▓▓██░░
      ▓▓  ░░░░▓▓▓▓▓▓▓▓▓▓
      ░░▒▒▓▓▒▒
        ░░▒▒    ░░
        ░░░░          Cooeee! Percy is working please remain calm..
    `)
    console.log(`Issue received... #${issueId} "${issueTitle}" (fetched from ${issueTrackingSystem.id})`);
    console.log('Converting issue to cucumber format...');

    let issueToCucumberText: string | undefined;
    const cucumberResponse = await llmConnector.cucumberFromString(issueDescription);
    if (llmConnector instanceof OpenAIConnector) {
      // Assuming cucumberResponse is an array with choices[0].message.content
      issueToCucumberText = (cucumberResponse as any)[0]?.message?.content;
    } else if (llmConnector instanceof ClaudeConnector) {
      // Assuming cucumberResponse is { analysis: string }
      issueToCucumberText = (cucumberResponse as any).analysis;
    }

    if (!issueToCucumberText) {
      throw new Error(`Could not convert issue ${issueId} to Cucumber format. Response was empty or in unexpected format.`);
    }
    
    // TODO: cache issueToCucumber
    console.log('The cucumber...\n```feature', '\n', issueToCucumberText, '\n```');
    console.log(`Comparing... '${file}'`);

    console.log('Generating report...');
    const compareResponse = await llmConnector.compareIssueToSourceCode({
      issue: issueToCucumberText,
      sourceCode: await readFile(resolve('.', file), 'utf8')
    });

    let reportText: string | undefined;
    let accuracyScore: number | undefined;

    if (llmConnector instanceof OpenAIConnector) {
      // Assuming compareResponse is an array with choices[0].message.content
      reportText = (compareResponse as any)[0]?.message?.content;
    } else if (llmConnector instanceof ClaudeConnector) {
      // Assuming compareResponse is { analysis: string, accuracy?: number }
      reportText = (compareResponse as any).analysis;
      accuracyScore = (compareResponse as any).accuracy;
    }

    if (!reportText) {
      throw new Error(`Could not generate comparison report for issue ${issueId}. Response was empty or in unexpected format.`);
    }

    console.log("--- Comparison Report ---");
    console.log(reportText);
    if (accuracyScore !== undefined) {
      console.log(`Accuracy (from Claude): ${accuracyScore}%`);
    }
    console.log("-------------------------");

  } else {
    throw new Error(`Issue body/description for #${issueId} is blank for ${issueTrackingSystem.id}, nothing to compare.`);
  }
}

// const jiraConnector = await new JiraConnector().getIssue(issue);

  // const openAI = new OpenAIConnector();

  // console.log(
  //   (await openAI.cucumberFromString(jiraConnector.description)).choices[0]
  //     .message
  // );
  //   ConnectorRegistry.get("openai");
  //     try {
  //         const targetFilePath = process.argv[2];
  //         const targetFile = await readFile(targetFilePath, 'utf-8');
  //         console.log(targetFile)
  //         const stream = await openai.chat.completions.create({
  //             model: 'gpt-4',
  //             messages: [{ role: 'user', content: `Generate ` }]
  //         });
  //     } catch (error: unknown) {
  //         // @ts-ignore
  //         console.error(error.message);
  //     }
}
