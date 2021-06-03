const vscode = require('vscode');
const fs = require('fs');

//

const XT = require('@cogsmith/xt').Init();
const App = XT.App; let LOG = XT.LOG;

LOG.WARN('XT');

App.Webviews = {};

const JSONFANCY = function (x) { return require('util').inspect(x, { colors: false, depth: null, breakLength: 1 }); };

const DT = function () { return new Date().toISOString().substr(0, 19).replace('T', '|'); }

//

activate = function (context) {

	//Object.keys(process.env).forEach(z => { console.log(z + '=' + process.env[z]); });

	let devkingpath = 'W:\\DEV\\CODE\\DEVKING-VSCODE';
	if (fs.existsSync(devkingpath)) { process.cwd(devkingpath); }

	let DEVKINGLOGCHAN = vscode.window.createOutputChannel('DEVKING');
	DEVKINGLOGCHAN.show();

	let DEVKINGLOG = function (msg) {
		if (typeof (msg) == 'object') { msg = JSONFANCY(msg); }
		if (!msg) { msg = ""; }
		msg = '[' + DT() + '] ' + msg;
		DEVKINGLOGCHAN.appendLine(msg);
	}

	LOG = DEVKINGLOG;

	LOG('DEVKING.Activate');

	//require('http').createServer((req, res) => { res.writeHead(200); res.end('DEVKING-VSCODE' + "\n" + req.url); console.log(req.url); }).listen(31337, '0.0.0.0');

	//

	const CMD_SHOWMSGS = vscode.commands.registerCommand('DEVKING.SHOWMSGS', async () => {
		vscode.window.showInformationMessage('INFO');
		vscode.window.showWarningMessage('WARNING');
		vscode.window.showErrorMessage('ERROR');
		const input = await vscode.window.showInputBox();
		vscode.window.showInformationMessage(input);
		LOG(input);
	});
	context.subscriptions.push(CMD_SHOWMSGS);

	//

	const CMD_ITEMCLICK = vscode.commands.registerCommand('DEVKING.ITEMCLICK', async (k) => {
		vscode.window.showInformationMessage(k);
		if (!App.Webviews[k]) {
			let panel = vscode.window.createWebviewPanel('VIEWTYPE', k, vscode.ViewColumn.Active, { enableScripts: true });
			panel.webview.html = "<html><head><style>html,body,iframe { background-color:white;border:0px;margin:0px;padding:0px;width:100%;height:100% }</style></head><body><iframe src='" + 'http:///localhost:31337' + '/' + k + "'></iframe></body></html>";
			App.Webviews[k] = panel;
		}
	});
	context.subscriptions.push(CMD_ITEMCLICK);

	//

	const CMD_IFRAME = vscode.commands.registerCommand('DEVKING.IFRAME', async (url, title) => {
		LOG('IFRAME: ' + url);
		let panel = vscode.window.createWebviewPanel('IFRAME', title || url, vscode.ViewColumn.Active, { enableScripts: true });
		panel.webview.html = "<html><head><style>html,body,iframe { background-color:white;border:0px;margin:0px;padding:0px;width:100%;height:100% }</style></head><body><iframe src='" + url + "'></iframe></body></html>";
	});
	context.subscriptions.push(CMD_IFRAME);

	//

	const CMD_EXECA = vscode.commands.registerCommand('DEVKING.EXECA', async (cmd) => {
		vscode.window.showInformationMessage('CMD_EXECA: ' + cmd);
		LOG();
		LOG('EXECA: ' + cmd);
		let cmdout = XT.EXECA.commandSync(cmd, { shell: true }).stdout;
		LOG('CMDOUT: ' + cmdout);
		//XT.EXECA.command(cmd).stdout.pipe(process.stdout);
	});
	context.subscriptions.push(CMD_EXECA);
	//vscode.commands.executeCommand('DEVKING.EXECA', 'WHOAMI');

	//

	const GetWorkspaceFolder = function () {
		let path = false;
		try { path = vscode.workspace.workspaceFolders[0].uri.path; } catch (ex) { } // LOG(ex.message); }
		if (path && path.substr(0, 1) == '/') { path = path.substr(1); }
		//vscode.window.showInformationMessage('WorkspaceFolder: ' + path);
		//LOG('WorkspaceFolder: ' + path);
		return path;
	}

	WAIT = async function (ms) { return new Promise(resolve => { setTimeout(resolve, ms); }); }
	let EXTDEVDIR = "W:\\DEV\\CODE\\DEVKING-VSCODE";

	const CMD_PULL = vscode.commands.registerCommand('DEVKING.PULL', async () => {
		let DT = new Date().toISOString();

		LOG(); LOG('PULL @ ' + DT);

		vscode.window.withProgress({ title: 'PULL', location: vscode.ProgressLocation.Window },
			async progress => {
				let cwd = GetWorkspaceFolder(); if (!cwd && fs.existsSync(EXTDEVDIR)) { cwd = EXTDEVDIR; }
				let cmd = 'git pull';
				LOG(cwd); LOG(cmd);

				const t = new vscode.Task({ type: 'shell' }, vscode.TaskScope.Global, 'PULL', 'test', new vscode.ShellExecution(cmd, { cwd }), []);

				progress.report({ increment: 1, message: cmd });
				await vscode.tasks.executeTask(t);
				await WAIT(999);
				progress.report({ increment: 98, message: cmdout });
			}
		);
	});
	context.subscriptions.push(CMD_PULL);

	const CMD_PUSHDEV = vscode.commands.registerCommand('DEVKING.PUSHDEV', async () => {
		let DT = new Date().toISOString();

		LOG(); LOG('PUSHDEV @ ' + DT);

		vscode.window.withProgress({ title: 'PUSHDEV', location: vscode.ProgressLocation.Window },
			async progress => {
				let cwd = GetWorkspaceFolder(); if (!cwd && fs.existsSync(EXTDEVDIR)) { cwd = EXTDEVDIR; }
				let cmd = 'git pull ; git commit -a -m "DEV" ; git push';
				LOG(cwd); LOG(cmd);

				const t = new vscode.Task({ type: 'shell' }, vscode.TaskScope.Global, 'PUSHDEV', 'test', new vscode.ShellExecution(cmd, { cwd }), []);

				progress.report({ increment: 1, message: cmd });
				await vscode.tasks.executeTask(t);
				await WAIT(999);
				progress.report({ increment: 98, message: cmdout });
			}
		);
	});
	context.subscriptions.push(CMD_PUSHDEV);

	const CMD_PUSHTAG = vscode.commands.registerCommand('DEVKING.PUSHTAG', async () => {
		let DT = new Date().toISOString();

		LOG(); LOG('PUSHTAG @ ' + DT);

		vscode.window.withProgress({ title: 'PUSHDEV', location: vscode.ProgressLocation.Window },
			async progress => {
				let cwd = GetWorkspaceFolder(); if (!cwd && fs.existsSync(EXTDEVDIR)) { cwd = EXTDEVDIR; }
				let cmd = 'git pull ; git commit -a -m "DEV" ; git commit --allow-empty -m "TAG" ; git push';
				LOG(cwd); LOG(cmd);

				const t = new vscode.Task({ type: 'shell' }, vscode.TaskScope.Global, 'PUSHTAG', 'test', new vscode.ShellExecution(cmd, { cwd }), []);

				progress.report({ increment: 1, message: cmd });
				await vscode.tasks.executeTask(t);
				await WAIT(999);
				progress.report({ increment: 98, message: cmdout });
			}
		);
	});
	context.subscriptions.push(CMD_PUSHTAG);

	//

	const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 10);
	statusBarItem.command = 'DEVKING.SHOWMSGS';
	statusBarItem.text = 'DEVKING';
	statusBarItem.show();
	context.subscriptions.push(statusBarItem);

	//

	class myTreeDataProvider {
		constructor() {
			this.data = [];
		}

		getTreeItem(q) {
			LOG({ GetTreeItem: q });

			let cstate = vscode.TreeItemCollapsibleState.Collapsed;
			let iconpath = new vscode.ThemeIcon('globe');
			if (q == 'LEAF') {
				cstate = vscode.TreeItemCollapsibleState.None;
				iconpath = new vscode.ThemeIcon('debug-breakpoint-log-disabled')
			}

			let treeitem = {
				label: q,
				tooltip: q,
				collapsibleState: cstate,
				iconPath: iconpath,
				command: { command: 'DEVKING.ITEMCLICK', title: 'CMD_TREEITEM', arguments: [q] },
			};
			return treeitem;
		}

		getChildren(q) {
			LOG({ GetChildren: q });
			if (!q) { return ['CHILD1', 'CHILD2']; }
			return ['NODE', 'LEAF'];
		}
	}

	//vscode.window.registerTreeDataProvider('DEVKING_TREEVIEW', new myTreeDataProvider());

	//

	const LINKS = {};

	const AddLink = function (id, link) {
		if (!link) {
			if (typeof (id) == 'string') { link = { URL: id }; } else { link = id; }
			id = 'LINK' + Object.keys(LINKS).length + 1;
		}
		link.ID = id;
		if (!link.Icon) { link.Icon = 'globe' }; link.Icon = new vscode.ThemeIcon(link.Icon);
		LINKS[id] = link;
	}

	AddLink('XT-DEMO', { URL: 'http://xtdemo.cogsmith.com', Icon: 'star' });
	//AddLink('BACKEND', { URL: 'http://localhost:31337/', Icon: 'gear' });
	AddLink('DEVKING-VSCODE', { URL: 'https://marketplace.visualstudio.com/items?itemName=COGSMITH.devking-vscode', Icon: 'gear' });
	AddLink('WIKIPEDIA', { URL: 'https://en.wikipedia.org/wiki/Visual_Studio_Code' });

	const TREEDATA_LINKVIEW = {};

	TREEDATA_LINKVIEW.getTreeItem = function (q) {
		if (LINKS[q]) {
			let link = LINKS[q];
			let label = link.Label || (q + ': ' + link.URL);
			let treeitem = {
				label: label,
				tooltip: link.ID,
				collapsibleState: vscode.TreeItemCollapsibleState.None,
				iconPath: link.Icon,
				command: { command: 'DEVKING.IFRAME', title: 'CMD_IFRAME', arguments: [link.URL, link.ID] },
			};
			return treeitem;
		}

		let treeitem = {
			label: q + ': Example Link Details',
			tooltip: q,
			collapsibleState: vscode.TreeItemCollapsibleState.None,
			iconPath: new vscode.ThemeIcon('debug-breakpoint-log-disabled'),
			command: { command: 'DEVKING.ITEMCLICK', title: 'CMD_TREEITEM', arguments: [q] },
		};
		return treeitem;
	}

	TREEDATA_LINKVIEW.getChildren = function (q) {
		return Object.keys(LINKS);
		// return ['LINK1', 'LINK2', 'LINK3'];
	}

	vscode.window.registerTreeDataProvider('DEVKING_LINKVIEW', TREEDATA_LINKVIEW);

	//

	vscode.workspace.onDidSaveTextDocument((document) => {
		//let DOCFIELDS = 'uri fileName isUntitled languageId version isClosed isDirty notebook save getText eol lineCount lineAt offsetAt positionAt validateRange validatePosition getWordRangeAtPosition'.split(' ');
		//DOCFIELDS.forEach(z => { LOG(z + ': ' + document[z]); });

		/*
		const edit = new vscode.WorkspaceEdit();
		const res = [vscode.TextEdit.setEndOfLine(vscode.EndOfLine.LF)];
		edit.set(document.uri, res)
		vscode.workspace.applyEdit(edit);
		*/
	})

	context.subscriptions.push(vscode.workspace.onWillSaveTextDocument(e => {
		let doc = e.document;
		let eol = vscode.EndOfLine.LF; // let eol = doc.eol || vscode.EndOfLine.LF;
		let eoltxt = eol == 1 ? 'LF' : 'CRLF';

		const edit = vscode.TextEdit.setEndOfLine(eol);
		e.waitUntil(Promise.resolve([edit]));

		let info = 'SAVE:' + doc.uri.scheme + ':' + eoltxt + ':' + doc.lineCount + ':' + doc.languageId;
		info = info.toUpperCase() + ': ' + doc.fileName;
		//LOG(info);
	}))

	//

	//LOG(context);
	//if (vscode.workspace.workspaceFolders) { LOG(vscode.workspace.workspaceFolders[0].uri.path); }

	//

	// vscode.workspace.onDidOpenTextDocument((z) => {	});

	SeenDocs = {};

	// vscode.workspace.onDidChangeWorkspaceFolders((z) => { LOG(z) });

	vscode.workspace.onDidCloseTextDocument((z) => {
		if (z.uri.scheme != 'file') { return; }
		//LOG('OnDidCloseTextDocument: ' + z.uri);
		LOG('Close: ' + z.uri);
		delete SeenDocs[z.uri];
	});

	vscode.workspace.onDidSaveTextDocument((z) => {
		//LOG('OnDidSaveTextDocument: ' + z.uri);
		LOG('Save: ' + z.uri);
	});

	vscode.workspace.onDidOpenTextDocument((z) => {
		if (z.uri.scheme != 'file') { return; }
		//LOG('OnDidOpenTextDocument: ' + z.uri);
	})

	vscode.window.onDidChangeActiveTextEditor((z) => {
		if (z.document.uri.scheme != 'file') { return; }
		if (!SeenDocs[z.document.uri]) {
			//LOG('OnDidChangeActiveTextEditor: ' + z.document.uri);
			LOG('Open: ' + z.document.uri);
			SeenDocs[z.document.uri] = z;
		}
	})

	//

	LOG('DEVKING.ActivateDone');

	LOG('Workspace: ' + GetWorkspaceFolder());
}

deactivate = function () { }

module.exports = { activate, deactivate };
