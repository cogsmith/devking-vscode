process.on('uncaughtException', function () { LOG(...arguments); });
process.on('unhandledRejection', function () { LOG(...arguments); });

//

const EventClass = class extends require('events').EventEmitter { constructor() { super(); } };

const WebSocket = require('ws');
const vscode = require('vscode');

const WAIT = async function (ms) { return new Promise(resolve => { setTimeout(resolve, ms); }); };

//

const JSONDUMP = function (x) { return require('util').inspect(x, { colors: false, depth: null, maxArrayLength: Infinity, breakLength: Infinity, compact: Infinity }); };
const LOGCHANNEL = vscode.window.createOutputChannel('DEVKING'); // LOGCHANNEL.show();
const DEVKINGLOG = function (z) {
    let logout = z; if (typeof (z) == 'object') { logout = JSONDUMP(z); }
    logout = Date.now() + ': ' + logout + "";
    LOGCHANNEL.appendLine(logout);
}
const LOG = DEVKINGLOG;

//

const VSCODE = {};

VSCODE.Show = {
    Info: vscode.window.showInformationMessage,
    Warn: vscode.window.showWarningMessage,
    Error: vscode.window.showErrorMessage
}

//

const DEVKING_StatusBarClickFx = async () => {
    vscode.commands.executeCommand('DEVKING_INFOVIEW.focus');
    const cmdlist = await vscode.commands.getCommands(false);
    for (const cmd of cmdlist.sort()) { LOG(cmd); }

    /*
    vscode.window.showInformationMessage('INFO');
    vscode.window.showWarningMessage('WARNING');
    vscode.window.showErrorMessage('ERROR');
    const input = await vscode.window.showInputBox();
    vscode.window.showInformationMessage(input);
    App.Event('VSCODE.StatusBarClick', input);
    */
}

const DEVKING_StatusBarClick = vscode.commands.registerCommand('DEVKING.StatusBarClick', DEVKING_StatusBarClickFx);

//

const BEAM = { IsOpen: false };
BEAM.Queue = [];

BEAM.Send = function (z) {
    let text = z.toString(); try { text = App.GetSafeDumpText(z); } catch (ex) { LOG('ERROR: BEAM.Send'); }
    LOG(text);
    BEAM.Queue.push(text);
}

BEAM.SendNow = function (text) {
    try { BEAM.WS.send(text); return true; }
    catch (ex) { VSCODE.Show.Error(ex.message); LOG('ERROR: ' + ex.message); return false; }
}

BEAM.Event = function (topic, data) {
    const event = { topic };
    if (data) { event.data = data; };
    if (App.WorkPath) { event.workpath = App.WorkPath };
    BEAM.Send(event);
}

BEAM.LoopFx = function () {
    if (BEAM.IsOpen && BEAM.Queue.length > 0) {
        const text = BEAM.Queue[0];
        if (BEAM.SendNow(text)) { BEAM.Queue.shift(); }
        setImmediate(BEAM.LoopFx);
    } else {
        setTimeout(BEAM.LoopFx, 9);
    }
}

//

const NODE = { Util: require('util') };

const App = new EventClass();

App.SeenDocs = {};

App.On = function (topic, fx) {
    App.on(topic, fx);
    // App.Event('App.On', fx);
}

App.EventDelay = function (ms, topic, data) { setTimeout(function () { App.Event(topic, data); }, ms); }

App.Event = function (topic, data) {
    // try { LOG(JSON.stringify({ topic, data })); } catch (ex) { LOG({ topic, data: 'ERROR_SERIALIZING_JSON' }); }
    const event = { topic, data };
    //LOG(App.Dump(event));
    BEAM.Event(topic, data);
    App.emit(topic, data);
    //App.emit('App.Event', { topic, data });
}

App.GetWorkspaceInfo = function (workspace) {
    const info = {};
    info.Keys = Object.keys(workspace);
    info.Path = App.GetWorkspaceFolder();
    info.Addon = workspace.extension;
    return info;
}

App.GetWorkspaceFolder = function () {
    let path = false;
    try { path = vscode.workspace.workspaceFolders[0].uri.path; } catch (ex) { } // LOG(ex.message); }
    if (path && path.substr(0, 1) == '/') { path = path.substr(1); }
    // App.Event('VSCODE.WorkspaceFolderGet', path);
    return path;
}

App.Activate = function (workspace) { App.Workspace = workspace; App.Event('VSCODE.Activate', workspace); }
App.Deactivate = function (workspace) { App.Event('VSCODE.Deactivate', workspace); }

App.DumpConfig = { depth: null, breakLength: Infinity, compact: Infinity };
App.Dump = function (o, config) {
    if (!config) { config = App.DumpConfig; }
    return NODE.Util.inspect(o, App.DumpConfig);
}

App.GetSafeDumpText = function (o) {
    let safe = '_';
    try { safe = App.GetSafeDump(o); } catch (ex) { LOG('ERROR: App.GetSafeDumpText'); LOG(ex); }
    const safetext = App.Dump(safe);
    // LOG(safetext + "\n\n---\n");
    return safetext;
    //return JSON.stringify(safe);
}

