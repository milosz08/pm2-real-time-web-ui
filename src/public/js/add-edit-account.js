'use strict';

const SHOW_PASSWORD_ICON = 'visibility';
const HIDE_PASSWORD_ICON = 'visibility_off';

function togglePassword() {
  const passwordInput = document.getElementById('password');
  const passwordIcon = document.getElementById('passwordIcon');
  const toggleButton = document.getElementById('passwordToggleBtn');

  toggleButton.addEventListener('click', function () {
    let type = 'password';
    let icon = SHOW_PASSWORD_ICON;
    if (passwordIcon.textContent === SHOW_PASSWORD_ICON) {
      icon = HIDE_PASSWORD_ICON;
      type = 'text';
    }
    passwordIcon.innerText = icon;
    passwordInput.setAttribute('type', type);
  });
}

function selectAll() {
  const accessContainer = document.getElementById('accessContainer');
  const actions = ['view', 'start', 'reload', 'restart', 'stop'];

  accessContainer.addEventListener('click', function (e) {
    if (e.target.type === 'checkbox' && e.target.id.includes('all')) {
      const pmId = parseInt(e.target.id.replace('all-', ''));
      for (const action of actions) {
        const checkbox = document.getElementById(`${action}-${pmId}`);
        checkbox.checked = e.target.checked;
      }
      return;
    }
    if (e.target.type === 'checkbox' && !e.target.id.includes('all')
      && !e.target.id.includes('view')) {
      const pmId = parseInt(e.target.id.split('-')[1]);
      const selectAllCheckbox = document.getElementById(`all-${pmId}`);

      const isChecked = [];
      for (const action of actions) {
        const checkbox = document.getElementById(`${action}-${pmId}`);
        isChecked.push(checkbox.checked);
      }
      selectAllCheckbox.checked = isChecked.every(isChecked => isChecked);
      return;
    }
    if (e.target.type === 'checkbox' && e.target.id.includes('view')) {
      const pmId = parseInt(e.target.id.split('-')[1]);
      if (!e.target.checked) {
        const allActions = actions.filter(action => action !== 'view');
        allActions.push('all');
        for (const action of allActions) {
          const checkbox = document.getElementById(`${action}-${pmId}`);
          checkbox.checked = false;
        }
      }
    }
  });
}

function togglePasswordField() {
  const passwordInput = document.getElementById('password');
  const omitPasswordCheckbox = document.getElementById('omitPassword');
  omitPasswordCheckbox.addEventListener('change', () => {
    passwordInput.disabled = !passwordInput.disabled;
    passwordInput.value = '';
  });
}

function onContentLoad() {
  togglePassword();
  selectAll();
  togglePasswordField();
}

document.addEventListener('DOMContentLoaded', onContentLoad);
