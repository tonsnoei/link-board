import { onChange } from './state.js';
import { buildExportData } from './exportFormat.js';
import { getSetting, setSetting } from './db.js';
import { debounce } from './utils.js';

const statusEl = document.getElementById('sync-status');

let fileHandle = null;
let lastSavedAt = null;

function formatSavedAt(date) {
  const time = date.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
  const sameDay = date.toDateString() === new Date().toDateString();
  return sameDay ? time : `${date.toLocaleDateString('nl-NL')} ${time}`;
}

function render(text, { signal = false, clickable = false } = {}) {
  statusEl.textContent = text;
  statusEl.classList.remove('hidden');
  statusEl.classList.toggle('sync-status-signal', signal);
  statusEl.style.cursor = clickable ? 'pointer' : 'default';
}

function renderSaved() {
  render(`Laatst opgeslagen om ${formatSavedAt(lastSavedAt)}`);
}

function renderUnsaved() {
  render('Nog niet opgeslagen', { signal: true });
}

async function recordSaved() {
  lastSavedAt = new Date();
  await setSetting('lastSavedAt', lastSavedAt.toISOString());
  renderSaved();
}

async function writeToHandle() {
  if (!fileHandle) return;
  try {
    const writable = await fileHandle.createWritable();
    await writable.write(JSON.stringify(buildExportData(), null, 2));
    await writable.close();
    await recordSaved();
  } catch (err) {
    render('Kon niet automatisch opslaan. Klik om opnieuw te verbinden.', { signal: true, clickable: true });
  }
}

const debouncedWrite = debounce(writeToHandle, 600);

export async function connectFileHandle(handle) {
  fileHandle = handle;
  await setSetting('fileHandle', handle);
  await recordSaved();
}

async function reconnect() {
  if (!fileHandle) return;
  const permission = await fileHandle.requestPermission({ mode: 'readwrite' });
  if (permission === 'granted') {
    await writeToHandle();
  }
}

export async function initFileSync() {
  const storedSavedAt = await getSetting('lastSavedAt');
  if (storedSavedAt) lastSavedAt = new Date(storedSavedAt);

  if (!('showSaveFilePicker' in window)) {
    renderUnsaved();
    return;
  }

  const storedHandle = await getSetting('fileHandle');
  if (storedHandle) {
    fileHandle = storedHandle;
    const permission = await storedHandle.queryPermission({ mode: 'readwrite' });
    if (permission === 'granted') {
      if (lastSavedAt) renderSaved();
      else renderUnsaved();
    } else {
      render('Klik om automatisch opslaan te hervatten.', { signal: true, clickable: true });
    }
  } else {
    renderUnsaved();
  }

  statusEl.addEventListener('click', reconnect);
  onChange(() => debouncedWrite());
}
