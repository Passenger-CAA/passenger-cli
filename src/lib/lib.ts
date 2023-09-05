import { readFile } from "fs/promises";
import dotenv from "dotenv";
import { JiraConnector } from "./connectors/Jira";
import { OpenAIConnector } from "./connectors/OpenAI";

dotenv.config();

// Protected instanciation - the registry sets up the connector and the class itself has its own defaults.

export async function scoreFile({
  issue,
  file,
}: {
  issue: string;
  file: string;
}) {
  const jiraConnector = await new JiraConnector().getIssue(issue);

  console.log(jiraConnector.description);
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
