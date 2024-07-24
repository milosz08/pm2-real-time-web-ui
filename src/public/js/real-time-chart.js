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

function updateChartOnTick(appMonit, chart, pmId) {
  const now = new Date();
  const timeLabel = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;
  
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
  const chart = document.querySelector('[data-pm-id]');
  const id = chart.dataset.pmId;

  const chartInstance = new Chart(
    chart.getContext('2d'),
    window.generateLineChartProps(),
  );

  generateInitChartContent(chartInstance);

  const socket = io('/monit', {
    transports: ['websocket'],
    query: {
      id,
    },
  });

  socket.on('monit:single', function (appMonit) {
    updateChartOnTick(appMonit, chartInstance, id);
  });

  socket.on('connect_error', function (error) {
    window.toast.error(error);
  });
}

document.addEventListener('DOMContentLoaded', onContentLoad);
