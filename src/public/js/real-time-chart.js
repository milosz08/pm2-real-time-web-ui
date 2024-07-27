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
  chart.data.datasets[1].data.push(parseFloat(appMonit.memory.split(' ')[0]));

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

  if (!window.EventSource) {
    window.toast.error('Your browser not support SSE!');
    return;
  }
  const eventSource = new window.EventSource(`/event/single/${id}`);

  eventSource.onmessage = function (event) {
    updateChartOnTick(JSON.parse(event.data), chartInstance, id);
  };

  eventSource.onerror = function () {
    window.toast.error('Error in SSE bus.');
    eventSource.close();
  };
}

document.addEventListener('DOMContentLoaded', onContentLoad);
