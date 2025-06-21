import { Client } from 'ssh2';

export function tryLogin(
  host: string,
  port: number,
  username: string,
  password: string,
  timeoutMs = 5000
): Promise<boolean> {
  return new Promise((resolve) => {
    const conn = new Client();
    let done = false;

    const timeout = setTimeout(() => {
      if (!done) {
        console.log(`[!] TIMEOUT: ${host}:${port}`);
        conn.end();
        resolve(false);
      }
    }, timeoutMs);

    conn
      .on('ready', () => {
        if (done) return;
        done = true;
        clearTimeout(timeout);
        console.log(`[+] SUCCESS: ${host}:${port} => ${username}:${password}`);
        conn.end();
        resolve(true);
      })
      .on('error', (err) => {
        if (done) return;
        done = true;
        clearTimeout(timeout);

        const msg = err.message || '';
        if (msg.includes('handshake') || msg.includes('timed out')) {
          console.error(`[!] ERROR on ${host}:${port}: ${msg}`);
        } else {
          console.error(`[-] FAILED: ${host}:${port} => ${username}:${password}`);
        }

        resolve(false);
      })
      .connect({
        host,
        port,
        username,
        password,
        readyTimeout: timeoutMs,
      });
  });
}