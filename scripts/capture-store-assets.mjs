import fs from 'node:fs/promises';

const pages = await (await fetch('http://127.0.0.1:9222/json')).json();
const page = pages.find((entry) => entry.type === 'page');
if (!page) throw new Error('No debuggable Chrome page found');

const socket = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once: true });
  socket.addEventListener('error', reject, { once: true });
});

let nextId = 1;
const pending = new Map();
socket.addEventListener('message', ({ data }) => {
  const message = JSON.parse(data);
  if (!message.id || !pending.has(message.id)) return;
  const { resolve, reject } = pending.get(message.id);
  pending.delete(message.id);
  if (message.error) reject(new Error(message.error.message));
  else resolve(message.result);
});

function send(method, params = {}) {
  const id = nextId++;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function setViewport(width, height, scale) {
  await send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: scale,
    mobile: true,
    screenWidth: width,
    screenHeight: height,
  });
}

async function reloadHome(query = '') {
  await send('Page.navigate', { url: `http://127.0.0.1:8088${query}` });
  await delay(2500);
}

async function clickText(text) {
  const expression = `(() => {
    const element = [...document.querySelectorAll('*')].find((node) =>
      node.children.length === 0 && node.textContent?.trim().includes(${JSON.stringify(text)})
    );
    const target = element?.closest('[role="button"]') || element?.parentElement;
    if (!target) return false;
    target.click();
    return true;
  })()`;
  const result = await send('Runtime.evaluate', { expression, returnByValue: true });
  if (!result.result.value) throw new Error(`Could not click text: ${text}`);
  await delay(1800);
}

async function clickSelector(selector) {
  const expression = `(() => {
    const target = document.querySelector(${JSON.stringify(selector)});
    if (!target) return false;
    target.click();
    return true;
  })()`;
  const result = await send('Runtime.evaluate', { expression, returnByValue: true });
  if (!result.result.value) throw new Error(`Could not click selector: ${selector}`);
  await delay(1800);
}

async function capture(path) {
  const result = await send('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: false,
    fromSurface: true,
  });
  await fs.writeFile(path, Buffer.from(result.data, 'base64'));
}

async function captureSet(folder, width, height, scale) {
  await setViewport(width, height, scale);
  await reloadHome();
  await capture(`${folder}/01-home-${width * scale}x${height * scale}.png`);
  await clickText('Start playing');
  await capture(`${folder}/02-gameplay-${width * scale}x${height * scale}.png`);
  await reloadHome();
  await clickText('Milestone Awards');
  await capture(`${folder}/03-awards-${width * scale}x${height * scale}.png`);
  await reloadHome();
  await clickSelector('[aria-label="Open settings"]');
  await capture(`${folder}/04-settings-${width * scale}x${height * scale}.png`);
}

async function captureAppStoreSet(folder, width, height, scale) {
  await fs.mkdir(folder, { recursive: true });
  await setViewport(width, height, scale);
  await reloadHome();
  await capture(`${folder}/01-home.png`);
  for (const level of [1, 2, 3]) {
    await reloadHome(`?captureLevel=${level}`);
    await clickText('Start playing');
    await capture(`${folder}/0${level + 1}-gameplay-level-${level}.png`);
  }
  await reloadHome();
  await clickText('Milestone Awards');
  await capture(`${folder}/05-awards.png`);
  await reloadHome();
  await clickSelector('[aria-label="Open settings"]');
  await capture(`${folder}/06-settings.png`);
}

const requestedSet = process.argv[2] || 'all';
if (requestedSet === 'all' || requestedSet === 'phone') {
  await captureSet('play-store-assets/phone', 360, 640, 3);
}
if (requestedSet === 'all' || requestedSet === 'tablet-7') {
  await captureSet('play-store-assets/tablet-7', 720, 1280, 2);
}
if (requestedSet === 'all' || requestedSet === 'tablet-10') {
  await captureSet('play-store-assets/tablet-10', 720, 1280, 3);
}
if (requestedSet === 'app-store' || requestedSet === 'app-store-iphone') {
  await captureAppStoreSet('app-store-assets/iphone-6.5', 414, 896, 3);
}
if (requestedSet === 'app-store' || requestedSet === 'app-store-ipad') {
  await captureAppStoreSet('app-store-assets/ipad-13', 1024, 1366, 2);
}

socket.close();
