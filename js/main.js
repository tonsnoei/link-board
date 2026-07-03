import * as state from './state.js';
import { renderAll, setHandlers } from './render.js';
import { attachTileDnd, attachTabDnd } from './dnd.js';
import { openAddTile, openEditTile } from './tile.js';
import { openAddTab, openEditTab } from './tabs.js';
import { initSearch } from './search.js';
import { initFileActions } from './fileActions.js';
import { initFileSync } from './fileSync.js';
import { initTheme } from './theme.js';

const addTileBtn = document.getElementById('btn-add-tile');
const addTabBtn = document.getElementById('btn-add-tab');

setHandlers({
  onSelectTab: (tabId) => state.setActiveTab(tabId),
  onEditTab: (tabId) => openEditTab(tabId),
  onEditTile: (tileId) => openEditTile(tileId),
  onAddTile: () => openAddTile(state.getState().activeTabId),
  attachTileDnd,
  attachTabDnd,
});

addTileBtn.addEventListener('click', () => openAddTile(state.getState().activeTabId));
addTabBtn.addEventListener('click', () => openAddTab());

state.onChange(() => renderAll());

async function init() {
  initSearch();
  initFileActions();
  await initTheme();
  await state.load();
  await initFileSync();
}

init();
