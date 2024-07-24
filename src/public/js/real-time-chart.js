'use strict';

const initElementsCount = window.initElementsCount;

function generateInitChartContent(chart) {
  const datasetElements = window.generateLineChartProps().data.datasets.length;
  for (let i = 0; i < initElementsCount; i++) {
    chart.data.labels.push(window.generateTimeLabels()[i]);
    for (let k = 0; k < datasetElements; k++) {
      chart.data.datasets[k].data.push(0);
    }
  }
}

function updateChartOnTick(appsMonit, chart, pmId) {
  const now = new Date();
  const timeLabel = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;
  
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

function onContentLoad() {
  const chart = document.getElementById('chart');
  const pmId = chart.dataset.pmId;

  const chartInstance = new Chart(
    chart.getContext('2d'),
    window.generateLineChartProps(),
  );

  generateInitChartContent(chartInstance);

  const socket = io({ transports: ["websocket"] });

  socket.on('monit:all', function (appsMonit) {
    updateChartOnTick(appsMonit, chartInstance, pmId);
  });

  socket.on('connect_error', function (error) {
    window.toast.error(error);
  });
}

document.addEventListener('DOMContentLoaded', onContentLoad);
