import * as state from './state.js';

export function attachTileDnd(el, tileId) {
  el.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('text/tile-id', tileId);
    e.dataTransfer.effectAllowed = 'move';
    el.classList.add('dragging');
  });
  el.addEventListener('dragend', () => el.classList.remove('dragging'));

  el.addEventListener('dragover', (e) => {
    if (e.dataTransfer.types.includes('text/tile-id')) {
      e.preventDefault();
      el.classList.add('drag-over');
    }
  });
  el.addEventListener('dragleave', () => el.classList.remove('drag-over'));

  el.addEventListener('drop', async (e) => {
    e.preventDefault();
    el.classList.remove('drag-over');
    const draggedId = e.dataTransfer.getData('text/tile-id');
    if (!draggedId || draggedId === tileId) return;
    const targetTile = state.getState().tiles.find((t) => t.id === tileId);
    if (!targetTile) return;
    const targetTiles = state.getTilesForTab(targetTile.tabId);
    const targetIndex = targetTiles.findIndex((t) => t.id === tileId);
    await state.moveTile(draggedId, targetTile.tabId, targetIndex);
  });
}

export function attachTabDnd(el, tabId) {
  el.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('text/tab-id', tabId);
    e.dataTransfer.effectAllowed = 'move';
  });

  el.addEventListener('dragover', (e) => {
    if (e.dataTransfer.types.includes('text/tab-id') || e.dataTransfer.types.includes('text/tile-id')) {
      e.preventDefault();
      el.classList.add('drag-over');
    }
  });
  el.addEventListener('dragleave', () => el.classList.remove('drag-over'));

  el.addEventListener('drop', async (e) => {
    e.preventDefault();
    el.classList.remove('drag-over');

    const draggedTileId = e.dataTransfer.getData('text/tile-id');
    if (draggedTileId) {
      const targetTiles = state.getTilesForTab(tabId);
      await state.moveTile(draggedTileId, tabId, targetTiles.length);
      return;
    }

    const draggedTabId = e.dataTransfer.getData('text/tab-id');
    if (draggedTabId && draggedTabId !== tabId) {
      const { tabs } = state.getState();
      const ids = tabs.map((t) => t.id);
      const fromIndex = ids.indexOf(draggedTabId);
      const toIndex = ids.indexOf(tabId);
      ids.splice(fromIndex, 1);
      ids.splice(toIndex, 0, draggedTabId);
      await state.reorderTabs(ids);
    }
  });
}
