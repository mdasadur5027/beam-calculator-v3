import React, { useRef, useEffect } from 'react';

const BeamDiagram = ({ beamData, results }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    drawBeam();
  }, [beamData, results]);

  const drawBeam = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Set up coordinate system
    const margin = 80;
    const beamY = height / 2;
    const beamHeight = 20;
    const scale = (width - 2 * margin) / beamData.length;

    // Draw beam
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(margin, beamY - beamHeight/2, beamData.length * scale, beamHeight);
    
    // Draw beam outline
    ctx.strokeStyle = '#1e40af';
    ctx.lineWidth = 2;
    ctx.strokeRect(margin, beamY - beamHeight/2, beamData.length * scale, beamHeight);

    // Draw supports
    beamData.supports.forEach(support => {
      const x = margin + support.position * scale;
      drawSupport(ctx, x, beamY + beamHeight/2, support.type, support.position, beamData.length);
    });

    // Draw point loads
    beamData.pointLoads.forEach(load => {
      const x = margin + load.position * scale;
      drawPointLoad(ctx, x, beamY - beamHeight/2, load.magnitude);
    });

    // Draw distributed loads
    beamData.distributedLoads.forEach(load => {
      const startX = margin + load.startPos * scale;
      const endX = margin + load.endPos * scale;
      drawDistributedLoad(ctx, startX, endX, beamY - beamHeight/2, load.startMag, load.endMag);
    });

    // Draw moments
    beamData.moments.forEach(moment => {
      const x = margin + moment.position * scale;
      drawMoment(ctx, x, beamY, moment.magnitude);
    });

    // Draw dimensions
    drawDimensions(ctx, margin, beamY + 60, beamData.length * scale, beamData);
  };

  const drawSupport = (ctx, x, y, type, position, beamLength) => {
    ctx.save();
    ctx.strokeStyle = '#374151';
    ctx.fillStyle = '#374151';
    ctx.lineWidth = 2;

    switch (type) {
      case 'Fixed':
        // Determine orientation based on position
        const isAtStart = position === 0;
        const isAtEnd = position === beamLength;
        
        if (isAtStart) {
          // Fixed support at left end - hatching on the left
          ctx.fillRect(x - 20, y - 10, 20, 30);
          // Draw hatching on the left side
          for (let i = 0; i < 6; i++) {
            ctx.beginPath();
            ctx.moveTo(x - 20, y - 10 + i * 5);
            ctx.lineTo(x - 15, y - 5 + i * 5);
            ctx.stroke();
          }
        } else if (isAtEnd) {
          // Fixed support at right end - hatching on the right
          ctx.fillRect(x, y - 10, 20, 30);
          // Draw hatching on the right side
          for (let i = 0; i < 6; i++) {
            ctx.beginPath();
            ctx.moveTo(x + 20, y - 10 + i * 5);
            ctx.lineTo(x + 15, y - 5 + i * 5);
            ctx.stroke();
          }
        } else {
          // Fixed support in middle - default vertical
          ctx.fillRect(x - 15, y, 30, 20);
          // Draw hatching at bottom
          for (let i = 0; i < 6; i++) {
            ctx.beginPath();
            ctx.moveTo(x - 15 + i * 5, y + 20);
            ctx.lineTo(x - 10 + i * 5, y + 25);
            ctx.stroke();
          }
        }
        break;
      case 'Hinge':
        // Draw hinge support
        ctx.beginPath();
        ctx.arc(x, y + 10, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x - 15, y + 20);
        ctx.lineTo(x, y + 10);
        ctx.lineTo(x + 15, y + 20);
        ctx.lineTo(x - 15, y + 20);
        ctx.stroke();
        break;
      case 'Roller':
        // Draw roller support
        ctx.beginPath();
        ctx.arc(x - 8, y + 15, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + 8, y + 15, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x - 15, y + 20);
        ctx.lineTo(x, y);
        ctx.lineTo(x + 15, y + 20);
        ctx.lineTo(x - 15, y + 20);
        ctx.stroke();
        break;
    }
    ctx.restore();
  };

  const drawPointLoad = (ctx, x, y, magnitude) => {
    if (magnitude === 0) return;

    ctx.save();
    ctx.strokeStyle = magnitude > 0 ? '#ef4444' : '#ef4444';
    ctx.fillStyle = magnitude > 0 ? '#ef4444' : '#ef4444';
    ctx.lineWidth = 2;

    const direction = magnitude > 0 ? -1 : 1;
    const arrowLength = Math.min(50, Math.abs(magnitude) * 5);

    // Draw arrow line
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y + direction * arrowLength);
    ctx.stroke();

    // Draw arrow head
    ctx.beginPath();
    ctx.moveTo(x, y + direction * arrowLength);
    ctx.lineTo(x - 5, y + direction * (arrowLength - 10));
    ctx.lineTo(x + 5, y + direction * (arrowLength - 10));
    ctx.closePath();
    ctx.fill();

    // Draw magnitude label
    ctx.fillStyle = '#374151';
    ctx.font = '12px Inter';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.abs(magnitude)} kN`, x, y + direction * (arrowLength + 15));

    ctx.restore();
  };

  const drawDistributedLoad = (ctx, startX, endX, y, startMag, endMag) => {
    if (startMag === 0 && endMag === 0) return;

    ctx.save();
    ctx.strokeStyle = '#22c55e';
    ctx.fillStyle = '#22c55e';
    ctx.lineWidth = 1;

    const maxMag = Math.max(Math.abs(startMag), Math.abs(endMag));
    
    // Determine directions for start and end
    const startDirection = startMag >= 0 ? -1 : 1; // Negative magnitude = downward
    const endDirection = endMag >= 0 ? -1 : 1;     // Negative magnitude = downward
    
    const startHeight = (Math.abs(startMag) / maxMag) * 40;
    const endHeight = (Math.abs(endMag) / maxMag) * 40;

    // Draw distributed load shape
    ctx.beginPath();
    ctx.moveTo(startX, y);
    ctx.lineTo(startX, y + startDirection * startHeight);
    ctx.lineTo(endX, y + endDirection * endHeight);
    ctx.lineTo(endX, y);
    ctx.closePath();
    ctx.globalAlpha = 0.3;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.stroke();

    // Draw arrows
    const numArrows = Math.max(3, Math.floor((endX - startX) / 20));
    for (let i = 0; i <= numArrows; i++) {
      const x = startX + (i / numArrows) * (endX - startX);
      const mag = startMag + (i / numArrows) * (endMag - startMag);
      const direction = mag >= 0 ? -1 : 1; // Negative magnitude = downward
      const height = (Math.abs(mag) / maxMag) * 40;
      
      if (height > 5) {
        // Draw arrow pointing in correct direction
        ctx.beginPath();
        ctx.moveTo(x, y + direction * height);
        ctx.lineTo(x - 3, y + direction * (height - 6));
        ctx.lineTo(x + 3, y + direction * (height - 6));
        ctx.closePath();
        ctx.fill();
      }
    }

    // Draw magnitude labels
    if (startMag !== 0) {
      ctx.fillStyle = '#374151';
      ctx.font = '12px Inter';
      ctx.textAlign = 'center';
      const labelY = y + startDirection * (startHeight + 15);
      ctx.fillText(`${Math.abs(startMag)} kN/m`, startX, labelY);
    }
    
    if (endMag !== 0 && endMag !== startMag) {
      ctx.fillStyle = '#374151';
      ctx.font = '12px Inter';
      ctx.textAlign = 'center';
      const labelY = y + endDirection * (endHeight + 15);
      ctx.fillText(`${Math.abs(endMag)} kN/m`, endX, labelY);
    }

    ctx.restore();
  };

  const drawMoment = (ctx, x, y, magnitude) => {
    if (magnitude === 0) return;

    ctx.save();
    ctx.strokeStyle = '#8b5cf6';
    ctx.lineWidth = 2;

    const radius = 20;
    const startAngle = magnitude > 0 ? 0 : Math.PI;
    const endAngle = magnitude > 0 ? Math.PI * 1.5 : Math.PI * 2.5;

    // Draw moment arc
    ctx.beginPath();
    ctx.arc(x, y, radius, startAngle, endAngle);
    ctx.stroke();

    // Draw arrow head
    const arrowX = x + radius * Math.cos(endAngle);
    const arrowY = y + radius * Math.sin(endAngle);
    ctx.beginPath();
    ctx.moveTo(arrowX, arrowY);
    ctx.lineTo(arrowX - 5, arrowY - 5);
    ctx.lineTo(arrowX - 5, arrowY + 5);
    ctx.closePath();
    ctx.fill();

    // Draw magnitude label
    ctx.fillStyle = '#374151';
    ctx.font = '12px Inter';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.abs(magnitude)} kNm`, x, y - 35);

    ctx.restore();
  };

  const drawDimensions = (ctx, startX, y, totalWidth, beamData) => {
    ctx.save();
    ctx.strokeStyle = '#6b7280';
    ctx.fillStyle = '#6b7280';
    ctx.lineWidth = 1;
    ctx.font = '11px Inter';
    ctx.textAlign = 'center';

    // Collect all significant positions
    const positions = [0, beamData.length];
    beamData.supports.forEach(support => positions.push(support.position));
    beamData.pointLoads.forEach(load => positions.push(load.position));
    beamData.distributedLoads.forEach(load => {
      positions.push(load.startPos);
      positions.push(load.endPos);
    });
    beamData.moments.forEach(moment => positions.push(moment.position));

    const uniquePositions = [...new Set(positions)].sort((a, b) => a - b);

    // Draw dimension line
    ctx.beginPath();
    ctx.moveTo(startX, y);
    ctx.lineTo(startX + totalWidth, y);
    ctx.stroke();

    // Draw dimension segments
    for (let i = 0; i < uniquePositions.length - 1; i++) {
      const pos1 = uniquePositions[i];
      const pos2 = uniquePositions[i + 1];
      const x1 = startX + (pos1 / beamData.length) * totalWidth;
      const x2 = startX + (pos2 / beamData.length) * totalWidth;
      const distance = pos2 - pos1;

      // Draw tick marks
      ctx.beginPath();
      ctx.moveTo(x1, y - 5);
      ctx.lineTo(x1, y + 5);
      ctx.moveTo(x2, y - 5);
      ctx.lineTo(x2, y + 5);
      ctx.stroke();

      // Draw dimension text
      if (distance > 0) {
        ctx.fillText(`${distance.toFixed(1)}m`, (x1 + x2) / 2, y + 20);
      }
    }

    ctx.restore();
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Beam Diagram</h3>
        <div className="bg-gray-50 rounded-lg p-4">
          <canvas
            ref={canvasRef}
            width={800}
            height={300}
            className="w-full h-auto border border-gray-200 rounded"
          />
        </div>
      </div>

      {results.reactions.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Reaction Forces</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {results.reactions.map((reaction, index) => (
              <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-blue-900">
                    Support at {reaction.position}m
                  </span>
                  <span className="text-blue-700">
                    {Math.abs(reaction.force).toFixed(2)} kN {reaction.force < 0 ? '↓' : '↑'}
                  </span>
                </div>
                {reaction.moment !== undefined && (
                  <div className="mt-2 text-sm text-blue-700">
                    Moment: {Math.abs(reaction.moment).toFixed(2)} kNm {reaction.moment > 0 ? '↻' : '↺'}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BeamDiagram;