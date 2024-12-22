'use strict';

const realTimeLogsBufferLinesCount = window.realTimeLogsBufferLinesCount;
const arrowsArray = ['chevron_right', 'chevron_left'];

let logsContainer, errContainer;

function commonConsoleApiCall(action, method = 'GET', pmId, params = {}) {
  const urlParams = new URLSearchParams(
    Object.assign({}, { pmId }, params),
  );
  return new Promise(resolve => {
    fetch(`/api/${action}?${urlParams.toString()}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'same-origin',
      body: JSON.stringify({
        _csrf: csrf.value,
      }),
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

function getSelectedLogsContainer() {
  const stderrContainer = document.getElementById('stderrContainer');
  let container = logsContainer;
  if (stderrContainer.classList.contains('active')) {
    container = errContainer;
  }
  return container;
}

function getLogsContainerType() {
  const stderrContainer = document.getElementById('stderrContainer');
  let type = 'out';
  if (stderrContainer.classList.contains('active')) {
    type = 'err';
  }
  return type;
}

function onContentLoad() {
  if (!window.EventSource) {
    window.toast.error('Your browser not support SSE!');
    return;
  }
  const consoleContainer = document.querySelector('[data-console-pm-id]');
  const id = consoleContainer.dataset.consolePmId;

  logsContainer = document.getElementById('stdout-logs');
  errContainer = document.getElementById('stderr-logs');

  // real time event source logs
  const eventSource = new window.EventSource(`/api/event/console/${id}`);

  eventSource.onmessage = function (event) {
    const data = JSON.parse(event.data);
    const code = createLineElement(data.line);
    let container = logsContainer;
    if (data.type === 'err') {
      container = errContainer;
    }
    container.prepend(code);
    if (container.children.length > realTimeLogsBufferLinesCount) {
      container.removeChild(container.lastElementChild);
    }
  };

  eventSource.onerror = function () {
    window.toast.error('Error in SSE bus.');
    eventSource.close();
  };

  // real time logs console
  const clearConsoleUiBtn = document.getElementById('clearConsoleUiBtn');
  const resizeLogsWindowBtn = document.getElementById('resizeLogsWindowBtn');
  const newestLogsBtn = document.getElementById('newestLogsBtn');
  const flushLogsBtn = document.getElementById('flushLogsBtn');

  clearConsoleUiBtn.addEventListener('click', function () {
    const container = getSelectedLogsContainer();
    container.innerHTML = '';
  });

  resizeLogsWindowBtn.addEventListener('click', function () {
    let classDefinition = 'container-fluid';
    let textContent = 'Shrink';
    if (consoleContainer.classList.contains('container-fluid')) {
      classDefinition = 'container';
      textContent = 'Expand';
    }
    const arrows = Array.from(resizeLogsWindowBtn.children);
    arrowsArray.reverse();
    for (let i = 0; i < 2; i++) {
      arrows[i].textContent = arrowsArray[i];
    }
    consoleContainer.className = (classDefinition += ' mb-3');
    const resizeText = document.getElementById('resizeText');
    resizeText.textContent = `${textContent} window`;
  });

  newestLogsBtn.addEventListener('click', function () {
    const container = getSelectedLogsContainer();
    container.scrollTop = 0;
  });

  flushLogsBtn.addEventListener('click', function() {
    commonConsoleApiCall('flush', 'PATCH', id).then(data => {
      if (data.status !== 'error') {
        logsContainer.innerHTML = '';
        errContainer.innerHTML = '';
      }
      const { csrf: resCsrf, ...rest } = data;
      csrf.value = resCsrf;
      window.toast.show({ ...rest });
    });
  });

  // logs viewer modal
  const logsViewerContainer = document.getElementById('logsViewerContainer');
  const logsViewerModalLabel = document.getElementById('logsViewerModalLabel');
  const previousLogsBtn = document.getElementById('previousLogsBtn');
  const newestViewerLogsBtn = document.getElementById('newestViewerLogsBtn');
  const logsViewerModal = document.getElementById('logsViewerModal');
  const removePreviousRowsCheckbox = document.getElementById('removePreviousRowsCheckbox');

  let removePreviousLogs = removePreviousRowsCheckbox.checked;

  previousLogsBtn.addEventListener('click', function () {
    const stderrContainer = document.getElementById('stderrContainer');
    let type = 'out';
    if (stderrContainer.classList.contains('active')) {
      type = 'err';
    }
    const nextByte = logsViewerContainer.dataset.nextByte;
    if (nextByte !== '' && parseInt(nextByte) <= 0) {
      return;
    }
    commonConsoleApiCall('logs', 'GET', id, {
      type,
      nextByte: nextByte ? nextByte : -1,
    }).then(data => {
      if (data.status === 'error') {
        window.toast.show(data);
        return;
      }
      if (removePreviousLogs) {
        logsViewerContainer.innerHTML = '';
      }
      for (const logLine of data.logLines) {
        const code = createLineElement(logLine);
        logsViewerContainer.append(code);
      }
      logsViewerContainer.dataset.nextByte = data.nextByte;
      logsViewerContainer.scrollTo(0, -logsViewerContainer.scrollHeight);
    });
  });

  newestViewerLogsBtn.addEventListener('click', function () {
    logsViewerContainer.scrollTop = 0;
  });

  removePreviousRowsCheckbox.addEventListener('change', function () {
    removePreviousLogs = !removePreviousLogs;
  });

  logsViewerModal.addEventListener('show.bs.modal', function () {
    const type = getLogsContainerType();
    logsViewerModalLabel.textContent = `Logs viewer (${type.toUpperCase()})`;
  });

  logsViewerModal.addEventListener('hide.bs.modal', function () {
    logsViewerContainer.innerHTML = '';
    logsViewerContainer.dataset.nextByte = '';
    logsViewerModalLabel.textContent = 'Logs viewer';
  });
}

document.addEventListener('DOMContentLoaded', onContentLoad);
