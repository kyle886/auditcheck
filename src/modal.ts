export function openModal(modal: HTMLElement, textarea: HTMLTextAreaElement): void {
  modal.classList.add('open');
  setTimeout(() => textarea.focus(), 80);
}

export function closeModal(modal: HTMLElement): void {
  modal.classList.remove('open');
}
