'use strict';

const toggleCheckbox = document.getElementById('onlyRunningSwitch');
const apps = document.querySelectorAll('.pm2-app');

function onChangeVisibility(e) {
  const showOnlyRunningApps = e.target.checked
  for (const app of apps) {
    if (!app.classList.contains('border-success')) {
      if (showOnlyRunningApps) {
        app.classList.add('d-none')
      } else {
        app.classList.remove('d-none')
      }
    }
  }
}

toggleCheckbox.addEventListener('change', onChangeVisibility);