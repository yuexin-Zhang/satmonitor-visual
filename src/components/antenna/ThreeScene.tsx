import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { PMREMGenerator } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { BLADE_STATUS } from './constants';
import { fetchSystemInfo } from './dataGenerator';
import type { SystemData } from './dataGenerator';
import { formatValue, animateCameraArc } from './helpers';
import ControlPanel from './ControlPanel';
import './ThreeScene.css';

interface PanelInfo {
  id: number;
  number: number;
  status: string;
  temperature: string;
  power: string;
  faultCode: string | null;
  faultDesc: string | null;
  bladeData: Record<string, unknown> | null;
}

const ThreeScene = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [panelInfo, setPanelInfo] = useState<PanelInfo | null>(null);
  const [systemData, setSystemData] = useState<SystemData | null>(null);
  const [showSystemInfo, setShowSystemInfo] = useState(false);
  const [showAttitudeInfo, setShowAttitudeInfo] = useState(false);
  const [showSatelliteInfo, setShowSatelliteInfo] = useState(false);
  const [heatingCommands, setHeatingCommands] = useState<Map<string, { isHeating: boolean; commandTime: Date }>>(new Map());
  const [backgroundColor, setBackgroundColor] = useState('#001a33');
  const [baseColor, setBaseColor] = useState('#001a33');
  const [brightness, setBrightness] = useState(2.0);
  const [cameraDistance, setCameraDistance] = useState(2.5);

  const heatingCommandsRef = useRef(new Map<string, { isHeating: boolean; commandTime: Date }>());
  const meshesRef = useRef<THREE.Mesh[]>([]);
  const originalMaterialsRef = useRef(new Map<THREE.Mesh, THREE.Material | THREE.Material[]>());
  const systemDataRef = useRef<SystemData | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const planeRef = useRef<THREE.Mesh | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  // 组件加载时自动从API获取数据
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const data = await fetchSystemInfo();
        setSystemData(data);
        setShowSystemInfo(false);
      } catch (error) {
        console.error('加载初始系统数据失败:', error);
      }
    };
    fetchInitialData();
  }, []);

  // 定时更新数据
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const data = await fetchSystemInfo();
        setSystemData(data);
      } catch (error) {
        console.error('更新系统数据失败:', error);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(backgroundColor);
    sceneRef.current = scene;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(0, 0, 5);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.LinearToneMapping;
    renderer.toneMappingExposure = brightness;
    rendererRef.current = renderer;

    if (renderer.outputColorSpace !== undefined) {
      renderer.outputColorSpace = THREE.SRGBColorSpace;
    }

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 1;
    controls.maxDistance = 1000;
    controls.maxPolarAngle = Math.PI;
    controlsRef.current = controls;

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const meshes: THREE.Mesh[] = [];
    const originalMaterials = new Map<THREE.Mesh, THREE.Material | THREE.Material[]>();
    meshesRef.current = meshes;
    originalMaterialsRef.current = originalMaterials;

    let onMouseClick: ((event: MouseEvent) => void) | null = null;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(5, 5, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.1;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -10;
    directionalLight.shadow.camera.right = 10;
    directionalLight.shadow.camera.top = 10;
    directionalLight.shadow.camera.bottom = -10;
    directionalLight.shadow.bias = -0.0001;
    scene.add(directionalLight);

    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight2.position.set(-5, 3, -5);
    scene.add(directionalLight2);

    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
    hemisphereLight.position.set(0, 10, 0);
    scene.add(hemisphereLight);

    const pmremGenerator = new PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    const envMap = pmremGenerator.fromScene(scene, 0.04).texture;
    scene.environment = envMap;
    pmremGenerator.dispose();

    const planeGeometry = new THREE.PlaneGeometry(20, 20);
    const planeMaterial = new THREE.MeshStandardMaterial({
      color: baseColor,
      roughness: 0.8,
      metalness: 0.1
    });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = -2;
    plane.receiveShadow = true;
    scene.add(plane);
    planeRef.current = plane;

    // 加载 GLB 模型
    const loader = new GLTFLoader();
    loader.load(
      '/models/radar.glb',
      (gltf) => {
        const model = gltf.scene;
        scene.add(model);

        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            meshes.push(mesh);
            mesh.castShadow = true;
            mesh.receiveShadow = true;

            const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            materials.forEach((mat) => {
              const stdMat = mat as THREE.MeshStandardMaterial;
              mat.needsUpdate = true;
              mat.visible = true;

              if (!stdMat.map && stdMat.color?.r === 0 && stdMat.color?.g === 0 && stdMat.color?.b === 0) {
                stdMat.color.setHex(0x808080);
              }

              if (!mat.transparent) {
                mat.opacity = 1.0;
              }

              if (stdMat.map) {
                if (stdMat.map.colorSpace !== undefined) {
                  stdMat.map.colorSpace = THREE.SRGBColorSpace;
                }
                stdMat.map.needsUpdate = true;
              }

              if (stdMat.normalMap) stdMat.normalMap.needsUpdate = true;

              if (stdMat.roughnessMap) {
                if (stdMat.roughnessMap.colorSpace !== undefined) {
                  stdMat.roughnessMap.colorSpace = THREE.LinearSRGBColorSpace;
                }
                stdMat.roughnessMap.needsUpdate = true;
              }

              if (stdMat.metalnessMap) {
                if (stdMat.metalnessMap.colorSpace !== undefined) {
                  stdMat.metalnessMap.colorSpace = THREE.LinearSRGBColorSpace;
                }
                stdMat.metalnessMap.needsUpdate = true;
              }

              if (stdMat.emissiveMap) {
                if (stdMat.emissiveMap.colorSpace !== undefined) {
                  stdMat.emissiveMap.colorSpace = THREE.SRGBColorSpace;
                }
                stdMat.emissiveMap.needsUpdate = true;
              }

              if ((mat as THREE.MeshStandardMaterial).isMeshStandardMaterial || (mat as THREE.MeshPhysicalMaterial).isMeshPhysicalMaterial) {
                if (stdMat.metalness === undefined) stdMat.metalness = 0.5;
                if (stdMat.roughness === undefined) stdMat.roughness = 0.5;
                stdMat.envMapIntensity = stdMat.envMapIntensity || 1.0;
              }
            });

            if (Array.isArray(mesh.material)) {
              originalMaterials.set(mesh, mesh.material.map((m) => m.clone()));
            } else {
              originalMaterials.set(mesh, mesh.material.clone());
            }
          }
        });

        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        model.position.x = -center.x;
        model.position.y = -center.y;
        model.position.z = -center.z;

        const maxDim = Math.max(size.x, size.y, size.z);
        const fovRad = camera.fov * (Math.PI / 180);
        const fitHeightDistance = maxDim / (2 * Math.tan(fovRad / 2));
        const fitWidthDistance = fitHeightDistance / camera.aspect;
        const initialDistance = Math.max(fitHeightDistance, fitWidthDistance) * 1.25;

        // 默认斜45度视角（第一象限，微微抬高）
        const angle = Math.PI / 4;
        camera.position.set(
          initialDistance * Math.sin(angle),
          maxDim * 0.15,
          initialDistance * Math.cos(angle)
        );
        controls.target.set(0, 0, 0);
        controls.update();
        setCameraDistance(initialDistance);

        const setMaterialStatus = (mat: THREE.Material, status: string, originalMat: THREE.Material | null = null) => {
          mat.needsUpdate = true;
          const stdMat = mat as THREE.MeshStandardMaterial;
          switch (status) {
            case 'heating':
              stdMat.color.setHex(0xff0000);
              stdMat.emissive = new THREE.Color(0xff0000);
              stdMat.emissiveIntensity = 0.8;
              break;
            case 'heating-system':
              stdMat.emissive = new THREE.Color(0xff0000);
              stdMat.emissiveIntensity = 0.5;
              stdMat.color.lerp(new THREE.Color(0xff6666), 0.3);
              break;
            case 'fault':
              stdMat.emissive = new THREE.Color(0x0000ff);
              stdMat.emissiveIntensity = 0.4;
              stdMat.color.lerp(new THREE.Color(0x0000aa), 0.5);
              break;
            case 'offline':
              stdMat.emissive = new THREE.Color(0x000000);
              stdMat.emissiveIntensity = 0;
              stdMat.color.setHex(0x808080);
              break;
            case 'normal':
            default:
              stdMat.emissive = new THREE.Color(0x000000);
              stdMat.emissiveIntensity = 0;
              if (originalMat) {
                stdMat.color.copy((originalMat as THREE.MeshStandardMaterial).color);
              }
              break;
          }
        };

        const restoreOriginalMaterial = (mesh: THREE.Mesh, originalMat: THREE.Material | THREE.Material[]) => {
          if (Array.isArray(originalMat)) {
            mesh.material = originalMat.map((m) => m.clone());
          } else {
            mesh.material = originalMat.clone();
          }
        };

        const findMeshesByName = (name: string) => {
          const foundMeshes: THREE.Mesh[] = [];
          meshes.forEach((mesh) => {
            if (mesh.name === name) {
              foundMeshes.push(mesh);
            } else {
              let parent: THREE.Object3D | null = mesh.parent;
              while (parent) {
                if (parent.name === name) {
                  foundMeshes.push(mesh);
                  break;
                }
                parent = parent.parent;
              }
            }
          });
          return foundMeshes;
        };

        const highlightMesh = (mesh: THREE.Mesh) => {
          const yellowHighlight = new THREE.Color(0xffffaa);
          const highlightMaterial = (mat: THREE.Material) => {
            const highlightedMat = mat.clone();
            const stdMat = highlightedMat as THREE.MeshStandardMaterial;
            const currentEmissive = stdMat.emissive.clone();
            const hasEmissiveColor = currentEmissive.r > 0.01 || currentEmissive.g > 0.01 || currentEmissive.b > 0.01;

            if (hasEmissiveColor && stdMat.emissiveIntensity > 0) {
              currentEmissive.lerp(yellowHighlight, 0.5);
              stdMat.emissive = currentEmissive;
              stdMat.emissiveIntensity += 0.4;
            } else {
              stdMat.emissive = yellowHighlight;
              stdMat.emissiveIntensity = 0.6;
            }
            stdMat.needsUpdate = true;
            return highlightedMat;
          };

          if (Array.isArray(mesh.material)) {
            mesh.material = mesh.material.map(highlightMaterial);
          } else {
            mesh.material = highlightMaterial(mesh.material);
          }
        };

        const generateBladeInfo = (meshName: string): PanelInfo | null => {
          const match = meshName.match(/radar_(\d+)/);
          if (!match) return null;
          const id = parseInt(match[1], 10);
          const bladeId = `BLADE_0${id}`;
          const currentSystemData = systemDataRef.current;

          if (currentSystemData?.blades) {
            const blade = currentSystemData.blades.find((b) => b.bladeId === bladeId);
            if (blade) {
              const statusMap: Record<string, string> = {
                normal: '正常',
                heating: '加热中',
                fault: '故障',
                offline: '离线'
              };
              return {
                id,
                number: id,
                status: statusMap[blade.status] || blade.status,
                temperature:
                  blade.temperature.current !== null ? `${blade.temperature.current.toFixed(1)}°C` : 'N/A',
                power: blade.heater.power === 'on' ? `${blade.heater.powerLevel}%` : '0%',
                faultCode: blade.faultInfo?.faultType || null,
                faultDesc: blade.faultInfo?.description || null,
                bladeData: blade as unknown as Record<string, unknown>
              };
            }
          }

          return {
            id,
            number: id,
            status: '正常',
            temperature: '25.0°C',
            power: '0%',
            faultCode: null,
            faultDesc: null,
            bladeData: null
          };
        };

        const restoreAllMeshes = () => {
          const currentSystemData = systemDataRef.current;

          meshes.forEach((mesh) => {
            const originalMat = originalMaterials.get(mesh);
            if (!originalMat) return;

            restoreOriginalMaterial(mesh, originalMat);
            const meshName = mesh.name;
            const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];

            if (meshName.startsWith('radar_') && meshName !== 'radar_b') {
              const match = meshName.match(/radar_(\d+)/);
              if (match && currentSystemData?.blades) {
                const bladeId = `BLADE_${match[1]}`;
                const blade = currentSystemData.blades.find((b) => b.bladeId === bladeId);
                if (blade) {
                  const heatingCommand = heatingCommandsRef.current.get(blade.bladeId);
                  const isIndependentHeating = heatingCommand?.isHeating;

                  materials.forEach((mat, idx) => {
                    const origMat = Array.isArray(originalMat) ? originalMat[idx] : originalMat;
                    if (blade.status === BLADE_STATUS.HEATING || isIndependentHeating) {
                      setMaterialStatus(mat, isIndependentHeating ? 'heating' : 'heating-system', origMat);
                    } else if (blade.status === BLADE_STATUS.FAULT) {
                      setMaterialStatus(mat, 'fault', origMat);
                    } else if (blade.status === BLADE_STATUS.OFFLINE) {
                      setMaterialStatus(mat, 'offline', origMat);
                    } else {
                      setMaterialStatus(mat, 'normal', origMat);
                    }
                  });
                }
              }
              return;
            }

            if (!currentSystemData?.system) return;
            const system = currentSystemData.system;
            materials.forEach((mat, idx) => {
              const origMat = Array.isArray(originalMat) ? originalMat[idx] : originalMat;
              if (meshName === 'control_unit' && system.controlUnit) {
                setMaterialStatus(mat, system.controlUnit.status === 'fault' ? 'fault' : 'normal', origMat);
              } else if (meshName === 'Rainwater_detection' && system.alarmDetector) {
                setMaterialStatus(mat, system.alarmDetector.status === 'alarming' ? 'fault' : 'normal', origMat);
              } else if (meshName === 'radar_b') {
                const hasFault = system.displacementFault?.status === 'fault' || system.attitude?.status === 'fault';
                setMaterialStatus(mat, hasFault ? 'fault' : 'normal', origMat);
              } else if (meshName === 'High_frequency' && system.highFrequencyFault) {
                setMaterialStatus(mat, system.highFrequencyFault.status === 'fault' ? 'fault' : 'normal', origMat);
              }
            });
          });
        };

        onMouseClick = (event: MouseEvent) => {
          const rect = container.getBoundingClientRect();
          mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
          mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

          raycaster.setFromCamera(mouse, camera);
          const intersects = raycaster.intersectObjects(meshes, true);

          if (intersects.length > 0) {
            const clickedMesh = intersects[0].object as THREE.Mesh;
            const meshName = clickedMesh.name || '(未命名)';

            const isBlade = meshName.startsWith('radar_') && meshName !== 'radar_b';
            const isDisplacementFault = findMeshesByName('radar_b').some((m) => m === clickedMesh);
            const isHighFrequency = findMeshesByName('High_frequency').some((m) => m === clickedMesh);

            if (isBlade) {
              restoreAllMeshes();
              highlightMesh(clickedMesh);
              const bladeInfo = generateBladeInfo(meshName);
              if (bladeInfo) {
                setPanelInfo(bladeInfo);
                setShowSystemInfo(false);
                setShowAttitudeInfo(false);
                setShowSatelliteInfo(false);
              }
            } else if (isDisplacementFault) {
              restoreAllMeshes();
              findMeshesByName('radar_b').forEach((m) => highlightMesh(m));
              setPanelInfo(null);
              setShowSystemInfo(false);
              setShowAttitudeInfo(true);
              setShowSatelliteInfo(false);
            } else if (isHighFrequency) {
              restoreAllMeshes();
              findMeshesByName('High_frequency').forEach((m) => highlightMesh(m));
              setPanelInfo(null);
              setShowSystemInfo(false);
              setShowAttitudeInfo(false);
              setShowSatelliteInfo(true);
            } else {
              restoreAllMeshes();
              setPanelInfo(null);
              setShowSystemInfo(true);
              setShowAttitudeInfo(false);
              setShowSatelliteInfo(false);
            }
          } else {
            restoreAllMeshes();
            setPanelInfo(null);
            setShowSystemInfo((prev) => !prev);
            setShowAttitudeInfo(false);
            setShowSatelliteInfo(false);
          }
        };

        renderer.domElement.addEventListener('click', onMouseClick);
      }
    );

    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    resizeObserverRef.current = new ResizeObserver(handleResize);
    resizeObserverRef.current.observe(container);

    const handleRightClick = (event: MouseEvent) => {
      event.preventDefault();
      const target = event.target as HTMLElement;
      const isInPanel = target.closest('.blade-info-panel') || target.closest('.system-info-panel');
      if (!isInPanel) {
        setShowSystemInfo((prev) => !prev);
        setPanelInfo(null);
        setShowAttitudeInfo(false);
        setShowSatelliteInfo(false);
      }
    };

    container.addEventListener('contextmenu', handleRightClick);

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
      if (onMouseClick && renderer.domElement) {
        renderer.domElement.removeEventListener('click', onMouseClick);
      }
      container.removeEventListener('contextmenu', handleRightClick);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      controls.dispose();
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  useEffect(() => {
    systemDataRef.current = systemData;
  }, [systemData]);

  useEffect(() => {
    heatingCommandsRef.current = heatingCommands;
  }, [heatingCommands]);

  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.background = new THREE.Color(backgroundColor);
    }
  }, [backgroundColor]);

  useEffect(() => {
    if (planeRef.current && (planeRef.current.material as THREE.MeshStandardMaterial)) {
      (planeRef.current.material as THREE.MeshStandardMaterial).color.set(baseColor);
    }
  }, [baseColor]);

  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.toneMappingExposure = brightness;
    }
  }, [brightness]);

  useEffect(() => {
    if (cameraRef.current && controlsRef.current) {
      const camera = cameraRef.current;
      const controls = controlsRef.current;
      const currentPosition = camera.position.clone();
      const currentDistance = currentPosition.length();

      if (currentDistance < 0.001) {
        camera.position.set(0, 0, cameraDistance);
      } else {
        const direction = currentPosition.clone().normalize();
        const newPosition = direction.multiplyScalar(cameraDistance);
        camera.position.copy(newPosition);
      }

      controls.target.set(0, 0, 0);
      controls.update();
    }
  }, [cameraDistance]);

  const updateMeshMaterialStatus = (
    mesh: THREE.Mesh,
    originalMat: THREE.Material | THREE.Material[],
    status: string
  ) => {
    if (Array.isArray(originalMat)) {
      mesh.material = originalMat.map((m) => m.clone());
    } else {
      mesh.material = originalMat.clone();
    }

    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    materials.forEach((mat, idx) => {
      const origMat = Array.isArray(originalMat) ? originalMat[idx] : originalMat;
      const stdMat = mat as THREE.MeshStandardMaterial;
      const origStdMat = origMat as THREE.MeshStandardMaterial;

      if (status === 'heating') {
        stdMat.color.setHex(0xff0000);
        stdMat.emissive = new THREE.Color(0xff0000);
        stdMat.emissiveIntensity = 0.8;
      } else if (status === 'heating-system') {
        stdMat.emissive = new THREE.Color(0xff0000);
        stdMat.emissiveIntensity = 0.5;
        stdMat.color.lerp(new THREE.Color(0xff6666), 0.3);
      } else if (status === 'fault') {
        stdMat.emissive = new THREE.Color(0x0000ff);
        stdMat.emissiveIntensity = 0.4;
        stdMat.color.lerp(new THREE.Color(0x0000aa), 0.5);
      } else if (status === 'offline') {
        stdMat.emissive = new THREE.Color(0x000000);
        stdMat.emissiveIntensity = 0;
        stdMat.color.setHex(0x808080);
      } else {
        stdMat.emissive = new THREE.Color(0x000000);
        stdMat.emissiveIntensity = 0;
        if (origStdMat) stdMat.color.copy(origStdMat.color);
      }
      mat.needsUpdate = true;
    });
  };

  useEffect(() => {
    if (!systemData || meshesRef.current.length === 0) return;

    systemData.blades?.forEach((blade) => {
      const bladeNum = blade.bladeId.split('_')[1];
      const meshName = `radar_${bladeNum}`;
      const mesh = meshesRef.current.find((m) => m.name === meshName);
      if (!mesh) return;

      const originalMat = originalMaterialsRef.current.get(mesh);
      if (!originalMat) return;

      const heatingCommand = heatingCommandsRef.current.get(blade.bladeId);
      const isIndependentHeating = heatingCommand?.isHeating;

      let status = 'normal';
      if (blade.status === BLADE_STATUS.HEATING || isIndependentHeating) {
        status = isIndependentHeating ? 'heating' : 'heating-system';
      } else if (blade.status === BLADE_STATUS.FAULT) {
        status = 'fault';
      } else if (blade.status === BLADE_STATUS.OFFLINE) {
        status = 'offline';
      }

      updateMeshMaterialStatus(mesh, originalMat, status);
    });

    if (systemData.system) {
      const system = systemData.system;

      if (system.controlUnit) {
        const mesh = meshesRef.current.find((m) => m.name === 'control_unit');
        const originalMat = mesh && originalMaterialsRef.current.get(mesh);
        if (originalMat) {
          updateMeshMaterialStatus(mesh, originalMat, system.controlUnit.status === 'fault' ? 'fault' : 'normal');
        }
      }

      if (system.alarmDetector) {
        const mesh = meshesRef.current.find((m) => m.name === 'Rainwater_detection');
        const originalMat = mesh && originalMaterialsRef.current.get(mesh);
        if (originalMat) {
          updateMeshMaterialStatus(mesh, originalMat, system.alarmDetector.status === 'alarming' ? 'fault' : 'normal');
        }
      }

      const displacementFaultMesh = meshesRef.current.find((m) => m.name === 'radar_b');
      if (displacementFaultMesh) {
        const originalMat = originalMaterialsRef.current.get(displacementFaultMesh);
        if (originalMat) {
          const hasFault = system.displacementFault?.status === 'fault' || system.attitude?.status === 'fault';
          updateMeshMaterialStatus(displacementFaultMesh, originalMat, hasFault ? 'fault' : 'normal');
        }
      }

      if (system.highFrequencyFault) {
        const mesh = meshesRef.current.find((m) => m.name === 'High_frequency');
        const originalMat = mesh && originalMaterialsRef.current.get(mesh);
        if (originalMat) {
          updateMeshMaterialStatus(mesh, originalMat, system.highFrequencyFault.status === 'fault' ? 'fault' : 'normal');
        }
      }
    }
  }, [systemData, heatingCommands]);

  const handleSimulateData = async () => {
    const newData = await fetchSystemInfo();
    setSystemData(newData);
    setShowSystemInfo(true);
    setPanelInfo(null);
    setShowAttitudeInfo(false);
    setShowSatelliteInfo(false);

    if (cameraRef.current && controlsRef.current) {
      const hasBladeFault = newData.blades?.some((blade) => blade.status === 'fault');
      const hasControlUnitFault = newData.system?.controlUnit?.status === 'fault';
      const hasAttitudeFault = newData.system?.attitude?.status === 'fault';
      const hasHighFrequencyFault = newData.system?.highFrequencyFault?.status === 'fault';

      if (hasBladeFault || hasControlUnitFault || hasAttitudeFault || hasHighFrequencyFault) {
        const currentPos = cameraRef.current.position;
        const radius = Math.sqrt(currentPos.x * currentPos.x + currentPos.z * currentPos.z) || 5;
        const startAngle = Math.atan2(currentPos.x, currentPos.z);
        const endAngle = hasHighFrequencyFault ? 0 : Math.PI;
        const counterClockwise = !hasHighFrequencyFault;

        animateCameraArc(cameraRef.current, controlsRef.current, radius, startAngle, endAngle, counterClockwise);
      }
    }
  };

  const handleStartHeating = () => {
    const bladeId = panelInfo?.bladeData?.bladeId as string | undefined;
    if (!bladeId) {
      alert('无法启动加热：叶片数据不存在');
      return;
    }
    if (!systemData) {
      alert('无法启动加热：系统数据不存在');
      return;
    }

    const newCommands = new Map(heatingCommands);
    newCommands.set(bladeId, { isHeating: true, commandTime: new Date() });
    setHeatingCommands(newCommands);

    const updatedBlades = systemData.blades.map((blade) => {
      if (blade.bladeId === bladeId) {
        return {
          ...blade,
          status: 'heating' as const,
          heater: { ...blade.heater, power: 'on' as const, powerLevel: 100 }
        };
      }
      return blade;
    });
    const updatedSystemData = { ...systemData, blades: updatedBlades };
    setSystemData(updatedSystemData);

    const updatedBlade = updatedBlades.find((b) => b.bladeId === bladeId);
    if (updatedBlade && panelInfo) {
      const statusMap: Record<string, string> = { normal: '正常', heating: '加热中', fault: '故障', offline: '离线' };
      setPanelInfo({
        ...panelInfo,
        status: statusMap[updatedBlade.status] || updatedBlade.status,
        temperature:
          updatedBlade.temperature.current !== null ? `${updatedBlade.temperature.current.toFixed(1)}°C` : 'N/A',
        power: updatedBlade.heater.power === 'on' ? `${updatedBlade.heater.powerLevel}%` : '0%',
        bladeData: updatedBlade as unknown as Record<string, unknown>
      });
    }
  };

  const handleStopHeating = () => {
    const bladeId = panelInfo?.bladeData?.bladeId as string | undefined;
    if (!bladeId) {
      alert('无法停止加热：叶片数据不存在');
      return;
    }
    if (!systemData) {
      alert('无法停止加热：系统数据不存在');
      return;
    }

    const newCommands = new Map(heatingCommands);
    newCommands.set(bladeId, { isHeating: false, commandTime: new Date() });
    setHeatingCommands(newCommands);

    const updatedBlades = systemData.blades.map((blade) => {
      if (blade.bladeId === bladeId) {
        return {
          ...blade,
          status: 'normal' as const,
          heater: { ...blade.heater, power: 'off' as const, powerLevel: 0 }
        };
      }
      return blade;
    });
    const updatedSystemData = { ...systemData, blades: updatedBlades };
    setSystemData(updatedSystemData);

    const updatedBlade = updatedBlades.find((b) => b.bladeId === bladeId);
    if (updatedBlade && panelInfo) {
      const statusMap: Record<string, string> = { normal: '正常', heating: '加热中', fault: '故障', offline: '离线' };
      setPanelInfo({
        ...panelInfo,
        status: statusMap[updatedBlade.status] || updatedBlade.status,
        temperature:
          updatedBlade.temperature.current !== null ? `${updatedBlade.temperature.current.toFixed(1)}°C` : 'N/A',
        power: updatedBlade.heater.power === 'on' ? `${updatedBlade.heater.powerLevel}%` : '0%',
        bladeData: updatedBlade as unknown as Record<string, unknown>
      });
    }
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <ControlPanel
        backgroundColor={backgroundColor}
        setBackgroundColor={setBackgroundColor}
        baseColor={baseColor}
        setBaseColor={setBaseColor}
        brightness={brightness}
        setBrightness={setBrightness}
        cameraDistance={cameraDistance}
        setCameraDistance={setCameraDistance}
      />

      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />

      {systemData && systemData.system && showSystemInfo && (
        <div className="blade-info-panel">
          <div className="panel-header">
            <h3>系统信息</h3>
          </div>
          <div className="panel-content">
            <div className="info-section">
              <div className="section-title">环境信息</div>
              <div className="info-row">
                <span className="info-label">雨雪状态：</span>
                <span className="info-value">
                  {systemData.system.environment?.rainSnowStatus === 'rain'
                    ? '雨'
                    : systemData.system.environment?.rainSnowStatus === 'snow'
                      ? '雪'
                      : '晴'}
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">空气温度：</span>
                <span className="info-value">
                  {formatValue(systemData.system.environment?.airTemperature) !== '-'
                    ? `${formatValue(systemData.system.environment?.airTemperature)}°C`
                    : '-'}
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">锅面温度：</span>
                <span className="info-value">
                  {formatValue(systemData.system.environment?.dishTemperature) !== '-'
                    ? `${formatValue(systemData.system.environment?.dishTemperature)}°C`
                    : '-'}
                </span>
              </div>
            </div>

            <div className="info-section">
              <div className="section-title">继电器状态</div>
              <div className="info-row">
                <span className="info-label">报警继电器：</span>
                <span className="info-value relay-switch">
                  {systemData.system.relays?.alarmRelay?.status ? (
                    <>
                      <div
                        className={`relay-switch-container ${systemData.system.relays?.alarmRelay?.status === 'on' ? 'on' : 'off'}`}
                      >
                        <div className="relay-switch-slider" />
                      </div>
                      <span
                        style={{
                          marginLeft: '8px',
                          fontSize: '14px',
                          color:
                            systemData.system.relays?.alarmRelay?.status === 'on'
                              ? '#4caf50'
                              : 'rgba(255, 255, 255, 0.5)'
                        }}
                      >
                        {systemData.system.relays?.alarmRelay?.status === 'on' ? '开启' : '关闭'}
                      </span>
                    </>
                  ) : (
                    <span style={{ color: 'rgba(255, 255, 255, 0.5)' }}>-</span>
                  )}
                </span>
              </div>
              {systemData.system.relays?.heatingRelays?.map((relay, index) => (
                <div key={index} className="info-row">
                  <span className="info-label">加热继电器{index + 1}：</span>
                  <span className="info-value relay-switch">
                    {relay.status ? (
                      <>
                        <div className={`relay-switch-container ${relay.status === 'on' ? 'on' : 'off'}`}>
                          <div className="relay-switch-slider" />
                        </div>
                        <span
                          style={{
                            marginLeft: '8px',
                            fontSize: '14px',
                            color: relay.status === 'on' ? '#4caf50' : 'rgba(255, 255, 255, 0.5)'
                          }}
                        >
                          {relay.status === 'on' ? '开启' : '关闭'}
                        </span>
                      </>
                    ) : (
                      <span style={{ color: 'rgba(255, 255, 255, 0.5)' }}>-</span>
                    )}
                  </span>
                </div>
              ))}
            </div>

            <div className="info-section">
              <div className="section-title">主控盒状态</div>
              <div className="info-row">
                <span className="info-label">状态：</span>
                <span
                  className={`info-value ${systemData.system.controlUnit?.status === 'fault' ? 'status-故障' : 'status-正常'}`}
                >
                  {systemData.system.controlUnit?.status
                    ? systemData.system.controlUnit?.status === 'fault'
                      ? '故障'
                      : '正常'
                    : '-'}
                </span>
              </div>
              {systemData.system.controlUnit?.status === 'fault' && systemData.system.controlUnit?.faultType && (
                <div className="info-row">
                  <span className="info-label">故障类型：</span>
                  <span className="info-value fault-code">
                    {systemData.system.controlUnit.faultType === 'circuit_error' ? '内部电路异常' : '通信中断'}
                  </span>
                </div>
              )}
            </div>

            <div className="info-section">
              <div className="section-title">报警器状态</div>
              <div className="info-row">
                <span className="info-label">状态：</span>
                <span
                  className={`info-value ${systemData.system.alarmDetector?.status === 'alarming' ? 'status-故障' : 'status-正常'}`}
                >
                  {systemData.system.alarmDetector?.status
                    ? systemData.system.alarmDetector?.status === 'alarming'
                      ? '报警'
                      : '正常'
                    : '-'}
                </span>
              </div>
              {systemData.system.alarmDetector?.status === 'alarming' && systemData.system.alarmDetector?.alarmType && (
                <div className="info-row">
                  <span className="info-label">报警类型：</span>
                  <span className="info-value fault-code">
                    {systemData.system.alarmDetector.alarmType === 'rain_snow'
                      ? '雨雪传感器报警'
                      : systemData.system.alarmDetector.alarmType === 'fault'
                        ? '故障报警'
                        : '其他报警'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {panelInfo && !showSystemInfo && (
        <div className="blade-info-panel">
          <div className="panel-header">
            <h3>叶片信息</h3>
            <button
              className="close-btn"
              onClick={() => {
                setPanelInfo(null);
                setShowSystemInfo(true);
                setShowAttitudeInfo(false);
                setShowSatelliteInfo(false);
              }}
            >
              ×
            </button>
          </div>
          <div className="panel-content">
            <div className="info-row">
              <span className="info-label">叶片ID/编号：</span>
              <span className="info-value">
                {formatValue(panelInfo.id)} /{' '}
                {panelInfo.number !== null && panelInfo.number !== undefined
                  ? String(panelInfo.number).padStart(2, '0')
                  : '-'}
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">当前状态：</span>
              <span className={`info-value status-${panelInfo.status}`}>{formatValue(panelInfo.status)}</span>
            </div>
            <div className="info-row">
              <span className="info-label">当前温度：</span>
              <span className="info-value">{formatValue(panelInfo.temperature)}</span>
            </div>
            <div className="info-row">
              <span className="info-label">加热功率：</span>
              <span className="info-value">{formatValue(panelInfo.power)}</span>
            </div>
            {panelInfo.faultCode && (
              <>
                <div className="info-row">
                  <span className="info-label">故障代码：</span>
                  <span className="info-value fault-code">{formatValue(panelInfo.faultCode)}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">故障描述：</span>
                  <span className="info-value fault-desc">{formatValue(panelInfo.faultDesc)}</span>
                </div>
              </>
            )}

            <div
              className="info-section"
              style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}
            >
              <div className="section-title">独立加热控制</div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                <button
                  onClick={handleStartHeating}
                  style={{
                    flex: 1,
                    padding: '8px 16px',
                    background: '#4caf50',
                    border: 'none',
                    borderRadius: '4px',
                    color: '#ffffff',
                    fontSize: '14px',
                    cursor: 'pointer',
                    fontWeight: 500,
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => ((e.target as HTMLButtonElement).style.background = '#45a049')}
                  onMouseLeave={(e) => ((e.target as HTMLButtonElement).style.background = '#4caf50')}
                >
                  启动加热
                </button>
                <button
                  onClick={handleStopHeating}
                  style={{
                    flex: 1,
                    padding: '8px 16px',
                    background: '#f44336',
                    border: 'none',
                    borderRadius: '4px',
                    color: '#ffffff',
                    fontSize: '14px',
                    cursor: 'pointer',
                    fontWeight: 500,
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => ((e.target as HTMLButtonElement).style.background = '#da190b')}
                  onMouseLeave={(e) => ((e.target as HTMLButtonElement).style.background = '#f44336')}
                >
                  停止加热
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAttitudeInfo && systemData && systemData.system && (
        <div className="blade-info-panel">
          <div className="panel-header">
            <h3>姿态信息</h3>
            <button
              className="close-btn"
              onClick={() => {
                setShowAttitudeInfo(false);
                setShowSystemInfo(true);
                setShowSatelliteInfo(false);
              }}
            >
              ×
            </button>
          </div>
          <div className="panel-content">
            <div className="info-section">
              <div className="section-title">姿态信息</div>
              <div className="info-row">
                <span className="info-label">翻转角偏移(Roll)：</span>
                <span
                  className={`info-value ${systemData.system.attitude?.status === 'fault' && Math.abs(systemData.system.attitude?.roll) > systemData.system.attitude?.rollThreshold ? 'status-故障' : ''}`}
                >
                  {formatValue(systemData.system.attitude?.roll) !== '-'
                    ? `${formatValue(systemData.system.attitude?.roll)}°`
                    : '-'}
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">仰角偏移(Pitch)：</span>
                <span
                  className={`info-value ${systemData.system.attitude?.status === 'fault' && Math.abs(systemData.system.attitude?.pitch) > systemData.system.attitude?.pitchThreshold ? 'status-故障' : ''}`}
                >
                  {formatValue(systemData.system.attitude?.pitch) !== '-'
                    ? `${formatValue(systemData.system.attitude?.pitch)}°`
                    : '-'}
                </span>
              </div>
              {systemData.system.attitude?.status === 'fault' && (
                <div
                  className="info-row"
                  style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}
                >
                  <div
                    style={{
                      padding: '12px',
                      background: 'rgba(255, 0, 0, 0.1)',
                      borderRadius: '4px',
                      border: '1px solid rgba(255, 0, 0, 0.3)'
                    }}
                  >
                    <div
                      style={{
                        fontSize: '13px',
                        color: '#ff6b6b',
                        fontWeight: 500,
                        marginBottom: '8px'
                      }}
                    >
                      状态：故障
                    </div>
                    <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.9)', lineHeight: 1.6 }}>
                      <div style={{ marginBottom: '8px' }}>如需恢复正常，请按以下方向调整：</div>
                      {(systemData.system.attitude?.recoveryHint?.rollValue > 0 ||
                        systemData.system.attitude?.recoveryHint?.pitchValue > 0) && (
                        <div>
                          {systemData.system.attitude?.recoveryHint?.rollValue > 0 && (
                            <div style={{ marginBottom: '6px' }}>
                              <span style={{ fontSize: '14px', marginRight: '4px' }}>
                                {systemData.system.attitude?.recoveryHint?.rollDirection === 'left' ? '←' : '→'}
                              </span>
                              向
                              {systemData.system.attitude?.recoveryHint?.rollDirection === 'left' ? '左' : '右'}偏移{' '}
                              {systemData.system.attitude?.recoveryHint?.rollValue}°
                            </div>
                          )}
                          {systemData.system.attitude?.recoveryHint?.pitchValue > 0 && (
                            <div>
                              <span style={{ fontSize: '14px', marginRight: '4px' }}>
                                {systemData.system.attitude?.recoveryHint?.pitchDirection === 'up' ? '↑' : '↓'}
                              </span>
                              向
                              {systemData.system.attitude?.recoveryHint?.pitchDirection === 'up' ? '上' : '下'}偏移{' '}
                              {systemData.system.attitude?.recoveryHint?.pitchValue}°
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showSatelliteInfo && systemData && systemData.system && (
        <div className="blade-info-panel">
          <div className="panel-header">
            <h3>卫星信号及状态</h3>
            <button
              className="close-btn"
              onClick={() => {
                setShowSatelliteInfo(false);
                setShowSystemInfo(true);
              }}
            >
              ×
            </button>
          </div>
          <div className="panel-content">
            <div className="info-section">
              <div className="section-title">卫星信号</div>
              <div className="info-row">
                <span className="info-label">信号强度：</span>
                <span className="info-value">
                  {formatValue(systemData.system.satelliteSignal?.signalStrength) !== '-'
                    ? `${formatValue(systemData.system.satelliteSignal?.signalStrength)}%`
                    : '-'}
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">信号质量：</span>
                <span className="info-value">
                  {formatValue(systemData.system.satelliteSignal?.signalQuality) !== '-'
                    ? `${formatValue(systemData.system.satelliteSignal?.signalQuality)}%`
                    : '-'}
                </span>
              </div>
            </div>

            <div className="info-section">
              <div className="section-title">当前状态：</div>
              <div className="info-row">
                <span className="info-label">是否故障：</span>
                <span
                  className={`info-value ${systemData.system.highFrequencyFault?.status === 'fault' ? 'status-故障' : 'status-正常'}`}
                >
                  {systemData.system.highFrequencyFault?.status
                    ? systemData.system.highFrequencyFault?.status === 'fault'
                      ? '是'
                      : '否'
                    : '-'}
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">故障描述：</span>
                <span className="info-value">{formatValue(systemData.system.highFrequencyFault?.faultDesc)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThreeScene;
