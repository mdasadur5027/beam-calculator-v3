import React, { useState } from 'react';
import BeamDiagram from './visualizations/BeamDiagram';
import DiagramCharts from './visualizations/DiagramCharts';
import ResultsTables from './visualizations/ResultsTables';

const VisualizationPanel = ({ beamData, results }) => {
  const [activeView, setActiveView] = useState('diagram');

  const views = [
    { id: 'diagram', label: 'Beam Diagram', icon: '🏗️' },
    { id: 'charts', label: 'SFD & BMD', icon: '📊' },
    { id: 'tables', label: 'Results Tables', icon: '📋' }
  ];

  const renderContent = () => {
    switch (activeView) {
      case 'diagram':
        return <BeamDiagram beamData={beamData} results={results} />;
      case 'charts':
        return <DiagramCharts beamData={beamData} results={results} />;
      case 'tables':
        return <ResultsTables beamData={beamData} results={results} />;
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex space-x-1">
            {views.map((view) => (
              <button
                key={view.id}
                onClick={() => setActiveView(view.id)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeView === view.id
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <span className="mr-2">{view.icon}</span>
                {view.label}
              </button>
            ))}
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <span>Beam Length: {beamData.length}m</span>
            <span>•</span>
            <span>Supports: {beamData.supports.length}</span>
            <span>•</span>
            <span>Loads: {beamData.pointLoads.length + beamData.distributedLoads.length}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="animate-fade-in">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default VisualizationPanel;