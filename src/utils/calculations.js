// Calculation utilities for beam analysis

export const calculateReactions = (supports, pointLoads, distributedLoads, moments, beamLength) => {
  const numSupports = supports.length;
  
  if (numSupports === 1) {
    const support = supports[0];
    if (support.type === "Fixed") {
      return calculateFixedSupportReactions(support, pointLoads, distributedLoads, moments, beamLength);
    } else {
      return { error: "Unable to solve with single non-fixed support" };
    }
  } else if (numSupports === 2) {
    if (supports.some(s => s.type === "Fixed")) {
      return { error: "Unable to solve with fixed support and two supports" };
    } else {
      return calculateTwoSupportReactions(supports, pointLoads, distributedLoads, moments, beamLength);
    }
  } else {
    return { error: "Unsupported number of supports" };
  }
};

const calculateFixedSupportReactions = (support, pointLoads, distributedLoads, moments, beamLength) => {
  let sumPointLoads = 0;
  let sumDistLoads = 0;
  let sumPointLoadsMoments = 0;
  let sumDistLoadsMoments = 0;
  let sumExternalMoments = 0;

  const fixedSupportPos = support.position;

  // Point loads
  pointLoads.forEach(({ position, magnitude }) => {
    sumPointLoads += magnitude;
    sumPointLoadsMoments += magnitude * Math.abs(position - fixedSupportPos);
  });

  // Distributed loads
  distributedLoads.forEach(({ startPos, endPos, startMag, endMag }) => {
    const length = Math.abs(endPos - startPos);
    const totalLoad = 0.5 * (startMag + endMag) * length;
    sumDistLoads += totalLoad;

    if (endMag + startMag !== 0) {
      const centroidLeft = (length / 3) * ((2 * endMag + startMag) / (endMag + startMag));
      const centroidRight = length - centroidLeft;
      const distanceLeft = Math.min(startPos, endPos);
      const distanceRight = beamLength - Math.max(startPos, endPos);

      if (fixedSupportPos === 0) {
        sumDistLoadsMoments += totalLoad * (centroidLeft + distanceLeft);
      } else {
        sumDistLoadsMoments += totalLoad * (centroidRight + distanceRight);
      }
    }
  });

  // External moments
  moments.forEach(({ magnitude }) => {
    sumExternalMoments += magnitude;
  });

  const reactionForce = -sumPointLoads - sumDistLoads;
  const reactionMoment = sumPointLoadsMoments + sumDistLoadsMoments - sumExternalMoments;

  return {
    reactions: [
      { position: fixedSupportPos, force: reactionForce, moment: reactionMoment }
    ],
    supportReactions: [{ position: fixedSupportPos, magnitude: reactionForce }],
    supportMoments: [{ position: fixedSupportPos, magnitude: reactionMoment }]
  };
};

const calculateTwoSupportReactions = (supports, pointLoads, distributedLoads, moments, beamLength) => {
  let sumPointLoads = 0;
  let sumDistLoads = 0;
  let sumPointLoadsMoments = 0;
  let sumDistLoadsMoments = 0;
  let sumExternalMoments = 0;

  // Point loads
  pointLoads.forEach(({ position, magnitude }) => {
    sumPointLoads += magnitude;
    sumPointLoadsMoments += magnitude * position;
  });

  // Distributed loads
  distributedLoads.forEach(({ startPos, endPos, startMag, endMag }) => {
    const length = Math.abs(endPos - startPos);
    const totalLoad = 0.5 * (startMag + endMag) * length;
    sumDistLoads += totalLoad;

    if (endMag + startMag !== 0) {
      const centroidLeft = (length / 3) * ((2 * endMag + startMag) / (endMag + startMag));
      const distanceLeft = Math.min(startPos, endPos);
      sumDistLoadsMoments += totalLoad * (centroidLeft + distanceLeft);
    }
  });

  // External moments
  moments.forEach(({ magnitude }) => {
    sumExternalMoments += magnitude;
  });

  const reactionCoefficientMat = [
    [1, 1],
    [supports[0].position, supports[1].position]
  ];

  const constantMat = [
    sumPointLoads + sumDistLoads,
    sumPointLoadsMoments + sumDistLoadsMoments - sumExternalMoments
  ];

  try {
    const det = reactionCoefficientMat[0][0] * reactionCoefficientMat[1][1] - 
                reactionCoefficientMat[0][1] * reactionCoefficientMat[1][0];
    
    if (Math.abs(det) < 1e-10) {
      return { error: "Singular matrix - unable to solve" };
    }

    const r1 = -(reactionCoefficientMat[1][1] * constantMat[0] - reactionCoefficientMat[0][1] * constantMat[1]) / det;
    const r2 = -(reactionCoefficientMat[0][0] * constantMat[1] - reactionCoefficientMat[1][0] * constantMat[0]) / det;

    const reactions = [
      { position: supports[0].position, force: r1 },
      { position: supports[1].position, force: r2 }
    ].sort((a, b) => a.position - b.position);

    return {
      reactions,
      supportReactions: reactions.map(r => ({ position: r.position, magnitude: r.force }))
    };
  } catch (error) {
    return { error: "Unable to solve reaction equations" };
  }
};

