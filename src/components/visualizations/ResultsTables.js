import React from 'react';

const ResultsTables = ({ beamData, results }) => {
  const generateTableData = (xData, yData, interval = 2.0) => {
    const tableData = [];
    for (let i = 0; i < xData.length; i++) {
      const x = xData[i];
      if (x % interval === 0 || Math.abs(x - beamData.length) < 0.01) {
        tableData.push({
          position: x.toFixed(2),
          value: yData[i].toFixed(4)
        });
      }
    }
    return tableData;
  };

  const shearForceTable = results.shearForce.x.length > 0 
    ? generateTableData(results.shearForce.x, results.shearForce.y)
    : [];

  const bendingMomentTable = results.bendingMoment.x.length > 0
    ? generateTableData(results.bendingMoment.x, results.bendingMoment.y)
    : [];

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

      {/* Shear Force Table */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Shear Force Values (every 2m)</h3>
        {shearForceTable.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-blue-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                    Position (m)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                    Shear Force (kN)
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {shearForceTable.map((row, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {row.position}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={parseFloat(row.value) < 0 ? 'text-red-600' : 'text-blue-600'}>
                        {row.value}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No shear force data available</p>
          </div>
        )}
      </div>

      {/* Bending Moment Table */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Bending Moment Values (every 2m)</h3>
        {bendingMomentTable.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-green-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider">
                    Position (m)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider">
                    Bending Moment (kNm)
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bendingMomentTable.map((row, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {row.position}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={parseFloat(row.value) < 0 ? 'text-red-600' : 'text-green-600'}>
                        {row.value}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No bending moment data available</p>
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