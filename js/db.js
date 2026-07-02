const DB_NAME = 'linkboard';
const DB_VERSION = 1;

let dbPromise = null;

function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('tabs')) {
        db.createObjectStore('tabs', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('tiles')) {
        db.createObjectStore('tiles', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function requestToPromise(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getStore(storeName, mode) {
  const db = await openDb();
  return db.transaction(storeName, mode).objectStore(storeName);
}

export async function getAll(storeName) {
  const store = await getStore(storeName, 'readonly');
  return requestToPromise(store.getAll());
}

export async function put(storeName, value) {
  const store = await getStore(storeName, 'readwrite');
  return requestToPromise(store.put(value));
}

export async function remove(storeName, key) {
  const store = await getStore(storeName, 'readwrite');
  return requestToPromise(store.delete(key));
}

export async function clearStore(storeName) {
  const store = await getStore(storeName, 'readwrite');
  return requestToPromise(store.clear());
}

export async function getSetting(key) {
  const store = await getStore('settings', 'readonly');
  const row = await requestToPromise(store.get(key));
  return row ? row.value : undefined;
}

export async function setSetting(key, value) {
  return put('settings', { key, value });
}

export async function replaceAll(tabs, tiles) {
  const db = await openDb();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(['tabs', 'tiles'], 'readwrite');
    const tabsStore = tx.objectStore('tabs');
    const tilesStore = tx.objectStore('tiles');
    tabsStore.clear();
    tilesStore.clear();
    tabs.forEach((tab) => tabsStore.put(tab));
    tiles.forEach((tile) => tilesStore.put(tile));
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}
