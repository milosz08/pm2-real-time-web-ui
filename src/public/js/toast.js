'use strict';

const normalColor = '#6c757d';
const errorColor = '#d9534f';

function createToast(text, color) {
  return Toastify({
    duration: 3000,
    text,
    style: {
      background: color,
      boxShadow: 'none',
    },
  });
}

window.toast = {
  info: function (text) {
    const toast = createToast(text, normalColor);
    toast.showToast();
  },
  error: function (text) {
    const toast = createToast(text, errorColor);
    toast.showToast();
  },
  show: function ({ message, status }) {
    const toast = createToast(
      message,
      status === 'error' ? errorColor : normalColor,
    );
    toast.showToast();
  },
};
