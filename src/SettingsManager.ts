import { Plugin } from "obsidian";

export interface WhisperSettings {
	apiKey: string;
	apiUrl: string;
	model: string;
	prompt: string;
	language: string;
	saveAudioFile: boolean;
	saveAudioFilePath: string;
	debugMode: boolean;
	createNewFileAfterRecording: boolean;
	createNewFileAfterRecordingPath: string;
	useSegmentsFromTranscription: boolean;
	postProcessingEnabled: boolean;
	postProcessingApiKey: string;
	postProcessingApiBaseAddress: string;
	postProcessingModelName: string;
	postProcessingCustomPrompt: string;
}

export const DEFAULT_SETTINGS: WhisperSettings = {
	apiKey: "",
	apiUrl: "https://api.openai.com/v1/audio/transcriptions",
	model: "whisper-1",
	prompt: "",
	language: "en",
	saveAudioFile: true,
	saveAudioFilePath: "",
	debugMode: false,
	createNewFileAfterRecording: true,
	createNewFileAfterRecordingPath: "",
	useSegmentsFromTranscription: false,
	postProcessingEnabled: false,
	postProcessingApiKey: "sk-...xxxx",
    postProcessingApiBaseAddress: "https://api.openai.com/v1/engines",
    postProcessingModelName: "gpt-3.5-turbo",
    postProcessingCustomPrompt: "",
};

export class SettingsManager {
	private plugin: Plugin;

	constructor(plugin: Plugin) {
		this.plugin = plugin;
	}

	async loadSettings(): Promise<WhisperSettings> {
		return Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.plugin.loadData()
		);
	}

	async saveSettings(settings: WhisperSettings): Promise<void> {
		await this.plugin.saveData(settings);
	}
}
