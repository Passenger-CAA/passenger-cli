import { Connector, IConfigurationValue } from "../mixins/Connector";
import { IssueTracker, NormalizedIssue, TicketAnalysis } from "../types/IssueTracker.types";
import { LLMProvider } from "../types/LLMProvider.types";
import { App } from "octokit";
import { Cache as FileSystemCache } from "file-system-cache";
import { Cache } from "../mixins/Cache";
import { readFile } from "fs/promises";

type SupportedEnvVars = 'GITHUB_APP_ID' | 'GITHUB_INSTALLATION_ID' | 'GITHUB_PRIVATE_KEY_PATH' | 'GITHUB_OWNER' | 'GITHUB_REPO';

export class GithubConnector implements IssueTracker {
    readonly id = "github";
    connectorMixin!: Connector<SupportedEnvVars>;
    cacheMixin!: FileSystemCache;
    GithubApp!: App;
    private llmProvider?: LLMProvider;

    // Environment variable key names
    githubInstallationIDKeyName: SupportedEnvVars = 'GITHUB_INSTALLATION_ID';
    githubAppPrivateKeyPathKeyName: SupportedEnvVars = 'GITHUB_PRIVATE_KEY_PATH';
    githubOwnerKeyName: SupportedEnvVars = 'GITHUB_OWNER';
    githubRepoKeyName: SupportedEnvVars = 'GITHUB_REPO';

    constructor(llmProvider?: LLMProvider) {
        this.llmProvider = llmProvider;
        this.connectorMixin = new Connector({
            id: "github"
        });
        this.cacheMixin = new Cache();

        const configurations: Record<SupportedEnvVars, IConfigurationValue> = {
            // Static
            GITHUB_APP_ID: {
                value: '413242',
                error: '',
            },
            // Dynamic
            GITHUB_INSTALLATION_ID: {
                optional: true,
                value: process.env[this.githubInstallationIDKeyName],
                error: `Please set the environment variable: ${this.githubInstallationIDKeyName}`,
            },
            GITHUB_PRIVATE_KEY_PATH: {
                value: process.env[this.githubAppPrivateKeyPathKeyName],
                error: `Please set the environment variable: ${this.githubAppPrivateKeyPathKeyName}`,
            },
            GITHUB_OWNER: {
                value: process.env[this.githubOwnerKeyName],
                error: `Please set the environment variable: ${this.githubOwnerKeyName}`,
            },
            GITHUB_REPO: {
                value: process.env[this.githubRepoKeyName],
                error: `Please set the environment variable: ${this.githubRepoKeyName}`,
            }
        };

        this.connectorMixin.validateConfigurations(configurations);
        this.connectorMixin.setConfigurations(configurations);
    }

    async getOctokit() {
        const appId = this.connectorMixin.getConfiguration('GITHUB_APP_ID');
        const privateKey = await this.#getPrivateKey();
        const owner = this.connectorMixin.getConfiguration('GITHUB_OWNER');
        const repo = this.connectorMixin.getConfiguration('GITHUB_REPO');
        let installationID = parseInt(this.connectorMixin.getConfiguration('GITHUB_INSTALLATION_ID'));

        const app = new App({ appId, privateKey });
        let installation = { id: 0 }

        if (!installationID) {
            // GITHUB_INSTALLATION_ID not set so lets figure it out
            let { data } = await app.octokit.request(
                `GET /repos/{owner}/{repo}/installation`,
                { owner, repo }
            );
            installation = {...data}
            console.log('Got installation ID... (fetched from live)', installation.id)
        } else {
            console.log('Got installation ID... (found in environment)', installationID)
        }

        installationID = installationID || installation.id;

        

        return app.getInstallationOctokit(installationID);
    }

    async #getPrivateKey() {
        let privateKey!: string;
        try {
            privateKey = await readFile(this.connectorMixin.getConfiguration(this.githubAppPrivateKeyPathKeyName), 'utf8');
            if (!privateKey) {
                throw new Error(`: file contents empty. ${this.connectorMixin.getConfiguration(this.githubAppPrivateKeyPathKeyName)}`);
            } 
        } catch (err: any) {
            throw new Error(`${this.githubAppPrivateKeyPathKeyName} something went wrong reading the specified file. \nerror: ${err.message}`);
        }
        return privateKey;
    }

    async getIssue(issueNumber: number): Promise<NormalizedIssue> {
        const octokit = await this.getOctokit();

        const owner = this.connectorMixin.getConfiguration('GITHUB_OWNER');
        const repo = this.connectorMixin.getConfiguration('GITHUB_REPO');

        const { data: issue } = await octokit.request('GET /repos/{owner}/{repo}/issues/{issue_number}', {
            owner,
            repo,
            issue_number: issueNumber,
        });

        const normalizedIssue: NormalizedIssue = {
            id: issue.number,
            title: issue.title,
            description: issue.body || undefined,
            status: issue.state,
        };

        // Only analyze if LLM provider is configured
        if (this.llmProvider) {
            normalizedIssue.analysis = await this.analyzeTicket(issue);
        }

        return normalizedIssue;
    }

    async analyzeTicket(issue: any): Promise<TicketAnalysis> {
        if (!this.llmProvider) {
            throw new Error("No LLM provider configured for ticket analysis");
        }

        const prompt = `You are an expert Business Analyst. Analyze the following GitHub issue and provide a structured analysis in JSON format.

**Issue Title:** ${issue.title}
**Issue Body:** ${issue.body}

**Instructions:**

1.  **\`is_workable\`:** Determine if the issue is well-defined and actionable for a developer. It should be \`true\` if the issue is clear and has enough information to start working on, and \`false\` otherwise.
2.  **\`missing_information\`:** If \`is_workable\` is \`false\`, provide a list of strings explaining what information is missing (e.g., "Missing acceptance criteria", "The user story is not well-defined", "The request is ambiguous"). If \`is_workable\` is \`true\`, this should be an empty array.
3.  **\`user_stories\`:** Generate a list of user stories from the issue, following the format: \`{"as_a": "...", "i_want": "...", "so_that": "..."}\`. If no clear user story can be extracted, provide a best-effort interpretation.
4.  **\`acceptance_criteria\`:** Extract a list of acceptance criteria from the issue. These should be specific, testable conditions that must be met for the issue to be considered complete.

**JSON Output Format:**

\`\`\`json
{
  "ticket_id": "${issue.number}",
  "title": "${issue.title}",
  "is_workable": boolean,
  "missing_information": ["string"],
  "user_stories": [
    {
      "as_a": "string",
      "i_want": "string",
      "so_that": "string"
    }
  ],
  "acceptance_criteria": ["string"]
}
\`\`\`

**Important:** Only return the JSON object. Do not include any other text or explanations in your response.`;

        const analysis = await this.llmProvider.generateContent(prompt);
        return JSON.parse(analysis);
    }
}
