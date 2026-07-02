import * as state from './state.js';
import { showConfirm } from './confirm.js';

const modal = document.getElementById('tab-modal');
const form = document.getElementById('tab-form');
const title = document.getElementById('tab-modal-title');
const nameInput = document.getElementById('tab-name');
const deleteBtn = document.getElementById('btn-delete-tab');
const cancelBtn = document.getElementById('btn-cancel-tab');

let editingTabId = null;

function open(tabId) {
  editingTabId = tabId;
  const tab = tabId ? state.getState().tabs.find((t) => t.id === tabId) : null;
  title.textContent = tab ? 'Tabblad bewerken' : 'Tabblad toevoegen';
  nameInput.value = tab ? tab.name : '';
  deleteBtn.classList.toggle('hidden', !tab);
  modal.classList.remove('hidden');
  nameInput.focus();
}

function close() {
  modal.classList.add('hidden');
  editingTabId = null;
}

export function openAddTab() {
  open(null);
}

export function openEditTab(tabId) {
  open(tabId);
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = nameInput.value.trim();
  if (!name) return;
  if (editingTabId) {
    await state.renameTab(editingTabId, name);
  } else {
    const tab = await state.addTab(name);
    state.setActiveTab(tab.id);
  }
  close();
});

cancelBtn.addEventListener('click', close);

deleteBtn.addEventListener('click', async () => {
  if (!editingTabId) return;
  const ok = await showConfirm('Tabblad verwijderen', 'Weet je zeker dat je dit tabblad en alle tegels erin wilt verwijderen?');
  if (ok) {
    await state.deleteTab(editingTabId);
    close();
  }
});
