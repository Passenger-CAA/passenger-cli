# Passenger

Passenger, named after the diligent passenger pigeon, is a tool that keeps you focused on project requirements while you code. It provides real-time BDD-focused feedback by watching your development and comparing changes against issue requirements from GitHub, Jira, Linear, Asana, or Trello.

## Features
- **BDD on Steroids**: Real-time feedback as you code, keeping requirements as your "north star"
- **Watch Mode**: Monitors git commits and file changes, providing instant guidance from Passenger Pigeon
- **Multi-Platform Support**: Works with GitHub, Jira, Linear, Asana, and Trello
- **Multi-LLM Support**: Choose between Claude, Gemini, or OpenAI for analysis
- **Score Mode**: Compare source code alignment with issue requirements
- **Configuration File**: Simple `passenger.json` setup instead of managing environment variables

## Installation

### For Local Development (npm link)
```bash
git clone <your-repo>
cd passenger-cli
npm install
npm link
```

Now `passenger` command is available globally.

### For Use in Other Projects
```bash
npm install -g passenger
# or for local project
npm install --save-dev passenger
```

## Quick Start

1. **Initialize Passenger in your project:**
```bash
cd your-project
passenger init
```

This will create a `passenger.json` file with your configuration (issue tracker + LLM settings).

2. **Start watching your development:**
```bash
passenger watch <issue-id>
```

Passenger Pigeon will now watch your git commits and file changes, providing real-time BDD-focused feedback!

## Getting Started

### Configuration

Passenger uses a `passenger.json` file in your project root. Run `passenger init` to create it interactively, or create it manually:

```json
{
  "issueTracker": {
    "system": "github",
    "github": {
      "owner": "your-org",
      "repo": "your-repo",
      "privateKeyPath": "/path/to/github-app-key.pem"
    }
  },
  "llm": {
    "system": "claude",
    "claude": {
      "apiKey": "your-api-key"
    }
  }
}
```

**Supported Issue Trackers:**
- `github` - Requires: owner, repo, privateKeyPath
- `jira` - Requires: host, userEmail, apiToken
- `linear` - Requires: apiKey
- `asana` - Requires: personalAccessToken
- `trello` - Requires: apiKey, userToken

**Supported LLMs:**
- `claude` - Requires: apiKey
- `gemini` - Requires: apiKey
- `openai` - Requires: apiKey

### Legacy: Environment Variables

You can still use environment variables instead of `passenger.json`:
```bash
ISSUE_TRACKER_SYSTEM=github
LLM_SYSTEM=claude
GITHUB_OWNER=your-org
GITHUB_REPO=your-repo
GITHUB_PRIVATE_KEY_PATH=/path/to/key.pem
ANTHROPIC_API_KEY=your-key
```

## Usage

### Watch Mode (BDD on Steroids)
```bash
passenger watch 123
```
Watches your development and provides real-time feedback based on issue #123.

### Score Mode
```bash
passenger score 123 src/myfile.ts
```
Compares a specific file against issue requirements.

### Analyze Mode
```bash
passenger analyze 123
```
Analyzes an issue and returns structured BDD analysis.

For detailed watch mode usage, see [WATCH_COMMAND_GUIDE.md](./WATCH_COMMAND_GUIDE.md).

## Contribution
We welcome contributions! See the [Contribution Guide](link-to-contribution-guide) for details on how to contribute.

## License
Passenger CLI is distributed under the [MIT License](link-to-license), ensuring it remains free and open for community development.

## Contact
For any inquiries, get in touch with us at [contact@email.com](mailto:contact@email.com).

## Acknowledgments
Special thanks to the community for their support and contributions!