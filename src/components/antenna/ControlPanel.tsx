import React from 'react';

interface ControlPanelProps {
  backgroundColor: string;
  setBackgroundColor: (v: string) => void;
  baseColor: string;
  setBaseColor: (v: string) => void;
  brightness: number;
  setBrightness: (v: number) => void;
  cameraDistance: number;
  setCameraDistance: (v: number) => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  backgroundColor,
  setBackgroundColor,
  baseColor,
  setBaseColor,
  brightness,
  setBrightness,
  cameraDistance,
  setCameraDistance
}) => {
  return (
    <>
      <div
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          zIndex: 1001,
          padding: '15px',
          backgroundColor: 'rgba(30, 30, 30, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '8px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(10px)',
          minWidth: '200px',
          display: 'none'
        }}
      >
        <ColorControl label="背景颜色" value={backgroundColor} onChange={setBackgroundColor} />
        <ColorControl label="底座颜色" value={baseColor} onChange={setBaseColor} />
        <SliderControl label="模型明暗度" value={brightness} onChange={setBrightness} min={0.5} max={2.0} step={0.1} />
        <SliderControl label="相机距离" value={cameraDistance} onChange={setCameraDistance} min={1} max={20} step={0.5} />
      </div>
    </>
  );
};

const ColorControl: React.FC<{ label: string; value: string; onChange: (v: string) => void }> = ({ label, value, onChange }) => (
  <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
    <label style={{ color: 'white', fontSize: '13px', fontWeight: 500, marginRight: '10px' }}>{label}</label>
    <input
      type="color"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: '50px',
        height: '30px',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '4px',
        cursor: 'pointer',
        backgroundColor: value
      }}
    />
  </div>
);

const SliderControl: React.FC<{
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
}> = ({ label, value, onChange, min, max, step }) => (
  <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
    <label style={{ color: 'white', fontSize: '13px', fontWeight: 500, marginRight: '10px' }}>{label}</label>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, maxWidth: '120px' }}>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{
          flex: 1,
          height: '4px',
          borderRadius: '2px',
          background: 'rgba(255, 255, 255, 0.2)',
          outline: 'none',
          cursor: 'pointer'
        }}
      />
      <span style={{ color: 'white', fontSize: '12px', minWidth: '35px', textAlign: 'right' }}>
        {value.toFixed(step < 1 ? 1 : 0)}
      </span>
    </div>
  </div>
);

export default ControlPanel;
