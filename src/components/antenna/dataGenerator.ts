import { FAULT_TYPES, FAULT_SUGGESTIONS } from './constants';

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function generateMockBladeData(bladeId: string, status = 'normal') {
  const isFault = status === 'fault';
  const isHeating = status === 'heating';
  const isOffline = status === 'offline';

  let faultInfo = null;
  if (isFault) {
    const faultTypes = Object.keys(FAULT_TYPES);
    const randomType = faultTypes[Math.floor(Math.random() * faultTypes.length)];

    faultInfo = {
      faultType: randomType,
      faultCode: FAULT_TYPES[randomType],
      description: `叶片${bladeId.split('_')[1]}发生${FAULT_TYPES[randomType]}故障`,
      severity: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
      suggestion: FAULT_SUGGESTIONS[randomType] || '请检查系统'
    };
  }

  return {
    bladeId,
    status,
    temperature: {
      current: isOffline
        ? null
        : isFault
          ? Math.random() * 100 + 20
          : isHeating
            ? Math.random() * 10 + 25
            : Math.random() * 10 + 20
    },
    heater: {
      power: isOffline ? 'off' : (isHeating ? 'on' : 'off'),
      powerLevel: isOffline ? 0 : (isHeating ? Math.floor(Math.random() * 50) + 50 : 0)
    },
    faultInfo
  };
}

function generateAttitude() {
  const roll = parseFloat((Math.random() * 10 - 5).toFixed(2));
  const pitch = parseFloat((Math.random() * 10 - 5).toFixed(2));
  const rollThreshold = 3.0;
  const pitchThreshold = 2.5;

  const rollExceeded = Math.abs(roll) > rollThreshold;
  const pitchExceeded = Math.abs(pitch) > pitchThreshold;
  const isFault = rollExceeded || pitchExceeded;

  let recoveryHint = null;
  if (isFault) {
    let rollAdjustment = 0;
    let pitchAdjustment = 0;
    let rollDirection: string | null = null;
    let pitchDirection: string | null = null;

    if (rollExceeded) {
      rollAdjustment = Math.abs(roll) - rollThreshold;
      rollDirection = roll > 0 ? 'left' : 'right';
    }

    if (pitchExceeded) {
      pitchAdjustment = Math.abs(pitch) - pitchThreshold;
      pitchDirection = pitch > 0 ? 'down' : 'up';
    }

    recoveryHint = {
      rollDirection,
      rollValue: rollAdjustment > 0 ? parseFloat(rollAdjustment.toFixed(2)) : 0,
      pitchDirection,
      pitchValue: pitchAdjustment > 0 ? parseFloat(pitchAdjustment.toFixed(2)) : 0
    };
  }

  return {
    roll,
    pitch,
    rollThreshold,
    pitchThreshold,
    status: isFault ? 'fault' : 'normal',
    recoveryHint
  };
}

export interface SystemData {
  system: {
    attitude: ReturnType<typeof generateAttitude>;
    environment: {
      rainSnowStatus: string;
      airTemperature: number;
      dishTemperature: number;
    };
    satelliteSignal: {
      signalStrength: number;
      signalQuality: number;
    };
    relays: {
      heatingRelays: { status: string }[];
      alarmRelay: { status: string };
    };
    controlUnit: {
      status: string;
      faultType: string | null;
    };
    alarmDetector: {
      status: string;
      alarmType: string | null;
    };
    displacementFault: {
      status: string;
    };
    highFrequencyFault: {
      status: string;
      faultDesc: string | null;
    };
  };
  blades: ReturnType<typeof generateMockBladeData>[];
}

