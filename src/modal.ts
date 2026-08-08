const FOCUSABLE =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

let trapModal: HTMLElement | null = null;
let restoreFocusEl: HTMLElement | null = null;
let onKeyDown: ((e: KeyboardEvent) => void) | null = null;

function focusables(modal: HTMLElement): HTMLElement[] {
  return [...modal.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
    el => !el.hasAttribute('disabled') && el.offsetParent !== null,
  );
}

export function openModal(
  modal: HTMLElement,
  textarea: HTMLTextAreaElement | null,
  opts?: { restoreFocus?: HTMLElement; initialFocus?: HTMLElement },
): void {
  restoreFocusEl = opts?.restoreFocus ?? null;
  modal.classList.add('open');

  const focus = opts?.initialFocus ?? textarea;
  setTimeout(() => focus?.focus(), 80);

  onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeModal(modal);
      return;
    }
    if (e.key !== 'Tab' || trapModal !== modal) return;

    const els = focusables(modal);
    if (!els.length) return;

    const first = els[0];
    const last = els[els.length - 1];
    const active = document.activeElement as HTMLElement;

    if (e.shiftKey) {
      if (active === first || !modal.contains(active)) {
        e.preventDefault();
        last.focus();
      }
    } else if (active === last || !modal.contains(active)) {
      e.preventDefault();
      first.focus();
    }
  };

  trapModal = modal;
  document.addEventListener('keydown', onKeyDown);
}

export function closeModal(modal: HTMLElement): void {
  modal.classList.remove('open');

  if (trapModal === modal) {
    trapModal = null;
    if (onKeyDown) {
      document.removeEventListener('keydown', onKeyDown);
      onKeyDown = null;
    }
  }

  const el = restoreFocusEl;
  restoreFocusEl = null;
  el?.focus();
}
