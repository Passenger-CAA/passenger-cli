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

### Environment setup

Use the following

#### Using Jira Connector? (because thats all we support right now)

Here are the required environment variables to place in an `.env` file or equivilent inline passing environment variables.

```txt
OPENAI_API_KEY=""
JIRA_HOST="https://amalgam.atlassian.net"
JIRA_USER_EMAIL="user@example.com"
JIRA_API_TOKEN=""
```