// null, false, true, number, string, array, object
// Object Array Map Set Promise Function [Function (anonymous)]

App.GetSafeDump = function (o) {
    let seen = [];
    let total = 0;

    const fx = function (o, now) {
        if (now > 99999) { return '__JSONSKIP__'; }
        if (total++ > 999999) { return '__JSONSKIP__'; }
        //LOG(now + ':' + total);

        const otype = typeof (o);
        const ptype = Object.prototype.toString.call(o);

        let safe = o;
        let ostring = false; if (o && o.toString) { ostring = o.toString(); }

        if (otype == 'object' && !seen.includes(o)) { seen.push(o); } else { return '__JSONSKIP__'; }

        if (0) {
            LOG(o);
            LOG({ otype, ptype });
            LOG(JSONDUMP(o));
            LOG("\n");
        }

        //if (!o.toString) { return 'NOTOSTRING'; }
        if (otype == 'function' || o instanceof Function || o instanceof Promise || (ostring && ostring.startsWith('[Function ('))) {
            safe = { FX: o.toString() };
        } else if (Array.isArray(o)) {
            safe = [];
            for (const v of o) {
                const vtype = typeof (v);
                if (v == undefined) { v = null; }
                //LOG('V=' + v + '=');
                if (vtype == 'function') { safe.push({ FX: v.toString() }); }
                else if (!v || typeof (v) != 'object') { safe.push(v); }
                else {
                    const fxv = fx(v, now + 1);
                    if (fxv == '__JSONSKIP__') { continue; }
                    safe.push(fxv);
                }
            }
        } else if (otype == 'object') {
            safe = {};
            for (const k of Object.keys(o)) {
                let v = k;
                try { v = o[k]; } catch (ex) { LOG(ex); }
                const vtype = typeof (v);
                if (v == undefined) { v = null; }
                //LOG('K=' + k + '=');// + v + '=');
                if (vtype == 'function') { safe[k] = { FX: v.toString() }; }
                else if (!v || vtype != 'object') { safe[k] = v; }
                else {
                    const fxv = fx(v, now + 1);
                    if (fxv == '__JSONSKIP__') { continue; }
                    safe[k] = fxv;
                }
            }
        }

        return safe;
    }

    const safedump = fx(o, 0);
    delete seen;
    return safedump;
}

//

App.GetLocalPath = function (path) {
    path = path.substr(0, 1).toUpperCase() + path.substr(1);
    path = path.replace(/\\/g, '/');
    if (path.startsWith(App.WorkPath)) { path = path.substr(App.WorkPath.length + 1); }
    // LOG(path);
    return path;
}

App.StatusBarAdd = function (text, command) {
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 10);
    statusBarItem.command = command;
    statusBarItem.text = text;
    statusBarItem.show();
    App.Workspace.subscriptions.push(statusBarItem);
    //App.Event('VSCODE.StatusBarAdd', { text, command });
}

// App.On('WS.OPENSEND', async function () { BEAM.WS.send('HELO @ ' + Date.now()); })

