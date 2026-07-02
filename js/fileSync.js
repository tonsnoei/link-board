import { onChange } from './state.js';
import { buildExportData } from './exportFormat.js';
import { getSetting, setSetting } from './db.js';
import { debounce } from './utils.js';

const statusEl = document.getElementById('sync-status');

let fileHandle = null;

function showStatus(text, clickable) {
  statusEl.textContent = text;
  statusEl.classList.remove('hidden');
  statusEl.style.cursor = clickable ? 'pointer' : 'default';
}

async function writeToHandle() {
  if (!fileHandle) return;
  try {
    const writable = await fileHandle.createWritable();
    await writable.write(JSON.stringify(buildExportData(), null, 2));
    await writable.close();
    showStatus(`Automatisch opgeslagen in ${fileHandle.name}`, false);
  } catch (err) {
    showStatus('Kon niet automatisch opslaan. Klik om opnieuw te verbinden.', true);
  }
}

const debouncedWrite = debounce(writeToHandle, 600);

export async function setFileHandle(handle) {
  fileHandle = handle;
  await setSetting('fileHandle', handle);
  showStatus(`Auto-opslaan actief: ${handle.name}`, false);
}

async function reconnect() {
  if (!fileHandle) return;
  const permission = await fileHandle.requestPermission({ mode: 'readwrite' });
  if (permission === 'granted') {
    await writeToHandle();
  }
}

export async function initFileSync() {
  if (!('showSaveFilePicker' in window)) return;

  const storedHandle = await getSetting('fileHandle');
  if (storedHandle) {
    fileHandle = storedHandle;
    const permission = await storedHandle.queryPermission({ mode: 'readwrite' });
    if (permission === 'granted') {
      showStatus(`Auto-opslaan actief: ${storedHandle.name}`, false);
    } else {
      showStatus('Klik om automatisch opslaan te hervatten.', true);
    }
  }

  statusEl.addEventListener('click', reconnect);
  onChange(() => debouncedWrite());
}
