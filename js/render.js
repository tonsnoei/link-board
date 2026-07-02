import { getState, getTilesForTab } from './state.js';
import { faviconCandidatesFor, isLightColor, loadImageWithFallbacks } from './utils.js';

const tabsBar = document.getElementById('tabs-bar');
const tileGrid = document.getElementById('tile-grid');

let searchQuery = '';
let handlers = {};

export function setHandlers(h) {
  handlers = h;
}

export function setSearchQuery(query) {
  searchQuery = query.trim().toLowerCase();
  renderTiles();
}

export function renderAll() {
  renderTabs();
  renderTiles();
}

export function renderTabs() {
  const { tabs, activeTabId } = getState();
  tabsBar.innerHTML = '';
  tabs.forEach((tab) => {
    const btn = document.createElement('button');
    btn.className = 'tab-btn' + (tab.id === activeTabId ? ' active' : '');
    btn.textContent = tab.name;
    btn.dataset.tabId = tab.id;
    btn.draggable = true;
    btn.addEventListener('click', () => handlers.onSelectTab?.(tab.id));
    btn.addEventListener('dblclick', () => handlers.onEditTab?.(tab.id));
    handlers.attachTabDnd?.(btn, tab.id);
    tabsBar.appendChild(btn);
  });
}

function fallbackInitial(tile) {
  const span = document.createElement('span');
  span.className = 'tile-icon-fallback';
  span.textContent = (tile.name.trim()[0] || '?').toUpperCase();
  return span;
}

function iconContent(tile, tileIsLight) {
  if (tile.icon?.type === 'library' || tile.icon?.type === 'upload') {
    const img = document.createElement('img');
    img.src = tile.icon.value;
    img.alt = '';
    img.onerror = () => img.replaceWith(fallbackInitial(tile));
    if (tile.icon.type === 'library' && !tileIsLight) {
      img.style.filter = 'invert(1)';
    }
    return img;
  }
  const img = document.createElement('img');
  img.alt = '';
  loadImageWithFallbacks(img, faviconCandidatesFor(tile.url), () => img.replaceWith(fallbackInitial(tile)));
  return img;
}

export function renderTiles() {
  const { activeTabId } = getState();
  tileGrid.innerHTML = '';
  if (!activeTabId) return;

  let tiles = getTilesForTab(activeTabId);
  if (searchQuery) {
    tiles = tiles.filter((t) => t.name.toLowerCase().includes(searchQuery));
  }

  tiles.forEach((tile, index) => {
    const el = document.createElement('a');
    el.className = 'tile';
    el.href = tile.url;
    el.target = '_blank';
    el.rel = 'noopener noreferrer';
    const tileColor = tile.color || '#4f8ef7';
    const tileIsLight = isLightColor(tileColor);
    el.style.background = tileColor;
    el.style.setProperty('--tile-text-color', tileIsLight ? '#000000' : '#ffffff');
    el.dataset.tileId = tile.id;
    el.draggable = true;

    const iconWrap = document.createElement('div');
    iconWrap.className = 'tile-icon';
    iconWrap.appendChild(iconContent(tile, tileIsLight));
    el.appendChild(iconWrap);

    const label = document.createElement('div');
    label.className = 'tile-label';
    label.textContent = tile.name;
    el.appendChild(label);

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'tile-edit-btn';
    editBtn.textContent = '✎';
    editBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      handlers.onEditTile?.(tile.id);
    });
    el.appendChild(editBtn);

    handlers.attachTileDnd?.(el, tile.id, index);

    tileGrid.appendChild(el);
  });

  if (!searchQuery) {
    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'tile tile-add';
    addBtn.textContent = '+';
    addBtn.addEventListener('click', () => handlers.onAddTile?.());
    tileGrid.appendChild(addBtn);
  } else if (tiles.length === 0) {
    const msg = document.createElement('div');
    msg.className = 'tile-empty-message';
    msg.textContent = 'Geen tegels gevonden.';
    tileGrid.appendChild(msg);
  }
}
