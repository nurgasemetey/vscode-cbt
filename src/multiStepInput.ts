/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { QuickPickItem, window, Disposable, CancellationToken, QuickInputButton, QuickInput, ExtensionContext, QuickInputButtons, Uri, workspace } from 'vscode';
import { promises as fsp, existsSync } from 'fs';
import { homedir } from 'os';


/**
 * A multi-step input using window.createQuickPick() and window.createInputBox().
 * 
 * This first part uses the helper class `MultiStepInput` that wraps the API for the multi-step case.
 */
export async function multiStepInput(context: ExtensionContext) {
	const configFilePath = workspace
		.getConfiguration()
		.get("cbt.filePath");
	console.log(`defaultFilePath: ${configFilePath}`);

	async function prepareFile() {
		const filePath = getFilePath();

		if (!existsSync(filePath)) {
			await createNewNote(filePath);
		}
	}
	function getFilePath() {
		const configFilePath = (workspace
			.getConfiguration()
			.get("cbt.filePath") as string)
			.replace("~/", homedir().concat("/"));
		console.log(`configFilePath: ${configFilePath}`)
		if (configFilePath) {
			return configFilePath;
		} else {
			return homedir + "/cbt.md";
		}
	}

	async function createNewNote(filePath: string) {
		try {
			await fsp.writeFile(filePath, "");
		} catch (error) {
			console.error(error);
			return window.showErrorMessage(
				`Cannot edit File in "${filePath}". Make sure the directory is present.`
			);
		}
	}

	async function appendToFileAtLine(filePath: string, content: string, lineNumber: number) {
		try {
			const result = await fsp.readFile(filePath, "utf8");

			let lines = result.toString().split("\n");
			lines.splice(lineNumber, 0, content);
			content = lines.join("\n");

			await fsp.writeFile(filePath, content);
		} catch (error: any) {
			if (error && error.code !== "ENOENT") {
				console.error(error);
				window.showErrorMessage("Cannot edit File.");
			}
		}
	}



	const resourceGroups: QuickPickItem[] = [
		{ "pattern": 'All or Nothing Thinking', "example": "I bombed the interview, I must be unhirable." },
		{ "pattern": 'Catastrophizing', "example": "I'm feeling jittery, I might be having a heart attack." },
		{ "pattern": 'Emotional Reasoning', "example": "I feel guilty, therefore I must have done something bad." },
		{ "pattern": 'Fortune Telling', "example": "The plane I'm about to get on will crash." },
		{ "pattern": 'Labeling', "example": "I failed a test, so I'm a bad student." },
		{ "pattern": 'Magnification of the Negative', "example": "I ate healthy this week, but I skipped my run." },
		{ "pattern": 'Mind Reading', "example": "I think I was rude to George, I'll bet he hates me." },
		{ "pattern": 'Minimization of the Positive', "example": "Many people liked my presentation, but I stumbled giving the intro, so it was bad." },
		{ "pattern": 'Other Blaming', "example": "That jerk is taking too long in line and I'm going to be late!" },
		{ "pattern": 'Over Generalization', "example": "No one asked me to dance, so no one ever will." },
		{ "pattern": 'Self Blaming', "example": "My son is failing in school, I must have failed him." },
		{ "pattern": 'Should Statements', "example": "I'm an adult, I shouldn't have these mental issues." },
	]
		.map(obj => ({ label: obj.pattern, detail: obj.example }));

	interface State {
		title: string;
		step: number;
		totalSteps: number;
		resourceGroup: QuickPickItem | any;
		challengeThought: string;
		runtime: QuickPickItem;
		automaticThought: string;
		alternativeThought: string;
	}

	async function collectInputs() {
		const state = {} as Partial<State>;
		await MultiStepInput.run(input => inputAuthomaticaThought(input, state));
		return state as State;
	}

	const title = 'Create Application Service';

	async function inputAuthomaticaThought(input: MultiStepInput, state: Partial<State>) {
		// TODO: Remember current value when navigating back.
		state.automaticThought = await input.showInputBox({
			title,
			step: 1,
			totalSteps: 4,
			value: state.automaticThought || '',
			prompt: 'Automatic thought',
			validate: validateNameIsUnique,
			shouldResume: shouldResume
		});
		return (input: MultiStepInput) => pickResourceGroup(input, state);
	}

	async function pickResourceGroup(input: MultiStepInput, state: Partial<State>) {
		const additionalSteps = state.automaticThought ? 1 : 0;
		const pick = await input.showQuickPick({
			title,
			step: 2 + additionalSteps,
			totalSteps: 4 + additionalSteps,
			placeholder: 'Pick a pattern',
			items: resourceGroups,
			activeItem: state.automaticThought ? state.resourceGroup : undefined,
			// buttons: [createResourceGroupButton],
			shouldResume: shouldResume
		});
		state.resourceGroup = pick;
		return (input: MultiStepInput) => inputChallengeThought(input, state);
	}

	async function inputChallengeThought(input: MultiStepInput, state: Partial<State>) {
		const additionalSteps = typeof state.resourceGroup === 'string' ? 1 : 0;
		console.log(typeof state.resourceGroup === 'string');
		// TODO: Remember current value when navigating back.
		state.challengeThought = await input.showInputBox({
			title,
			step: 3 + additionalSteps,
			totalSteps: 4 + additionalSteps,
			value: state.challengeThought || '',
			prompt: 'Challenge thought',
			validate: validateNameIsUnique,
			shouldResume: shouldResume
		});
		return (input: MultiStepInput) => inputAlternativeThought(input, state);
	}

	async function inputAlternativeThought(input: MultiStepInput, state: Partial<State>) {
		const additionalSteps = typeof state.challengeThought === 'string' ? 1 : 0;
		// TODO: Remember current value when navigating back.
		state.alternativeThought = await input.showInputBox({
			title,
			step: 4 + additionalSteps,
			totalSteps: 4 + additionalSteps,
			value: state.alternativeThought || '',
			prompt: 'Alternative thought',
			validate: validateNameIsUnique,
			shouldResume: shouldResume
		});
		// return (input: MultiStepInput) => pickRuntime(input, state);
	}

	function shouldResume() {
		// Could show a notification with the option to resume.
		return new Promise<boolean>((resolve, reject) => {
			// noop
		});
	}

	async function validateNameIsUnique(name: string) {
		// ...validate...
		return undefined;
	}

	const state = await collectInputs();
	try {
		await prepareFile();
		const filePath = getFilePath();
		const content = `
Date: ${new Date()}
Automatic thought: ${state.automaticThought}
Pattern: ${state.resourceGroup.label}
Challenge thought: ${state.challengeThought}
Alternative thought: ${state.alternativeThought}`
		await appendToFileAtLine(filePath, content, 0);
	} catch (error) {
		console.error(error);
		return window.showErrorMessage(
			"Cannot add to File."
		);
	}
	window.showInformationMessage(`Creating Application Service '${state.challengeThought} ${state.automaticThought} ${state.alternativeThought}'`);
}


