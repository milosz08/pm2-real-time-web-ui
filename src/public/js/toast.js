'use strict';

const commonOptions = {
  duration: 3000,
  style: {
    boxShadow: 'none',
  },
};

function createToast(text, color) {
  return Toastify(
    Object.assign({}, commonOptions, {
      text,
      backgroundColor: color,
    }),
  );
}

window.toast = {
  info: function (text) {
    const toast = createToast(text, '#6c757d');
    toast.showToast();
  },
  error: function (text) {
    const toast = createToast(text, '#d9534f');
    toast.showToast();
  },
};
