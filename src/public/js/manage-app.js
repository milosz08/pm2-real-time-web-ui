'use strict';

function loadingContainer(pmId) {
  return {
    container: document.getElementById(`waiting-${pmId}`),
    show() {
      this.container.classList.remove('d-none');
      this.container.classList.add('d-flex');
    },
    hide() {
      this.container.classList.remove('d-flex');
      this.container.classList.add('d-none');
    },
  }
}

function commonApiCall(action, pmId) {
  const waitingContainer = loadingContainer(pmId);
  waitingContainer.show();
  return new Promise(resolve => {
    const errorResponse = {
      message: 'Unexpected error',
      status: 'error',
    };
    fetch(`/api/${action}?pmId=${pmId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
    })
      .then(res => {
        if (!res.ok) {
          resolve(errorResponse);
        }
        return res.json();
      })
      .then(data => {
        waitingContainer.hide();
        resolve(data);
      })
      .catch(() =>  resolve(errorResponse));
  });
}

function switchButtonsState(pmId, disabled) {
  const onDisabledBtn = document.querySelectorAll(`[data-on-disabled="${pmId}"]`);
  const onEnabledBtn = document.querySelectorAll(`[data-on-enabled="${pmId}"]`);
  for (const btn of onDisabledBtn) {
    btn.disabled = disabled;
  }
  for (const btn of onEnabledBtn) {
    btn.disabled = !disabled;
  }
}

function startApp(pmId) {
  commonApiCall('start', pmId).then(data => {
    switchButtonsState(pmId, true);
    window.toast.show(data);
  });
}

function reloadApp(pmId) {
  commonApiCall('reload', pmId).then(data => {
    window.toast.show(data);
  });
}

function restartApp(pmId) {
  commonApiCall('restart', pmId).then(data => {
    window.toast.show(data);
  });
}

function stopApp(pmId) {
  commonApiCall('stop', pmId).then(data => {
    switchButtonsState(pmId, false);
    window.toast.show(data);
  });
}

function deleteApp(pmId) {
  commonApiCall('delete', pmId).then(() => {
    window.location.href = '/';
  });
}
