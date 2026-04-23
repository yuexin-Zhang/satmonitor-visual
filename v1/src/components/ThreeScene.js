import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { PMREMGenerator } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import radarModel from '../img/radar.glb';
import { BLADE_STATUS } from '../constants';
import { generateSystemData, fetchSystemInfo } from '../utils/dataGenerator';
import { formatValue, animateCameraArc } from '../utils/helpers';
import ControlPanel from './ControlPanel';
import './ThreeScene.css';

const ThreeScene = () => {
  const mountRef = useRef(null);
  const [panelInfo, setPanelInfo] = useState(null);
  const [systemData, setSystemData] = useState(null);
  const [showSystemInfo, setShowSystemInfo] = useState(false);
  const [showAttitudeInfo, setShowAttitudeInfo] = useState(false);
  const [showSatelliteInfo, setShowSatelliteInfo] = useState(false);
  const [heatingCommands, setHeatingCommands] = useState(new Map());
  const [backgroundColor, setBackgroundColor] = useState('#001a33');
  const [baseColor, setBaseColor] = useState('#001a33');
  const [brightness, setBrightness] = useState(2.0);
  const [cameraDistance, setCameraDistance] = useState(2.5);

  const heatingCommandsRef = useRef(new Map());
  const meshesRef = useRef([]);
  const originalMaterialsRef = useRef(new Map());
  const systemDataRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const sceneRef = useRef(null);
  const planeRef = useRef(null);
  const rendererRef = useRef(null);
  const animationFrameRef = useRef(null);

  // 组件加载时自动从API获取数据
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const data = await fetchSystemInfo();
        setSystemData(data);
        setShowSystemInfo(false); // 初始状态不显示弹窗
        console.log('初始系统数据已加载:', data);
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
        console.log('系统数据已更新:', data);
      } catch (error) {
        console.error('更新系统数据失败:', error);
      }
    }, 5000); // 每5秒更新一次

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(backgroundColor);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 5);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.LinearToneMapping;
    renderer.toneMappingExposure = brightness;
    rendererRef.current = renderer;
    
    // Three.js r152+ 使用 outputColorSpace，旧版本使用 outputEncoding，需兼容处理
    if (renderer.outputColorSpace !== undefined) {
      renderer.outputColorSpace = THREE.SRGBColorSpace;
    } else {
      renderer.outputEncoding = THREE.sRGBEncoding;
    }
    
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountRef.current.appendChild(renderer.domElement);

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
    
    const meshes = [];
    const originalMaterials = new Map();
    meshesRef.current = meshes;
    originalMaterialsRef.current = originalMaterials;
    
    let onMouseClick = null;

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
      radarModel,
      (gltf) => {
        const model = gltf.scene;
        scene.add(model);

        model.traverse((child) => {
          if (child.isMesh) {
            meshes.push(child);
            child.castShadow = true;
            child.receiveShadow = true;
            
            const materials = Array.isArray(child.material) ? child.material : [child.material];
            materials.forEach((mat) => {
              mat.needsUpdate = true;
              mat.visible = true;
              
              // 检测未正确加载的材质（无贴图且颜色为纯黑），设置默认灰色避免不可见
              if (!mat.map && mat.color.r === 0 && mat.color.g === 0 && mat.color.b === 0) {
                mat.color.setHex(0x808080);
              }
              
              if (!mat.transparent) {
                mat.opacity = 1.0;
              }
              
              if (mat.map) {
                if (mat.map.colorSpace !== undefined) {
                  mat.map.colorSpace = THREE.SRGBColorSpace;
                } else {
                  mat.map.encoding = THREE.sRGBEncoding;
                }
                mat.map.needsUpdate = true;
              }
              
              if (mat.normalMap) mat.normalMap.needsUpdate = true;
              
              if (mat.roughnessMap) {
                if (mat.roughnessMap.colorSpace !== undefined) {
                  mat.roughnessMap.colorSpace = THREE.LinearSRGBColorSpace;
                } else {
                  mat.roughnessMap.encoding = THREE.LinearEncoding;
                }
                mat.roughnessMap.needsUpdate = true;
              }
              
              if (mat.metalnessMap) {
                if (mat.metalnessMap.colorSpace !== undefined) {
                  mat.metalnessMap.colorSpace = THREE.LinearSRGBColorSpace;
                } else {
                  mat.metalnessMap.encoding = THREE.LinearEncoding;
                }
                mat.metalnessMap.needsUpdate = true;
              }
              
              if (mat.emissiveMap) {
                if (mat.emissiveMap.colorSpace !== undefined) {
                  mat.emissiveMap.colorSpace = THREE.SRGBColorSpace;
                } else {
                  mat.emissiveMap.encoding = THREE.sRGBEncoding;
                }
                mat.emissiveMap.needsUpdate = true;
              }
              
              if (mat.isMeshStandardMaterial || mat.isMeshPhysicalMaterial) {
                if (mat.metalness === undefined) mat.metalness = 0.5;
                if (mat.roughness === undefined) mat.roughness = 0.5;
                mat.envMapIntensity = mat.envMapIntensity || 1.0;
              }
            });
            
            if (Array.isArray(child.material)) {
              originalMaterials.set(child, child.material.map(mat => mat.clone()));
            } else {
              originalMaterials.set(child, child.material.clone());
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
        const initialDistance = 2.5;
        camera.position.z = initialDistance;
        controls.target.set(0, 0, 0);
        controls.update();
        setCameraDistance(initialDistance);

        /**
         * 根据组件状态设置材质视觉效果
         * @param {THREE.Material} mat - 待更新的材质对象
         * @param {string} status - 状态类型：'heating'(独立加热-正红)、'heating-system'(系统加热-淡红)、'fault'(故障-蓝色)、'offline'(离线-灰色)、'normal'(正常-原色)
         * @param {THREE.Material} originalMat - 原始材质，用于恢复正常状态时的颜色
         */
        const setMaterialStatus = (mat, status, originalMat = null) => {
          mat.needsUpdate = true;
          
          switch (status) {
            case 'heating':
              mat.color.setHex(0xff0000);
              mat.emissive = new THREE.Color(0xff0000);
              mat.emissiveIntensity = 0.8;
              break;
            case 'heating-system':
              mat.emissive = new THREE.Color(0xff0000);
              mat.emissiveIntensity = 0.5;
              const redTint = new THREE.Color(0xff6666);
              mat.color.lerp(redTint, 0.3);
              break;
            case 'fault':
              mat.emissive = new THREE.Color(0x0000ff);
              mat.emissiveIntensity = 0.4;
              const blueTint = new THREE.Color(0x0000aa);
              mat.color.lerp(blueTint, 0.5);
              break;
            case 'offline':
              mat.emissive = new THREE.Color(0x000000);
              mat.emissiveIntensity = 0;
              mat.color.setHex(0x808080);
              break;
            case 'normal':
            default:
              mat.emissive = new THREE.Color(0x000000);
              mat.emissiveIntensity = 0;
              if (originalMat) {
                mat.color.copy(originalMat.color);
              }
              break;
          }
        };

        /**
         * 从缓存恢复mesh的原始材质（克隆避免修改缓存引用）
         */
        const restoreOriginalMaterial = (mesh, originalMat) => {
          if (Array.isArray(originalMat)) {
            mesh.material = originalMat.map(mat => mat.clone());
          } else {
            mesh.material = originalMat.clone();
          }
        };

        /**
         * 查找所有匹配名称的mesh，包括层级结构中的子mesh
         * 用于处理具有层级结构的组件（如 radar_b 及其子组件）
         */
        const findMeshesByName = (name) => {
          const foundMeshes = [];
          meshes.forEach(mesh => {
            if (mesh.name === name) {
              foundMeshes.push(mesh);
            } else {
              let parent = mesh.parent;
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

        /**
         * 高亮mesh，使用淡黄色发光效果
         * 如果mesh已有状态颜色（如加热的红色、故障的蓝色），则混合黄色以保持状态可见性
         */
        const highlightMesh = (mesh) => {
          const yellowHighlight = new THREE.Color(0xffffaa);
          const highlightMaterial = (mat) => {
            const highlightedMat = mat.clone();
            const currentEmissive = highlightedMat.emissive.clone();
            // 检测是否已有状态颜色（非黑色且发光强度>0）
            const hasEmissiveColor = currentEmissive.r > 0.01 || currentEmissive.g > 0.01 || currentEmissive.b > 0.01;
            
            if (hasEmissiveColor && highlightedMat.emissiveIntensity > 0) {
              // 混合黄色与现有状态颜色，保持状态可见
              currentEmissive.lerp(yellowHighlight, 0.5);
              highlightedMat.emissive = currentEmissive;
              highlightedMat.emissiveIntensity += 0.4;
            } else {
              // 无状态颜色时直接使用黄色高亮
              highlightedMat.emissive = yellowHighlight;
              highlightedMat.emissiveIntensity = 0.6;
            }
            
            highlightedMat.needsUpdate = true;
            return highlightedMat;
          };
          
          if (Array.isArray(mesh.material)) {
            mesh.material = mesh.material.map(highlightMaterial);
          } else {
            mesh.material = highlightMaterial(mesh.material);
          }
        };

        const generateBladeInfo = (meshName) => {
          const match = meshName.match(/radar_(\d+)/);
          if (!match) return null;
          const id = parseInt(match[1], 10);
          const bladeId = `BLADE_0${id}`;
          const currentSystemData = systemDataRef.current;
          
          if (currentSystemData?.blades) {
            const blade = currentSystemData.blades.find(b => b.bladeId === bladeId);
            if (blade) {
              const statusMap = {
                'normal': '正常',
                'heating': '加热中',
                'fault': '故障',
                'offline': '离线'
              };
              
              return {
                id,
                number: id,
                status: statusMap[blade.status] || blade.status,
                temperature: blade.temperature.current !== null 
                  ? `${blade.temperature.current.toFixed(1)}°C` 
                  : 'N/A',
                power: blade.heater.power === 'on' ? `${blade.heater.powerLevel}%` : '0%',
                faultCode: blade.faultInfo?.faultType || null,
                faultDesc: blade.faultInfo?.description || null,
                bladeData: blade
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

        /**
         * 恢复所有mesh到基础状态，然后根据系统数据应用状态颜色
         * 处理叶片、主控盒、报警器、位移/姿态故障、高频头等组件的状态可视化
         */
        const restoreAllMeshes = () => {
          const currentSystemData = systemDataRef.current;
          
          meshes.forEach(mesh => {
            const originalMat = originalMaterials.get(mesh);
            if (!originalMat) return;
            
            restoreOriginalMaterial(mesh, originalMat);
            const meshName = mesh.name;
            const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            
            // 叶片状态处理（radar_01 ~ radar_06，排除 radar_b）
            if (meshName.startsWith('radar_') && meshName !== 'radar_b') {
              const match = meshName.match(/radar_(\d+)/);
              if (match && currentSystemData?.blades) {
                const bladeId = `BLADE_${match[1]}`;
                const blade = currentSystemData.blades.find(b => b.bladeId === bladeId);
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
            
            // 处理其他组件状态
            if (!currentSystemData?.system) return;
            
            const system = currentSystemData.system;
            materials.forEach((mat, idx) => {
              const origMat = Array.isArray(originalMat) ? originalMat[idx] : originalMat;
              
              if (meshName === 'control_unit' && system.controlUnit) {
                setMaterialStatus(mat, system.controlUnit.status === 'fault' ? 'fault' : 'normal', origMat);
              } else if (meshName === 'Rainwater_detection' && system.alarmDetector) {
                setMaterialStatus(mat, system.alarmDetector.status === 'alarming' ? 'fault' : 'normal', origMat);
              } else if (meshName === 'radar_b') {
                const hasFault = (system.displacementFault?.status === 'fault') || 
                                (system.attitude?.status === 'fault');
                setMaterialStatus(mat, hasFault ? 'fault' : 'normal', origMat);
              } else if (meshName === 'High_frequency' && system.highFrequencyFault) {
                setMaterialStatus(mat, system.highFrequencyFault.status === 'fault' ? 'fault' : 'normal', origMat);
              }
            });
          });
        };

        /**
         * 鼠标点击事件处理
         * 根据点击的mesh类型显示对应的信息面板，并高亮选中的组件
         */
        onMouseClick = (event) => {
          // 归一化鼠标坐标到NDC空间（-1到1）
          mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
          mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

          raycaster.setFromCamera(mouse, camera);
          const intersects = raycaster.intersectObjects(meshes, true);

          if (intersects.length > 0) {
            const clickedMesh = intersects[0].object;
            const meshName = clickedMesh.name || '(未命名)';

            // 识别mesh类型以决定显示哪个信息面板
            const isBlade = meshName.startsWith('radar_') && meshName !== 'radar_b';
            const isDisplacementFault = findMeshesByName('radar_b').some(m => m === clickedMesh);
            const isHighFrequency = findMeshesByName('High_frequency').some(m => m === clickedMesh);
            
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
              const radarBMeshes = findMeshesByName('radar_b');
              radarBMeshes.forEach(mesh => highlightMesh(mesh));
              
              setPanelInfo(null);
              setShowSystemInfo(false);
              setShowAttitudeInfo(true);
              setShowSatelliteInfo(false);
            } else if (isHighFrequency) {
              restoreAllMeshes();
              const highFrequencyMeshes = findMeshesByName('High_frequency');
              highFrequencyMeshes.forEach(mesh => highlightMesh(mesh));
              
              setPanelInfo(null);
              setShowSystemInfo(false);
              setShowAttitudeInfo(false);
              setShowSatelliteInfo(true);
            } else {
              // 点击其他组件，显示系统总览
              restoreAllMeshes();
              setPanelInfo(null);
              setShowSystemInfo(true);
              setShowAttitudeInfo(false);
              setShowSatelliteInfo(false);
            }
          } else {
            // 点击空白处，切换系统总览的显示/隐藏状态
            restoreAllMeshes();
            setPanelInfo(null);
            setShowSystemInfo(prev => !prev);
            setShowAttitudeInfo(false);
            setShowSatelliteInfo(false);
          }
        };

        renderer.domElement.addEventListener('click', onMouseClick);
      },
    );

    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      controls.update(); // 应用阻尼效果
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // 全局鼠标右键点击事件处理
    const handleRightClick = (event) => {
      // 阻止默认右键菜单
      event.preventDefault();
      
      // 检查点击是否在面板外部
      const target = event.target;
      const isInPanel = target.closest('.blade-info-panel') || target.closest('.system-info-panel');
      
      if (!isInPanel) {
        // 切换系统信息面板的显示状态
        setShowSystemInfo(prev => !prev);
        // 隐藏其他面板
        setPanelInfo(null);
        setShowAttitudeInfo(false);
        setShowSatelliteInfo(false);
      }
    };

    // 添加全局右键点击事件监听器
    window.addEventListener('contextmenu', handleRightClick);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (onMouseClick && renderer.domElement) {
        renderer.domElement.removeEventListener('click', onMouseClick);
      }
      // 移除全局右键点击事件监听器
      window.removeEventListener('contextmenu', handleRightClick);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      controls.dispose();
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // 同步state到ref，供非React回调使用（如Three.js事件处理）
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
    if (planeRef.current && planeRef.current.material) {
      planeRef.current.material.color.set(baseColor);
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
      
      // 距离为0时使用默认方向，否则保持当前视角方向仅调整距离
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

  /**
   * 更新mesh材质视觉状态
   * @param {THREE.Mesh} mesh - 待更新的mesh对象
   * @param {THREE.Material|THREE.Material[]} originalMat - 原始材质，用于恢复
   * @param {string} status - 状态：'heating'|'heating-system'|'fault'|'offline'|'normal'
   */
  const updateMeshMaterialStatus = (mesh, originalMat, status) => {
    if (Array.isArray(originalMat)) {
      mesh.material = originalMat.map(mat => mat.clone());
    } else {
      mesh.material = originalMat.clone();
    }
    
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    materials.forEach((mat, idx) => {
      const origMat = Array.isArray(originalMat) ? originalMat[idx] : originalMat;
      
      if (status === 'heating') {
        mat.color.setHex(0xff0000);
        mat.emissive = new THREE.Color(0xff0000);
        mat.emissiveIntensity = 0.8;
      } else if (status === 'heating-system') {
        mat.emissive = new THREE.Color(0xff0000);
        mat.emissiveIntensity = 0.5;
        const redTint = new THREE.Color(0xff6666);
        mat.color.lerp(redTint, 0.3);
      } else if (status === 'fault') {
        mat.emissive = new THREE.Color(0x0000ff);
        mat.emissiveIntensity = 0.4;
        const blueTint = new THREE.Color(0x0000aa);
        mat.color.lerp(blueTint, 0.5);
      } else if (status === 'offline') {
        mat.emissive = new THREE.Color(0x000000);
        mat.emissiveIntensity = 0;
        mat.color.setHex(0x808080);
      } else {
        mat.emissive = new THREE.Color(0x000000);
        mat.emissiveIntensity = 0;
        if (origMat) mat.color.copy(origMat.color);
      }
      mat.needsUpdate = true;
    });
  };

  /**
   * 根据系统数据同步更新所有组件的材质视觉状态
   * 包括叶片、主控盒、报警器、位移/姿态故障、高频头等
   */
  useEffect(() => {
    if (!systemData || meshesRef.current.length === 0) return;

    systemData.blades?.forEach((blade) => {
      const bladeNum = blade.bladeId.split('_')[1];
      const meshName = `radar_${bladeNum}`;
      const mesh = meshesRef.current.find(m => m.name === meshName);
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
        const mesh = meshesRef.current.find(m => m.name === 'control_unit');
        const originalMat = mesh && originalMaterialsRef.current.get(mesh);
        if (originalMat) {
          updateMeshMaterialStatus(mesh, originalMat, system.controlUnit.status === 'fault' ? 'fault' : 'normal');
        }
        }
        
        if (system.alarmDetector) {
          const mesh = meshesRef.current.find(m => m.name === 'Rainwater_detection');
          const originalMat = mesh && originalMaterialsRef.current.get(mesh);
          if (originalMat) {
            updateMeshMaterialStatus(mesh, originalMat, system.alarmDetector.status === 'alarming' ? 'fault' : 'normal');
          }
        }
        
        // radar_b 同时表示位移故障和姿态故障
        const displacementFaultMesh = meshesRef.current.find(m => m.name === 'radar_b');
        if (displacementFaultMesh) {
          const originalMat = originalMaterialsRef.current.get(displacementFaultMesh);
          if (originalMat) {
            const hasFault = (system.displacementFault?.status === 'fault') || 
                            (system.attitude?.status === 'fault');
            updateMeshMaterialStatus(displacementFaultMesh, originalMat, hasFault ? 'fault' : 'normal');
          }
        }
        
        if (system.highFrequencyFault) {
        const mesh = meshesRef.current.find(m => m.name === 'High_frequency');
        const originalMat = mesh && originalMaterialsRef.current.get(mesh);
        if (originalMat) {
          updateMeshMaterialStatus(mesh, originalMat, system.highFrequencyFault.status === 'fault' ? 'fault' : 'normal');
        }
      }
    }
  }, [systemData, heatingCommands]);

  /**
   * 从API获取系统数据更新
   * 检测故障并自动旋转相机到故障位置（背面故障逆时针，高频头故障顺时针）
   */
  const handleSimulateData = async () => {
    const newData = await fetchSystemInfo();
    setSystemData(newData);
    setShowSystemInfo(true);
    setPanelInfo(null);
    setShowAttitudeInfo(false);
    setShowSatelliteInfo(false);
    console.log('系统数据已更新:', newData);
    
    if (cameraRef.current && controlsRef.current) {
      const hasBladeFault = newData.blades?.some(blade => blade.status === 'fault');
      const hasControlUnitFault = newData.system?.controlUnit?.status === 'fault';
      const hasAttitudeFault = newData.system?.attitude?.status === 'fault';
      const hasHighFrequencyFault = newData.system?.highFrequencyFault?.status === 'fault';
      
      if (hasBladeFault || hasControlUnitFault || hasAttitudeFault || hasHighFrequencyFault) {
        const currentPos = cameraRef.current.position;
        const radius = Math.sqrt(currentPos.x * currentPos.x + currentPos.z * currentPos.z) || 5;
        const startAngle = Math.atan2(currentPos.x, currentPos.z);
        // 高频头在正面（0度），其他故障在背面（π）
        const endAngle = hasHighFrequencyFault ? 0 : Math.PI;
        const counterClockwise = !hasHighFrequencyFault;
        
        animateCameraArc(cameraRef.current, controlsRef.current, radius, startAngle, endAngle, counterClockwise);
      }
    }
  };
  
  /**
   * 沿圆弧路径平滑旋转相机（在XOZ平面）
   * @param {THREE.PerspectiveCamera} camera - 相机对象
   * @param {OrbitControls} controls - 控制器对象
   * @param {number} radius - 圆弧半径
   * @param {number} startAngle - 起始角度（弧度）
   * @param {number} endAngle - 结束角度（弧度）
   * @param {boolean} counterClockwise - 是否逆时针旋转
   * @param {number} duration - 动画时长（毫秒）
   */
  const animateCameraArc = (camera, controls, radius, startAngle, endAngle, counterClockwise = true, duration = 1500) => {
    const startTime = Date.now();
    const targetLookAt = new THREE.Vector3(0, 0, 0);
    
    const normalizeAngle = (angle) => {
      while (angle < 0) angle += 2 * Math.PI;
      while (angle >= 2 * Math.PI) angle -= 2 * Math.PI;
      return angle;
    };
    
    const normalizedStart = normalizeAngle(startAngle);
    const normalizedEnd = normalizeAngle(endAngle);
    
    // 根据旋转方向计算角度差（确保走最短路径）
    let angleDiff = normalizedEnd - normalizedStart;
    if (counterClockwise) {
      if (angleDiff < 0) angleDiff += 2 * Math.PI;
    } else {
      if (angleDiff > 0) angleDiff -= 2 * Math.PI;
    }
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // easeInOutCubic 缓动函数，提供平滑的加速和减速
      const easeProgress = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      
      const currentAngle = normalizedStart + angleDiff * easeProgress;
      
      // 在XOZ平面计算位置，保持Y坐标不变
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
                  {systemData.system.environment?.rainSnowStatus === 'rain' ? '雨' : 
                   systemData.system.environment?.rainSnowStatus === 'snow' ? '雪' : '晴'}
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">空气温度：</span>
                <span className="info-value">{formatValue(systemData.system.environment?.airTemperature) !== '-' ? `${formatValue(systemData.system.environment?.airTemperature)}°C` : '-'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">锅面温度：</span>
                <span className="info-value">{formatValue(systemData.system.environment?.dishTemperature) !== '-' ? `${formatValue(systemData.system.environment?.dishTemperature)}°C` : '-'}</span>
              </div>
            </div>

            <div className="info-section">
              <div className="section-title">继电器状态</div>
              <div className="info-row">
                <span className="info-label">报警继电器：</span>
                <span className="info-value relay-switch">
                  {systemData.system.relays?.alarmRelay?.status ? (
                    <>
                      <div className={`relay-switch-container ${systemData.system.relays?.alarmRelay?.status === 'on' ? 'on' : 'off'}`}>
                        <div className="relay-switch-slider"></div>
                      </div>
                      <span style={{ 
                        marginLeft: '8px', 
                        fontSize: '14px',
                        color: systemData.system.relays?.alarmRelay?.status === 'on' ? '#4caf50' : 'rgba(255, 255, 255, 0.5)'
                      }}>
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
                          <div className="relay-switch-slider"></div>
                        </div>
                        <span style={{ 
                          marginLeft: '8px', 
                          fontSize: '14px',
                          color: relay.status === 'on' ? '#4caf50' : 'rgba(255, 255, 255, 0.5)'
                        }}>
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
                <span className={`info-value ${systemData.system.controlUnit?.status === 'fault' ? 'status-故障' : 'status-正常'}`}>
                  {systemData.system.controlUnit?.status ? (systemData.system.controlUnit?.status === 'fault' ? '故障' : '正常') : '-'}
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
                <span className={`info-value ${systemData.system.alarmDetector?.status === 'alarming' ? 'status-故障' : 'status-正常'}`}>
                  {systemData.system.alarmDetector?.status ? (systemData.system.alarmDetector?.status === 'alarming' ? '报警' : '正常') : '-'}
                </span>
              </div>
              {systemData.system.alarmDetector?.status === 'alarming' && systemData.system.alarmDetector?.alarmType && (
                <div className="info-row">
                  <span className="info-label">报警类型：</span>
                  <span className="info-value fault-code">
                    {systemData.system.alarmDetector.alarmType === 'rain_snow' ? '雨雪传感器报警' : 
                     systemData.system.alarmDetector.alarmType === 'fault' ? '故障报警' : '其他报警'}
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
            <button className="close-btn" onClick={() => {
              setPanelInfo(null);
              setShowSystemInfo(true);
              setShowAttitudeInfo(false);
              setShowSatelliteInfo(false);
            }}>×</button>
          </div>
          <div className="panel-content">
            <div className="info-row">
              <span className="info-label">叶片ID/编号：</span>
              <span className="info-value">{formatValue(panelInfo.id)} / {panelInfo.number !== null && panelInfo.number !== undefined ? String(panelInfo.number).padStart(2, '0') : '-'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">当前状态：</span>
              <span className={`info-value status-${panelInfo.status}`}>
                {formatValue(panelInfo.status)}
              </span>
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

            <div className="info-section" style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <div className="section-title">独立加热控制</div>
              
              <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                <button
                  onClick={() => {
                    const bladeId = panelInfo.bladeData?.bladeId;
                    if (!bladeId) {
                      console.warn('无法启动加热：bladeId 不存在', panelInfo);
                      alert('无法启动加热：叶片数据不存在，请先点击"模拟后端数据"按钮');
                      return;
                    }
                    
                    if (!systemData) {
                      console.warn('无法启动加热：systemData 不存在');
                      alert('无法启动加热：系统数据不存在，请先点击"模拟后端数据"按钮');
                      return;
                    }
                    
                    const newCommands = new Map(heatingCommands);
                    newCommands.set(bladeId, {
                      isHeating: true,
                      commandTime: new Date()
                    });
                    setHeatingCommands(newCommands);
                    
                    const updatedBlades = systemData.blades.map(blade => {
                      if (blade.bladeId === bladeId) {
                        return {
                          ...blade,
                          status: 'heating',
                          heater: {
                            ...blade.heater,
                            power: 'on',
                            powerLevel: 100
                          }
                        };
                      }
                      return blade;
                    });
                    const updatedSystemData = {
                      ...systemData,
                      blades: updatedBlades
                    };
                    setSystemData(updatedSystemData);
                    
                    const updatedBlade = updatedBlades.find(b => b.bladeId === bladeId);
                    if (updatedBlade && panelInfo) {
                      const statusMap = {
                        'normal': '正常',
                        'heating': '加热中',
                        'fault': '故障',
                        'offline': '离线'
                      };
                      setPanelInfo({
                        ...panelInfo,
                        status: statusMap[updatedBlade.status] || updatedBlade.status,
                        temperature: updatedBlade.temperature.current !== null 
                          ? `${updatedBlade.temperature.current.toFixed(1)}°C` 
                          : 'N/A',
                        power: updatedBlade.heater.power === 'on' ? `${updatedBlade.heater.powerLevel}%` : '0%',
                        bladeData: updatedBlade
                      });
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: '8px 16px',
                    background: '#4caf50',
                    border: 'none',
                    borderRadius: '4px',
                    color: '#ffffff',
                    fontSize: '14px',
                    cursor: 'pointer',
                    fontWeight: '500',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.background = '#45a049'}
                  onMouseLeave={(e) => e.target.style.background = '#4caf50'}
                >
                  启动加热
                </button>
                <button
                  onClick={() => {
                    const bladeId = panelInfo.bladeData?.bladeId;
                    if (!bladeId) {
                      console.warn('无法停止加热：bladeId 不存在', panelInfo);
                      alert('无法停止加热：叶片数据不存在，请先点击"模拟后端数据"按钮');
                      return;
                    }
                    
                    if (!systemData) {
                      console.warn('无法停止加热：systemData 不存在');
                      alert('无法停止加热：系统数据不存在，请先点击"模拟后端数据"按钮');
                      return;
                    }
                    
                    const newCommands = new Map(heatingCommands);
                    newCommands.set(bladeId, {
                      isHeating: false,
                      commandTime: new Date()
                    });
                    setHeatingCommands(newCommands);
                    
                    // 更新系统数据中的叶片状态
                    const updatedBlades = systemData.blades.map(blade => {
                      if (blade.bladeId === bladeId) {
                        return {
                          ...blade,
                          status: 'normal',
                          heater: {
                            ...blade.heater,
                            power: 'off',
                            powerLevel: 0
                          }
                        };
                      }
                      return blade;
                    });
                    const updatedSystemData = {
                      ...systemData,
                      blades: updatedBlades
                    };
                    setSystemData(updatedSystemData);
                    
                    const updatedBlade = updatedBlades.find(b => b.bladeId === bladeId);
                    if (updatedBlade && panelInfo) {
                      const statusMap = {
                        'normal': '正常',
                        'heating': '加热中',
                        'fault': '故障',
                        'offline': '离线'
                      };
                      setPanelInfo({
                        ...panelInfo,
                        status: statusMap[updatedBlade.status] || updatedBlade.status,
                        temperature: updatedBlade.temperature.current !== null 
                          ? `${updatedBlade.temperature.current.toFixed(1)}°C` 
                          : 'N/A',
                        power: updatedBlade.heater.power === 'on' ? `${updatedBlade.heater.powerLevel}%` : '0%',
                        bladeData: updatedBlade
                      });
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: '8px 16px',
                    background: '#f44336',
                    border: 'none',
                    borderRadius: '4px',
                    color: '#ffffff',
                    fontSize: '14px',
                    cursor: 'pointer',
                    fontWeight: '500',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.background = '#da190b'}
                  onMouseLeave={(e) => e.target.style.background = '#f44336'}
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
            <button className="close-btn" onClick={() => {
              setShowAttitudeInfo(false);
              setShowSystemInfo(true);
              setShowSatelliteInfo(false);
            }}>×</button>
          </div>
          <div className="panel-content">
            <div className="info-section">
              <div className="section-title">姿态信息</div>
              <div className="info-row">
                <span className="info-label">翻转角偏移(Roll)：</span>
                <span className={`info-value ${systemData.system.attitude?.status === 'fault' && Math.abs(systemData.system.attitude?.roll) > systemData.system.attitude?.rollThreshold ? 'status-故障' : ''}`}>
                  {formatValue(systemData.system.attitude?.roll) !== '-' ? `${formatValue(systemData.system.attitude?.roll)}°` : '-'}
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">仰角偏移(Pitch)：</span>
                <span className={`info-value ${systemData.system.attitude?.status === 'fault' && Math.abs(systemData.system.attitude?.pitch) > systemData.system.attitude?.pitchThreshold ? 'status-故障' : ''}`}>
                  {formatValue(systemData.system.attitude?.pitch) !== '-' ? `${formatValue(systemData.system.attitude?.pitch)}°` : '-'}
                </span>
              </div>
              {systemData.system.attitude?.status === 'fault' && (
                <div className="info-row" style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <div style={{ 
                    padding: '12px', 
                    background: 'rgba(255, 0, 0, 0.1)', 
                    borderRadius: '4px',
                    border: '1px solid rgba(255, 0, 0, 0.3)'
                  }}>
                    <div style={{ 
                      fontSize: '13px', 
                      color: '#ff6b6b', 
                      fontWeight: '500',
                      marginBottom: '8px'
                    }}>
                      状态：故障
                    </div>
                    <div style={{ 
                      fontSize: '12px', 
                      color: 'rgba(255, 255, 255, 0.9)',
                      lineHeight: '1.6'
                    }}>
                      <div style={{ marginBottom: '8px' }}>
                        如需恢复正常，请按以下方向调整：
                      </div>
                      {(systemData.system.attitude?.recoveryHint?.rollValue > 0 || systemData.system.attitude?.recoveryHint?.pitchValue > 0) && (
                        <div>
                          {systemData.system.attitude?.recoveryHint?.rollValue > 0 && (
                            <div style={{ marginBottom: '6px' }}>
                              <span style={{ fontSize: '14px', marginRight: '4px' }}>
                                {systemData.system.attitude?.recoveryHint?.rollDirection === 'left' ? '←' : '→'}
                              </span>
                              向{systemData.system.attitude?.recoveryHint?.rollDirection === 'left' ? '左' : '右'}偏移 {systemData.system.attitude?.recoveryHint?.rollValue}°
                            </div>
                          )}
                          {systemData.system.attitude?.recoveryHint?.pitchValue > 0 && (
                            <div>
                              <span style={{ fontSize: '14px', marginRight: '4px' }}>
                                {systemData.system.attitude?.recoveryHint?.pitchDirection === 'up' ? '↑' : '↓'}
                              </span>
                              向{systemData.system.attitude?.recoveryHint?.pitchDirection === 'up' ? '上' : '下'}偏移 {systemData.system.attitude?.recoveryHint?.pitchValue}°
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
            <button className="close-btn" onClick={() => {
              setShowSatelliteInfo(false);
              setShowSystemInfo(true);
            }}>×</button>
          </div>
          <div className="panel-content">
            <div className="info-section">
              <div className="section-title">卫星信号</div>
              <div className="info-row">
                <span className="info-label">信号强度：</span>
                <span className="info-value">{formatValue(systemData.system.satelliteSignal?.signalStrength) !== '-' ? `${formatValue(systemData.system.satelliteSignal?.signalStrength)}%` : '-'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">信号质量：</span>
                <span className="info-value">{formatValue(systemData.system.satelliteSignal?.signalQuality) !== '-' ? `${formatValue(systemData.system.satelliteSignal?.signalQuality)}%` : '-'}</span>
              </div>
            </div>

            <div className="info-section">
              <div className="section-title">当前状态：</div>
              <div className="info-row">
                <span className="info-label">是否故障：</span>
                <span className={`info-value ${systemData.system.highFrequencyFault?.status === 'fault' ? 'status-故障' : 'status-正常'}`}>
                  {systemData.system.highFrequencyFault?.status ? (systemData.system.highFrequencyFault?.status === 'fault' ? '是' : '否') : '-'}
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">故障描述：</span>
                <span className="info-value">
                  {formatValue(systemData.system.highFrequencyFault?.faultDesc)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThreeScene;
