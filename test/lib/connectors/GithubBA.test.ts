import { expect, test, beforeEach, mock } from "bun:test";
import { GithubConnector } from "../../../src/lib/connectors/Github";
import { GeminiConnector } from "../../../src/lib/connectors/Gemini";
import { readFile } from "fs/promises";

mock.module("fs/promises", () => ({
    readFile: mock(() => Promise.resolve("mock-private-key"))
}));

mock.module("octokit", () => ({
    App: class MockApp {
        octokit = {
            request: mock((url: string, options: any) => {
                if (url.includes('/repos/{owner}/{repo}/installation')) {
                    return Promise.resolve({ data: { id: 123 } });
                }
                if (url.includes('/repos/{owner}/{repo}/issues/{issue_number}')) {
                    return Promise.resolve({ data: {
                        number: options.issue_number,
                        title: "Sample Issue Title",
                        body: "Sample Issue Body. As a user, I want to do X so that Y. Acceptance Criteria: Do A, Do B."
                    } });
                }
                return Promise.reject(new Error("Unknown octokit request"));
            })
        };
        getInstallationOctokit = mock(() => ({
            request: mock((url: string, options: any) => {
                if (url.includes('/repos/{owner}/{repo}/issues/{issue_number}')) {
                    return Promise.resolve({ data: {
                        number: options.issue_number,
                        title: "Sample Issue Title",
                        body: "Sample Issue Body. As a user, I want to do X so that Y. Acceptance Criteria: Do A, Do B."
                    } });
                }
                return Promise.reject(new Error("Unknown octokit request"));
            })
        }));
    }
}));

mock.module("../../../src/lib/connectors/Gemini", () => ({
    GeminiConnector: class MockGeminiConnector {
        generateContent = mock((prompt: string) => {
            const expectedJson = {
                ticket_id: "1",
                title: "Sample Issue Title",
                is_workable: true,
                missing_information: [],
                user_stories: [
                    {
                        as_a: "user",
                        i_want: "to do X",
                        so_that: "Y"
                    }
                ],
                acceptance_criteria: ["Do A", "Do B"]
            };
            return Promise.resolve(JSON.stringify(expectedJson));
        });
        connectorMixin = {
            getConfiguration: mock((key: string) => {
                if (key === 'GEMINI_API_KEY') return 'mock-gemini-api-key';
                return undefined;
            })
        };
    }
}));

beforeEach(() => {
    process.env.GITHUB_OWNER = "test-owner";
    process.env.GITHUB_REPO = "test-repo";
    process.env.GITHUB_INSTALLATION_ID = "123";
    process.env.GITHUB_PRIVATE_KEY_PATH = "/tmp/mock-key.pem";
    process.env.GEMINI_API_KEY = "mock-gemini-api-key";
});

test("should return structured analysis for a GitHub issue", async () => {
    const githubConnector = new GithubConnector();
    const issueNumber = 1;

    const analysis = await githubConnector.getIssue(issueNumber);

    expect(analysis).toEqual({
        ticket_id: "1",
        title: "Sample Issue Title",
        is_workable: true,
        missing_information: [],
        user_stories: [
            {
                as_a: "user",
                i_want: "to do X",
                so_that: "Y"
            }
        ],
        acceptance_criteria: ["Do A", "Do B"]
    });
});
