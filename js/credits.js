// ---------------------------------------------------------------------------
// Footer "Credits" popup: shows the avocado attribution when clicked.
// ---------------------------------------------------------------------------
export function initCredits() {
  const creditBtn = document.getElementById('creditBtn');
  const creditPop = document.getElementById('creditPop');
  const creditClose = document.getElementById('creditClose');
  if (!creditBtn || !creditPop) return;

  function openCredit() {
    creditPop.hidden = false;
    creditBtn.setAttribute('aria-expanded', 'true');
    if (creditClose) creditClose.focus();
  }
  function closeCredit(restoreFocus = true) {
    creditPop.hidden = true;
    creditBtn.setAttribute('aria-expanded', 'false');
    if (restoreFocus) creditBtn.focus();
  }

  creditBtn.addEventListener('click', () => {
    if (creditPop.hidden) openCredit();
    else closeCredit();
  });
  if (creditClose) creditClose.addEventListener('click', closeCredit);
  document.addEventListener('click', (e) => {
    if (creditPop.hidden) return;
    if (!creditPop.contains(e.target) && !creditBtn.contains(e.target)) closeCredit(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !creditPop.hidden) closeCredit();
  });
}
