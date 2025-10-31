import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import { join } from 'path';

export type PassengerConfig = {
  issueTracker: {
    system: 'github' | 'jira' | 'linear' | 'asana' | 'trello';
    github?: {
      owner: string;
      repo: string;
      privateKeyPath: string;
      installationId?: string;
    };
    jira?: {
      host: string;
      userEmail: string;
      apiToken: string;
    };
    linear?: {
      apiKey: string;
    };
    asana?: {
      personalAccessToken: string;
    };
    trello?: {
      apiKey: string;
      userToken: string;
    };
  };
  llm: {
    system: 'gemini' | 'claude' | 'openai';
    gemini?: {
      apiKey: string;
    };
    claude?: {
      apiKey: string;
    };
    openai?: {
      apiKey: string;
    };
  };
};

/**
 * Load passenger.json configuration file
 * Falls back to environment variables if config file doesn't exist
 */
export class ConfigLoader {
  private static CONFIG_FILENAME = 'passenger.json';

  /**
   * Load configuration from passenger.json or environment variables
   */
  static async load(configPath?: string): Promise<PassengerConfig | null> {
    // Try to load from passenger.json
    const configFilePath = configPath || join(process.cwd(), this.CONFIG_FILENAME);

    if (existsSync(configFilePath)) {
      try {
        const configContent = await readFile(configFilePath, 'utf-8');
        const config = JSON.parse(configContent) as PassengerConfig;
        console.log(`🐦 Loaded config from ${this.CONFIG_FILENAME}`);
        return config;
      } catch (error: any) {
        console.error(`❌ Error reading ${this.CONFIG_FILENAME}: ${error.message}`);
        return null;
      }
    }

    // Try to load from environment variables (legacy support)
    return this.loadFromEnv();
  }

  /**
   * Load configuration from environment variables (legacy)
   */
  private static loadFromEnv(): PassengerConfig | null {
    const issueTrackerSystem = process.env.ISSUE_TRACKER_SYSTEM;
    const llmSystem = process.env.LLM_SYSTEM;

    if (!issueTrackerSystem || !llmSystem) {
      return null;
    }

    const config: PassengerConfig = {
      issueTracker: {
        system: issueTrackerSystem as any,
      },
      llm: {
        system: llmSystem as any,
      },
    };

    // Load issue tracker specific config
    switch (issueTrackerSystem) {
      case 'github':
        config.issueTracker.github = {
          owner: process.env.GITHUB_OWNER!,
          repo: process.env.GITHUB_REPO!,
          privateKeyPath: process.env.GITHUB_PRIVATE_KEY_PATH!,
          installationId: process.env.GITHUB_INSTALLATION_ID,
        };
        break;
      case 'jira':
        config.issueTracker.jira = {
          host: process.env.JIRA_HOST!,
          userEmail: process.env.JIRA_USER_EMAIL!,
          apiToken: process.env.JIRA_API_TOKEN!,
        };
        break;
      case 'linear':
        config.issueTracker.linear = {
          apiKey: process.env.LINEAR_API_KEY!,
        };
        break;
      case 'asana':
        config.issueTracker.asana = {
          personalAccessToken: process.env.ASANA_PERSONAL_ACCESS_TOKEN!,
        };
        break;
      case 'trello':
        config.issueTracker.trello = {
          apiKey: process.env.TRELLO_API_KEY!,
          userToken: process.env.TRELLO_USER_TOKEN!,
        };
        break;
    }

    // Load LLM specific config
    switch (llmSystem) {
      case 'gemini':
        config.llm.gemini = { apiKey: process.env.GEMINI_API_KEY! };
        break;
      case 'claude':
        config.llm.claude = { apiKey: process.env.ANTHROPIC_API_KEY! };
        break;
      case 'openai':
        config.llm.openai = { apiKey: process.env.OPENAI_API_KEY! };
        break;
    }

    console.log(`🐦 Loaded config from environment variables`);
    return config;
  }

  /**
   * Apply config to environment variables (for legacy connector code)
   */
  static applyToEnv(config: PassengerConfig): void {
    process.env.ISSUE_TRACKER_SYSTEM = config.issueTracker.system;
    process.env.LLM_SYSTEM = config.llm.system;

    // Apply issue tracker config
    const issueTracker = config.issueTracker;
    if (issueTracker.github) {
      process.env.GITHUB_OWNER = issueTracker.github.owner;
      process.env.GITHUB_REPO = issueTracker.github.repo;
      process.env.GITHUB_PRIVATE_KEY_PATH = issueTracker.github.privateKeyPath;
      if (issueTracker.github.installationId) {
        process.env.GITHUB_INSTALLATION_ID = issueTracker.github.installationId;
      }
    }
    if (issueTracker.jira) {
      process.env.JIRA_HOST = issueTracker.jira.host;
      process.env.JIRA_USER_EMAIL = issueTracker.jira.userEmail;
      process.env.JIRA_API_TOKEN = issueTracker.jira.apiToken;
    }
    if (issueTracker.linear) {
      process.env.LINEAR_API_KEY = issueTracker.linear.apiKey;
    }
    if (issueTracker.asana) {
      process.env.ASANA_PERSONAL_ACCESS_TOKEN = issueTracker.asana.personalAccessToken;
    }
    if (issueTracker.trello) {
      process.env.TRELLO_API_KEY = issueTracker.trello.apiKey;
      process.env.TRELLO_USER_TOKEN = issueTracker.trello.userToken;
    }

    // Apply LLM config
    const llm = config.llm;
    if (llm.gemini) {
      process.env.GEMINI_API_KEY = llm.gemini.apiKey;
    }
    if (llm.claude) {
      process.env.ANTHROPIC_API_KEY = llm.claude.apiKey;
    }
    if (llm.openai) {
      process.env.OPENAI_API_KEY = llm.openai.apiKey;
    }
  }

  /**
   * Check if configuration exists
   */
  static exists(): boolean {
    return existsSync(join(process.cwd(), this.CONFIG_FILENAME)) ||
           (!!process.env.ISSUE_TRACKER_SYSTEM && !!process.env.LLM_SYSTEM);
  }
}
