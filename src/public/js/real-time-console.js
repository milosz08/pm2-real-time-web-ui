'use strict';

let childrenToRemove = window.initLogsRemoveBufferCount;
let consoleContainer;
let page = 1;

function commonApiCall(action, pmId, params = {}) {
  const urlParams = new URLSearchParams(
    Object.assign({}, { pmId }, params),
  );
  return new Promise(resolve => {
    fetch(`/api/${action}?${urlParams.toString()}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })
      .then(res => res.json())
      .then(data => resolve(data))
      .catch(() =>  resolve({
        message: 'Unexpected error',
        status: 'error',
      }));
  });
}

function createLineElement(line) {
  const code = document.createElement('code');
  code.textContent = `${line}`;
  code.className = 'text-nowrap text-white';
  return code;
}

function onUpdateChildrenToRemove(e) {
  childrenToRemove = Number(e.target.value) || 10;
}

function onGetRealTimeLogs(line) {
  const code = createLineElement(line);
  consoleContainer.prepend(code);
}

function onFetchPreviousLogs(id) {
  commonApiCall('logs', id, { page: ++page }).then(data => {
    if (data.status === 'error') {
      window.toast.show(data);
    } else {
      for (const logLine of data) {
        const code = createLineElement(logLine);
        consoleContainer.append(code);
      }
    }
  });
}

function onNewestLogsButtonClick() {
  consoleContainer.scrollTop = 0;
}

function onRemoveFirstLogLines() {
  for (let i = 0; i < childrenToRemove * 2; i++) {
    if (consoleContainer.lastChild) {
      consoleContainer.removeChild(consoleContainer.lastChild);
    } else {
        break;
    }
  }
}

function onFlushLogs(id) {
  commonApiCall('flush', id).then(data => {
    if (data.status !== 'error') {
      consoleContainer.innerHTML = '';
    }
    window.toast.show(data);
  });
}

function onContentLoad() {
  consoleContainer = document.querySelector('[data-console-pm-id]');
  const previousLogsBtn = document.getElementById('previousLogsBtn');
  const newestLogsBtn = document.getElementById('newestLogsBtn');
  const removeFirstLogLinesBtn = document.getElementById('removeFirstLogLinesBtn');
  const flushLogsBtn = document.getElementById('flushLogsBtn');
  const linesToRemoveInput = document.getElementById('linesToRemoveInput');
  
  const id = consoleContainer.dataset.consolePmId;

  if (!window.EventSource) {
    window.toast.error('Your browser not support SSE!');
    return;
  }
  const eventSource = new window.EventSource(`/api/event/console/${id}`);

  eventSource.onmessage = function (event) {
    onGetRealTimeLogs(event.data);
  };

  eventSource.onerror = function () {
    window.toast.error('Error in SSE bus.');
    eventSource.close();
  };

  if (consoleContainer) {
    linesToRemoveInput.addEventListener('change', onUpdateChildrenToRemove);
    previousLogsBtn.addEventListener('click', function() { onFetchPreviousLogs(id); });
    newestLogsBtn.addEventListener('click', onNewestLogsButtonClick);
    removeFirstLogLinesBtn.addEventListener('click', onRemoveFirstLogLines);
    flushLogsBtn.addEventListener('click', function() { onFlushLogs(id); });
  }
}

document.addEventListener('DOMContentLoaded', onContentLoad);
