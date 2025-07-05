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
import { useUnits } from '../../contexts/UnitContext';

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

const StressDiagrams = ({ beamData, results }) => {
  const { convertValue, getUnit } = useUnits();

  const calculateStresses = () => {
    if (!results || !results.bendingMoment || results.bendingMoment.y.length === 0) {
      return { tensileStress: [], compressiveStress: [], xCoords: [] };
    }

    const section = beamData.section || {};
    const I = beamData.materialProperties.I;
    
    // Calculate section properties
    let c_top = 0, c_bottom = 0;
    
    switch (section.type || 'rectangular') {
      case 'rectangular':
        const h = section.height || 0.5;
        c_top = c_bottom = h / 2;
        break;
      case 'circular':
        const d = section.diameter || 0.4;
        c_top = c_bottom = d / 2;
        break;
      case 'i-beam':
        const totalHeight = (section.webHeight || 0.4) + 2 * (section.flangeThickness || 0.02);
        c_top = c_bottom = totalHeight / 2;
        break;
      case 't-beam':
        const bft = section.flangeWidth || 0.3;
        const tft = section.flangeThickness || 0.05;
        const hwt = section.webHeight || 0.4;
        const twt = section.webThickness || 0.02;
        const totalHeightT = hwt + tft;
        
        // Calculate centroid
        const A1 = bft * tft;
        const A2 = twt * hwt;
        const y1 = totalHeightT - tft / 2;
        const y2 = hwt / 2;
        const yc = (A1 * y1 + A2 * y2) / (A1 + A2);
        
        c_top = totalHeightT - yc;
        c_bottom = yc;
        break;
      default:
        c_top = c_bottom = 0.25;
    }

    const tensileStress = [];
    const compressiveStress = [];
    const xCoords = results.bendingMoment.x;

    results.bendingMoment.y.forEach((moment, index) => {
      // Calculate stresses at top and bottom fibers
      const stress_top = Math.abs(moment * c_top / I);
      const stress_bottom = Math.abs(moment * c_bottom / I);
      
      // Determine which fiber is in tension/compression
      if (moment > 0) {
        // Positive moment: bottom in tension, top in compression
        tensileStress.push(stress_bottom);
        compressiveStress.push(-stress_top); // Negative for compression
      } else {
        // Negative moment: top in tension, bottom in compression
        tensileStress.push(stress_top);
        compressiveStress.push(-stress_bottom); // Negative for compression
      }
    });

    return { tensileStress, compressiveStress, xCoords };
  };

  const { tensileStress, compressiveStress, xCoords } = calculateStresses();

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        labels: {
          color: document.documentElement.classList.contains('dark') ? '#e5e7eb' : '#374151'
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          title: function(context) {
            const xValue = parseFloat(context[0].label);
            const displayX = convertValue(xValue, 'length', 'SI');
            return `Position: ${displayX.toFixed(2)} ${getUnit('length')}`;
          },
          label: function(context) {
            const displayStress = convertValue(Math.abs(context.parsed.y), 'stress', 'SI');
            const stressType = context.parsed.y >= 0 ? 'Tensile' : 'Compressive';
            return `${stressType} Stress: ${displayStress.toFixed(2)} ${getUnit('stress')}`;
          }
        }
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: `Position along beam (${getUnit('length')})`,
          color: document.documentElement.classList.contains('dark') ? '#e5e7eb' : '#374151'
        },
        grid: {
          display: true,
          color: document.documentElement.classList.contains('dark') ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          color: document.documentElement.classList.contains('dark') ? '#d1d5db' : '#6b7280',
          callback: function(value, index) {
            const displayX = convertValue(this.getLabelForValue(value), 'length', 'SI');
            return displayX.toFixed(1);
          }
        }
      },
      y: {
        display: true,
        title: {
          display: true,
          text: `Stress (${getUnit('stress')})`,
          color: document.documentElement.classList.contains('dark') ? '#e5e7eb' : '#374151'
        },
        grid: {
          display: true,
          color: document.documentElement.classList.contains('dark') ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          color: document.documentElement.classList.contains('dark') ? '#d1d5db' : '#6b7280',
          callback: function(value) {
            const displayStress = convertValue(Math.abs(value), 'stress', 'SI');
            return displayStress.toFixed(0);
          }
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  };

  // Convert stress data for display
  const displayXCoords = xCoords.map(x => convertValue(x, 'length', 'SI'));
  const displayTensileStress = tensileStress.map(s => convertValue(s, 'stress', 'SI'));
  const displayCompressiveStress = compressiveStress.map(s => convertValue(Math.abs(s), 'stress', 'SI'));

  const stressData = {
    labels: displayXCoords.map(x => x.toFixed(2)),
    datasets: [
      {
        label: 'Tensile Stress',
        data: displayTensileStress,
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        fill: false,
        tension: 0.1,
        pointRadius: 0,
        pointHoverRadius: 4,
      },
      {
        label: 'Compressive Stress',
        data: displayCompressiveStress.map(s => -s), // Negative for display
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        fill: false,
        tension: 0.1,
        pointRadius: 0,
        pointHoverRadius: 4,
      }
    ]
  };

  const findMaxStresses = () => {
    if (tensileStress.length === 0) return null;
    
    const maxTensile = Math.max(...tensileStress);
    const maxCompressive = Math.max(...compressiveStress.map(Math.abs));
    
    const maxTensileIndex = tensileStress.findIndex(s => s === maxTensile);
    const maxCompressiveIndex = compressiveStress.findIndex(s => Math.abs(s) === maxCompressive);

    return {
      maxTensile: {
        value: maxTensile,
        position: xCoords[maxTensileIndex]
      },
      maxCompressive: {
        value: maxCompressive,
        position: xCoords[maxCompressiveIndex]
      }
    };
  };

  const maxStresses = findMaxStresses();

  const calculateSectionModulus = () => {
    const section = beamData.section || {};
    const I = beamData.materialProperties.I;
    
    let c = 0;
    switch (section.type || 'rectangular') {
      case 'rectangular':
        c = (section.height || 0.5) / 2;
        break;
      case 'circular':
        c = (section.diameter || 0.4) / 2;
        break;
      case 'i-beam':
        c = ((section.webHeight || 0.4) + 2 * (section.flangeThickness || 0.02)) / 2;
        break;
      case 't-beam':
        const bft = section.flangeWidth || 0.3;
        const tft = section.flangeThickness || 0.05;
        const hwt = section.webHeight || 0.4;
        const twt = section.webThickness || 0.02;
        const totalHeightT = hwt + tft;
        
        const A1 = bft * tft;
        const A2 = twt * hwt;
        const y1 = totalHeightT - tft / 2;
        const y2 = hwt / 2;
        const yc = (A1 * y1 + A2 * y2) / (A1 + A2);
        
        c = Math.max(totalHeightT - yc, yc);
        break;
      default:
        c = 0.25;
    }
    
    return I / c; // Section modulus S = I/c
  };

  const sectionModulus = calculateSectionModulus();

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {maxStresses && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
            <h4 className="font-semibold text-red-900 dark:text-red-200 mb-2">Maximum Tensile Stress</h4>
            <div className="text-2xl font-bold text-red-700 dark:text-red-300">
              {convertValue(maxStresses.maxTensile.value, 'stress', 'SI').toFixed(2)} {getUnit('stress')}
            </div>
            <div className="text-sm text-red-600 dark:text-red-400">
              at position {convertValue(maxStresses.maxTensile.position, 'length', 'SI').toFixed(2)} {getUnit('length')}
            </div>
          </div>
          <div className="card bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">Maximum Compressive Stress</h4>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
              {convertValue(maxStresses.maxCompressive.value, 'stress', 'SI').toFixed(2)} {getUnit('stress')}
            </div>
            <div className="text-sm text-blue-600 dark:text-blue-400">
              at position {convertValue(maxStresses.maxCompressive.position, 'length', 'SI').toFixed(2)} {getUnit('length')}
            </div>
          </div>
        </div>
      )}

      {/* Stress Diagram */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Stress Diagram</h3>
        <div className="h-64">
          {tensileStress.length > 0 ? (
            <Line data={stressData} options={chartOptions} />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <p>No stress data to display</p>
                <p className="text-sm">Configure beam parameters to see the stress analysis</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Section Properties */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Section Properties</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Moment of Inertia (I)</div>
            <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {convertValue(beamData.materialProperties.I, 'inertia', 'SI').toExponential(3)} {getUnit('inertia')}
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Section Modulus (S)</div>
            <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {convertValue(sectionModulus, 'inertia', 'SI').toExponential(3)} {getUnit('inertia')}
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Section Type</div>
            <div className="text-lg font-semibold text-gray-900 dark:text-gray-100 capitalize">
              {(beamData.section?.type || 'rectangular').replace('-', ' ')}
            </div>
          </div>
        </div>
      </div>

      {/* Stress Analysis Notes */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              Stress Analysis Notes
            </h3>
            <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
              <ul className="list-disc list-inside space-y-1">
                <li>Stresses are calculated using the flexure formula: σ = M×c/I</li>
                <li>Tensile stress occurs on the fiber farthest from the neutral axis in tension</li>
                <li>Compressive stress occurs on the fiber farthest from the neutral axis in compression</li>
                <li>For T-beams, the neutral axis location is calculated based on the composite section</li>
                <li>Maximum stresses typically occur at locations of maximum bending moment</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StressDiagrams;