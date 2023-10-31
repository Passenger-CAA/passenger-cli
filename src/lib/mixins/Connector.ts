export interface IConfigurationValue {
  value: string | undefined;
  error: string;
  optional?: boolean;
}

export default class Connector<T extends string> {
  private id: string;
  #configurations: Record<T, string> = {} as any;

  constructor(options: { id: string }) {
    this.id = options.id;
  }

  validateConfigurations(configurations: Record<T, IConfigurationValue>): void {
    Object.keys(configurations).forEach((key) => {
      const { value, error, optional } = configurations[key as T];
      if (!value && !optional) {
        throw new Error(error || `Configuration for ${key} is missing`);
      }
    });
  }

  setConfigurations(configurations: Record<T, IConfigurationValue>): void {
    Object.keys(configurations).forEach((key) => {
      const { value } = configurations[key as T];
      if (value !== undefined) {
        this.#configurations[key as T] = value;
      }
    });
  }

  getConfiguration(key: T): string {
    return this.#configurations[key];
  }

  /**
   * Logs messages to the console with the Connector instance's ID as a prefix.
   * @param {...string} chunks - The message chunks to log.
   */
  log(...chunks: string[]): void {
    const formattedId = `[${this.id.toUpperCase()}]:`;
    console.log(formattedId, ...chunks);
  }
}
