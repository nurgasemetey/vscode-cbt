/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { window, commands, ExtensionContext, workspace } from 'vscode';
import { multiStepInput } from './multiStepInput';
import {prepareFile,getFilePath} from "./utils"

export function activate(context: ExtensionContext) {
	context.subscriptions.push(commands.registerCommand('cbt.createNote', async () => {
		multiStepInput(context).catch(console.error);
	}));

	context.subscriptions.push(commands.registerCommand('cbt.openNotes', async () => {
		await prepareFile();
		const filePath = getFilePath();

		workspace.openTextDocument(filePath).then((doc) => {
			window.showTextDocument(doc);
		});
	}));
}
