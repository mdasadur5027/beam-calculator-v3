import React, { useState } from 'react';
import { useUnits } from '../../contexts/UnitContext';

const SectionTab = ({ beamData, updateBeamData }) => {
  const [sectionType, setSectionType] = useState('rectangular');
  const { getUnit, convertValue } = useUnits();

  const updateSectionProperty = (property, value) => {
    const siValue = convertValue(value, 'length', null, 'SI');
    updateBeamData({
      section: {
        ...beamData.section,
        [property]: siValue
      }
    });
  };

  const calculateMomentOfInertia = () => {
    const section = beamData.section || {};
    let I = 0;

    switch (section.type || sectionType) {
      case 'rectangular':
        const b = section.width || 0.3; // Default 300mm
        const h = section.height || 0.5; // Default 500mm
        I = (b * Math.pow(h, 3)) / 12;
        break;
      case 'circular':
        const d = section.diameter || 0.4; // Default 400mm
        I = (Math.PI * Math.pow(d, 4)) / 64;
        break;
      case 'i-beam':
        const bf = section.flangeWidth || 0.2; // Default 200mm
        const tf = section.flangeThickness || 0.02; // Default 20mm
        const hw = section.webHeight || 0.4; // Default 400mm
        const tw = section.webThickness || 0.01; // Default 10mm
        const totalHeight = hw + 2 * tf;
        
        // I-beam moment of inertia calculation
        const Iflange = 2 * ((bf * Math.pow(tf, 3)) / 12 + bf * tf * Math.pow((totalHeight / 2 - tf / 2), 2));
        const Iweb = (tw * Math.pow(hw, 3)) / 12;
        I = Iflange + Iweb;
        break;
      case 't-beam':
        const bft = section.flangeWidth || 0.3; // Default 300mm
        const tft = section.flangeThickness || 0.05; // Default 50mm
        const hwt = section.webHeight || 0.4; // Default 400mm
        const twt = section.webThickness || 0.02; // Default 20mm
        const totalHeightT = hwt + tft;
        
        // T-beam moment of inertia calculation
        // Calculate centroid first
        const A1 = bft * tft; // Flange area
        const A2 = twt * hwt; // Web area
        const y1 = totalHeightT - tft / 2; // Flange centroid from bottom
        const y2 = hwt / 2; // Web centroid from bottom
        const yc = (A1 * y1 + A2 * y2) / (A1 + A2); // Overall centroid
        
        // Calculate moment of inertia about centroid
        const I1 = (bft * Math.pow(tft, 3)) / 12 + A1 * Math.pow(y1 - yc, 2);
        const I2 = (twt * Math.pow(hwt, 3)) / 12 + A2 * Math.pow(y2 - yc, 2);
        I = I1 + I2;
        break;
      case 'custom':
        I = section.momentOfInertia || 1e-4;
        break;
      default:
        I = 1e-4;
    }

    // Update the material properties with calculated I
    updateBeamData({
      materialProperties: {
        ...beamData.materialProperties,
        I: I
      },
      section: {
        ...beamData.section,
        type: sectionType
      }
    });
  };

  const calculateStresses = () => {
    const section = beamData.section || {};
    const I = beamData.materialProperties.I;
    
    if (!results || !results.bendingMoment || results.bendingMoment.y.length === 0) {
      return { maxTensile: 0, maxCompressive: 0, position: 0 };
    }

    // Find maximum bending moment
    const maxMomentIndex = results.bendingMoment.y.findIndex(
      m => Math.abs(m) === Math.max(...results.bendingMoment.y.map(Math.abs))
    );
    const maxMoment = results.bendingMoment.y[maxMomentIndex];
    const position = results.bendingMoment.x[maxMomentIndex];

    // Calculate section modulus and extreme fiber distances
    let c_top = 0, c_bottom = 0;
    
    switch (section.type || sectionType) {
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
        c_top = c_bottom = 0.25; // Default assumption
    }

    // Calculate stresses (σ = M*c/I)
    const stress_top = Math.abs(maxMoment * c_top / I);
    const stress_bottom = Math.abs(maxMoment * c_bottom / I);
    
    // Determine tension and compression based on moment sign
    let maxTensile, maxCompressive;
    if (maxMoment > 0) {
      // Positive moment: bottom in tension, top in compression
      maxTensile = stress_bottom;
      maxCompressive = stress_top;
    } else {
      // Negative moment: top in tension, bottom in compression
      maxTensile = stress_top;
      maxCompressive = stress_bottom;
    }

    return { maxTensile, maxCompressive, position };
  };

  const sectionPresets = [
    { 
      name: 'Small Beam', 
      type: 'rectangular', 
      width: 0.2, 
      height: 0.3,
      description: '200×300mm rectangular section'
    },
    { 
      name: 'Medium Beam', 
      type: 'rectangular', 
      width: 0.3, 
      height: 0.5,
      description: '300×500mm rectangular section'
    },
    { 
      name: 'Large Beam', 
      type: 'rectangular', 
      width: 0.4, 
      height: 0.7,
      description: '400×700mm rectangular section'
    },
    { 
      name: 'Standard I-Beam', 
      type: 'i-beam', 
      flangeWidth: 0.2, 
      flangeThickness: 0.02, 
      webHeight: 0.4, 
      webThickness: 0.01,
      description: 'Standard steel I-beam'
    },
    { 
      name: 'T-Beam', 
      type: 't-beam', 
      flangeWidth: 0.3, 
      flangeThickness: 0.05, 
      webHeight: 0.4, 
      webThickness: 0.02,
      description: 'Standard T-beam section'
    }
  ];

  const applyPreset = (preset) => {
    setSectionType(preset.type);
    const newSection = { type: preset.type };
    
    Object.keys(preset).forEach(key => {
      if (key !== 'name' && key !== 'description') {
        newSection[key] = preset[key];
      }
    });

    updateBeamData({
      section: newSection
    });

    // Recalculate moment of inertia
    setTimeout(calculateMomentOfInertia, 100);
  };

  const section = beamData.section || {};

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Cross-Section Properties</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Section Type
            </label>
            <select
              value={section.type || sectionType}
              onChange={(e) => {
                setSectionType(e.target.value);
                updateBeamData({
                  section: { ...section, type: e.target.value }
                });
              }}
              className="input-field"
            >
              <option value="rectangular">Rectangular</option>
              <option value="circular">Circular</option>
              <option value="i-beam">I-Beam</option>
              <option value="t-beam">T-Beam</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          {/* Rectangular Section */}
          {(section.type || sectionType) === 'rectangular' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Width ({getUnit('length')})
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={convertValue(section.width || 0.3, 'length', 'SI').toFixed(3)}
                  onChange={(e) => updateSectionProperty('width', parseFloat(e.target.value) || 0)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Height ({getUnit('length')})
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={convertValue(section.height || 0.5, 'length', 'SI').toFixed(3)}
                  onChange={(e) => updateSectionProperty('height', parseFloat(e.target.value) || 0)}
                  className="input-field"
                />
              </div>
            </div>
          )}

          {/* Circular Section */}
          {(section.type || sectionType) === 'circular' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Diameter ({getUnit('length')})
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={convertValue(section.diameter || 0.4, 'length', 'SI').toFixed(3)}
                onChange={(e) => updateSectionProperty('diameter', parseFloat(e.target.value) || 0)}
                className="input-field"
              />
            </div>
          )}

          {/* I-Beam Section */}
          {(section.type || sectionType) === 'i-beam' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Flange Width ({getUnit('length')})
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={convertValue(section.flangeWidth || 0.2, 'length', 'SI').toFixed(3)}
                  onChange={(e) => updateSectionProperty('flangeWidth', parseFloat(e.target.value) || 0)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Flange Thickness ({getUnit('length')})
                </label>
                <input
                  type="number"
                  min="0.001"
                  step="0.001"
                  value={convertValue(section.flangeThickness || 0.02, 'length', 'SI').toFixed(3)}
                  onChange={(e) => updateSectionProperty('flangeThickness', parseFloat(e.target.value) || 0)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Web Height ({getUnit('length')})
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={convertValue(section.webHeight || 0.4, 'length', 'SI').toFixed(3)}
                  onChange={(e) => updateSectionProperty('webHeight', parseFloat(e.target.value) || 0)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Web Thickness ({getUnit('length')})
                </label>
                <input
                  type="number"
                  min="0.001"
                  step="0.001"
                  value={convertValue(section.webThickness || 0.01, 'length', 'SI').toFixed(3)}
                  onChange={(e) => updateSectionProperty('webThickness', parseFloat(e.target.value) || 0)}
                  className="input-field"
                />
              </div>
            </div>
          )}

          {/* T-Beam Section */}
          {(section.type || sectionType) === 't-beam' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Flange Width ({getUnit('length')})
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={convertValue(section.flangeWidth || 0.3, 'length', 'SI').toFixed(3)}
                  onChange={(e) => updateSectionProperty('flangeWidth', parseFloat(e.target.value) || 0)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Flange Thickness ({getUnit('length')})
                </label>
                <input
                  type="number"
                  min="0.001"
                  step="0.001"
                  value={convertValue(section.flangeThickness || 0.05, 'length', 'SI').toFixed(3)}
                  onChange={(e) => updateSectionProperty('flangeThickness', parseFloat(e.target.value) || 0)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Web Height ({getUnit('length')})
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={convertValue(section.webHeight || 0.4, 'length', 'SI').toFixed(3)}
                  onChange={(e) => updateSectionProperty('webHeight', parseFloat(e.target.value) || 0)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Web Thickness ({getUnit('length')})
                </label>
                <input
                  type="number"
                  min="0.001"
                  step="0.001"
                  value={convertValue(section.webThickness || 0.02, 'length', 'SI').toFixed(3)}
                  onChange={(e) => updateSectionProperty('webThickness', parseFloat(e.target.value) || 0)}
                  className="input-field"
                />
              </div>
            </div>
          )}

          {/* Custom Section */}
          {(section.type || sectionType) === 'custom' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Moment of Inertia ({getUnit('inertia')})
              </label>
              <input
                type="number"
                min="1e-8"
                step="1e-8"
                value={convertValue(section.momentOfInertia || 1e-4, 'inertia', 'SI').toExponential(2)}
                onChange={(e) => {
                  const siValue = convertValue(parseFloat(e.target.value) || 0, 'inertia', null, 'SI');
                  updateBeamData({
                    materialProperties: {
                      ...beamData.materialProperties,
                      I: siValue
                    },
                    section: {
                      ...section,
                      momentOfInertia: siValue
                    }
                  });
                }}
                className="input-field"
              />
            </div>
          )}

          <button
            onClick={calculateMomentOfInertia}
            className="btn-primary w-full"
          >
            Calculate Moment of Inertia
          </button>
        </div>
      </div>

      {/* Section Presets */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Section Presets</h4>
        <div className="grid grid-cols-1 gap-2">
          {sectionPresets.map((preset) => (
            <button
              key={preset.name}
              onClick={() => applyPreset(preset)}
              className="p-3 text-left border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="font-medium text-sm text-gray-900 dark:text-white">{preset.name}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{preset.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Calculated Properties */}
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
              Calculated Properties
            </h3>
            <div className="mt-1 text-sm text-green-700 dark:text-green-300">
              <div>Moment of Inertia (I) = {convertValue(beamData.materialProperties.I, 'inertia', 'SI').toExponential(3)} {getUnit('inertia')}</div>
              {(section.type || sectionType) === 'rectangular' && (
                <div className="mt-1">
                  Section: {convertValue(section.width || 0.3, 'length', 'SI').toFixed(0)} × {convertValue(section.height || 0.5, 'length', 'SI').toFixed(0)} {getUnit('length')}
                </div>
              )}
              {(section.type || sectionType) === 'circular' && (
                <div className="mt-1">
                  Diameter: {convertValue(section.diameter || 0.4, 'length', 'SI').toFixed(0)} {getUnit('length')}
                </div>
              )}
              {(section.type || sectionType) === 't-beam' && (
                <div className="mt-1">
                  T-Section: {convertValue(section.flangeWidth || 0.3, 'length', 'SI').toFixed(0)} × {convertValue(section.flangeThickness || 0.05, 'length', 'SI').toFixed(0)} flange, {convertValue(section.webThickness || 0.02, 'length', 'SI').toFixed(0)} × {convertValue(section.webHeight || 0.4, 'length', 'SI').toFixed(0)} web {getUnit('length')}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Section Visualization */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Section Preview</h4>
        <div className="flex justify-center">
          <svg width="200" height="150" viewBox="0 0 200 150" className="border border-gray-300 dark:border-gray-600 rounded">
            {(section.type || sectionType) === 'rectangular' && (
              <rect
                x="50"
                y="25"
                width="100"
                height="100"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-blue-600 dark:text-blue-400"
              />
            )}
            {(section.type || sectionType) === 'circular' && (
              <circle
                cx="100"
                cy="75"
                r="50"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-blue-600 dark:text-blue-400"
              />
            )}
            {(section.type || sectionType) === 'i-beam' && (
              <g className="text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" strokeWidth="2">
                {/* Top flange */}
                <rect x="40" y="25" width="120" height="20" />
                {/* Web */}
                <rect x="90" y="45" width="20" height="60" />
                {/* Bottom flange */}
                <rect x="40" y="105" width="120" height="20" />
              </g>
            )}
            {(section.type || sectionType) === 't-beam' && (
              <g className="text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" strokeWidth="2">
                {/* Top flange */}
                <rect x="40" y="25" width="120" height="25" />
                {/* Web */}
                <rect x="90" y="50" width="20" height="75" />
              </g>
            )}
            {(section.type || sectionType) === 'custom' && (
              <g className="text-blue-600 dark:text-blue-400">
                <rect
                  x="50"
                  y="25"
                  width="100"
                  height="100"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                />
                <text x="100" y="80" textAnchor="middle" className="text-xs fill-current">
                  Custom
                </text>
              </g>
            )}
          </svg>
        </div>
      </div>
    </div>
  );
};

export default SectionTab;