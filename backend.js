const XT = require('@cogsmith/xt').Init();
const App = XT.App; const LOG = XT.LOG;

let ZFOO = 3467;
let ZZZZ = 9999;

App.InitArgs = function () {
}

App.InitInfo = function () {
    // App.SetInfo('App', function () { return 'DEVKING' });
}

App.InitData = function () {
    App.MyDB = { FOO: 123, BAR: Math.random() };
}

App.Init = function () {
}

App.InitDone = function () {
}

App.Main = function () {
}

App.Routes = { ELSEROOT: true };
App.Routes['/foo'] = (req, rep) => { rep.send('FOO'); };

App.Routes = {
    '/foo': (req, rep) => {
        let data = { action: 'FOO', rand: Math.random() };
        rep.view('template', data);
    }
}

App.Routes['/uptime'] = (req, rep) => { rep.send(Math.floor(process.uptime())); };


App.Port = 31337;
App.Run();
