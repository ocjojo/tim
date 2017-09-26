var childProcess = require('child_process');

var server = childProcess.execFile('node', ['db.js'], {
	"cwd": __dirname
});

process.stdin.setEncoding('utf8');
process.stdin.pipe(server.stdin);
server.stdout.pipe(process.stdout);
server.stderr.pipe(process.stderr);

setTimeout(console.log.bind(null, '  Type e + enter to exit'), 2000);

process.stdin.on('data', function (chunk) {
	if (chunk.trim().toLowerCase() === 'e') {
		server.kill();
		process.exit(0);
	}
});