import { expect, test, beforeEach } from "bun:test";
import { GithubConnector } from '../../../src/lib/connectors/Github';

let ghConnector: GithubConnector;

beforeEach(() => {
    process.env.GITHUB_OWNER = 'hello';
    process.env.GITHUB_REPO = 'world';
    process.env.GITHUB_INSTALLATION_ID = '1';
    ghConnector = new GithubConnector();
});


test('should set GITHUB_OWNER configuration for user of ConnectorMixin', () => {
  const configProperty = ghConnector.connectorMixin.getConfiguration('GITHUB_OWNER');
  expect(configProperty).toBeDefined();
  // Add any additional expectations as needed.
});

test('should set GITHUB_REPO configuration for user of ConnectorMixin', () => {
  const configProperty = ghConnector.connectorMixin.getConfiguration('GITHUB_REPO');
  expect(configProperty).toBeDefined();
  // Add any additional expectations as needed.
});
