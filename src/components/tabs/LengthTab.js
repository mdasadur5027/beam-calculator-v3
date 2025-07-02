import React from 'react';

const LengthTab = ({ beamData, updateBeamData }) => {
  const handleLengthChange = (e) => {
    const length = parseFloat(e.target.value) || 0;
    updateBeamData({ length });
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Beam Length (m)
        </label>
        <input
          type="number"
          min="1"
          max="100"
          step="0.1"
          value={beamData.length}
          onChange={handleLengthChange}
          className="input-field"
          placeholder="Enter beam length"
        />
        <p className="text-xs text-gray-500 mt-1">
          Specify the total length of the beam in meters
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Beam Length Guidelines
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li>Typical range: 1-100 meters</li>
                <li>Consider practical construction limits</li>
                <li>Longer beams may require intermediate supports</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LengthTab;