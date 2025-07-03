import React from 'react';

const ResultsTables = ({ beamData, results }) => {
  const generateCombinedTableData = (interval = 1.0) => {
    if (results.shearForce.x.length === 0) return [];
    
    const tableData = [];
    for (let i = 0; i < results.shearForce.x.length; i++) {
      const x = results.shearForce.x[i];
      if (x % interval === 0 || Math.abs(x - beamData.length) < 0.01) {
        tableData.push({
          position: x.toFixed(2),
          shearForce: results.shearForce.y[i].toFixed(4),
          bendingMoment: results.bendingMoment.y[i].toFixed(4),
          deflection: (results.deflection.y[i] * 1000).toFixed(4) // Convert to mm
        });
      }
    }
    return tableData;
  };

  const combinedTable = generateCombinedTableData(1.0);

  return (
    <div className="space-y-6">
      {/* Reactions Summary */}
      {results.reactions.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Reaction Forces Summary</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Support Position (m)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Support Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vertical Force (kN)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Moment (kNm)
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {results.reactions.map((reaction, index) => {
                  const support = beamData.supports.find(s => s.position === reaction.position);
                  return (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {reaction.position.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {support?.type || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={reaction.force < 0 ? 'text-red-600' : 'text-blue-600'}>
                          {Math.abs(reaction.force).toFixed(3)} {reaction.force < 0 ? '↓' : '↑'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {reaction.moment !== undefined ? (
                          <span className={reaction.moment < 0 ? 'text-red-600' : 'text-blue-600'}>
                            {Math.abs(reaction.moment).toFixed(3)} {reaction.moment > 0 ? '↻' : '↺'}
                          </span>
                        ) : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Combined Results Table */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Analysis Results (every 1m)</h3>
        {combinedTable.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Position (m)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                    Shear Force (kN)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider">
                    Bending Moment (kNm)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase tracking-wider">
                    Deflection (mm)
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {combinedTable.map((row, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {row.position}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={parseFloat(row.shearForce) < 0 ? 'text-red-600' : 'text-blue-600'}>
                        {row.shearForce}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={parseFloat(row.bendingMoment) < 0 ? 'text-red-600' : 'text-green-600'}>
                        {row.bendingMoment}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={parseFloat(row.deflection) < 0 ? 'text-red-600' : 'text-red-600'}>
                        {row.deflection}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No analysis data available</p>
            <p className="text-sm">Configure beam parameters to see the results</p>
          </div>
        )}
      </div>

      {/* Material Properties Summary */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Material Properties</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm font-medium text-gray-700">Young's Modulus (E)</div>
            <div className="text-lg font-semibold text-gray-900">
              {beamData.materialProperties.E.toExponential(2)} kN/m²
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm font-medium text-gray-700">Moment of Inertia (I)</div>
            <div className="text-lg font-semibold text-gray-900">
              {beamData.materialProperties.I.toExponential(2)} m⁴
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm font-medium text-gray-700">Flexural Rigidity (EI)</div>
            <div className="text-lg font-semibold text-gray-900">
              {(beamData.materialProperties.E * beamData.materialProperties.I).toExponential(2)} kNm²
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsTables;