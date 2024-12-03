import Whisper from "main";
import { App, PluginSettingTab, Setting } from "obsidian";
import { SettingsManager } from "./SettingsManager";

export class WhisperSettingsTab extends PluginSettingTab {
    private plugin: Whisper;
    private settingsManager: SettingsManager;

    constructor(app: App, plugin: Whisper) {
        super(app, plugin);
        this.plugin = plugin;
        this.settingsManager = plugin.settingsManager;
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();

        // General Settings Section
        this.createHeader("General Settings");
        this.createApiKeySetting();
        this.createApiUrlSetting();
        this.createModelSetting();
        this.createPromptSetting();
        this.createLanguageSetting();
		this.createUseSegmentsSetting();

        // Divider
        containerEl.createEl("hr");

        // Audio Settings Section
        this.createHeader("Audio Settings");
        this.createSaveAudioFileToggleSetting();
        this.createSaveAudioFilePathSetting();
        this.createNewFileToggleSetting();
        this.createNewFilePathSetting();

        // Divider
        containerEl.createEl("hr");

        // Post Processing Settings Section
        this.createHeader("Post Processing Settings");
        this.createPostProcessingEnabledToggleSetting();
        this.createPostProcessingApiKeySetting();
        this.createPostProcessingApiBaseAddressSetting();
        this.createPostProcessingModelNameSetting();
        this.createPostProcessingCustomPromptSetting();

		// Divider
        containerEl.createEl("hr");

        // Debug Settings Section
        this.createHeader("Debug Settings");
        this.createDebugModeToggleSetting();
    }

    // Helper Methods
    private createHeader(text: string): void {
        this.containerEl.createEl("h2", { text });
    }

    private createTextSetting(
        name: string,
        description: string,
        placeholder: string,
        value: string,
        onChange: (value: string) => Promise<void>
    ): void {
        new Setting(this.containerEl)
            .setName(name)
            .setDesc(description)
            .addText((text) =>
                text
                    .setPlaceholder(placeholder)
                    .setValue(value)
                    .onChange(onChange)
            );
    }

    private createTextAreaSetting(
        name: string,
        description: string,
        placeholder: string,
        value: string,
        onChange: (value: string) => Promise<void>
    ): void {
        new Setting(this.containerEl)
            .setName(name)
            .setDesc(description)
            .addTextArea((text) => {
                text
                    .setPlaceholder(placeholder)
                    .setValue(value)
                    .onChange(onChange);
                text.inputEl.rows = 5; // Increase the size of the text area
            });
    }

    // General Settings Methods
    private createApiKeySetting(): void {
        this.createTextSetting(
            "API Key",
            "Enter your OpenAI API key.",
            "sk-...",
            this.plugin.settings.apiKey,
            async (value) => {
                this.plugin.settings.apiKey = value;
                await this.settingsManager.saveSettings(this.plugin.settings);
            }
        );
    }

    private createApiUrlSetting(): void {
        this.createTextSetting(
            "API URL",
            "Enter the API URL for transcription.",
            "https://api.openai.com/v1/audio/transcriptions",
            this.plugin.settings.apiUrl,
            async (value) => {
                this.plugin.settings.apiUrl = value;
                await this.settingsManager.saveSettings(this.plugin.settings);
            }
        );
    }

    private createModelSetting(): void {
        this.createTextSetting(
            "Model",
            "Specify the model to use for transcription.",
            "whisper-1",
            this.plugin.settings.model,
            async (value) => {
                this.plugin.settings.model = value;
                await this.settingsManager.saveSettings(this.plugin.settings);
            }
        );
    }

    private createPromptSetting(): void {
        this.createTextAreaSetting(
            "Prompt",
            "Enter a custom prompt to guide the transcription.",
            "Your custom prompt here...",
            this.plugin.settings.prompt,
            async (value) => {
                this.plugin.settings.prompt = value;
                await this.settingsManager.saveSettings(this.plugin.settings);
            }
        );
    }

    private createLanguageSetting(): void {
        this.createTextSetting(
            "Language",
            "Specify the language for transcription.",
            "en",
            this.plugin.settings.language,
            async (value) => {
                this.plugin.settings.language = value;
                await this.settingsManager.saveSettings(this.plugin.settings);
            }
        );
    }

