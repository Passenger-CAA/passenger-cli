#!/usr/bin/env node

import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { initializeIssueTracker, initializeLLMConnector, scoreFile } from "../lib/lib";
import { GitWatcher } from "../lib/services/GitWatcher";
import { DevelopmentCoach } from "../lib/services/DevelopmentCoach";
import { ConfigLoader } from "../lib/config/ConfigLoader";
import inquirer from "inquirer";
import { writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

const CONFIG_FILE_NAME = "passenger.json";

/**
 * Check if passenger.json exists, if not prompt user to run init
 */
async function ensureConfig(): Promise<boolean> {
  if (!ConfigLoader.exists()) {
    console.log('\n🐦 Welcome to Passenger Pigeon!\n');
    console.log('No configuration found. Let\'s set you up!\n');

    const { shouldInit } = await inquirer.prompt([{
      type: 'confirm',
      name: 'shouldInit',
      message: 'Would you like to create a passenger.json config file now?',
      default: true,
    }]);

    if (!shouldInit) {
      console.log('\n❌ Cannot proceed without configuration.');
      console.log('Run `passenger init` when you\'re ready.\n');
      return false;
    }

    // Run init flow
    await runInit();
    return true;
  }

  // Load and apply config
  const config = await ConfigLoader.load();
  if (!config) {
    console.log('\n❌ Failed to load configuration.');
    console.log('Please check your passenger.json file or run `passenger init` again.\n');
    return false;
  }

  ConfigLoader.applyToEnv(config);
  return true;
}

/**
 * Run the init flow to create passenger.json
 */
async function runInit(): Promise<void> {
  const answers = await inquirer.prompt([
    {
      type: "list",
      name: "ISSUE_TRACKER_SYSTEM",
      message: "Which issue tracking system do you use?",
      choices: ["github", "jira", "linear", "asana", "trello"],
    },
    {
      type: "list",
      name: "LLM_SYSTEM",
      message: "Which LLM provider do you want to use?",
      choices: ["gemini", "claude", "openai"],
      default: "gemini",
    },
    // Github
    {
      type: "input",
      name: "GITHUB_OWNER",
      message: "Enter your GitHub owner/organization name:",
      when: (answers) => answers.ISSUE_TRACKER_SYSTEM === "github",
    },
    {
      type: "input",
      name: "GITHUB_REPO",
      message: "Enter your GitHub repository name:",
      when: (answers) => answers.ISSUE_TRACKER_SYSTEM === "github",
    },
    {
      type: "input",
      name: "GITHUB_INSTALLATION_ID",
      message: "Enter your GitHub App Installation ID (optional, press enter to skip):",
      when: (answers) => answers.ISSUE_TRACKER_SYSTEM === "github",
    },
    {
      type: "input",
      name: "GITHUB_PRIVATE_KEY_PATH",
      message: "Enter the path to your GitHub App private key file:",
      when: (answers) => answers.ISSUE_TRACKER_SYSTEM === "github",
    },
    // Jira
    {
      type: "input",
      name: "JIRA_HOST",
      message: "Enter your Jira host (e.g., yourcompany.atlassian.net):",
      when: (answers) => answers.ISSUE_TRACKER_SYSTEM === "jira",
    },
    {
      type: "input",
      name: "JIRA_USER_EMAIL",
      message: "Enter your Jira user email:",
      when: (answers) => answers.ISSUE_TRACKER_SYSTEM === "jira",
    },
    {
      type: "input",
      name: "JIRA_API_TOKEN",
      message: "Enter your Jira API token:",
      when: (answers) => answers.ISSUE_TRACKER_SYSTEM === "jira",
    },
    // Linear
    {
      type: "input",
      name: "LINEAR_API_KEY",
      message: "Enter your Linear API key:",
      when: (answers) => answers.ISSUE_TRACKER_SYSTEM === "linear",
    },
    // Asana
    {
      type: "input",
      name: "ASANA_PERSONAL_ACCESS_TOKEN",
      message: "Enter your Asana Personal Access Token:",
      when: (answers) => answers.ISSUE_TRACKER_SYSTEM === "asana",
    },
    // Trello
    {
      type: "input",
      name: "TRELLO_API_KEY",
      message: "Enter your Trello API key:",
      when: (answers) => answers.ISSUE_TRACKER_SYSTEM === "trello",
    },
    {
      type: "input",
      name: "TRELLO_USER_TOKEN",
      message: "Enter your Trello user token:",
      when: (answers) => answers.ISSUE_TRACKER_SYSTEM === "trello",
    },
    // LLM API Keys
    {
      type: "input",
      name: "GEMINI_API_KEY",
      message: "Enter your Gemini API Key:",
      when: (answers) => answers.LLM_SYSTEM === "gemini",
    },
    {
      type: "input",
      name: "ANTHROPIC_API_KEY",
      message: "Enter your Anthropic (Claude) API Key:",
      when: (answers) => answers.LLM_SYSTEM === "claude",
    },
    {
      type: "input",
      name: "OPENAI_API_KEY",
      message: "Enter your OpenAI API Key:",
      when: (answers) => answers.LLM_SYSTEM === "openai",
    },
  ]);

  // Build passenger.json structure
  const config: any = {
    issueTracker: {
      system: answers.ISSUE_TRACKER_SYSTEM,
    },
    llm: {
      system: answers.LLM_SYSTEM,
    },
  };

  // Add issue tracker config
  if (answers.ISSUE_TRACKER_SYSTEM === "github") {
    config.issueTracker.github = {
      owner: answers.GITHUB_OWNER,
      repo: answers.GITHUB_REPO,
      privateKeyPath: answers.GITHUB_PRIVATE_KEY_PATH,
    };
    if (answers.GITHUB_INSTALLATION_ID) {
      config.issueTracker.github.installationId = answers.GITHUB_INSTALLATION_ID;
    }
  } else if (answers.ISSUE_TRACKER_SYSTEM === "jira") {
    config.issueTracker.jira = {
      host: answers.JIRA_HOST,
      userEmail: answers.JIRA_USER_EMAIL,
      apiToken: answers.JIRA_API_TOKEN,
    };
  } else if (answers.ISSUE_TRACKER_SYSTEM === "linear") {
    config.issueTracker.linear = {
      apiKey: answers.LINEAR_API_KEY,
    };
  } else if (answers.ISSUE_TRACKER_SYSTEM === "asana") {
    config.issueTracker.asana = {
      personalAccessToken: answers.ASANA_PERSONAL_ACCESS_TOKEN,
    };
  } else if (answers.ISSUE_TRACKER_SYSTEM === "trello") {
    config.issueTracker.trello = {
      apiKey: answers.TRELLO_API_KEY,
      userToken: answers.TRELLO_USER_TOKEN,
    };
  }

  // Add LLM config
  if (answers.LLM_SYSTEM === "gemini") {
    config.llm.gemini = { apiKey: answers.GEMINI_API_KEY };
  } else if (answers.LLM_SYSTEM === "claude") {
    config.llm.claude = { apiKey: answers.ANTHROPIC_API_KEY };
  } else if (answers.LLM_SYSTEM === "openai") {
    config.llm.openai = { apiKey: answers.OPENAI_API_KEY };
  }

  // Write to passenger.json
  const configPath = join(process.cwd(), CONFIG_FILE_NAME);
  writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log(`\n✅ Configuration saved to ${CONFIG_FILE_NAME}`);
  console.log(`🐦 You're all set! Run a command to start using Passenger.\n`);
}

yargs(hideBin(process.argv))
  .command(
    "score [issue] [file]",
    "Score a file against an issue.",
    (yargs) => yargs,
    async (argv) => {
      const issueTrackerSystemSelection = process.env.ISSUE_TRACKER_SYSTEM;
      const llmProvider = initializeLLMConnector(process.env.LLM_SYSTEM);
      const issueTrackingSystem = initializeIssueTracker(
        issueTrackerSystemSelection as ('jira' | 'github' | 'linear' | 'asana' | 'trello'),
        llmProvider
      );
      const ensuredFileArray: string[] = Array.isArray(argv.file)
        ? argv.file
        : [argv.file];

      if (!argv.issue) {
        throw new Error("No issue key");
      }

      for (const file of ensuredFileArray) {
        await scoreFile({
          issueTrackingSystem,
          issue: argv.issue as string,
          file,
        });
      }
    }
  )
  .command(
    "analyze <issueNumber>",
    "Analyze a GitHub issue and return a structured BA analysis.",
    (yargs) => {
      return yargs.positional("issueNumber", {
        describe: "The issue number to analyze",
        type: "number",
      });
    },
    async (argv) => {
      const issueTrackerSystemSelection = process.env.ISSUE_TRACKER_SYSTEM;
      const llmProvider = initializeLLMConnector(process.env.LLM_SYSTEM);
      const issueTrackingSystem = initializeIssueTracker(
        issueTrackerSystemSelection as ('jira' | 'github' | 'linear' | 'asana' | 'trello'),
        llmProvider
      );
      if (!argv.issueNumber) {
        throw new Error("Issue number is required.");
      }
      const analysis = await issueTrackingSystem.getIssue(argv.issueNumber);
      console.log(JSON.stringify(analysis, null, 2));
    }
  )
  .command(
    "watch <issue>",
    "Watch for code changes and provide real-time BDD-focused feedback",
    (yargs) => {
      return yargs
        .positional("issue", {
          describe: "The issue ID/number to use as the north star",
          type: "string",
        })
        .option("path", {
          describe: "Path to the git repository to watch",
          type: "string",
          default: process.cwd(),
        });
    },
    async (argv) => {
      // Ensure config exists
      if (!(await ensureConfig())) {
        return;
      }

      const issueTrackerSystemSelection = process.env.ISSUE_TRACKER_SYSTEM;
      const llmProvider = initializeLLMConnector(process.env.LLM_SYSTEM);
      const issueTrackingSystem = initializeIssueTracker(
        issueTrackerSystemSelection as ('jira' | 'github' | 'linear' | 'asana' | 'trello'),
        llmProvider
      );

      if (!argv.issue) {
        throw new Error("Issue ID is required for watch command");
      }

      console.log(`\n🎯 Fetching issue details...`);
      const issue = await issueTrackingSystem.getIssue(argv.issue);

      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`🐦 FLIGHT PATH (North Star): Issue #${issue.id}`);
      console.log(`📋 ${issue.title}`);
      if (issue.status) {
        console.log(`📊 Status: ${issue.status}`);
      }
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

      if (issue.description) {
        console.log(`Description:\n${issue.description.substring(0, 300)}${issue.description.length > 300 ? '...' : ''}\n`);
      }

      if (issue.analysis?.acceptance_criteria && issue.analysis.acceptance_criteria.length > 0) {
        console.log(`✅ Acceptance Criteria:`);
        issue.analysis.acceptance_criteria.forEach((criteria, i) => {
          console.log(`   ${i + 1}. ${criteria}`);
        });
        console.log('');
      }

      console.log(`🐦 Passenger Pigeon using ${llmProvider.id}`);
      console.log(`🪺 Watching nest: ${argv.path}\n`);

      const gitWatcher = new GitWatcher(argv.path as string);
      const coach = new DevelopmentCoach(llmProvider, issue);

      // Handle Ctrl+C gracefully
      process.on('SIGINT', async () => {
        console.log('\n\n🐦 Passenger Pigeon returning to the nest...');
        await gitWatcher.stop();
        console.log(coach.getSummary());
        process.exit(0);
      });

      // Listen for commits
      gitWatcher.on('commit', async (change) => {
        console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`📦 New commit detected`);
        if (change.message) {
          console.log(`💬 "${change.message}"`);
        }
        console.log(`📝 Files changed: ${change.files.join(', ')}`);
        console.log(`\n🐦 Passenger Pigeon coos:\n`);

        try {
          const feedback = await coach.provideFeedback(change, 'commit');
          console.log(feedback.message);
        } catch (error: any) {
          console.error(`\n❌ Error getting feedback: ${error.message}`);
        }

        console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`👂 Waiting for your next move...\n`);
      });

      // Listen for file changes (unstaged)
      gitWatcher.on('change', async (change) => {
        console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`📝 Changes detected (not yet committed)`);
        console.log(`📝 Files: ${change.files.join(', ')}`);
        console.log(`\n🐦 Passenger Pigeon coos:\n`);

        try {
          const feedback = await coach.provideFeedback(change, 'change');
          console.log(feedback.message);
        } catch (error: any) {
          console.error(`\n❌ Error getting feedback: ${error.message}`);
        }

        console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`👂 Waiting for your next move...\n`);
      });

      await gitWatcher.start();

      // Keep the process alive
      await new Promise(() => {});
    }
  )
  .command(
    "init",
    "Initialize Passenger configuration for the current project.",
    (yargs) => yargs,
    async () => {
      await runInit();
    }
  )
  .command(
    "old-init-backup",
    false, // Hidden command
    (yargs) => yargs,
    async () => {
      const answers = await inquirer.prompt([
        {
          type: "list",
          name: "ISSUE_TRACKER_SYSTEM",
          message: "Which issue tracking system do you use?",
          choices: ["github", "jira", "linear", "asana", "trello"],
        },
        {
          type: "list",
          name: "LLM_SYSTEM",
          message: "Which LLM provider do you want to use?",
          choices: ["gemini", "claude", "openai"],
          default: "gemini",
        },
        {
          type: "input",
          name: "GITHUB_OWNER",
          message: "Enter your GitHub owner/organization name:",
          when: (answers) => answers.ISSUE_TRACKER_SYSTEM === "github",
        },
        {
          type: "input",
          name: "GITHUB_REPO",
          message: "Enter your GitHub repository name:",
          when: (answers) => answers.ISSUE_TRACKER_SYSTEM === "github",
        },
        {
          type: "input",
          name: "GITHUB_INSTALLATION_ID",
          message: "Enter your GitHub App Installation ID (optional):",
          when: (answers) => answers.ISSUE_TRACKER_SYSTEM === "github",
        },
        {
          type: "input",
          name: "GITHUB_PRIVATE_KEY_PATH",
          message: "Enter the absolute path to your GitHub App private key file (e.g., /home/user/github-app.pem):",
          when: (answers) => answers.ISSUE_TRACKER_SYSTEM === "github",
        },
        {
          type: "input",
          name: "GEMINI_API_KEY",
          message: "Enter your Gemini API Key:",
          when: (answers) => answers.LLM_SYSTEM === "gemini",
        },
        {
          type: "input",
          name: "ANTHROPIC_API_KEY",
          message: "Enter your Anthropic (Claude) API Key:",
          when: (answers) => answers.LLM_SYSTEM === "claude",
        },
        {
          type: "input",
          name: "OPENAI_API_KEY",
          message: "Enter your OpenAI API Key:",
          when: (answers) => answers.LLM_SYSTEM === "openai",
        },
      ]);

      const configPath = join(process.cwd(), CONFIG_FILE_NAME);
      writeFileSync(configPath, JSON.stringify(answers, null, 2));
      console.log(`Configuration saved to ${CONFIG_FILE_NAME}`);
      console.log("You can now set these as environment variables or use the .env file.");
    }
  )
  .option("verbose", {
    alias: "v",
    type: "boolean",
    description: "Run with verbose logging",
  })
  .parse();