App.On('VSCODE.Activate', async function (workspace) {
    //

    App.StatusMessage = await vscode.window.setStatusBarMessage('DEVKING: Activating...');
    App.StatusBarAdd('DEVKING', 'DEVKING.StatusBarClick');

    //

    let EXTDEVDIR = "W:\\DEV\\CODE\\DEVKING-VSCODE"; // TODO

    //    

    if (vscode.workspace.workspaceFolders) {
        App.WorkPath = vscode.workspace.workspaceFolders[0].uri.path;
        if (App.WorkPath.substr(2, 1) == ':') {
            if (App.WorkPath.substr(0, 1) == '/') { App.WorkPath = App.WorkPath.substr(1); }
            App.WorkPath = App.WorkPath.substr(0, 1).toUpperCase() + App.WorkPath.substr(1);
        }
        App.Event('VSCODE.WorkspaceOpen', App.WorkPath);
    };
    vscode.workspace.onDidChangeWorkspaceFolders((z) => { App.Event('VSCODE.WorkspaceChanged', z); });

    // workspace.subscriptions.push(vscode.workspace.onWillSaveTextDocument(e => { App.Event('VSCODE.FileSaving', e.document.fsPath); }))
    vscode.workspace.onDidSaveTextDocument((document) => { App.Event('VSCODE.FileSaved', App.GetLocalPath(document.uri.fsPath)); });

    vscode.workspace.onDidCloseTextDocument((z) => {
        if (z.uri.scheme != 'file') { return; }
        delete App.SeenDocs[z.uri];
        App.Event('VSCODE.FileClosed', App.GetLocalPath(z.uri.fsPath));
    })

    vscode.workspace.onDidOpenTextDocument((z) => {
        if (z.uri.scheme != 'file') { return; }
        App.Event('VSCODE.FileOpened', App.GetLocalPath(z.uri.fsPath));
    })

    vscode.window.onDidChangeActiveTextEditor((z) => {
        if (z.document.uri.scheme != 'file') { return; }
        if (!App.SeenDocs[z.document.uri]) {
            App.SeenDocs[z.document.uri] = z;
            // App.Event('VSCODE.FocusNew', z.document.uri.fsPath);
        }
        App.Event('VSCODE.Focus', App.GetLocalPath(z.document.uri.fsPath));
    })

    //

    const WSURL = 'ws://beam.onsx.net:60411/DEVKING';

    let WSFACTORYBUSY = 0;
    const WSFACTORY = function () {
        if (BEAM.IsOpen) { return; }
        WSFACTORYBUSY = 1; setTimeout(function () { WSFACTORYBUSY = 0; }, 5000);

        const ws = new WebSocket(WSURL);
        ws.on('open', function () { App.Event('VSCODE.LinkOpen', WSURL); BEAM.IsOpen = 1; WSFACTORYBUSY = 0; });
        ws.on('close', function () { App.Event('VSCODE.LinkClosed', WSURL); VSCODE.Show.Error('DEVKING.LinkClosed: ' + WSURL); BEAM.IsOpen = 0; });
        ws.on('error', function (err) { App.Event('VSCODE.LinkError', err); VSCODE.Show.Error('DEVKING.LinkError: ' + err); BEAM.IsOpen = 0; });

        ws.on('message', async function (text) {
            text = text.toString();
            const wsevent = {}; // { LinkID: 'VSCODE:' + 'ID' };
            let data = text; if (text.startsWith('{')) {
                data = JSON.parse(text);
                if (data.topic) {
                    wsevent.event = { topic: data.topic, data: data.data };
                } else if (data.Topic) {
                    wsevent.event = { topic: data.Topic, data: data.Data };
                } else {
                    wsevent.data = data;
                }
            } else {
                wsevent.text = text;
            }

            LOG({ WS: wsevent });
        });

        return ws;
    }

    BEAM.WS = WSFACTORY();
    const WSFACTORYLOOP = setInterval(function () { if (!BEAM.IsOpen && !WSFACTORYBUSY) { BEAM.WS = WSFACTORY(); } }, 250);

    BEAM.LoopFx();

    //

    const CMD_IFRAME = vscode.commands.registerCommand('DEVKING.IFRAME', async (url, title) => {
        LOG('IFRAME: ' + url);
        let panel = vscode.window.createWebviewPanel('IFRAME', title || url, vscode.ViewColumn.Beside, { enableScripts: true });
        panel.webview.html = "<html><head><style>html,body,iframe { background-color:white;border:0px;margin:0px;padding:0px;width:100%;height:100% }</style></head><body><iframe src='" + url + "'></iframe></body></html>";
    });
    App.Workspace.subscriptions.push(CMD_IFRAME);

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

    //

    const CMD_PULL = vscode.commands.registerCommand('DEVKING.PULL', async () => {
        let DT = new Date().toISOString();

        LOG(); LOG('PULL @ ' + DT);
        App.Event('VSCODE.Pull');

        vscode.window.withProgress({ title: 'PULL', location: vscode.ProgressLocation.Window },
            async progress => {
                let cwd = App.GetWorkspaceFolder(); if (!cwd && fs.existsSync(EXTDEVDIR)) { cwd = EXTDEVDIR; }
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
    App.Workspace.subscriptions.push(CMD_PULL);

    const CMD_PUSHDEV = vscode.commands.registerCommand('DEVKING.PUSHDEV', async () => {
        let DT = new Date().toISOString();

        LOG(); LOG('PUSHDEV @ ' + DT);
        App.Event('VSCODE.PushDev');

        vscode.window.withProgress({ title: 'PUSHDEV', location: vscode.ProgressLocation.Window },
            async progress => {
                let cwd = App.GetWorkspaceFolder(); if (!cwd && fs.existsSync(EXTDEVDIR)) { cwd = EXTDEVDIR; }
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
    App.Workspace.subscriptions.push(CMD_PUSHDEV);

    const CMD_PUSHTAG = vscode.commands.registerCommand('DEVKING.PUSHTAG', async () => {
        let DT = new Date().toISOString();

        LOG(); LOG('PUSHTAG @ ' + DT);
        App.Event('VSCODE.PushTag');

        vscode.window.withProgress({ title: 'PUSHDEV', location: vscode.ProgressLocation.Window },
            async progress => {
                let cwd = App.GetWorkspaceFolder(); if (!cwd && fs.existsSync(EXTDEVDIR)) { cwd = EXTDEVDIR; }
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
    App.Workspace.subscriptions.push(CMD_PUSHTAG);

    setTimeout(async function () { App.StatusMessage.dispose(); await vscode.window.setStatusBarMessage('DEVKING: Activated!', 5000); }, 999);
});

//

module.exports = {
    activate: App.Activate,
    deactivate: App.Deactivate
}
