import Connector, { IConfigurationValue } from "../mixins/Connector";
import { Cache } from "../mixins/Cache";
import { Cache as FileSystemCache } from "file-system-cache";
import { App } from "octokit";
import { readFile } from "fs/promises";

type SupportedEnvVars = 'GITHUB_APP_ID' | 'GITHUB_OWNER' | 'GITHUB_REPO' | "GITHUB_INSTALLATION_ID" | "GITHUB_PRIVATE_KEY_PATH";

export class GithubConnector {
    githubOwnerKeyName: SupportedEnvVars = "GITHUB_OWNER";
    githubRepoKeyName: SupportedEnvVars = "GITHUB_REPO";
    githubInstallationIDKeyName: SupportedEnvVars = "GITHUB_INSTALLATION_ID";
    githubAppPrivateKeyPathKeyName: SupportedEnvVars = "GITHUB_PRIVATE_KEY_PATH";
    id: string = "github";
    connectorMixin!: Connector<SupportedEnvVars>;
    cacheMixin!: FileSystemCache;
    GithubApp!: App;

    constructor() {
        this.connectorMixin = new Connector({
            id: this.id
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
            console.log('Got installation ID... (fetched from live)', installationID)
        } else {
            console.log('Got installation ID... (found in environment)', installationID)
        }
    
        installationID |= installation.id;

        

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

    async getIssue(issueNumber: number) {
        const octokit = await this.getOctokit();

        const owner = this.connectorMixin.getConfiguration('GITHUB_OWNER');
        const repo = this.connectorMixin.getConfiguration('GITHUB_REPO');

        const { data: issue } = await octokit.request('GET /repos/{owner}/{repo}/issues/{issue_number}', {
            owner,
            repo,
            issue_number: issueNumber,
        });
          
        return issue;
    }
}
