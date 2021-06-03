console.log("\n");
console.log('BACKEND');
console.log("\n");

require('http').createServer((req, res) => { res.writeHead(200); res.end('DEVKING'); }).listen(31337, '0.0.0.0');
