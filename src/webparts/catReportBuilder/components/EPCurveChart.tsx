import * as React from 'react';
import { IEPCurve } from '../../models/IAnalysisResults';
import './EPCurveChart.module.scss';

export interface IEPCurveChartProps {
  currentYearData: IEPCurve[];
  previousYearData?: IEPCurve[];
}

export const EPCurveChart: React.FC<IEPCurveChartProps> = ({
  currentYearData,
  previousYearData
}) => {
  const chartRef = React.useRef<HTMLCanvasElement>(null);
  const chartInstance = React.useRef<any>(null);

  React.useEffect(() => {
    if (!chartRef.current) return;

    // Destroy existing chart
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    // Create new chart
    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    const datasets = [
      {
        label: 'Current Year',
        data: currentYearData.map(point => ({
          x: point.probability,
          y: point.lossAmount
        })),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1
      }
    ];

    if (previousYearData) {
      datasets.push({
        label: 'Previous Year',
        data: previousYearData.map(point => ({
          x: point.probability,
          y: point.lossAmount
        })),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        tension: 0.1
      });
    }

    // Dynamically import Chart.js
    import('chart.js/auto').then(({ Chart }) => {
      chartInstance.current = new Chart(ctx, {
        type: 'line',
        data: {
          datasets
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              type: 'linear',
              position: 'bottom',
              title: {
                display: true,
                text: 'Exceedance Probability (%)'
              },
              reverse: true
            },
            y: {
              title: {
                display: true,
                text: 'Loss Amount ($)'
              },
              ticks: {
                callback: function(value: any) {
                  return new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  }).format(value);
                }
              }
            }
          },
          plugins: {
            legend: {
              position: 'top'
            },
            tooltip: {
              callbacks: {
                label: function(context: any) {
                  const label = context.dataset.label || '';
                  const value = context.parsed.y;
                  return `${label}: ${new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  }).format(value)}`;
                }
              }
            }
          }
        }
      });
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [currentYearData, previousYearData]);

  return (
    <div className="ep-curve-chart">
      <canvas ref={chartRef} height="400"></canvas>
    </div>
  );
}; 