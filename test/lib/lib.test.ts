import { expect, test, beforeAll } from "bun:test";
import { initializeIssueTracker } from "../../src/lib/lib";
import { GithubConnector } from "../../src/lib/connectors/Github";
import { JiraConnector } from "../../src/lib/connectors/Jira";


beforeAll(() => {
    process.env.GITHUB_OWNER = 'hello';
    process.env.GITHUB_REPO = 'world';
    process.env.GITHUB_INSTALLATION_ID = '1'; 
});

test("should initialize Github", () => {
    process.env.ISSUE_TRACKER_SYSTEM = 'github';
    const issueTracker = initializeIssueTracker('github');
    expect(issueTracker instanceof GithubConnector).toBeTruthy();
});

// TODO
test.skip("should initialize Jira", () => {
    process.env.ISSUE_TRACKER_SYSTEM = 'jira';
    const issueTracker = initializeIssueTracker('jira');
    expect(issueTracker instanceof JiraConnector).toBeTruthy();
});

test("should throw an error when an unsupported issue tracking system is provided", () => {
    expect(() => initializeIssueTracker('unsupported' as any)).toThrow('Unsupported or undefined issue tracker system');
});