    // Audio Settings Methods
    private createSaveAudioFileToggleSetting(): void {
        new Setting(this.containerEl)
            .setName("Save Audio File")
            .setDesc("Enable to save the recorded audio file.")
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.settings.saveAudioFile)
                    .onChange(async (value) => {
                        this.plugin.settings.saveAudioFile = value;
                        await this.settingsManager.saveSettings(this.plugin.settings);
                    })
            );
    }

    private createSaveAudioFilePathSetting(): void {
        this.createTextSetting(
            "Audio File Save Path",
            "Specify the path to save audio files.",
            "Audio/",
            this.plugin.settings.saveAudioFilePath,
            async (value) => {
                this.plugin.settings.saveAudioFilePath = value;
                await this.settingsManager.saveSettings(this.plugin.settings);
            }
        );
    }

    private createNewFileToggleSetting(): void {
        new Setting(this.containerEl)
            .setName("Create New Note After Recording")
            .setDesc("Enable to create a new note after recording.")
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.settings.createNewFileAfterRecording)
                    .onChange(async (value) => {
                        this.plugin.settings.createNewFileAfterRecording = value;
                        await this.settingsManager.saveSettings(this.plugin.settings);
                    })
            );
    }

    private createNewFilePathSetting(): void {
        this.createTextSetting(
            "New Note Save Path",
            "Specify the path to save new notes.",
            "Notes/",
            this.plugin.settings.createNewFileAfterRecordingPath,
            async (value) => {
                this.plugin.settings.createNewFileAfterRecordingPath = value;
                await this.settingsManager.saveSettings(this.plugin.settings);
            }
        );
    }

	private createUseSegmentsSetting(): void {
        new Setting(this.containerEl)
            .setName("Use Segments From Transcription")
            .setDesc("Enable to use segments from the transcription. Migth be better in some self-hosted scenarios.")
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.settings.useSegmentsFromTranscription)
                    .onChange(async (value) => {
                        this.plugin.settings.useSegmentsFromTranscription = value;
                        await this.settingsManager.saveSettings(this.plugin.settings);
                    })
            );
    }

    // Debug Settings Methods
    private createDebugModeToggleSetting(): void {
        new Setting(this.containerEl)
            .setName("Debug Mode")
            .setDesc("Enable to show debug information.")
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.settings.debugMode)
                    .onChange(async (value) => {
                        this.plugin.settings.debugMode = value;
                        await this.settingsManager.saveSettings(this.plugin.settings);
                    })
            );
    }

    // Post Processing Settings Methods
    private createPostProcessingEnabledToggleSetting(): void {
        new Setting(this.containerEl)
            .setName("Enable Post Processing")
            .setDesc("Enable or disable post processing of transcribed text.")
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.settings.postProcessingEnabled)
                    .onChange(async (value) => {
                        this.plugin.settings.postProcessingEnabled = value;
                        await this.settingsManager.saveSettings(this.plugin.settings);
                    })
            );
    }

    private createPostProcessingApiKeySetting(): void {
        this.createTextSetting(
            "Post Processing API Key",
            "Enter your API key for post processing.",
            "sk-...xxxx",
            this.plugin.settings.postProcessingApiKey,
            async (value) => {
                this.plugin.settings.postProcessingApiKey = value;
                await this.settingsManager.saveSettings(this.plugin.settings);
            }
        );
    }

    private createPostProcessingApiBaseAddressSetting(): void {
        this.createTextSetting(
            "Post Processing API Base Address",
            "Specify the endpoint for post processing.",
            "https://api.openai.com",
            this.plugin.settings.postProcessingApiBaseAddress,
            async (value) => {
                this.plugin.settings.postProcessingApiBaseAddress = value;
                await this.settingsManager.saveSettings(this.plugin.settings);
            }
        );
    }

    private createPostProcessingModelNameSetting(): void {
        this.createTextSetting(
            "Post Processing Model Name",
            "Specify the model to use for post processing.",
            "gpt-3.5-turbo",
            this.plugin.settings.postProcessingModelName,
            async (value) => {
                this.plugin.settings.postProcessingModelName = value;
                await this.settingsManager.saveSettings(this.plugin.settings);
            }
        );
    }

    private createPostProcessingCustomPromptSetting(): void {
        this.createTextAreaSetting(
            "Post Processing Custom Prompt",
            "Add a custom prompt to guide post processing.",
            "Your custom prompt here...",
            this.plugin.settings.postProcessingCustomPrompt,
            async (value) => {
                this.plugin.settings.postProcessingCustomPrompt = value;
                await this.settingsManager.saveSettings(this.plugin.settings);
            }
        );
    }
}