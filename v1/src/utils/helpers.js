export const formatValue = (value) => {
  if (value === null || value === undefined) {
    return '-';
  }
  return value;
};

import * as THREE from 'three';

export const animateCameraArc = (camera, controls, radius, startAngle, endAngle, counterClockwise = true, duration = 1500) => {
  const startTime = Date.now();
  const targetLookAt = new THREE.Vector3(0, 0, 0);
  
  const normalizeAngle = (angle) => {
    while (angle < 0) angle += 2 * Math.PI;
    while (angle >= 2 * Math.PI) angle -= 2 * Math.PI;
    return angle;
  };
  
  const normalizedStart = normalizeAngle(startAngle);
  const normalizedEnd = normalizeAngle(endAngle);
  
  let angleDiff = normalizedEnd - normalizedStart;
  if (counterClockwise) {
    if (angleDiff < 0) {
      angleDiff += 2 * Math.PI;
    }
  } else {
    if (angleDiff > 0) {
      angleDiff -= 2 * Math.PI;
    }
  }
  
  const animate = () => {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    const easeProgress = progress < 0.5
      ? 4 * progress * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 3) / 2;
    
    const currentAngle = normalizedStart + angleDiff * easeProgress;
    const currentY = camera.position.y;
    const currentX = radius * Math.sin(currentAngle);
    const currentZ = radius * Math.cos(currentAngle);
    
    camera.position.set(currentX, currentY, currentZ);
    controls.target.copy(targetLookAt);
    controls.update();
    
    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  };
  
  animate();
};

