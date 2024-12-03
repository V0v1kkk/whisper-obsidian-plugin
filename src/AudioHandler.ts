import axios from "axios";
import Whisper from "main";
import { Notice, MarkdownView } from "obsidian";
import { getBaseFileName } from "./utils";

export class AudioHandler {
	private plugin: Whisper;

	constructor(plugin: Whisper) {
		this.plugin = plugin;
	}

	async sendAudioData(blob: Blob, fileName: string): Promise<void> {
		// Get the base file name without extension
		const baseFileName = getBaseFileName(fileName);

		const audioFilePath = `${
			this.plugin.settings.saveAudioFilePath
				? `${this.plugin.settings.saveAudioFilePath}/`
				: ""
		}${fileName}`;

		const noteFilePath = `${
			this.plugin.settings.createNewFileAfterRecordingPath
				? `${this.plugin.settings.createNewFileAfterRecordingPath}/`
				: ""
		}${baseFileName}.md`;

		if (this.plugin.settings.debugMode) {
			new Notice(`Sending audio data size: ${blob.size / 1000} KB`);
		}

		if (!this.plugin.settings.apiKey) {
			new Notice(
				"API key is missing. Please add your API key in the settings."
			);
			return;
		}

		const formData = new FormData();
		formData.append("file", blob, fileName);
		formData.append("model", this.plugin.settings.model);
		formData.append("language", this.plugin.settings.language);
		if (this.plugin.settings.prompt)
			formData.append("prompt", this.plugin.settings.prompt);

		try {
			// If the saveAudioFile setting is true, save the audio file
			if (this.plugin.settings.saveAudioFile) {
				const arrayBuffer = await blob.arrayBuffer();
				await this.plugin.app.vault.adapter.writeBinary(
					audioFilePath,
					new Uint8Array(arrayBuffer)
				);
				new Notice("Audio saved successfully.");
			}
		} catch (err) {
			console.error("Error saving audio file:", err);
			new Notice("Error saving audio file: " + err.message);
		}

		try {
			if (this.plugin.settings.debugMode) {
				new Notice("Parsing audio data:" + fileName);
			}
			const response = await axios.post(
				this.plugin.settings.apiUrl,
				formData,
				{
					headers: {
						"Content-Type": "multipart/form-data",
						Authorization: `Bearer ${this.plugin.settings.apiKey}`,
					},
				}
			);

			let resultText = this.plugin.settings.useSegmentsFromTranscription 
				? response.data.segments.map((segment) => segment.text).join('\n') 
				: response.data.text;

			resultText = await this.postprocessText(resultText);

			// Determine if a new file should be created
			const activeView =
				this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
			const shouldCreateNewFile =
				this.plugin.settings.createNewFileAfterRecording || !activeView;

			if (shouldCreateNewFile) {
				await this.plugin.app.vault.create(
					noteFilePath,
					`![[${audioFilePath}]]\n${resultText}`
				);
				await this.plugin.app.workspace.openLinkText(
					noteFilePath,
					"",
					true
				);
			} else {
				// Insert the transcription at the cursor position
				const editor =
					this.plugin.app.workspace.getActiveViewOfType(
						MarkdownView
					)?.editor;
				if (editor) {
					const cursorPosition = editor.getCursor();
					editor.replaceRange(resultText, cursorPosition);

					// Move the cursor to the end of the inserted text
					const newPosition = {
						line: cursorPosition.line,
						ch: cursorPosition.ch + resultText.length,
					};
					editor.setCursor(newPosition);
				}
			}

			new Notice("Audio parsed successfully.");
		} catch (err) {
			console.error("Error parsing audio:", err);
			new Notice("Error parsing audio: " + err.message);
		}
	}

	private async postprocessText(text: string): Promise<string> {
		if (!this.plugin.settings.postProcessingEnabled || text.length === 0) {
			// Return the original text if post-processing is disabled or the text is empty
			return text;
		}
	
		const prompt = `${this.plugin.settings.postProcessingCustomPrompt}\n\n${text}`;
	
		try {
			const apiBase = this.plugin.settings.postProcessingApiBaseAddress;
			const modelName = this.plugin.settings.postProcessingModelName;
			const apiKey = this.plugin.settings.postProcessingApiKey;
	
			// Determine the API endpoint based on the model name
			let apiUrl = `${apiBase}/v1/completions`;
			let requestData: any = {
				model: modelName,
				prompt: prompt,
				//max_tokens: 1000, // Adjust based on your needs
			};
	
			// If using a ChatGPT model, adjust the endpoint and request format
			if (modelName.startsWith("gpt-3.5-") || modelName.startsWith("gpt-4")) {
				apiUrl = `${apiBase}/v1/chat/completions`;
				requestData = {
					model: modelName,
					messages: [
						{ role: "system", content: this.plugin.settings.postProcessingCustomPrompt },
						{ role: "user", content: text },
					],
					//max_tokens: 1000, // Adjust based on your needs
				};
			}
	
			const response = await axios.post(apiUrl, requestData, {
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${apiKey}`,
				},
			});
	
			// Extract the processed text based on the response format
			let processedText = text;
			if (response.data.choices && response.data.choices.length > 0) {
				if (response.data.choices[0].text) {
					// For completion models
					processedText = response.data.choices[0].text.trim();
				} else if (response.data.choices[0].message && response.data.choices[0].message.content) {
					// For chat models
					processedText = response.data.choices[0].message.content.trim();
				}
			}
	
			return processedText;
		} catch (error) {
			console.error("Error during postprocessing:", error);
			new Notice("Error during postprocessing: " + error.message);
			// Return the original text if post-processing fails
			return text;
		}
	}
}
