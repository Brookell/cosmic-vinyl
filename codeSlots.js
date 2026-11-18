// Cosmic Vinyl - CodeSlots
// A row of digit slots driven by one hidden <input>, so mobile number pads,
// paste and password managers all work. Options mirror the React CodeSlots API:
//   length, status ('idle' | 'success' | 'error'), onChange, onComplete,
//   accentColor, inkColor, slotColor, digitColor, dangerColor,
//   slotSize, gap, radius, bounce, settle, rise, cascade.

const DEFAULTS = {
  length: 6,
  status: 'idle',
  masked: true,
  label: '',
  autocomplete: 'one-time-code',
  onChange: () => {},
  onComplete: () => {},
  accentColor: '#f5f5f5',
  inkColor: '#f5f5f5',
  slotColor: '#27272a',
  digitColor: '#18181b',
  dangerColor: '#ff3b30',
  slotSize: 44,
  gap: 8,
  radius: 12,
  bounce: 0.2, // overshoot amount of the digit pop
  settle: 0.3, // seconds for a digit to settle into place
  rise: 8, // px a digit rises from
  cascade: 20 // ms between slots for success / error waves
};

export function createCodeSlots(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  let value = '';
  let masked = o.masked;

  root.classList.add('code-slots');
  root.style.setProperty('--cs-accent', o.accentColor);
  root.style.setProperty('--cs-ink', o.inkColor);
  root.style.setProperty('--cs-slot', o.slotColor);
  root.style.setProperty('--cs-digit', o.digitColor);
  root.style.setProperty('--cs-danger', o.dangerColor);
  root.style.setProperty('--cs-size', `${o.slotSize}px`);
  root.style.setProperty('--cs-gap', `${o.gap}px`);
  root.style.setProperty('--cs-radius', `${o.radius}px`);
  root.style.setProperty('--cs-settle', `${o.settle}s`);
  root.style.setProperty('--cs-rise', `${o.rise}px`);
  root.style.setProperty('--cs-cascade', `${o.cascade}ms`);
  // Overshooting ease: bounce 0 = no overshoot, 0.2 ≈ a gentle spring.
  root.style.setProperty('--cs-ease', `cubic-bezier(0.2, ${(1 + o.bounce * 3).toFixed(2)}, 0.4, 1)`);

  const input = document.createElement('input');
  input.className = 'code-slots-input';
  input.type = 'text';
  input.inputMode = 'numeric';
  input.autocomplete = o.autocomplete;
  input.maxLength = o.length;
  input.spellcheck = false;
  if (o.label) input.setAttribute('aria-label', o.label);

  const row = document.createElement('div');
  row.className = 'code-slots-row';
  row.setAttribute('aria-hidden', 'true');

  const slots = Array.from({ length: o.length }, (_, i) => {
    const slot = document.createElement('div');
    slot.className = 'code-slot';
    slot.style.setProperty('--i', i);
    const char = document.createElement('span');
    char.className = 'code-slot-char';
    slot.appendChild(char);
    row.appendChild(slot);
    return { slot, char };
  });

  root.replaceChildren(row, input);

  function restartClass(el, className) {
    el.classList.remove(className);
    void el.offsetWidth;
    el.classList.add(className);
  }

  function render(prevLength = value.length) {
    slots.forEach(({ slot, char }, i) => {
      const filled = i < value.length;
      slot.classList.toggle('filled', filled);
      slot.classList.toggle('active', i === Math.min(value.length, o.length - 1) && value.length < o.length);
      char.textContent = filled ? (masked ? '•' : value[i]) : '';
      if (filled && i >= prevLength) restartClass(slot, 'pop');
      if (!filled) slot.classList.remove('pop');
    });
  }

  function setStatus(status) {
    root.removeAttribute('data-status');
    if (status && status !== 'idle') {
      void root.offsetWidth; // restart the wave even if the status repeats
      root.setAttribute('data-status', status);
    }
  }

  input.addEventListener('input', () => {
    const prevLength = value.length;
    const next = input.value.replace(/\D/g, '').slice(0, o.length);
    input.value = next;
    if (next === value) return;
    value = next;
    render(prevLength);
    o.onChange(value);
    if (value.length === o.length) o.onComplete(value);
  });

  input.addEventListener('focus', () => root.classList.add('is-focused'));
  input.addEventListener('blur', () => root.classList.remove('is-focused'));

  setStatus(o.status);
  render();

  return {
    element: root,
    input,
    getValue: () => value,
    setStatus,
    clear() {
      value = '';
      input.value = '';
      render();
    },
    focus() {
      input.focus({ preventScroll: true });
    },
    setMasked(nextMasked) {
      masked = nextMasked;
      render(value.length);
    },
    isMasked: () => masked,
    setDisabled(disabled) {
      input.disabled = disabled;
      root.classList.toggle('is-disabled', disabled);
    },
    // Total time a success / error wave takes, so callers can wait for it.
    waveDuration: () => o.settle * 1000 + o.cascade * (o.length - 1) + 120
  };
}
