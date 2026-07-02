import { buildExportData, parseImportData } from './exportFormat.js';
import { replaceAllData } from './state.js';
import { showConfirm } from './confirm.js';
import { setFileHandle } from './fileSync.js';

const exportBtn = document.getElementById('btn-export');
const importBtn = document.getElementById('btn-import');
const importInput = document.getElementById('import-file-input');

function downloadFallback(json) {
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'linkboard-export.json';
  a.click();
  URL.revokeObjectURL(url);
}

async function exportData() {
  const json = JSON.stringify(buildExportData(), null, 2);

  if ('showSaveFilePicker' in window) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: 'linkboard-export.json',
        types: [{ description: 'JSON', accept: { 'application/json': ['.json'] } }],
      });
      const writable = await handle.createWritable();
      await writable.write(json);
      await writable.close();
      await setFileHandle(handle);
      return;
    } catch (err) {
      if (err.name === 'AbortError') return;
    }
  }

  downloadFallback(json);
}

async function importFile(file) {
  const text = await file.text();
  let data;
  try {
    data = parseImportData(text);
  } catch (err) {
    alert('Kon bestand niet importeren: ongeldig formaat.');
    return;
  }

  const ok = await showConfirm(
    'Importeren',
    'Dit vervangt alle huidige tabbladen en tegels door de inhoud van dit bestand. Doorgaan?',
  );
  if (ok) {
    await replaceAllData(data.tabs, data.tiles);
  }
}

export function initExportImport() {
  exportBtn.addEventListener('click', exportData);
  importBtn.addEventListener('click', () => importInput.click());
  importInput.addEventListener('change', async () => {
    const file = importInput.files[0];
    importInput.value = '';
    if (file) await importFile(file);
  });
}
