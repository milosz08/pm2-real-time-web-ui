'use strict';

const labelColor = '#ffffff';
const gridColor = '#696969';

const timeMultiplier = 40;
const initBlankElementsCount = window.dataTick * timeMultiplier / 1000;

const totalCpuLabel = document.getElementById('total-cpu');
const totalMemoryLabel = document.getElementById('total-memory');
const totalRunningLabel = document.getElementById('total-running');
const totalSuspendedLabel = document.getElementById('total-suspended');

const dataElements = [
  { label: 'CPU (%)', color: '#3b71ca' },
  { label: 'Memory (B)', color: '#ffffff' },
];

window.generateTimeLabels = function() {
  const now = new Date();
  const labels = [];
  for (let i = initBlankElementsCount - 1; i >= 0; i--) {
    const pastTime = new Date(now.getTime() - i * parseInt(window.dataTick));
    const timeLabel = pastTime.toISOString().substring(11, 8);
    labels.push(timeLabel);
  }
  return labels;
};

window.initElementsCount = initBlankElementsCount;

window.generateLineChartProps = function() {
  return {
    type: 'line',
    data: {
      labels: [],
      datasets: dataElements.map(({ label, color }) => ({
        label,
        data: [],
        borderColor: color,
        fill: false,
        tension: 0,
        pointRadius: 0,
      })),
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: true,
          labels: {
            color: labelColor,
          },
        },
      },
      scales: {
        x: {
          display: false,
        },
        y: {
          display: true,
          grid: {
            display: true,
            color: gridColor,
            borderColor: gridColor,
            borderDash: [5, 5],
          },
          title: {
            display: false,
          },
          ticks: {
            color: labelColor,
          },
        }
      },
      animation: {
        duration: 0,
      },
    },
  }
};

function determinateStatusColor(status) {
  switch (status) {
    case 'online':
      return 'text-success';
    case 'stopped':
    case 'errored':
      return 'text-danger';
    case 'paused':
    case 'stopping':
      return 'text-warning';
    default:
      return '';
  }
}

window.updateTotalLabels = function (total) {
  if (totalCpuLabel.textContent !== total.cpu) {
    totalCpuLabel.innerText = total.cpu;
  }
  if (totalMemoryLabel !== total.memory) {
    totalMemoryLabel.innerText = total.memory;
  }
  if (totalRunningLabel !== total.running) {
    totalRunningLabel.innerText = total.running;
  }
  if (totalSuspendedLabel !== total.suspended) {
    totalSuspendedLabel.innerText = total.suspended;
  }
}

window.updateLabels = function (pmId, appMonit) {
  const cpuLabel = document.getElementById(`cpu-${pmId}`);
  const memLabel = document.getElementById(`mem-${pmId}`);
  const uptimeLabel = document.getElementById(`uptime-${pmId}`);
  const statusLabel = document.getElementById(`status-${pmId}`);
  const pidLabel = document.getElementById(`pid-${pmId}`);
  const borderedContainer = document.getElementById(`border-${pmId}`);

  const onDisabledBtn = document.querySelectorAll(`[data-on-disabled="${pmId}"]`);
  const onEnabledBtn = document.querySelectorAll(`[data-on-enabled="${pmId}"]`);

  if (cpuLabel.textContent !== `${appMonit.cpu}%`) {
    cpuLabel.innerText = `${appMonit.cpu}%`;
  }
  if (memLabel.textContent !== appMonit.memory) {
    memLabel.innerText = appMonit.memory;
  }
  if (statusLabel.textContent !== appMonit.status) {
    statusLabel.innerText = appMonit.status;
    if (appMonit.status === 'online') {
      borderedContainer.classList.add('border-success');
    } else {
      borderedContainer.classList.remove('border-success');
    }
    for (const btn of onDisabledBtn) {
      btn.disabled = appMonit.status === 'online';
    }
    for (const btn of onEnabledBtn) {
      btn.disabled = appMonit.status !== 'online';
    }
    statusLabel.className = determinateStatusColor(appMonit.status);
    borderedContainer.className = [
      'card mb-3 px-0 container-fluid position-relative',
      determinateStatusColor(appMonit.status).replace('text', 'border'),
    ].join(' ');
  }
  if (pidLabel.textContent !== appMonit.pId) {
    pidLabel.innerText = appMonit.pId;
  }
  uptimeLabel.innerText = appMonit.uptime;
};
