import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const DiagramCharts = ({ beamData, results }) => {
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          title: function(context) {
            return `Position: ${context[0].label}m`;
          },
          label: function(context) {
            return `${context.dataset.label}: ${context.parsed.y.toFixed(3)}`;
          }
        }
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Position along beam (m)'
        },
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.1)'
        }
      },
      y: {
        display: true,
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.1)'
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  };

  const shearForceData = {
    labels: results.shearForce.x.map(x => x.toFixed(2)),
    datasets: [
      {
        label: 'Shear Force (kN)',
        data: results.shearForce.y,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        fill: true,
        tension: 0.1,
        pointRadius: 0,
        pointHoverRadius: 4,
      }
    ]
  };

  const bendingMomentData = {
    labels: results.bendingMoment.x.map(x => x.toFixed(2)),
    datasets: [
      {
        label: 'Bending Moment (kNm)',
        data: results.bendingMoment.y,
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34, 197, 94, 0.2)',
        fill: true,
        tension: 0.1,
        pointRadius: 0,
        pointHoverRadius: 4,
      }
    ]
  };

  const findMaxValues = () => {
    const maxShear = Math.max(...results.shearForce.y.map(Math.abs));
    const maxMoment = Math.max(...results.bendingMoment.y.map(Math.abs));
    const maxShearIndex = results.shearForce.y.findIndex(v => Math.abs(v) === maxShear);
    const maxMomentIndex = results.bendingMoment.y.findIndex(v => Math.abs(v) === maxMoment);

    return {
      maxShear: {
        value: results.shearForce.y[maxShearIndex],
        position: results.shearForce.x[maxShearIndex]
      },
      maxMoment: {
        value: results.bendingMoment.y[maxMomentIndex],
        position: results.bendingMoment.x[maxMomentIndex]
      }
    };
  };

  const maxValues = results.shearForce.x.length > 0 ? findMaxValues() : null;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {maxValues && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card bg-blue-50 border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-2">Maximum Shear Force</h4>
            <div className="text-2xl font-bold text-blue-700">
              {Math.abs(maxValues.maxShear.value).toFixed(2)} kN
            </div>
            <div className="text-sm text-blue-600">
              at position {maxValues.maxShear.position.toFixed(2)}m
            </div>
          </div>
          <div className="card bg-green-50 border-green-200">
            <h4 className="font-semibold text-green-900 mb-2">Maximum Bending Moment</h4>
            <div className="text-2xl font-bold text-green-700">
              {Math.abs(maxValues.maxMoment.value).toFixed(2)} kNm
            </div>
            <div className="text-sm text-green-600">
              at position {maxValues.maxMoment.position.toFixed(2)}m
            </div>
          </div>
        </div>
      )}

      {/* Shear Force Diagram */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Shear Force Diagram (SFD)</h3>
        <div className="h-64">
          {results.shearForce.x.length > 0 ? (
            <Line data={shearForceData} options={{
              ...chartOptions,
              scales: {
                ...chartOptions.scales,
                y: {
                  ...chartOptions.scales.y,
                  title: {
                    display: true,
                    text: 'Shear Force (kN)'
                  }
                }
              }
            }} />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p>No data to display</p>
                <p className="text-sm">Configure beam parameters to see the shear force diagram</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bending Moment Diagram */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Bending Moment Diagram (BMD)</h3>
        <div className="h-64">
          {results.bendingMoment.x.length > 0 ? (
            <Line data={bendingMomentData} options={{
              ...chartOptions,
              scales: {
                ...chartOptions.scales,
                y: {
                  ...chartOptions.scales.y,
                  title: {
                    display: true,
                    text: 'Bending Moment (kNm)'
                  }
                }
              }
            }} />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p>No data to display</p>
                <p className="text-sm">Configure beam parameters to see the bending moment diagram</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DiagramCharts;