// -------------------------------------------------------
// Helper code that wraps the API for the multi-step case.
// -------------------------------------------------------


class InputFlowAction {
	static back = new InputFlowAction();
	static cancel = new InputFlowAction();
	static resume = new InputFlowAction();
}

type InputStep = (input: MultiStepInput) => Thenable<InputStep | void>;

interface QuickPickParameters<T extends QuickPickItem> {
	title: string;
	step: number;
	totalSteps: number;
	items: T[];
	activeItem?: T;
	placeholder: string;
	buttons?: QuickInputButton[];
	shouldResume: () => Thenable<boolean>;
}

interface InputBoxParameters {
	title: string;
	step: number;
	totalSteps: number;
	value: string;
	prompt: string;
	validate: (value: string) => Promise<string | undefined>;
	buttons?: QuickInputButton[];
	shouldResume: () => Thenable<boolean>;
}

class MultiStepInput {

	static async run<T>(start: InputStep) {
		const input = new MultiStepInput();
		return input.stepThrough(start);
	}

	private current?: QuickInput;
	private steps: InputStep[] = [];

	private async stepThrough<T>(start: InputStep) {
		let step: InputStep | void = start;
		while (step) {
			this.steps.push(step);
			if (this.current) {
				this.current.enabled = false;
				this.current.busy = true;
			}
			try {
				step = await step(this);
			} catch (err) {
				if (err === InputFlowAction.back) {
					this.steps.pop();
					step = this.steps.pop();
				} else if (err === InputFlowAction.resume) {
					step = this.steps.pop();
				} else if (err === InputFlowAction.cancel) {
					step = undefined;
				} else {
					throw err;
				}
			}
		}
		if (this.current) {
			this.current.dispose();
		}
	}

