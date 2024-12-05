'use strict';

const toggleCheckbox = document.getElementById('onlyRunningSwitch');
const apps = document.querySelectorAll('.pm2-app');

function changeVisibility(checked) {
  for (const app of apps) {
    if (!app.classList.contains('border-success')) {
      if (checked) {
        app.classList.add('d-none')
      } else {
        app.classList.remove('d-none')
      }
    }
  }
}

function onContentLoad() {  
  toggleCheckbox.addEventListener('change', function (e) {
    changeVisibility(e.target.checked)
    window.localStorage.setItem('only-running', e.target.checked)
  });
}

const isChecked = window.localStorage.getItem('only-running') === 'true';
toggleCheckbox.checked = isChecked;
changeVisibility(isChecked);

document.addEventListener('DOMContentLoaded', onContentLoad);

