const modal = document.getElementById('icon-picker-modal');
const grid = document.getElementById('icon-picker-grid');
const searchInput = document.getElementById('icon-search-input');
const closeBtn = document.getElementById('btn-close-icon-picker');

let iconNames = null;
let onSelectCallback = null;

async function loadManifest() {
  if (iconNames) return iconNames;
  const res = await fetch('icons/manifest.json');
  iconNames = await res.json();
  return iconNames;
}

function renderGrid(filter) {
  grid.innerHTML = '';
  const query = filter.trim().toLowerCase();
  const filtered = query ? iconNames.filter((n) => n.includes(query)) : iconNames;

  filtered.slice(0, 300).forEach((name) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'icon-picker-item';
    btn.title = name;
    const img = document.createElement('img');
    img.src = `icons/${name}.svg`;
    img.alt = name;
    img.style.width = '100%';
    img.style.height = '100%';
    btn.appendChild(img);
    btn.addEventListener('click', () => {
      onSelectCallback?.(`${name}.svg`);
      close();
    });
    grid.appendChild(btn);
  });
}

export async function openIconPicker(onSelect) {
  onSelectCallback = onSelect;
  await loadManifest();
  searchInput.value = '';
  renderGrid('');
  modal.classList.remove('hidden');
  searchInput.focus();
}

function close() {
  modal.classList.add('hidden');
  onSelectCallback = null;
}

searchInput.addEventListener('input', () => renderGrid(searchInput.value));
closeBtn.addEventListener('click', close);
