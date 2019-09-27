const io = require('socket.io-client');
var processArgs = process.argv.slice(2);
var ip = (processArgs.length > 0) ? processArgs[0] : 'localhost'
var port = (processArgs.length > 1) ? processArgs[1] : '80'
const socket = io.connect('http://'+ip+':'+port, {reconnect: true});
const readline = require('readline');


var commands = {};
var argsList = {};
argsList['command'] = []
var autoComplete = function completer(line) 
{
    var completions = [];
    const lineWords = line.split(' ');
    const lastWord = lineWords[lineWords.length-1];
    const firstWord = lineWords[0];
    if(lineWords.length == 1)
    {
        completions = argsList['command'];
    } else if (commands[firstWord] && commands[firstWord][lineWords.length-2]) {
        if(argsList[commands[firstWord][lineWords.length-2]])
            completions = argsList[commands[firstWord][lineWords.length-2]]
    }
    const hits = completions.filter((c) => c.startsWith(lastWord));
    return [hits, lastWord];
}

function consoleOut(msg) 
{
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    console.log(msg);
    rl.prompt(true);
}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    completer: autoComplete
});

function resetPrompt()
{
    var promptLine = '';
    if(login)
        promptLine+=FgBlue+login+Reset+'@'+FgGreen+ip+Reset
    if(session)
        promptLine+=':'+FgYellow+session+Reset;
    rl.setPrompt(promptLine+' > ');
}
function getCommands(cmds)
{
    argsList['command'] = []
    for(var i in cmds)
        argsList['command'].push(i);
}

function requestPassword(args)
{
    var username = args.split(' ')[0]
    rl.stdoutMuted = true;
    rl.query = "Password : ";
    rl.question(rl.query, function(password) {
        socket.emit('command',{cmd: 'login', args: username+' '+password});
        rl.history = rl.history.slice(1);
        rl.stdoutMuted = false;
        rl.prompt()
    });

    rl._writeToOutput = function _writeToOutput(stringToWrite) {
    if (rl.stdoutMuted)
        rl.output.write("\x1B[2K\x1B[200D"+rl.query)
    else
        rl.output.write(stringToWrite);
    };
}

rl.on('line', function(line) {
    if (line[0] == "/" && line.length > 1) {
        var cmd = line.match(/[a-z-]+\b/)[0];
        var arg = line.substr(cmd.length+2, line.length);
        if(cmd == "login")
            requestPassword(arg)
        else
            socket.emit('command',{cmd: cmd, args: arg});
        rl.prompt();
    } else {
        socket.emit('message', line)
        rl.prompt();
    }
}).on('close',function(){
    process.exit(0);
});
var login = '';
var session ='';
Reset = "\x1b[0m"
Bright = "\x1b[1m"
Dim = "\x1b[2m"
Underscore = "\x1b[4m"
Blink = "\x1b[5m"
Reverse = "\x1b[7m"
Hidden = "\x1b[8m"

FgBlack = "\x1b[30m"
FgRed = "\x1b[31m"
FgGreen = "\x1b[32m"
FgYellow = "\x1b[33m"
FgBlue = "\x1b[34m"
FgMagenta = "\x1b[35m"
FgCyan = "\x1b[36m"
FgWhite = "\x1b[37m"

BgBlack = "\x1b[40m"
BgRed = "\x1b[41m"
BgGreen = "\x1b[42m"
BgYellow = "\x1b[43m"
BgBlue = "\x1b[44m"
BgMagenta = "\x1b[45m"
BgCyan = "\x1b[46m"
BgWhite = "\x1b[47m"
serverHandle = FgGreen+"Server"

socket.on('connect', ()=> { consoleOut(serverHandle+': '+Reset+'Connected to '+ip+':'+port);});
socket.on('disconnect', ()=> { consoleOut(serverHandle+': '+Reset+'Lost connection to '+ip+':'+port);});
socket.on("message", (data) => { consoleOut(data.username+": "+data.message)});
socket.on("private message", ({from, to,message}) => { consoleOut(from+to+':'+message)})
socket.on("command", (data) => { consoleOut(data.username+": "+data.message)});
socket.on("command list", (data) => { getCommands(data); commands = data });
//socket.on("suggested args list", (data) => { argslist = data });
socket.on("session list", (data) => { argsList['session'] = data; consoleOut(data) });
socket.on("session user list", (data) => { consoleOut(data) });
socket.on("enter session", (data) => { session = data; resetPrompt(); });
socket.on("leave session", (data) => { session = ''; resetPrompt();});
socket.on("user list", (data) => { argsList['user'] = data.users; consoleOut(data.users)});
socket.on("login", (data) => { login = data.username; resetPrompt()});

rl.setPrompt("> ");
rl.prompt();
