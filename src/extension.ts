import * as path from 'path';

import { workspace,
	ExtensionContext,
	Extension,
	window
} from 'vscode';

import { LanguageClient,
	LanguageClientOptions,
	ServerOptions,
	TransportKind
} from 'vscode-languageclient';

import * as child_process from 'child_process';

let client: LanguageClient;

export function activate(context: ExtensionContext) {
	let currentPath: string;
	const relativeLocationOfServerExecutable: string = '../../ARXML_LanguageServer/build/ARXML_LanguageServer.exe';
	currentPath = __dirname;
	currentPath = path.join(currentPath, relativeLocationOfServerExecutable);
	window.showInformationMessage(currentPath);
	let execOptions: Object;
	execOptions = {
		shell: true,
		windowsHide: false
	};
	const child = child_process.execFile(currentPath, execOptions, (error, stdout, stderr) => {
		if (error) {
			throw error;
		}
		console.log(stdout);
	});
}

export function deactivate() {}