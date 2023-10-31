import { readFile } from "fs/promises";
import dotenv from "dotenv";
import { JiraConnector } from "./connectors/Jira";
import { OpenAIConnector } from "./connectors/OpenAI";
import { GithubConnector } from "./connectors/Github";
import { resolve } from "path";

dotenv.config();

/**
 * A union type that represents either a JiraConnector or a GithubConnector.
 */
type IssueTrackerConnector = JiraConnector | GithubConnector;

/**
 * Initializes the issue tracker connector based on the environment configuration.
 *
 * @returns {IssueTrackerConnector} An instance of the issue tracker connector.
 * @throws Will throw an error if the issue tracker system is not supported or not configured.
 */
export function initializeIssueTracker(issueTrackerSystem: 'jira' | 'github'): IssueTrackerConnector {
  switch (issueTrackerSystem) {
    case 'github':
      console.log(new GithubConnector().constructor.name)
      return new GithubConnector();
    case 'jira':
      return new JiraConnector();
    default:
      throw new Error('Unsupported or undefined issue tracker system');
  }
}

// Protected instanciation - the registry sets up the connector and the class itself has its own defaults.

export async function scoreFile({
  issueTrackingSystem,
  issue,
  file,
}: {
  issueTrackingSystem: IssueTrackerConnector,
  issue: string;
  file: string;
}) {

  const openai = new OpenAIConnector();

  if (issueTrackingSystem instanceof GithubConnector) {
    const { body, comments, title,  } = await issueTrackingSystem.getIssue(parseInt(issue));

    console.log(`${issueTrackingSystem.connectorMixin.getConfiguration('GITHUB_OWNER')}/${issueTrackingSystem.connectorMixin.getConfiguration('GITHUB_REPO')}`)

    if (body) {
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
      console.log(`Issue recieved... #${issue} "${title}" (fetched from live)`)
      console.log('Converting issue to cucumber format...')
      const issueToCucumber = (await openai.cucumberFromString(body))[0].message.content;
      // TODO: cache issueToCucumber
      console.log('The cucumber...\n```feature', '\n', issueToCucumber, '\n```')
      console.log(`Comparing... '${file}'`);
      if (issueToCucumber) {
        console.log('Generating report...');
        console.log(
          (await openai.compareIssueToSourceCode({
            issue: issueToCucumber,
            sourceCode: await readFile(resolve('.',file), 'utf8')
          }))[0].message.content
        )
      } else {
        throw new Error('Something went wrong serializing the issue, stopping.');
      }
    } else {
      throw new Error(`Issue body is blank, nothing to compare.`);
    }
    
  }

  if (issueTrackingSystem instanceof JiraConnector) {
    await issueTrackingSystem.getIssue(issue);
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
