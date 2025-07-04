import React, { useState } from 'react';

const LoadsTab = ({ beamData, updateBeamData }) => {
  const [activeLoadType, setActiveLoadType] = useState('point');

  const addPointLoad = () => {
    const newLoad = { position: 0, magnitude: 0 };
    updateBeamData({
      pointLoads: [...beamData.pointLoads, newLoad]
    });
  };

  const addDistributedLoad = () => {
    const newLoad = {
      startPos: 0,
      endPos: beamData.length,
      startMag: 0,
      endMag: 0
    };
    updateBeamData({
      distributedLoads: [...beamData.distributedLoads, newLoad]
    });
  };

  const removePointLoad = (index) => {
    const newLoads = beamData.pointLoads.filter((_, i) => i !== index);
    updateBeamData({ pointLoads: newLoads });
  };

  const removeDistributedLoad = (index) => {
    const newLoads = beamData.distributedLoads.filter((_, i) => i !== index);
    updateBeamData({ distributedLoads: newLoads });
  };

  const updatePointLoad = (index, field, value) => {
    const newLoads = [...beamData.pointLoads];
    newLoads[index] = { ...newLoads[index], [field]: value };
    updateBeamData({ pointLoads: newLoads });
  };

  const updateDistributedLoad = (index, field, value) => {
    const newLoads = [...beamData.distributedLoads];
    newLoads[index] = { ...newLoads[index], [field]: value };
    updateBeamData({ distributedLoads: newLoads });
  };

  return (
    <div className="space-y-6">
      <div className="flex space-x-2">
        <button
          onClick={() => setActiveLoadType('point')}
          className={`tab-button ${activeLoadType === 'point' ? 'active' : 'inactive'}`}
        >
          Point Loads
        </button>
        <button
          onClick={() => setActiveLoadType('distributed')}
          className={`tab-button ${activeLoadType === 'distributed' ? 'active' : 'inactive'}`}
        >
          Distributed Loads
        </button>
      </div>

      {activeLoadType === 'point' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">Point Loads</h3>
            <button onClick={addPointLoad} className="btn-primary text-sm">
              Add Point Load
            </button>
          </div>

          {beamData.pointLoads.map((load, index) => (
            <div key={index} className="card">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-gray-900">Point Load {index + 1}</h4>
                <button
                  onClick={() => removePointLoad(index)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Remove
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Position (m)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={beamData.length}
                    step="0.1"
                    value={load.position}
                    onChange={(e) => updatePointLoad(index, 'position', parseFloat(e.target.value) || 0)}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Magnitude (kN)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={load.magnitude}
                    onChange={(e) => updatePointLoad(index, 'magnitude', parseFloat(e.target.value) || 0)}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="mt-3 flex space-x-2">
                <button
                  onClick={() => updatePointLoad(index, 'magnitude', Math.abs(load.magnitude))}
                  className="btn-secondary text-sm flex items-center"
                >
                  ⬆️ Upward
                </button>
                <button
                  onClick={() => updatePointLoad(index, 'magnitude', -Math.abs(load.magnitude))}
                  className="btn-secondary text-sm flex items-center"
                >
                  ⬇️ Downward
                </button>
              </div>
            </div>
          ))}

          {beamData.pointLoads.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No point loads defined</p>
            </div>
          )}
        </div>
      )}

      {activeLoadType === 'distributed' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">Distributed Loads</h3>
            <button onClick={addDistributedLoad} className="btn-primary text-sm">
              Add Distributed Load
            </button>
          </div>

          {beamData.distributedLoads.map((load, index) => (
            <div key={index} className="card">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-gray-900">Distributed Load {index + 1}</h4>
                <button
                  onClick={() => removeDistributedLoad(index)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Remove
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Position (m)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={beamData.length}
                    step="0.1"
                    value={load.startPos}
                    onChange={(e) => updateDistributedLoad(index, 'startPos', parseFloat(e.target.value) || 0)}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Position (m)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={beamData.length}
                    step="0.1"
                    value={load.endPos}
                    onChange={(e) => updateDistributedLoad(index, 'endPos', parseFloat(e.target.value) || 0)}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Magnitude (kN/m)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={load.startMag}
                    onChange={(e) => updateDistributedLoad(index, 'startMag', parseFloat(e.target.value) || 0)}
                    className="input-field"
                  />
                  <div className="mt-2 flex space-x-1">
                    <button
                      onClick={() => updateDistributedLoad(index, 'startMag', Math.abs(load.startMag))}
                      className="btn-secondary text-xs flex items-center px-2 py-1"
                    >
                      ⬆️ Up
                    </button>
                    <button
                      onClick={() => updateDistributedLoad(index, 'startMag', -Math.abs(load.startMag))}
                      className="btn-secondary text-xs flex items-center px-2 py-1"
                    >
                      ⬇️ Down
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Magnitude (kN/m)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={load.endMag}
                    onChange={(e) => updateDistributedLoad(index, 'endMag', parseFloat(e.target.value) || 0)}
                    className="input-field"
                  />
                  <div className="mt-2 flex space-x-1">
                    <button
                      onClick={() => updateDistributedLoad(index, 'endMag', Math.abs(load.endMag))}
                      className="btn-secondary text-xs flex items-center px-2 py-1"
                    >
                      ⬆️ Up
                    </button>
                    <button
                      onClick={() => updateDistributedLoad(index, 'endMag', -Math.abs(load.endMag))}
                      className="btn-secondary text-xs flex items-center px-2 py-1"
                    >
                      ⬇️ Down
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-3 text-xs text-gray-500">
                Start: {load.startMag > 0 ? 'Upward' : load.startMag < 0 ? 'Downward' : 'No load'} • 
                End: {load.endMag > 0 ? 'Upward' : load.endMag < 0 ? 'Downward' : 'No load'}
              </div>
            </div>
          ))}

          {beamData.distributedLoads.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No distributed loads defined</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LoadsTab;