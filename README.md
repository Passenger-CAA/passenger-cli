# Passenger: Advancing Test Automation 🚀

---

## Introduction

Ever meticulously coded a solution, only to discover it wasn't addressing the core issue? That's where Passenger comes in.

Passenger refines the synergy between software testing and business objectives. By converting both tickets and code into a comparable medium, we ensure that every piece of development is in harmony with business needs. The endgame? Say goodbye to manual test writing, embracing both efficiency and precision, getting advice as you develop your solution your way.

---

## Core Features

- **Test Derivation from Tickets:**  
   Transforms high-level requirements from tickets into actionable and testable scenarios, ensuring that business objectives are always in focus.

- **Code Behavior Insights:**  
   Delves deep into the source code or PRs, extracting their core behaviors. These behaviors are then matched with the tests derived from tickets, ensuring a coherent alignment.

- **Comparative Analysis:**  
   A streamlined comparison between the behaviors identified in the code and the requirements from tickets. It's all about ensuring that the code genuinely addresses business needs.

- **Feedback Loop:**  
   Provides actionable feedback in real-time for any discrepancies between code behaviors and ticket-derived tests, enabling swift and precise course corrections. Fail really fast paperclip.

- **Integrated Workflow:**  
   Engineered to integrate seamlessly with leading project management and development platforms, facilitating a cohesive and uninterrupted development cycle. We support Jira, Github and more.

---

## Benefits

- **Automated Testing:** With Passenger's automation prowess, the days of manual test writing are behind us.
- **Efficient Development Cycle:** By identifying and rectifying discrepancies early, we streamline the development process, reducing back-and-forths. That no only let you push back to the business but let the code focus in on the solution.
- **Transparent Alignment:** A clear, concise overview of how your code aligns with business objectives, beneficial for both technical strategists and project stakeholders.

## Environment setup

Use the following

### Using Jira Connector?

_(because thats all we support right now)_

Here are the required environment variables to place in an `.env` file or equivilent inline passing environment variables.

### Requirements

- bun (probably but we will be removing that barier soon)
- openAI with api key and billing setup
- an existing file with a solution for a ticket, wrote in any programming language, see ./docs/example
- A jira account, a project and a ticket to compare

### Costs

With pay as you go, it seems to cost 0.0001 dolars so far I have not been charged for the API access, I think for a larger team you can expect a cost from OpenAI and thats a price you might consider worth while considering all of the agrovation this tool will save you, business and developer alignment has always been a problem and tests can be wrote wrong, this tool will spare all of that. I think depending on how good Passenger becomes the benifits will quickly outway the costs.

```txt
OPENAI_API_KEY=""
JIRA_HOST="https://amalgam.atlassian.net"
JIRA_USER_EMAIL="user@example.com"
JIRA_API_TOKEN=""
```
