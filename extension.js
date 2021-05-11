const vscode = require('vscode');

//

const XT = require('@cogsmith/xt').Init();
const App = XT.App; const LOG = XT.LOG;

LOG.WARN('XT');

App.Webviews = {};

//

activate = function (context) {
	console.log('ACTIVATE-INIT');
	LOG.WARN('ACTIVATE-INIT');

	console.log(LOG);
	console.log(LOG.WARN);

	require('http').createServer((req, res) => { res.writeHead(200); res.end('DEVKING-VSCODE' + "\n" + req.url); console.log(req.url); }).listen(31337, '0.0.0.0');

	//

	const CMD_SHOWMSGS = vscode.commands.registerCommand('DEVKING.SHOWMSGS', async () => {
		vscode.window.showInformationMessage('INFO');
		vscode.window.showWarningMessage('WARNING');
		vscode.window.showErrorMessage('ERROR');
		const input = await vscode.window.showInputBox();
		vscode.window.showInformationMessage(input);
		console.log(input);
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
		console.log('IFRAME: ' + url);
		let panel = vscode.window.createWebviewPanel('IFRAME', title || url, vscode.ViewColumn.Active, { enableScripts: true });
		panel.webview.html = "<html><head><style>html,body,iframe { background-color:white;border:0px;margin:0px;padding:0px;width:100%;height:100% }</style></head><body><iframe src='" + url + "'></iframe></body></html>";
	});
	context.subscriptions.push(CMD_IFRAME);

	//

	const CMD_EXECA = vscode.commands.registerCommand('DEVKING.EXECA', async (cmd) => {
		vscode.window.showInformationMessage('CMD_EXECA: ' + cmd);
		console.log('#');
		console.log('CMD_EXECA: ' + cmd);
		let cmdout = XT.EXECA.commandSync(cmd).stdout;
		console.log(cmdout);
		console.log('#');
		//XT.EXECA.command(cmd).stdout.pipe(process.stdout);
	});
	context.subscriptions.push(CMD_EXECA);
	vscode.commands.executeCommand('DEVKING.EXECA', 'WHOAMI');

	//

	const CMD_PUSHDEV = vscode.commands.registerCommand('DEVKING.PUSHDEV', async () => {
		vscode.window.showInformationMessage('DEVKING.PUSHDEV');
		console.log('#');
		console.log('DEVKING.PUSHDEV');
		cmd = "git pull ; git commit -a -m 'DEV' ; git push";
		let cmdout = XT.EXECA.commandSync(cmd).stdout;
		console.log(cmdout);
		console.log('#');
	});
	context.subscriptions.push(CMD_PUSHDEV);

	const CMD_PUSHTAG = vscode.commands.registerCommand('DEVKING.PUSHTAG', async () => {
		vscode.window.showInformationMessage('DEVKING.PUSHTAG');
		console.log('#');
		console.log('DEVKING.PUSHDEV');
		cmd = "git pull ; git commit -a -m 'DEV' ; git commit --allow-empty -m 'TAG' ; git push";
		let cmdout = XT.EXECA.commandSync(cmd).stdout;
		console.log(cmdout);
		console.log('#');
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
			console.log('MyTreeDataProvider');
			this.data = [];
		}

		getTreeItem(q) {
			console.log({ GetTreeItem: q });

			vscode.commands.executeCommand('DEVKING.EXECA', 'dir');

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
			console.log({ GetChildren: q });
			if (!q) { return ['CHILD1', 'CHILD2']; }
			return ['NODE', 'LEAF'];
		}
	}

	vscode.window.registerTreeDataProvider('DEVKING_TREEVIEW', new myTreeDataProvider());

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

	AddLink('XT_DEMO', { URL: 'http://xtdemo.cogsmith.com', Icon: 'star' });
	AddLink('BACKEND', { URL: 'http://localhost:31337/', Icon: 'gear' });
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
	};

	TREEDATA_LINKVIEW.getChildren = function (q) {
		return Object.keys(LINKS);
		// return ['LINK1', 'LINK2', 'LINK3'];
	}

	vscode.window.registerTreeDataProvider('DEVKING_LINKVIEW', TREEDATA_LINKVIEW);

	//

	console.log('ACTIVATE-DONE');
}

deactivate = function () { }

module.exports = { activate, deactivate };

