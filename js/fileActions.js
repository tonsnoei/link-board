import { buildExportData, parseImportData } from './exportFormat.js';
import { replaceAllData } from './state.js';
import { showConfirm } from './confirm.js';
import { connectFileHandle } from './fileSync.js';

const openBtn = document.getElementById('btn-open');
const saveAsBtn = document.getElementById('btn-save-as');
const openInput = document.getElementById('open-file-input');

const jsonFileType = { description: 'JSON', accept: { 'application/json': ['.json'] } };

function downloadFallback(json) {
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'linkboard.json';
  a.click();
  URL.revokeObjectURL(url);
}

async function loadFromText(text) {
  let data;
  try {
    data = parseImportData(text);
  } catch (err) {
    alert('Kon bestand niet openen: ongeldig formaat.');
    return false;
  }

  const ok = await showConfirm(
    'Bestand openen',
    'Dit vervangt alle huidige tabbladen en tegels door de inhoud van dit bestand. Doorgaan?',
  );
  if (ok) await replaceAllData(data.tabs, data.tiles);
  return ok;
}

async function openFile() {
  if ('showOpenFilePicker' in window) {
    let handle;
    try {
      [handle] = await window.showOpenFilePicker({ types: [jsonFileType] });
    } catch (err) {
      if (err.name === 'AbortError') return;
      throw err;
    }
    const file = await handle.getFile();
    const loaded = await loadFromText(await file.text());
    if (loaded) await connectFileHandle(handle);
    return;
  }

  openInput.click();
}

async function saveAsFile() {
  const json = JSON.stringify(buildExportData(), null, 2);

  if ('showSaveFilePicker' in window) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: 'linkboard.json',
        types: [jsonFileType],
      });
      const writable = await handle.createWritable();
      await writable.write(json);
      await writable.close();
      await connectFileHandle(handle);
      return;
    } catch (err) {
      if (err.name === 'AbortError') return;
    }
  }

  downloadFallback(json);
}

export function initFileActions() {
  openBtn.addEventListener('click', openFile);
  saveAsBtn.addEventListener('click', saveAsFile);
  openInput.addEventListener('change', async () => {
    const file = openInput.files[0];
    openInput.value = '';
    if (file) await loadFromText(await file.text());
  });
}
