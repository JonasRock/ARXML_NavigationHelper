import * as net from 'net';
import { SocketMessageReader, SocketMessageWriter, Trace } from 'vscode-jsonrpc';
import { window, workspace, commands, ExtensionContext, Uri, languages } from 'vscode';
import { LanguageClient, LanguageClientOptions, StreamInfo, Position as LSPosition, Location as LSLocation, ServerOptions} from 'vscode-languageclient';
import { lchmod, ReadStream } from 'fs';
import { Socket } from 'dgram';
import * as child_process from 'child_process';

let socket: net.Socket;

export function activate(context: ExtensionContext) {

	let arxmlLSPath: string = ""; //Path to LanguageServer Executable

	return launchServer(context, arxmlLSPath);
}

function launchServer(context: ExtensionContext, serverPath: string)
{
	const serverOptions: ServerOptions = () => createServerWithSocket(serverPath).then<StreamInfo>(() => ({ reader: socket, writer: socket }));
	const clientOptions: LanguageClientOptions = {
		documentSelector: [{ language: 'xml' }]
	};
	const client = new LanguageClient('ARXML_LanguageServer', 'ARXML Language Server', serverOptions, clientOptions);

	context.subscriptions.push(client.start());
}

function createServerWithSocket(executablePath: string)
{
	let exec: child_process.ChildProcess;
	return new Promise<child_process.ChildProcess>(resolve => {
		let server = net.createServer(s => {
			socket = s;
			socket.setNoDelay(true);
			server.close();
			resolve(exec);
		});

		server.listen(12730, '127.0.0.1', () => {
			exec = child_process.spawn(executablePath);
		});
	});
}

export function deactivate() {}