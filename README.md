# Passenger – Code Alignment Assistant – 🐦

---

## Introduction

Have you ever meticulously coded a solution, only to discover it wasn't addressing the core issue? That's where Passenger comes in.

Passenger is a Code-Alignment Assistant (CAA) the first in its class, crafted with the belief in a harmonious co-working future between AI and developers. Our tool enhances development workflows, ensuring code consistency with project issues and fostering a collaborative environment where AI and human intelligence complement each other.

Passenger refines the synergy between software testing and business objectives. By converting both tickets and code into a comparable medium, we ensure that every piece of development is in harmony with business needs. The endgame? Say goodbye to manual test writing, embrace both efficiency and precision and get advice as you develop your solution your way.

---

## Core Features

- **Test Derivation from Tickets:**  
   Transforms high-level requirements from tickets into actionable and testable scenarios, ensuring that business objectives are always in focus.

- **Code Behavior Insights:**  
   Delves deep into the source code or PRs, extracting their core behaviors. These behaviors are then matched with the tests derived from tickets, ensuring a coherent alignment.

- **Comparative Analysis:**  
   A streamlined comparison between the behaviors identified in the code and the requirements from tickets. It's all about ensuring that the code genuinely addresses business needs.

- **Feedback Loop:**  
   Provides actionable feedback in real-time for any discrepancies between code behaviors and ticket-derived tests, enabling swift and precise course corrections. Fail fast paperclip.

- **Integrated Workflow:**  
   Engineered to integrate seamlessly with leading project management and development platforms, facilitating a cohesive and uninterrupted development cycle. We support Jira, Github, and more.

---

## Benefits

- **Efficient Development Cycle:** By identifying and rectifying discrepancies early, we streamline the development process, reducing back-and-forths. That no only let you push back to the business but let the code focus on the solution.
- **Transparent Alignment:** A clear, concise overview of how your code aligns with business objectives, is beneficial for both technical strategists and project stakeholders.

## Environment setup

Use the following

### Using Jira Connector?

_(because thats all we support right now)_

Here are the required environment variables to place in an `.env` file or equivalent inline passing environment variables.

### Costs

_To get the best accuracy, we use GPT-4_, **This requires a billing account** and at-least `$1` credit. From our initial tests with pay-as-you-go, it seems to cost 0.0001 dollars so far I have not been charged for the API access, I think for a larger team you can expect a cost from OpenAI and that's a price you might consider worthwhile considering all of the aggravation this tool will save you, business and developer alignment has always been a problem and tests can be written wrong, this tool will spare all of that. I think depending on how good Passenger becomes the benefits will quickly outweigh the costs.

### Requirements

- bun (probably but we will be removing that barier soon)
- OpenAI paid account with at least $1 credit and API key and billing setup
- an existing file with a solution for an issue, this can be written in any programming language, see ./docs/example
- A (Jira/GitHub with issues) account 
- a project and an issue to compare

#### For GitHub install

1. Please add the GitHub App to your organization or specific repo(s) It is **a simple one-click secure way to connect.**
[Passenger Code-Alignment Assistant App](https://github.com/apps/passenger-caa)

2. Add and populate the following environment variables
```toml
ISSUE_TRACKER_SYSTEM='github'
OPENAI_API_KEY=""
# Github only
GITHUB_OWNER="adam-cyclones"
GITHUB_REPO="passenger"
# The private key you generated using the GitHub app https://github.com/apps/passenger-caa
GITHUB_PRIVATE_KEY_PATH="path/to/github-app-pem-passenger-cca.pem"
# *optional* Save a request speeds things up a tiny bit
GITHUB_INSTALLATION_ID="123456789" 

```

#### For Jira install
```toml
ISSUE_TRACKER_SYSTEM='jira'
OPENAI_API_KEY=""
JIRA_HOST="https://amalgam.atlassian.net"
JIRA_USER_EMAIL="user@example.com"
JIRA_API_TOKEN=""
```

