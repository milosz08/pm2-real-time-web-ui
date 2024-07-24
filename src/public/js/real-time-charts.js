'use strict';

const initElementsCount = window.initElementsCount;
const chartsMap = new Map();

function initChartsMap(charts) {
  for (let i = 0; i < charts.length; i++) {
    const chart = charts[i];
    const chartInstance = new Chart(
      chart.getContext('2d'),
      window.generateLineChartProps(),
    );
    chartsMap.set(
      Number(chart.dataset.chart),
      chartInstance,
    );
  }
}

function generateInitChartContent() {
  const datasetElements = window.generateLineChartProps().data.datasets.length;
  for (let i = 0; i < initElementsCount; i++) {
    for (const chart of chartsMap.values()) {
      chart.data.labels.push(window.generateTimeLabels()[i]);
      for (let k = 0; k < datasetElements; k++) {
        chart.data.datasets[k].data.push(0);
      }
    }
  }
}

function updateChartOnTick(appsMonit) {
  const now = new Date();
  const timeLabel = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;
  for (const [pmId, chart] of chartsMap.entries()) {
    const appMonit = appsMonit[pmId];
    if (chart.data.labels.length >= initElementsCount) {
      chart.data.labels.shift();
      chart.data.datasets.forEach(dataset => dataset.data.shift());
    }
    chart.data.labels.push(timeLabel);
    chart.data.datasets[0].data.push(appMonit.cpu);
    chart.data.datasets[1].data.push(appMonit.memoryRaw);

    chart.update();
    window.updateLabels(pmId, appMonit);
  }
}

function onContentLoad() {
  const charts = document.querySelectorAll('[data-chart]');
  
  initChartsMap(charts);
  generateInitChartContent();

  const socket = io('/monit', {
    transports: ['websocket'],
  });

  socket.on('monit:all', updateChartOnTick);

  socket.on('connect_error', function (error) {
    window.toast.error(error);
  });
}

document.addEventListener('DOMContentLoaded', onContentLoad);
