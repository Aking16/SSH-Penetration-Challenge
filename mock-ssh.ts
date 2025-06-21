import { Server } from 'ssh2';
import fs from 'fs';

// Simple in-memory username/password pair
const VALID_USERS: { [key: string]: string; } = {
  'admin': 'admin123',
  'test': 'pass',
};

const server = new Server(
  {
    hostKeys: [{ key: fs.readFileSync('./host.key'), passphrase: "123" }],
  },
  (client) => {
    console.log('Client connected.');

    client.on('authentication', (ctx) => {
      if (ctx.method === 'password') {
        const username = ctx.username;
        const password = ctx.password;
        if (
          Object.prototype.hasOwnProperty.call(VALID_USERS, username) &&
          VALID_USERS[username] === password
        ) {
          console.log(`[+] AUTH OK: ${username}`);
          ctx.accept();
        } else {
          console.log(`[-] AUTH FAIL: ${username}:${password}`);
          ctx.reject();
        }
      } else {
        ctx.reject();
      }
    });

    client.on('ready', () => {
      console.log('Client authenticated!');

      client.on('session', (accept) => {
        const session = accept();
        session.on('shell', (acceptShell) => {
          const stream = acceptShell();
          stream.write('Mock SSH Server\r\n');
          stream.end();
        });
      });
    });

    client.on('end', () => {
      console.log('Client disconnected');
    });
  }
);

server.listen(2222, '0.0.0.0', () => {
  console.log('Mock SSH server running on port 2222');
});