export const calculateShearForce = (supportReactions, pointLoads, distributedLoads, beamLength, resolution) => {
  const numPoints = Math.floor(beamLength * resolution) + 1;
  const shear = new Array(numPoints).fill(0);
  const xCoords = Array.from({ length: numPoints }, (_, i) => (i * beamLength) / (numPoints - 1));

  // Add support reactions
  supportReactions.forEach(({ position, magnitude }) => {
    for (let i = 0; i < xCoords.length; i++) {
      if (xCoords[i] >= position) {
        shear[i] += magnitude;
      }
    }
  });

  // Add point loads
  pointLoads.forEach(({ position, magnitude }) => {
    for (let i = 0; i < xCoords.length; i++) {
      if (xCoords[i] >= position) {
        shear[i] += magnitude;
      }
    }
  });

  // Add distributed loads
  distributedLoads.forEach(({ startPos, endPos, startMag, endMag }) => {
    for (let i = 0; i < xCoords.length; i++) {
      const x = xCoords[i];
      if (x >= startPos && x <= endPos) {
        const load = startMag + (endMag - startMag) * ((x - startPos) / (endPos - startPos));
        const increment = load * (beamLength / (numPoints - 1));
        for (let j = i; j < xCoords.length; j++) {
          shear[j] += increment;
        }
      }
    }
  });

  return { x: xCoords, shear };
};

export const calculateBendingMoment = (supports, supportReactions, supportMoments, pointLoads, distributedLoads, externalMoments, beamLength, resolution) => {
  const numPoints = Math.floor(beamLength * resolution) + 1;
  const moment = new Array(numPoints).fill(0);
  const xCoords = Array.from({ length: numPoints }, (_, i) => (i * beamLength) / (numPoints - 1));

  // Fixed support position
  let fixedSupportPos = 0;
  supports.forEach(({ type, position }) => {
    if (type === "Fixed") {
      fixedSupportPos = position;
    }
  });

  // Add support reaction moments
  supportReactions.forEach(({ position, magnitude }) => {
    for (let i = 0; i < xCoords.length; i++) {
      if (xCoords[i] >= position) {
        moment[i] += magnitude * (xCoords[i] - position);
      }
    }
  });

  // Add support moments
  if (supportMoments) {
    supportMoments.forEach(({ position, magnitude }) => {
      for (let i = 0; i < xCoords.length; i++) {
        if (xCoords[i] >= position) {
          if (fixedSupportPos === 0) {
            moment[i] += magnitude;
          } else {
            moment[i] -= magnitude;
          }
        }
      }
    });
  }

  // Add point loads
  pointLoads.forEach(({ position, magnitude }) => {
    for (let i = 0; i < xCoords.length; i++) {
      if (xCoords[i] >= position) {
        moment[i] += magnitude * (xCoords[i] - position);
      }
    }
  });

  // Add distributed loads
  distributedLoads.forEach(({ startPos, endPos, startMag, endMag }) => {
    for (let i = 0; i < xCoords.length; i++) {
      const x = xCoords[i];
      if (x >= startPos && x <= endPos) {
        const load = startMag + (endMag - startMag) * ((x - startPos) / (endPos - startPos));
        const increment = load * (beamLength / (numPoints - 1));
        for (let j = i; j < xCoords.length; j++) {
          moment[j] += (xCoords[j] - x) * increment;
        }
      }
    }
  });

  // Add external moments
  externalMoments.forEach(({ position, magnitude }) => {
    for (let i = 0; i < xCoords.length; i++) {
      if (xCoords[i] >= position) {
        moment[i] += magnitude;
      }
    }
  });

  return { x: xCoords, moment };
};