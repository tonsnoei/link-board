import * as state from './state.js';
import { normalizeUrl, faviconCandidatesFor, loadImageWithFallbacks, refreshFaviconCache } from './utils.js';
import { showConfirm } from './confirm.js';
import { openIconPicker } from './iconPicker.js';

const modal = document.getElementById('tile-modal');
const form = document.getElementById('tile-form');
const title = document.getElementById('tile-modal-title');
const nameInput = document.getElementById('tile-name');
const urlInput = document.getElementById('tile-url');
const colorInput = document.getElementById('tile-color');
const colorHexInput = document.getElementById('tile-color-hex');
const iconPreview = document.getElementById('tile-icon-preview');
const deleteBtn = document.getElementById('btn-delete-tile');
const cancelBtn = document.getElementById('btn-cancel-tile');
const pickIconBtn = document.getElementById('btn-pick-icon');
const useFaviconBtn = document.getElementById('btn-use-favicon');
const uploadIconBtn = document.getElementById('btn-upload-icon');
const uploadInput = document.getElementById('icon-upload-input');

let editingTileId = null;
let currentIcon = null;

const HEX_COLOR_RE = /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

function normalizeHex(value) {
  let hex = value.trim();
  if (!hex.startsWith('#')) hex = `#${hex}`;
  if (!HEX_COLOR_RE.test(hex)) return null;
  if (hex.length === 4) {
    hex = `#${[...hex.slice(1)].map((c) => c + c).join('')}`;
  }
  return hex.toLowerCase();
}

function renderIconPreview() {
  iconPreview.innerHTML = '';
  const img = document.createElement('img');
  if (currentIcon) {
    img.src = currentIcon.value;
  } else if (urlInput.value) {
    faviconCandidatesFor(normalizeUrl(urlInput.value)).then((urls) =>
      loadImageWithFallbacks(img, urls, () => {})
    );
  }
  iconPreview.appendChild(img);
}

function open(tileId, defaultTabId) {
  editingTileId = tileId;
  const tile = tileId ? state.getState().tiles.find((t) => t.id === tileId) : null;

  title.textContent = tile ? 'Tegel bewerken' : 'Tegel toevoegen';
  nameInput.value = tile ? tile.name : '';
  urlInput.value = tile ? tile.url : '';
  colorInput.value = tile ? tile.color : '#ffffff';
  colorHexInput.value = colorInput.value;
  colorHexInput.classList.remove('invalid');
  currentIcon = tile && tile.icon?.type !== 'favicon' ? tile.icon : null;
  deleteBtn.classList.toggle('hidden', !tile);
  modal.dataset.tabId = defaultTabId || '';
  renderIconPreview();
  modal.classList.remove('hidden');
  nameInput.focus();
}

export function openAddTile(tabId) {
  open(null, tabId);
}

export function openEditTile(tileId) {
  open(tileId, null);
}

function close() {
  modal.classList.add('hidden');
  editingTileId = null;
  currentIcon = null;
}

urlInput.addEventListener('input', () => {
  if (!currentIcon) renderIconPreview();
});

colorInput.addEventListener('input', () => {
  colorHexInput.value = colorInput.value;
  colorHexInput.classList.remove('invalid');
});

colorHexInput.addEventListener('input', () => {
  const hex = normalizeHex(colorHexInput.value);
  if (hex) {
    colorInput.value = hex;
    colorHexInput.classList.remove('invalid');
  } else {
    colorHexInput.classList.add('invalid');
  }
});

colorHexInput.addEventListener('blur', () => {
  const hex = normalizeHex(colorHexInput.value);
  colorHexInput.value = hex || colorInput.value;
  colorHexInput.classList.remove('invalid');
});

pickIconBtn.addEventListener('click', () => {
  openIconPicker((iconFile) => {
    currentIcon = { type: 'library', value: `icons/${iconFile}` };
    renderIconPreview();
  });
});

useFaviconBtn.addEventListener('click', () => {
  currentIcon = null;
  renderIconPreview();
});

uploadIconBtn.addEventListener('click', () => uploadInput.click());

uploadInput.addEventListener('change', () => {
  const file = uploadInput.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    currentIcon = { type: 'upload', value: reader.result };
    renderIconPreview();
  };
  reader.readAsDataURL(file);
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = nameInput.value.trim();
  const url = normalizeUrl(urlInput.value.trim());
  const color = colorInput.value;
  const icon = currentIcon || { type: 'favicon', value: '' };

  if (icon.type === 'favicon') {
    await refreshFaviconCache(url);
  }

  if (editingTileId) {
    await state.updateTile(editingTileId, { name, url, color, icon });
  } else {
    const tabId = modal.dataset.tabId || state.getState().activeTabId;
    await state.addTile(tabId, { name, url, color, icon });
  }
  close();
});

cancelBtn.addEventListener('click', close);

deleteBtn.addEventListener('click', async () => {
  if (!editingTileId) return;
  const ok = await showConfirm('Tegel verwijderen', 'Weet je zeker dat je deze tegel wilt verwijderen?');
  if (ok) {
    await state.deleteTile(editingTileId);
    close();
  }
});
