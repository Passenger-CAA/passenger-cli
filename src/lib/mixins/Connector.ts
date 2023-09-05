export default class Connector {
  id: string;
  apiKeyName: string;
  apiKeyValue: string | undefined;

  constructor({ id, apiKeyName }: { id: string; apiKeyName: string }) {
    this.id = id;
    this.apiKeyName = apiKeyName;
  }

  /**
   * Initializes the API key from an environment variable.
   *
   * @param {string} keyName - The name of the environment variable containing the API key.
   * @throws {Error} If the environment variable is not set.
   */
  setAPIKeyFromEnv() {
    if (!process.env[this.apiKeyName]) {
      throw new Error(
        `Please set the environment variable ${this.apiKeyName}.`
      );
    }
    this.apiKeyValue = process.env[this.apiKeyName];
  }
}