export function generateSystemData(): SystemData {
  const statuses = ['normal', 'normal', 'normal', 'heating', 'fault', 'offline'];
  const shuffledStatuses = shuffleArray(statuses);

  const blades = [];
  for (let i = 1; i <= 6; i++) {
    blades.push(generateMockBladeData(`BLADE_0${i}`, shuffledStatuses[i - 1]));
  }

  const faultBlades = blades.filter(b => b.status === 'fault');

  const heatingRelays = blades.map(blade => ({
    status: blade.status === 'heating' ? 'on' : 'off'
  }));

  const alarmRelay = {
    status: faultBlades.length > 0 ? 'on' : 'off'
  };

  const rainSnowStatus = Math.random() > 0.7 ? 'rain' : (Math.random() > 0.9 ? 'snow' : 'clear');
  const environment = {
    rainSnowStatus,
    airTemperature: parseFloat((15 + Math.random() * 20).toFixed(1)),
    dishTemperature: parseFloat((20 + Math.random() * 15).toFixed(1))
  };

  const satelliteSignal = {
    signalStrength: Math.floor(Math.random() * 40 + 60),
    signalQuality: parseFloat((Math.random() * 30 + 70).toFixed(1))
  };

  const hasFault = faultBlades.length > 0;
  const hasRainSnow = rainSnowStatus !== 'clear';
  const randomAlarm = Math.random() > 0.6;
  const isAlarming = hasFault || hasRainSnow || randomAlarm;
  const alarmDetector = {
    status: isAlarming ? 'alarming' : 'normal',
    alarmType: isAlarming
      ? (hasRainSnow ? 'rain_snow' : (hasFault ? 'fault' : 'other'))
      : null
  };

  const highFrequencyFaultDescriptions = [
    '高频头电路异常，请检查电源与信号线连接',
    '高频头接收信号弱，请检查天线指向及遮挡物',
    '高频头温度过高，请检查散热情况',
    '高频头内部模块故障，请联系维护人员'
  ];

  return {
    system: {
      attitude: generateAttitude(),
      environment,
      satelliteSignal,
      relays: {
        heatingRelays,
        alarmRelay
      },
      controlUnit: {
        status: Math.random() > 0.5 ? 'fault' : 'normal',
        faultType: Math.random() > 0.5
          ? (Math.random() > 0.5 ? 'circuit_error' : 'communication_error')
          : null
      },
      alarmDetector,
      displacementFault: {
        status: Math.random() > 0.5 ? 'fault' : 'normal'
      },
      highFrequencyFault: {
        status: Math.random() > 0.5 ? 'fault' : 'normal',
        faultDesc: Math.random() > 0.5
          ? highFrequencyFaultDescriptions[Math.floor(Math.random() * highFrequencyFaultDescriptions.length)]
          : null
      }
    },
    blades
  };
}

export async function fetchSystemInfo(): Promise<SystemData> {
  const response = await fetch('http://8.145.43.245:8989/api/v1/snow/detail?tag=1');
  const data = await response.json();

  if (data.code === '00000') {
    const apiData = data.data;

    const rainSnowStatusMap: Record<string, string> = {
      '无雨雪': 'clear',
      '雨': 'rain',
      '雪': 'snow'
    };

    const heatingRelays: { status: string }[] = [];
    const alarmRelay = {
      status: 'off'
    };

    if (apiData.relays) {
      apiData.relays.forEach((relay: { name: string; state: boolean }) => {
        if (relay.name.includes('加热继电器')) {
          heatingRelays.push({
            status: relay.state ? 'on' : 'off'
          });
        } else if (relay.name.includes('报警继电器')) {
          alarmRelay.status = relay.state ? 'on' : 'off';
        }
      });
    }

    const blades = [];
    for (let i = 1; i <= 6; i++) {
      let tempValue = 25;
      if (apiData.tempsensors) {
        const tempSensor = apiData.tempsensors.find((sensor: { name: string; value: number }) =>
          sensor.name.includes(`锅面_${(i - 1) * 2 + 1}_${(i - 1) * 2 + 2}`)
        );
        if (tempSensor) {
          tempValue = tempSensor.value;
        }
      }

      blades.push({
        bladeId: `BLADE_0${i}`,
        status: 'normal',
        temperature: {
          current: tempValue
        },
        heater: {
          power: 'off',
          powerLevel: 0
        },
        faultInfo: null
      });
    }

    return {
      system: {
        attitude: {
          roll: 0,
          pitch: 0,
          rollThreshold: 3.0,
          pitchThreshold: 2.5,
          status: apiData.roll === '正常' && apiData.pitch === '正常' ? 'normal' : 'fault',
          recoveryHint: null
        },
        environment: {
          rainSnowStatus: rainSnowStatusMap[apiData.rainSnow] || 'clear',
          airTemperature: apiData.airTemperature || 25,
          dishTemperature: apiData.potTemperature || 25
        },
        satelliteSignal: {
          signalStrength: parseInt(apiData.signalStrength) || 0,
          signalQuality: 80
        },
        relays: {
          heatingRelays,
          alarmRelay
        },
        controlUnit: {
          status: 'normal',
          faultType: null
        },
        alarmDetector: {
          status: alarmRelay.status === 'on' ? 'alarming' : 'normal',
          alarmType: alarmRelay.status === 'on' ? 'fault' : null
        },
        displacementFault: {
          status: apiData.yaw === '正常' ? 'normal' : 'fault'
        },
        highFrequencyFault: {
          status: 'normal',
          faultDesc: null
        }
      },
      blades
    };
  } else {
    throw new Error(`API返回错误: ${data.msg}`);
  }
}
