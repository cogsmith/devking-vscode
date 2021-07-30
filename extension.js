const fs = require('fs');

const axios = require('axios');
const vscode = require('vscode');

//

const JSONFANCY = function (x) { return require('util').inspect(x, { colors: false, depth: null, breakLength: 1 }); };

const DT = function () { return new Date().toISOString().substr(0, 19).replace('T', '|'); }

//

const XT = require('@cogsmith/xt').Init();
const App = XT.App; // let LOG = XT.LOG;
//App = {}; App.Run = function () { console.log('App.Run'); }

//

App.InitBackendExec = async function () {
    const childProcess = require('child_process');
    //let cmd = 'NODE ' + App.Workspace.extensionPath + '/backend.js';
    let cmd = 'NODEMON --delay 2.5 --ignore package.json --ignore package-lock.json ' + App.Workspace.extensionPath + '/backend.js';
    const spawned = childProcess.spawn('CMD', ['/C', cmd], { stdio: 'inherit', shell: true, windowsHide: true });
    LOG('App.InitBackendExec: ' + cmd);

    const waitFor = delay => new Promise(resolve => setTimeout(resolve, delay));
    await waitFor(2500);

    axios.get('http://localhost:31337/').then(r => {
        LOG(r.data);
    });
}

//

App.InitLog = function () {
    let LOGCHANNEL = vscode.window.createOutputChannel('DEVKING');
    LOGCHANNEL.show();

    let DEVKINGLOG = function (msg) {
        if (typeof (msg) == 'object') { msg = JSONFANCY(msg); }
        if (!msg) { msg = ""; }
        msg = '[' + DT() + '] ' + msg;
        LOGCHANNEL.appendLine(msg);
    }

    LOG = DEVKINGLOG;
}

App.InitData = function () {
    App.Webviews = {};
}

//

App.Init = function () {
    LOG('App.Init');

    App.InitBackendExec();




    const CMD_IFRAME = vscode.commands.registerCommand('DEVKING.IFRAME', async (url, title) => {
        LOG('IFRAME: ' + url);
        let panel = vscode.window.createWebviewPanel('IFRAME', title || url, vscode.ViewColumn.Beside, { enableScripts: true });
        panel.webview.html = "<html><head><style>html,body,iframe { background-color:white;border:0px;margin:0px;padding:0px;width:100%;height:100% }</style></head><body><iframe src='" + url + "'></iframe></body></html>";
    });
    App.Workspace.subscriptions.push(CMD_IFRAME);


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

    AddLink('BACKEND', { URL: 'http://localhost:31337/', Icon: 'gear' });
    AddLink('LOCAL-3000', { URL: 'http://localhost:3000/', Icon: 'gear' });
    AddLink('DEVKING-VSCODE', { URL: 'https://marketplace.visualstudio.com/items?itemName=COGSMITH.devking-vscode', Icon: 'gear' });
    AddLink('WIKIPEDIA', { URL: 'https://en.wikipedia.org/wiki/Visual_Studio_Code' });
    AddLink('REACTMUI', { URL: 'https://react.cogsmith.com' });
    AddLink('XT-DEMO', { URL: 'http://xtdemo.cogsmith.com', Icon: 'star' });

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















}

//

App.Activate = function (workspace) {
    App.Workspace = workspace;
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 10);
    statusBarItem.command = 'DEVKING_INFOVIEW.focus';
    statusBarItem.text = 'DEVKING';
    statusBarItem.show();
    workspace.subscriptions.push(statusBarItem);

    App.Run();
}

App.Deactivate = function (workspace) {
    LOG('DEVKING.Deactivate');
}

//

const activate = App.Activate;
const deactivate = App.Deactivate;
module.exports = { activate, deactivate };
