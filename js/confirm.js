const modal = document.getElementById('confirm-modal');
const titleEl = document.getElementById('confirm-modal-title');
const bodyEl = document.getElementById('confirm-modal-body');
const okBtn = document.getElementById('btn-confirm-ok');
const cancelBtn = document.getElementById('btn-confirm-cancel');

export function showConfirm(title, body) {
  titleEl.textContent = title;
  bodyEl.textContent = body;
  modal.classList.remove('hidden');

  return new Promise((resolve) => {
    function cleanup(result) {
      modal.classList.add('hidden');
      okBtn.removeEventListener('click', onOk);
      cancelBtn.removeEventListener('click', onCancel);
      resolve(result);
    }
    function onOk() { cleanup(true); }
    function onCancel() { cleanup(false); }
    okBtn.addEventListener('click', onOk);
    cancelBtn.addEventListener('click', onCancel);
  });
}