	async showQuickPick<T extends QuickPickItem, P extends QuickPickParameters<T>>({ title, step, totalSteps, items, activeItem, placeholder, buttons, shouldResume }: P) {
		const disposables: Disposable[] = [];
		try {
			return await new Promise<T | (P extends { buttons: (infer I)[] } ? I : never)>((resolve, reject) => {
				const input = window.createQuickPick<T>();
				input.title = title;
				input.step = step;
				input.totalSteps = totalSteps;
				input.placeholder = placeholder;
				input.items = items;
				input.canSelectMany = false;
				if (activeItem) {
					input.activeItems = [activeItem];
				}
				input.buttons = [
					...(this.steps.length > 1 ? [QuickInputButtons.Back] : []),
					...(buttons || [])
				];
				disposables.push(
					input.onDidTriggerButton(item => {
						if (item === QuickInputButtons.Back) {
							reject(InputFlowAction.back);
						} else {
							resolve(<any>item);
						}
					}),
					input.onDidChangeSelection(items => resolve(items[0])),
					input.onDidHide(() => {
						(async () => {
							reject(shouldResume && await shouldResume() ? InputFlowAction.resume : InputFlowAction.cancel);
						})()
							.catch(reject);
					})
				);
				if (this.current) {
					this.current.dispose();
				}
				this.current = input;
				this.current.show();
			});
		} finally {
			disposables.forEach(d => d.dispose());
		}
	}

	async showInputBox<P extends InputBoxParameters>({ title, step, totalSteps, value, prompt, validate, buttons, shouldResume }: P) {
		const disposables: Disposable[] = [];
		try {
			return await new Promise<string | (P extends { buttons: (infer I)[] } ? I : never)>((resolve, reject) => {
				const input = window.createInputBox();
				input.title = title;
				input.step = step;
				input.totalSteps = totalSteps;
				input.value = value || '';
				input.prompt = prompt;
				input.buttons = [
					...(this.steps.length > 1 ? [QuickInputButtons.Back] : []),
					...(buttons || [])
				];
				let validating = validate('');
				disposables.push(
					input.onDidTriggerButton(item => {
						if (item === QuickInputButtons.Back) {
							reject(InputFlowAction.back);
						} else {
							resolve(<any>item);
						}
					}),
					input.onDidAccept(async () => {
						const value = input.value;
						input.enabled = false;
						input.busy = true;
						if (!(await validate(value))) {
							resolve(value);
						}
						input.enabled = true;
						input.busy = false;
					}),
					input.onDidChangeValue(async text => {
						const current = validate(text);
						validating = current;
						const validationMessage = await current;
						if (current === validating) {
							input.validationMessage = validationMessage;
						}
					}),
					input.onDidHide(() => {
						(async () => {
							reject(shouldResume && await shouldResume() ? InputFlowAction.resume : InputFlowAction.cancel);
						})()
							.catch(reject);
					})
				);
				if (this.current) {
					this.current.dispose();
				}
				this.current = input;
				this.current.show();
			});
		} finally {
			disposables.forEach(d => d.dispose());
		}
	}
}
