import * as THREE from 'three';
import { BLADE_STATUS, STATUS_COLORS } from '../constants';

export function applyMaterialStatus(material, status, originalMaterial) {
  material.needsUpdate = true;
  
  const statusConfig = STATUS_COLORS[status] || STATUS_COLORS.NORMAL;
  
  if (status === BLADE_STATUS.HEATING) {
    material.color.setHex(statusConfig.color);
    material.emissive = new THREE.Color(statusConfig.emissive);
    material.emissiveIntensity = statusConfig.emissiveIntensity;
  } else if (status === BLADE_STATUS.FAULT) {
    material.emissive = new THREE.Color(statusConfig.emissive);
    material.emissiveIntensity = statusConfig.emissiveIntensity;
    const blueTint = new THREE.Color(statusConfig.color);
    material.color.lerp(blueTint, 0.5);
  } else if (status === BLADE_STATUS.OFFLINE) {
    material.emissive = new THREE.Color(statusConfig.emissive);
    material.emissiveIntensity = statusConfig.emissiveIntensity;
    material.color.setHex(statusConfig.color);
  } else {
    material.emissive = new THREE.Color(statusConfig.emissive);
    material.emissiveIntensity = statusConfig.emissiveIntensity;
    if (originalMaterial) {
      material.color.copy(originalMaterial.color);
    }
  }
}

export function applyIndependentHeating(material) {
  material.needsUpdate = true;
  material.color.setHex(0xff0000);
  material.emissive = new THREE.Color(0xff0000);
  material.emissiveIntensity = 0.8;
}

export function restoreOriginalMaterial(mesh, originalMaterial) {
  if (Array.isArray(originalMaterial)) {
    mesh.material = originalMaterial.map(mat => mat.clone());
  } else {
    mesh.material = originalMaterial.clone();
  }
}

export function highlightMesh(mesh, originalMaterial) {
  const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
  const yellowHighlight = new THREE.Color(0xffffaa);
  
  materials.forEach((mat) => {
    const highlightedMat = mat.clone();
    const currentEmissive = highlightedMat.emissive.clone();
    const hasEmissiveColor = currentEmissive.r > 0.01 || currentEmissive.g > 0.01 || currentEmissive.b > 0.01;
    
    if (hasEmissiveColor && highlightedMat.emissiveIntensity > 0) {
      currentEmissive.lerp(yellowHighlight, 0.5);
      highlightedMat.emissive = currentEmissive;
      highlightedMat.emissiveIntensity = highlightedMat.emissiveIntensity + 0.4;
    } else {
      highlightedMat.emissive = yellowHighlight;
      highlightedMat.emissiveIntensity = 0.6;
    }
    
    highlightedMat.needsUpdate = true;
  });
  
  if (Array.isArray(mesh.material)) {
    mesh.material = materials.map((mat, idx) => {
      const highlightedMat = mat.clone();
      const currentEmissive = highlightedMat.emissive.clone();
      const hasEmissiveColor = currentEmissive.r > 0.01 || currentEmissive.g > 0.01 || currentEmissive.b > 0.01;
      
      if (hasEmissiveColor && highlightedMat.emissiveIntensity > 0) {
        currentEmissive.lerp(yellowHighlight, 0.5);
        highlightedMat.emissive = currentEmissive;
        highlightedMat.emissiveIntensity = highlightedMat.emissiveIntensity + 0.4;
      } else {
        highlightedMat.emissive = yellowHighlight;
        highlightedMat.emissiveIntensity = 0.6;
      }
      
      highlightedMat.needsUpdate = true;
      return highlightedMat;
    });
  } else {
    mesh.material = materials[0];
  }
}

