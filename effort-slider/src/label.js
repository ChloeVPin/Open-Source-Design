/**
 * Swap the text in `host`: the old label blurs away upwards while the new one
 * comes into focus a letter at a time (or all at once with `byLetter: false`,
 * for longer lines). The CSS does the animating; this only
 * builds the spans.
 */
export function setLabel(host, text, { animate = true, byLetter = true } = {}) {
  const current = host.querySelector('.label:not(.is-leaving)');
  if (current?.textContent === text) return;

  if (current) {
    if (animate) {
      current.classList.add('is-leaving');
      current.addEventListener('animationend', () => current.remove(), { once: true });
    } else {
      current.remove();
    }
  }

  const label = document.createElement('span');
  label.className = 'label';
  (byLetter ? [...text] : [text]).forEach((char, i) => {
    const span = document.createElement('span');
    span.textContent = char;
    span.style.setProperty('--i', i);
    if (!animate) span.style.animation = 'none';
    label.append(span);
  });
  host.append(label);
}
