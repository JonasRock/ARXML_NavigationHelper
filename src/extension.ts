import * as net from 'net';
import { SocketMessageReader, SocketMessageWriter, Trace } from 'vscode-jsonrpc';
import { window, workspace, commands, ExtensionContext, Uri, languages } from 'vscode';
import { LanguageClient, LanguageClientOptions, StreamInfo, Position as LSPosition, Location as LSLocation, ServerOptions} from 'vscode-languageclient';
import * as child_process from 'child_process';
import * as path from 'path';
import { writer } from 'repl';

let socket: net.Socket;

export function activate(context: ExtensionContext) {

	let arxmlLSPath: string = path.join(__dirname, "../ARXML_LanguageServer.exe"); //Path to LanguageServer Executable
	return launchServer(context, arxmlLSPath);
}

function launchServer(context: ExtensionContext, serverPath: string)
{
	const serverOptions: ServerOptions = () => createServerWithSocket(serverPath).then<StreamInfo>(() => ({ reader: socket, writer: socket }));
	const clientOptions: LanguageClientOptions = {
		documentSelector: [{ language: 'xml' }]
	};
	const client = new LanguageClient('ARXML_LanguageServer', 'ARXML Language Server', serverOptions, clientOptions);
	client.trace = Trace.Verbose;
	window.showInformationMessage("Launching");
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
		server.listen(12730, '127.0.0.1', () => {
			console.log("Server bound on \"127.0.0.1:12730\"");
			exec = child_process.spawn(executablePath);
		});
	});
}

export function deactivate() {}