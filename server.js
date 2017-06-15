'use strict';

const hapi = require('hapi');
const fs = require('fs');

const server = new hapi.Server();
server.connection({ port: 5000, host: 'localhost' });

server.register(require('inert'), (err) => {
    if (err) throw err;

    server.route({
        method: 'GET',
        path: '/',
        handler: (req, res) => {
            res.file('./index.html');
        }
    });

    server.route({
        method: 'GET',
        path: '/public/{path*}',
        handler: {
            directory: {
                path: './',
                listing: false,
                index: false
            }
        }
    });

    server.route({
        method: 'GET',
        path: '/txtfile',
        handler: (req, res) => {
            res.file('bax-output.txt');
        }
    });

    // take in uploaded txt file to hold
    server.route({
        method: 'POST',
        path: '/import',
        handler: (req, res) => {
            var createdFileName = 'batch_' + Date.now() + '.txt';

            fs.stat('uploads', (err, stats) => {
                if (err) fs.mkdirSync('uploads');

                fs.writeFile('./uploads/' + createdFileName, req.payload, 'utf8', () => {
                    res('Saved to file ' + createdFileName).code(201);
                });
            });
        }
    });

    // export generated CSV content into file
    server.route({
        method: 'POST',
        path: '/export',
        handler: (req, res) => {
            var createdFileName = 'schedule' + req.payload.id + '_results.csv';

            fs.stat('output', (err, stats) => {
                if(err) fs.mkdirSync('output');

                fs.writeFile('./output/' + createdFileName, req.payload.data, 'utf8', () => {
                    res('Saved to file ' + createdFileName).code(201);
                });
            });
        }
    })
});

server.start((err) => {
    if (err) throw err;

    console.log(`Server running at: ${server.info.uri}`);
});
