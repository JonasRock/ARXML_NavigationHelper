import * as net from 'net';
import { ExtensionContext, TreeDataProvider, TreeItem, TreeItemCollapsibleState, window, EventEmitter, Event, Uri, extensions, TextEditor, ProviderResult} from 'vscode';
import { LanguageClient, LanguageClientOptions, StreamInfo, ServerOptions} from 'vscode-languageclient';
import * as child_process from 'child_process';
import * as path from 'path';
import { Server } from 'http';
import { stringify } from 'querystring';
import { promisify } from 'util';

let socket: net.Socket;
let client: LanguageClient;

export function activate(context: ExtensionContext) {

	let arxmlLSPath: string = path.join(__dirname, "../ARXML_LanguageServer.exe"); //Path to LanguageServer Executable
	let shortnameTreeDataProvider = new ShortnameTreeProvider(window.activeTextEditor?.document.uri);

	window.onDidChangeActiveTextEditor(shortnameTreeDataProvider.refresh);

	window.registerTreeDataProvider('shortnames', shortnameTreeDataProvider);
	return launchServer(context, arxmlLSPath);
}

function launchServer(context: ExtensionContext, serverPath: string)
{
	const serverOptions: ServerOptions = () => createServerWithSocket(serverPath).then<StreamInfo>(() => ({ reader: socket, writer: socket }));
	const clientOptions: LanguageClientOptions = {
		documentSelector: [{ language: 'xml', pattern: '**/*.arxml' }],
		
	};
	client = new LanguageClient('ARXML_LanguageServer', 'ARXML Language Server', serverOptions, clientOptions);
	context.subscriptions.push(client.start());
}

function createServerWithSocket(executablePath: string)
{
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

interface ShortnameElement
{
	name: string,
	path: string,
	cState: TreeItemCollapsibleState
}

class Shortname extends TreeItem{
	constructor(elem: ShortnameElement)
	{
		super("Bananas", 1);
		this.tooltip = "dragon tooltip"
		this.description = "Bananas description";
	}
	label = "Bananas";
	description = "Here be dragons";
	collapsibleState = 1;
}

export class ShortnameTreeProvider implements TreeDataProvider<Shortname> {
	constructor(uri: Uri | undefined) {
		this._uri = uri;
	}

	getTreeItem(element: Shortname): TreeItem {
		return element;
	}

	getChildren(element?: Shortname): ProviderResult<Shortname[]> {

		//if (client.initializeResult !== undefined) {
			let params = { elem: element?.description, uri: this._uri };
			let elem = 
			{
				name: "Bananas",
				path: "banpath",
				cState: 1
			};
			let sn = new Shortname(elem);
			return Promise.resolve([sn, sn, sn]);
		// }
		// else {
		// 	return Promise.resolve([]);
		// }
	}

	refresh(textEditor: TextEditor | undefined): void {
		if (textEditor) {
			this._uri = textEditor.document.uri;
		}
		else {
			this._uri = undefined;
		}
		this._onDidChangeTreeData.fire();
	}

	private _onDidChangeTreeData: EventEmitter<Shortname | undefined | null | void> = new EventEmitter<Shortname | undefined | null | void>();
	readonly onDidChangeTreeData: Event<Shortname | undefined | null | void> = this._onDidChangeTreeData.event;

	private _uri: Uri | undefined;
}