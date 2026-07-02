import * as db from './db.js';
import { generateId } from './utils.js';

const state = {
  tabs: [],
  tiles: [],
  activeTabId: null,
};

const listeners = new Set();

export function onChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notify() {
  listeners.forEach((fn) => fn(state));
}

export async function load() {
  const [tabs, tiles] = await Promise.all([db.getAll('tabs'), db.getAll('tiles')]);
  state.tabs = tabs.sort((a, b) => a.order - b.order);
  state.tiles = tiles.sort((a, b) => a.order - b.order);
  if (state.tabs.length === 0) {
    const tab = { id: generateId(), name: 'Start', order: 0 };
    state.tabs = [tab];
    await db.put('tabs', tab);
  }
  state.activeTabId = state.tabs[0].id;
  notify();
}

export function getState() {
  return state;
}

export function getTilesForTab(tabId) {
  return state.tiles.filter((t) => t.tabId === tabId).sort((a, b) => a.order - b.order);
}

export function setActiveTab(tabId) {
  state.activeTabId = tabId;
  notify();
}

export async function addTab(name) {
  const order = state.tabs.length;
  const tab = { id: generateId(), name, order };
  state.tabs.push(tab);
  await db.put('tabs', tab);
  notify();
  return tab;
}

export async function renameTab(tabId, name) {
  const tab = state.tabs.find((t) => t.id === tabId);
  if (!tab) return;
  tab.name = name;
  await db.put('tabs', tab);
  notify();
}

export async function deleteTab(tabId) {
  state.tabs = state.tabs.filter((t) => t.id !== tabId);
  const removedTiles = state.tiles.filter((t) => t.tabId === tabId);
  state.tiles = state.tiles.filter((t) => t.tabId !== tabId);
  await Promise.all([
    db.remove('tabs', tabId),
    ...removedTiles.map((t) => db.remove('tiles', t.id)),
  ]);
  if (state.activeTabId === tabId) {
    state.activeTabId = state.tabs[0] ? state.tabs[0].id : null;
  }
  notify();
}

export async function reorderTabs(orderedIds) {
  orderedIds.forEach((id, index) => {
    const tab = state.tabs.find((t) => t.id === id);
    if (tab) tab.order = index;
  });
  state.tabs.sort((a, b) => a.order - b.order);
  await Promise.all(state.tabs.map((t) => db.put('tabs', t)));
  notify();
}

export async function addTile(tabId, data) {
  const order = getTilesForTab(tabId).length;
  const tile = { id: generateId(), tabId, order, ...data };
  state.tiles.push(tile);
  await db.put('tiles', tile);
  notify();
  return tile;
}

export async function updateTile(tileId, data) {
  const tile = state.tiles.find((t) => t.id === tileId);
  if (!tile) return;
  Object.assign(tile, data);
  await db.put('tiles', tile);
  notify();
}

export async function deleteTile(tileId) {
  state.tiles = state.tiles.filter((t) => t.id !== tileId);
  await db.remove('tiles', tileId);
  notify();
}

export async function moveTile(tileId, targetTabId, targetIndex) {
  const tile = state.tiles.find((t) => t.id === tileId);
  if (!tile) return;
  const sourceTabId = tile.tabId;
  tile.tabId = targetTabId;

  const targetTiles = getTilesForTab(targetTabId).filter((t) => t.id !== tileId);
  targetTiles.splice(targetIndex, 0, tile);
  targetTiles.forEach((t, i) => { t.order = i; });

  let touched = targetTiles;
  if (sourceTabId !== targetTabId) {
    const sourceTiles = getTilesForTab(sourceTabId);
    sourceTiles.forEach((t, i) => { t.order = i; });
    touched = targetTiles.concat(sourceTiles);
  }

  await Promise.all(touched.map((t) => db.put('tiles', t)));
  notify();
}

export async function replaceAllData(tabs, tiles) {
  state.tabs = tabs.sort((a, b) => a.order - b.order);
  state.tiles = tiles.sort((a, b) => a.order - b.order);
  state.activeTabId = state.tabs[0] ? state.tabs[0].id : null;
  await db.replaceAll(state.tabs, state.tiles);
  notify();
}
