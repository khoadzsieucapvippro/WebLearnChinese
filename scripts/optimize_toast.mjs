import fs from 'node:fs';

const filePath = 'frontend/js/ui/ui.js';
let content = fs.readFileSync(filePath, 'utf8');

const targetOldToast = `export function showToast({
  type = 'info',
  title = '',
  message = '',
  duration = 4000
} = {}) {
  if (typeof document === 'undefined') return;
  let toastContainer = document.getElementById('toastContainer');
  if (!toastContainer) {
    toastContainer = createSafeElement('div', {
      className: 'toast-container-custom',
      attrs: {
        'id': 'toastContainer',
        'role': 'status',
        'aria-live': 'polite',
        'aria-atomic': 'true'
      }
    });
    document.body.appendChild(toastContainer);
  }

  const typeClass = \`toast-\${type}\`;
  const toastEl = createSafeElement('div', {
    className: \`toast-custom \${typeClass}\`,
    children: [
      createSafeElement('div', {
        className: 'toast-content',
        children: [
          title ? createSafeElement('div', { className: 'toast-title', text: title }) : '',
          message ? createSafeElement('p', { className: 'toast-message', text: message }) : ''
        ].filter(Boolean)
      }),
      createSafeElement('button', {
        className: 'toast-close-btn',
        attrs: {
          'type': 'button',
          'aria-label': 'Đóng thông báo'
        },
        text: '✕'
      })
    ]
  });

  const closeBtn = toastEl.querySelector('.toast-close-btn');
  const dismiss = () => {
    toastEl.style.opacity = '0';
    toastEl.style.transform = 'translateY(8px)';
    setTimeout(() => {
      if (toastEl.parentNode) {
        toastEl.parentNode.removeChild(toastEl);
      }
    }, 200);
  };

  closeBtn.addEventListener('click', dismiss);

  toastContainer.appendChild(toastEl);

  if (duration > 0) {
    setTimeout(dismiss, duration);
  }
}`;

const replacementNewToast = `// Track recent toasts for deduplication and spam prevention
let _lastToastKey = '';
let _lastToastTimestamp = 0;

export function showToast({
  type = 'info',
  title = '',
  message = '',
  duration = 2500
} = {}) {
  if (typeof document === 'undefined') return;

  // 1. Deduplication guard: ignore identical toast messages within 2.0s
  const toastKey = \`\${type}::\${title}::\${message}\`;
  const now = Date.now();
  if (toastKey === _lastToastKey && (now - _lastToastTimestamp) < 2000) {
    return;
  }
  _lastToastKey = toastKey;
  _lastToastTimestamp = now;

  let toastContainer = document.getElementById('toastContainer');
  if (!toastContainer) {
    toastContainer = createSafeElement('div', {
      className: 'toast-container-custom',
      attrs: {
        'id': 'toastContainer',
        'role': 'status',
        'aria-live': 'polite',
        'aria-atomic': 'true'
      }
    });
    document.body.appendChild(toastContainer);
  }

  // 2. Strict Max Toasts constraint: keep maximum 2 toasts at any time
  const existingToasts = toastContainer.querySelectorAll('.toast-custom');
  if (existingToasts.length >= 2) {
    for (let i = 0; i <= existingToasts.length - 2; i++) {
      existingToasts[i].remove();
    }
  }

  const typeClass = \`toast-\${type}\`;
  const toastEl = createSafeElement('div', {
    className: \`toast-custom \${typeClass}\`,
    children: [
      createSafeElement('div', {
        className: 'toast-content',
        children: [
          title ? createSafeElement('div', { className: 'toast-title', text: title }) : '',
          message ? createSafeElement('p', { className: 'toast-message', text: message }) : ''
        ].filter(Boolean)
      }),
      createSafeElement('button', {
        className: 'toast-close-btn',
        attrs: {
          'type': 'button',
          'aria-label': 'Đóng thông báo'
        },
        text: '✕'
      })
    ]
  });

  const closeBtn = toastEl.querySelector('.toast-close-btn');
  const dismiss = () => {
    toastEl.style.opacity = '0';
    toastEl.style.transform = 'translateY(8px)';
    setTimeout(() => {
      if (toastEl.parentNode) {
        toastEl.parentNode.removeChild(toastEl);
      }
    }, 200);
  };

  closeBtn.addEventListener('click', dismiss);

  toastContainer.appendChild(toastEl);

  if (duration > 0) {
    setTimeout(dismiss, duration);
  }
}`;

if (content.includes(targetOldToast)) {
  content = content.replace(targetOldToast, replacementNewToast);
  console.log('Replaced showToast (LF)');
} else if (content.includes(targetOldToast.replace(/\n/g, '\r\n'))) {
  content = content.replace(targetOldToast.replace(/\n/g, '\r\n'), replacementNewToast.replace(/\n/g, '\r\n'));
  console.log('Replaced showToast (CRLF)');
} else {
  console.error('Target old toast not found in frontend/js/ui/ui.js!');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Done optimizing showToast!');
