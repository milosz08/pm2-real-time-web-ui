'use strict';

let childrenToRemove = window.initLogsRemoveBufferCount;
let consoleContainer, logsContainer, errContainer, resizeLogsWindowBtn;

const arrowsArray = ['chevron_left', 'chevron_right'];

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
  childrenToRemove = Number(e.target.value)
    || window.initLogsRemoveBufferCount;
}

function onGetRealTimeLogs(data) {
  const code = createLineElement(data.line);
  let container = logsContainer;
  if (data.type === 'err') {
    container = errContainer;
  }
  container.prepend(code);
  if (container.children.length > 200) {
    container.removeChild(container.lastElementChild);
  }
}

function getSelectedLogsContainer() {
  const stderrContainer = document.getElementById('stderrContainer');
  let container = logsContainer;
  if (stderrContainer.classList.contains('active')) {
    container = errContainer;
  }
  return container;
}

function onFetchPreviousLogs(id) {
  const stderrContainer = document.getElementById('stderrContainer');
  let type = 'out';
  let offset = logsContainer.children.length;
  if (stderrContainer.classList.contains('active')) {
    type = 'err';
    offset = errContainer.children.length;
  }
  commonApiCall('logs', id, { type, offset }).then(data => {
    if (data.status === 'error') {
      window.toast.show(data);
      return;
    }
    for (const logLine of data) {
      const code = createLineElement(logLine);
      let container = logsContainer;
      if (type === 'err') {
        container = errContainer;
      }
      container.append(code);
    }
  });
}

function onNewestLogsButtonClick() {
  const container = getSelectedLogsContainer();
  container.scrollTop = 0;
}

function onRemoveFirstLogLines() {
  const container = getSelectedLogsContainer();
  for (let i = 0; i < childrenToRemove * 2; i++) {
    if (!container.lastChild) {
      break;
    }
    container.removeChild(container.lastChild);
  }
}

function onResizeConsoleWindow(e) {
  let classDefinition = 'container';
  let textContent = 'Expand';
  if (consoleContainer.classList.contains('container')) {
    classDefinition = 'container-fluid';
    textContent = 'Shrink';
  }
  const arrows = Array.from(resizeLogsWindowBtn.children);
  arrowsArray.reverse();
  for (let i = 0; i < 2; i++) {
    arrows[i].textContent = arrowsArray[i];
  }
  consoleContainer.className = (classDefinition += ' mb-3');
  const resizeText = document.getElementById('resizeText');
  resizeText.textContent = `${textContent} window`;
}

function onFlushLogs(id) {
  commonApiCall('flush', id).then(data => {
    if (data.status !== 'error') {
      logsContainer.innerHTML = '';
      errContainer.innerHTML = '';
    }
    window.toast.show(data);
  });
}

function onContentLoad() {
  consoleContainer = document.querySelector('[data-console-pm-id]');
  logsContainer = document.getElementById('stdout-logs');
  errContainer = document.getElementById('stderr-logs');
  resizeLogsWindowBtn = document.getElementById('resizeLogsWindowBtn');

  const linesToRemoveInput = document.getElementById('linesToRemoveInput');
  const previousLogsBtn = document.getElementById('previousLogsBtn');
  const newestLogsBtn = document.getElementById('newestLogsBtn');
  const removeFirstLogLinesBtn = document.getElementById('removeFirstLogLinesBtn');
  const flushLogsBtn = document.getElementById('flushLogsBtn');

  const id = consoleContainer.dataset.consolePmId;

  if (!window.EventSource) {
    window.toast.error('Your browser not support SSE!');
    return;
  }
  const eventSource = new window.EventSource(`/api/event/console/${id}`);

  eventSource.onmessage = function (event) {
    onGetRealTimeLogs(JSON.parse(event.data));
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
    resizeLogsWindowBtn.addEventListener('click', onResizeConsoleWindow);
    flushLogsBtn.addEventListener('click', function() { onFlushLogs(id); });
  }
}

document.addEventListener('DOMContentLoaded', onContentLoad);
