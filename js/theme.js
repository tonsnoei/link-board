import { getSetting, setSetting } from './db.js';

const themeBtn = document.getElementById('btn-theme');

export async function initTheme() {
  const saved = await getSetting('theme');
  if (saved === 'dark') document.body.classList.add('theme-dark');

  themeBtn.addEventListener('click', async () => {
    document.body.classList.toggle('theme-dark');
    const isDark = document.body.classList.contains('theme-dark');
    await setSetting('theme', isDark ? 'dark' : 'light');
  });
}
