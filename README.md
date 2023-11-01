# Passenger

Passenger, named subtly after the diligent passenger pigeon, is a tool that pairs your code with project objectives by comparing source code against issues from GitHub or Jira. Through AI, it assesses the alignment and offers feedback, aiding developers in aligning their code accurately with project goals.

## Features
- Real-time comparison between source code and GitHub Issues or Jira tickets, empowered by AI.
- Scoring system that measures the alignment between code and project objectives, providing actionable feedback to developers.
- User-friendly CLI for effortless interaction.

## Getting Started

### Connect to GitHub
1. Add the GitHub App to your organization or specific repo(s) through the [Passenger Code-Alignment Assistant App](https://github.com/apps/passenger-caa) for a one-click secure connection.
2. Populate the following environment variables:
```bash
ISSUE_TRACKER_SYSTEM='github'
OPENAI_API_KEY=""
# Github only
GITHUB_OWNER="adam-cyclones"
GITHUB_REPO="passenger"
# The private key you generated using the GitHub app
GITHUB_PRIVATE_KEY_PATH="path/to/github-app-pem-passenger-cca.pem"
# *optional* Save a request speeds things up a tiny bit

## Usage
Refer to the [Usage Guide](link-to-usage-guide) for examples and instructions on how to use Passenger.

## Contribution
We welcome contributions! See the [Contribution Guide](link-to-contribution-guide) for details on how to contribute.

## License
Passenger CLI is distributed under the [MIT License](link-to-license), ensuring it remains free and open for community development.

## Contact
For any inquiries, get in touch with us at [contact@email.com](mailto:contact@email.com).

## Acknowledgments
Special thanks to the community for their support and contributions!