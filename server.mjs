import * as https from "https";
import * as selfsigned from "selfsigned";
import * as fs from "fs";

const domain = "localhost";
const port = 3000;

const attrs = [{ name: "commonName", value: domain }];
const certOptions = { keySize: 2048, selfSigned: true };
const pems = selfsigned.generate(attrs, certOptions);

fs.writeFileSync("server.key", pems.private);
fs.writeFileSync("server.cert", pems.cert);

const options = {
    key: fs.readFileSync("server.key"),
    cert: fs.readFileSync("server.cert")
};

const responseBody = {
    items: []
};

const server = https.createServer(options, (req, res) => {
    res.writeHead(429, { "Retry-After": 1 });
    res.end();
});

server.listen(port);