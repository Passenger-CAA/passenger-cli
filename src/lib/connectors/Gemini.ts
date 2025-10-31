
import { Connector, IConfigurationValue } from "../mixins/Connector";
import { LLMProvider } from "../types/LLMProvider.types";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Cache as FileSystemCache } from "file-system-cache";
import { Cache } from "../mixins/Cache";

type SupportedEnvVars = 'GEMINI_API_KEY';



export class GeminiConnector implements LLMProvider {

    // ... other properties ...

    readonly id = "gemini";
    connectorMixin!: Connector<SupportedEnvVars>;
    cacheMixin!: FileSystemCache;
    private genAI: GoogleGenerativeAI;

    constructor() {
        this.connectorMixin = new Connector({
            id: "gemini"
        });
        this.cacheMixin = new Cache();

        const configurations: Record<SupportedEnvVars, IConfigurationValue> = {
            GEMINI_API_KEY: {
                value: process.env['GEMINI_API_KEY'],
                error: `Please set the environment variable: GEMINI_API_KEY`,
            },
        };

        this.connectorMixin.validateConfigurations(configurations);
        this.connectorMixin.setConfigurations(configurations);

        const apiKey = this.connectorMixin.getConfiguration('GEMINI_API_KEY');
        this.genAI = new GoogleGenerativeAI(apiKey);
    }

    async generateContent(prompt: string): Promise<string> {
        const model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    }
}
