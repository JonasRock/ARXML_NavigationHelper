import * as net from 'net';
import { ExtensionContext, TreeDataProvider, TreeItem, TreeItemCollapsibleState, window, EventEmitter, Event, TextEditor, Position, ViewColumn, commands, TextEditorCursorStyle, Selection, Uri, Range, TextEditorRevealType } from 'vscode';
import { LanguageClient, LanguageClientOptions, StreamInfo, ServerOptions, Command } from 'vscode-languageclient';
import * as child_process from 'child_process';
import * as path from 'path';
import { Server } from 'http';
import { stringify } from 'querystring';
import { promisify } from 'util';
import { resourceLimits } from 'worker_threads';
import { notEqual } from 'assert';
import { POINT_CONVERSION_COMPRESSED } from 'constants';

let socket: net.Socket;
let client: LanguageClient;

export function activate(context: ExtensionContext) {

	let shortnameTreeDataProvider = new ShortnameTreeProvider(window.activeTextEditor?.document.uri.toString());

	window.registerTreeDataProvider('arxmlNavigationHelper.shortnames', shortnameTreeDataProvider);
	window.onDidChangeActiveTextEditor(shortnameTreeDataProvider.refresh.bind(shortnameTreeDataProvider));
	commands.registerCommand('arxmlNavigationHelper.treeDefinition', definition);
	commands.registerCommand('arxmlNavigationHelper.treeReferences', references);
	commands.registerCommand('arxmlNavigationHelper.refreshTreeView', () => shortnameTreeDataProvider.refresh());

	let arxmlLSPath: string = path.join(__dirname, "../ARXML_LanguageServer.exe"); //Path to LanguageServer Executable
	return launchServer(context, arxmlLSPath);
}

function launchServer(context: ExtensionContext, serverPath: string) {
	const serverOptions: ServerOptions = () => createServerWithSocket(serverPath).then<StreamInfo>(() => ({ reader: socket, writer: socket }));
	const clientOptions: LanguageClientOptions = {
		documentSelector: [{ language: 'xml', pattern: '**/*.arxml' }],

	};
	client = new LanguageClient('ARXML_LanguageServer', 'ARXML Language Server', serverOptions, clientOptions);
	context.subscriptions.push(client.start());
}

function createServerWithSocket(executablePath: string) {
	let exec: child_process.ChildProcess;
	return new Promise<child_process.ChildProcess>(resolve => {
		let server = net.createServer(s => {
			console.log("Connection established");	//Callback for event 'connection'
			socket = s;
			socket.setNoDelay(true);
			socket.on("end", (hadError: boolean) => {
				console.log("Connection ended");
			});
			server.close();
			resolve(exec);
		});
		server.listen(0, '127.0.0.1', () => {
			var portNr: Number = ((server.address() as any).port);
			console.log("Listening on Port " + portNr);
			//Comment out next line if you want to start the server yourself for debugging etc
			//exec = child_process.spawn(executablePath, [portNr.toString()]);
		});
	});
}

interface ShortnameElement {
	name: string,
	path: string,
	pos: Position,
	cState: TreeItemCollapsibleState
}

class Shortname extends TreeItem {
	constructor(elem: ShortnameElement) {
		super(elem.name, 1);
		if (elem.path) {
			this.tooltip = elem.path + '/' + elem.name;
		}
		else {
			this.tooltip = elem.name;
		}
		this.description = false;
		this.collapsibleState = elem.cState;
		this.pos = elem.pos;
		this.command = { title: "go to definition", command: "arxmlNavigationHelper.treeDefinition", arguments: [this]};
	}
	pos: Position;
}

export class ShortnameTreeProvider implements TreeDataProvider<Shortname> {
	constructor(uri: string | undefined) {
		this._uri = uri;
	}

	getTreeItem(element: Shortname): TreeItem {
		return element;
	}

	getChildren(element?: Shortname): Thenable<Shortname[]> {
		//if (client.initializeResult !== undefined) {
		let params = { path: element?.tooltip, uri: this._uri };
		return Promise.resolve<Shortname[]>(
			client.sendRequest<ShortnameElement[]>("treeView/getChildren", params)
				.then(function (result) {
					let a = createShortnamesFromShortnameElements(result);
					return a;
				})
		);
	}

	refresh(): void {
		if (client.initializeResult) {
			if (window.activeTextEditor) {
				if (window.activeTextEditor.document.languageId === "xml") {
					this._uri = window.activeTextEditor.document.uri.toString();
					this._onDidChangeTreeData.fire();
				}
			}
			else {
				this._uri = undefined;
			}
		}
	}

	private _onDidChangeTreeData: EventEmitter<Shortname | undefined | null | void> = new EventEmitter<Shortname | undefined | null | void>();
	readonly onDidChangeTreeData: Event<Shortname | undefined | null | void> = this._onDidChangeTreeData.event;

	private _uri: String | undefined;
}

function createShortnamesFromShortnameElements(elems: ShortnameElement[]): Shortname[] {
	let resArray: Shortname[] = [];
	for (let elem of elems) {
		resArray.push(new Shortname(elem));
	}
	return resArray;
}

function definition(node: Shortname) {
	if (node.label) {
		let sel = new Selection(node.pos.line, node.pos.character - 1, node.pos.line, node.pos.character + node.label.length - 1);
		if (window.activeTextEditor) {
			window.activeTextEditor.selection = sel;
			window.activeTextEditor.revealRange(new Range(sel.anchor, sel.active), TextEditorRevealType.InCenterIfOutsideViewport);
		}
	}
	commands.executeCommand('editor.action.goToSelectionAnchor');
}

function references(node: Shortname) {
	if (node.label) {
		let sel = new Selection(node.pos.line, node.pos.character - 1, node.pos.line, node.pos.character - 1);
		if (window.activeTextEditor) {
			window.activeTextEditor.selection = sel;
		}
	}
	commands.executeCommand('editor.action.goToReferences');
}