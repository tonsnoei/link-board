import { getState } from './state.js';

export const EXPORT_VERSION = 1;

export function buildExportData() {
  const { tabs, tiles } = getState();
  return {
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    tabs,
    tiles,
  };
}

export function parseImportData(json) {
  const data = JSON.parse(json);
  if (!data || !Array.isArray(data.tabs) || !Array.isArray(data.tiles)) {
    throw new Error('Ongeldig bestandsformaat.');
  }
  return data;
}
