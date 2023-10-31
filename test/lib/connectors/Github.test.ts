import { expect, test, beforeEach } from "bun:test";
import {GithubConnector} from "../../../src/lib/connectors/Github"

beforeEach(() => {
    process.env.GITHUB_OWNER = undefined;
    process.env.GITHUB_REPO = undefined;
    process.env.GITHUB_INSTALLATION_ID = undefined;
});

test("should throw errors when ENV var 'GITHUB_OWNER' is missing", () => {
    process.env.GITHUB_OWNER = undefined;
    process.env.GITHUB_REPO = 'abc123';
    process.env.GITHUB_INSTALLATION_ID = 'abc123';
    expect(() => (new GithubConnector())).toThrow("Please set the environment variable: GITHUB_OWNER")
});

test("should throw errors when ENV var 'GITHUB_REPO' is missing", () => {
    process.env.GITHUB_OWNER = 'abc123';
    process.env.GITHUB_REPO = undefined;
    process.env.GITHUB_INSTALLATION_ID = 'abc123';
    expect(() => (new GithubConnector())).toThrow("Please set the environment variable: GITHUB_REPO")
});

test("should throw errors when ENV var 'GITHUB_INSTALLATION_ID' is missing", () => {
    process.env.GITHUB_OWNER = 'abc123';
    process.env.GITHUB_REPO = 'abc123';
    process.env.GITHUB_INSTALLATION_ID = undefined;
    expect(() => (new GithubConnector())).toThrow("Please set the environment variable: GITHUB_INSTALLATION_ID")
});

