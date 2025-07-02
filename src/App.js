import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import InputPanel from './components/InputPanel';
import VisualizationPanel from './components/VisualizationPanel';
import { calculateReactions, calculateShearForce, calculateBendingMoment } from './utils/calculations';

function App() {
  const [beamData, setBeamData] = useState({
    length: 10.0,
    supports: [{ type: 'Fixed', position: 0.0 }],
    pointLoads: [],
    distributedLoads: [],
    moments: [],
    materialProperties: {
      E: 2e8, // Young's modulus in kN/m²
      I: 1e-4  // Moment of inertia in m⁴
    }
  });

  const [results, setResults] = useState({
    reactions: [],
    shearForce: { x: [], y: [] },
    bendingMoment: { x: [], y: [] },
    deflection: { x: [], y: [] }
  });

  const [resolution, setResolution] = useState(100);

  useEffect(() => {
    calculateResults();
  }, [beamData, resolution]);

  const calculateResults = () => {
    try {
      const reactions = calculateReactions(
        beamData.supports,
        beamData.pointLoads,
        beamData.distributedLoads,
        beamData.moments,
        beamData.length
      );

      if (reactions) {
        const { x: xCoords, shear } = calculateShearForce(
          reactions.supportReactions || [],
          beamData.pointLoads,
          beamData.distributedLoads,
          beamData.length,
          resolution
        );

        const { x: xCoordsMoment, moment } = calculateBendingMoment(
          beamData.supports,
          reactions.supportReactions || [],
          reactions.supportMoments || [],
          beamData.pointLoads,
          beamData.distributedLoads,
          beamData.moments,
          beamData.length,
          resolution
        );

        setResults({
          reactions: reactions.reactions || [],
          shearForce: { x: xCoords, y: shear },
          bendingMoment: { x: xCoordsMoment, y: moment },
          deflection: { x: [], y: [] } // Placeholder for deflection calculation
        });
      }
    } catch (error) {
      console.error('Calculation error:', error);
    }
  };

  const updateBeamData = (newData) => {
    setBeamData(prev => ({ ...prev, ...newData }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex h-[calc(100vh-4rem)]">
        <div className="w-96 border-r border-gray-200 bg-white overflow-y-auto">
          <InputPanel 
            beamData={beamData} 
            updateBeamData={updateBeamData}
            resolution={resolution}
            setResolution={setResolution}
          />
        </div>
        <div className="flex-1 overflow-hidden">
          <VisualizationPanel 
            beamData={beamData} 
            results={results}
          />
        </div>
      </div>
    </div>
  );
}

export default App;