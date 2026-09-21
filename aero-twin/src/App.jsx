import React, { useState, useRef, useEffect, useMemo, Suspense } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, useGLTF, Center } from '@react-three/drei';
import { AreaChart, Area, LineChart, Line, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid } from 'recharts';

// --- 3D ENGINE MODEL ---
function EngineModel({ faultType, autoRotate }) {
  const { scene } = useGLTF('/engine.gltf');
  const modelRef = useRef();
  
  const isOverheating = faultType === 'fracture' || faultType === 'cooling';

  useMemo(() => {
    scene.traverse((child) => {
      if (child.isMesh) {
        child.material = new THREE.MeshStandardMaterial({
          color: new THREE.Color('#94a3b8'),
          metalness: 1.0,  
          roughness: 0.15, 
          emissive: new THREE.Color('#000000'), 
        });
      }
    });
  }, [scene]);

  useEffect(() => {
    scene.traverse((child) => {
      if (child.isMesh) {
        if (isOverheating) {
          child.material.color.set('#ef4444');
          child.material.emissive.set('#991b1b');
          child.material.emissiveIntensity = 0.8;
          child.material.roughness = 0.4; 
        } else {
          child.material.color.set('#94a3b8');
          child.material.emissive.set('#000000');
          child.material.roughness = 0.15; 
        }
      }
    });
  }, [isOverheating, scene]);

  useFrame((_, delta) => {
    if (modelRef.current && autoRotate) {
      modelRef.current.rotation.y += delta * (isOverheating ? 0.9 : 0.15);
    }
  });

  return (
    <Center>
      <primitive ref={modelRef} object={scene} scale={isOverheating ? 1.02 : 1} />
    </Center>
  );
}

// --- MAIN DASHBOARD ---
export default function GCSDashboard() {
  const [faultType, setFaultType] = useState('none'); 
  const [isHighAltitude, setIsHighAltitude] = useState(false);
  const [isHotWeather, setIsHotWeather] = useState(false);
  const [autoRotate, setAutoRotate] = useState(false);

  const isOverheating = faultType === 'fracture' || faultType === 'cooling';
  const isSensorFailed = faultType === 'snap';
  const isJammed = faultType === 'jamming';
  
  const tempOffset = (isHighAltitude ? 15 : 0) + (isHotWeather ? 25 : 0); 
  
  let rul = "1500:00";
  let confidence = "98.4%";
  if (faultType === 'snap') { rul = "1500:00"; confidence = "96.2%"; }
  if (faultType === 'fracture') { rul = "0014:00"; confidence = "41.2%"; }
  if (faultType === 'cooling') { rul = "0008:00"; confidence = "32.1%"; }
  if (faultType === 'jamming') { rul = "--:--"; confidence = "--%"; }

  const telemetryData = [
    { time: 'T-5', cht: 180 + tempOffset, egt: 650 + tempOffset },
    { time: 'T-4', cht: 182 + tempOffset, egt: 655 + tempOffset },
    { time: 'T-3', cht: 181 + tempOffset, egt: 652 + tempOffset },
    { time: 'T-2', cht: isSensorFailed ? 0 : (faultType === 'fracture' ? 230 : (faultType === 'cooling' ? 280 : 179)) + tempOffset, egt: faultType === 'cooling' ? 800 : (faultType === 'fracture' ? 750 : 650) + tempOffset },
    { time: 'T-1', cht: isSensorFailed ? 0 : (faultType === 'fracture' ? 285 : (faultType === 'cooling' ? 310 : 180)) + tempOffset, egt: faultType === 'cooling' ? 920 : (faultType === 'fracture' ? 890 : 654) + tempOffset }
  ];

  const fftData = [
    { hz: '1k', amp: 20 }, { hz: '2k', amp: 35 }, { hz: '3k', amp: 15 },
    { hz: '4k', amp: faultType === 'fracture' ? 95 : 25 }, { hz: '5k', amp: 40 },
    { hz: '6k', amp: faultType === 'fracture' ? 80 : 30 }, { hz: '7k', amp: 10 }
  ];

  const bellCurveData = [
    { x: 1392, y: 0.05 }, { x: 1420, y: 0.2 }, { x: 1447, y: 0.6 }, { x: 1475, y: 0.9 }, 
    { x: 1502, y: 1.1 }, { x: 1530, y: 0.9 }, { x: 1558, y: 0.6 }, { x: 1585, y: 0.2 }, { x: 1608, y: 0.05 }
  ];

  const faultBellCurveData = [
    { x: 10, y: 0.1 }, { x: 11, y: 0.4 }, { x: 12, y: 0.8 }, { x: 13, y: 1.1 }, 
    { x: 14, y: 1.3 }, { x: 15, y: 1.1 }, { x: 16, y: 0.8 }, { x: 17, y: 0.4 }, { x: 18, y: 0.1 }
  ];

  const curveColor = isOverheating ? "#ef4444" : "#10b981";
  const activeBellData = isOverheating ? faultBellCurveData : bellCurveData;

  const resetSystem = () => {
    setFaultType('none');
    setAutoRotate(false); 
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-emerald-500 p-4 font-mono flex flex-col uppercase selection:bg-emerald-900 overflow-hidden relative">
      
      {/* FULL SCREEN JAMMING OVERLAY WITH EXIT BUTTON */}
      {isJammed && (
        <div className="absolute inset-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-md flex flex-col items-center justify-center border-8 border-red-900/50">
          <span className="text-red-500 text-4xl font-black tracking-widest animate-pulse mb-4 text-center">SATCOM DENIAL ATTACK DETECTED</span>
          <span className="text-slate-300 text-sm tracking-widest mb-8 text-center">GCS TELEMETRY LINK SEVERED. EDGE AUTONOMY ENGAGED.</span>
          
          <button 
            onClick={resetSystem} 
            className="bg-red-950/40 border border-red-500 text-red-400 hover:bg-red-900/60 hover:text-red-300 py-3 px-8 text-xs font-bold tracking-widest transition-all"
          >
            ↻ RESTORE SATELLITE UPLINK
          </button>
        </div>
      )}

      {/* TOP HEADER */}
      <header className="flex justify-between items-start border-b border-emerald-900/40 pb-3 mb-4 shrink-0">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-[10px] text-emerald-500 font-bold tracking-widest">
            <span className={`w-1.5 h-1.5 rounded-full ${isJammed ? 'bg-red-500' : 'bg-emerald-500 animate-pulse'}`}></span>
            ATDT - AUTONOMOUS TACTICAL DIGITAL TWIN
          </div>
          <div className="text-sm font-bold tracking-widest text-slate-300">
            UAV ID: <span className="text-emerald-400">TAPAS-BH-201</span> <span className="text-emerald-900 mx-2">|</span> ENG: TWIN VRDE 220HP
          </div>
          <div className="text-[9px] text-slate-600 tracking-widest mt-1">
            DRDO / ADE / VRDE - INLINE-4 TURBO DIESEL - JET-A1 - 2543 RPM
          </div>
        </div>

        <div className="flex flex-col items-center">
          <div className="text-[10px] tracking-widest text-emerald-700 mb-1">REMAINING USEFUL LIFE</div>
          <div className={`text-5xl font-black tracking-tighter ${isJammed ? 'text-slate-700' : (isOverheating ? 'text-red-500' : 'text-emerald-500')}`}>
            {rul} <span className="text-sm text-emerald-800 tracking-normal">HH:MM</span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 w-72">
          <div className="flex justify-between w-full text-[10px] tracking-widest text-emerald-700 font-bold">
            <span>PREDICTION CONFIDENCE</span>
            <span className={isJammed ? 'text-slate-700' : (isOverheating ? 'text-red-500' : 'text-emerald-400')}>{confidence}</span>
          </div>
          <div className="w-full h-1.5 bg-emerald-950 rounded overflow-hidden">
            <div className={`h-full ${isJammed ? 'bg-slate-800 w-full' : (isOverheating ? 'bg-red-500 w-[41%]' : 'bg-emerald-500 w-[98%]')}`}></div>
          </div>
          <div className="text-[9px] tracking-widest text-slate-500 mt-1 flex justify-between w-full items-center">
            <span>PHYSICS-INFORMED ENSEMBLE</span>
            <div className={`flex items-center gap-2 ${isJammed ? 'text-red-500 font-bold' : 'text-emerald-500'}`}>
              <span className={isJammed ? '' : 'animate-pulse'}>((•))</span> UPLINK: {isJammed ? '0.0 kbps' : (faultType !== 'none' ? '15.0 kbps' : '0.5 kbps')}
            </div>
          </div>
        </div>
      </header>

      {/* 4-COLUMN MAIN LAYOUT */}
      <div className="flex-1 grid grid-cols-12 gap-3 min-h-0">
        
        {/* COL 1: 3D Engine Canvas */}
        <div className="col-span-3 bg-[#0d0d0d] border border-emerald-900/30 rounded relative flex flex-col overflow-hidden h-[580px]">
          <div className="absolute top-4 left-4 right-4 z-10 flex justify-between text-[9px] tracking-widest text-emerald-700 border-b border-emerald-900/40 pb-2 font-bold">
            <span>DIGITAL TWIN VISUALIZER</span>
            <span className={isJammed ? 'text-red-500' : 'text-emerald-500'}>{isJammed ? 'OFFLINE' : 'LIVE 1 Hz'}</span>
          </div>
          
          <div className="absolute bottom-16 left-4 z-20">
            <button onClick={() => setAutoRotate(!autoRotate)} className="bg-emerald-950/80 hover:bg-emerald-900 text-emerald-400 py-1.5 px-3 rounded text-[8px] font-bold tracking-widest border border-emerald-800/50 transition-all backdrop-blur-sm">
              {autoRotate ? '■ PAUSE' : '▶ AUTO-ROTATE'}
            </button>
          </div>

          <div className="flex-1 w-full h-full cursor-grab active:cursor-grabbing mt-8 mb-12">
            <Canvas camera={{ position: [0, 1.5, 4], fov: 50 }} dpr={[1, 2]}>
              <ambientLight intensity={0.5} />
              <directionalLight position={[10, 10, 5]} intensity={2.5} />
              <pointLight position={[-10, -10, -5]} intensity={1} />
              <Suspense fallback={null}>
                <EngineModel faultType={faultType} autoRotate={autoRotate} />
                <Environment preset="city" />
              </Suspense>
              <OrbitControls makeDefault enableDamping dampingFactor={0.05} />
            </Canvas>
          </div>

          {/* Bottom Telemetry Grid */}
          <div className="absolute bottom-0 w-full grid grid-cols-4 border-t border-emerald-900/30 bg-[#0a0a0a] text-[9px] text-emerald-700 tracking-widest divide-x divide-emerald-900/30">
            <div className="p-2 flex flex-col gap-1">
              <span>RPM</span>
              <span className={`text-sm font-bold ${isJammed ? 'text-slate-700' : (isOverheating ? 'text-red-500' : 'text-emerald-400')}`}>{isJammed ? '---' : (isOverheating ? '1840' : '2552')}</span>
            </div>
            <div className="p-2 flex flex-col gap-1">
              <span>VIB HZ</span>
              <span className={`text-sm font-bold ${isJammed ? 'text-slate-700' : (faultType === 'fracture' ? 'text-red-500' : 'text-emerald-400')}`}>{isJammed ? '---' : (faultType === 'fracture' ? '4000' : '85')}</span>
            </div>
            <div className="p-2 flex flex-col gap-1">
              <span>OIL</span>
              <span className={`text-sm font-bold ${isJammed ? 'text-slate-700' : 'text-emerald-400'}`}>{isJammed ? '--' : '53.8'}</span>
            </div>
            <div className="p-2 flex flex-col gap-1">
              <span>Fe PPM</span>
              <span className={`text-sm font-bold ${isJammed ? 'text-slate-700' : 'text-emerald-400'}`}>{isJammed ? '--' : '11'}</span>
            </div>
          </div>
        </div>

        {/* COL 2: Dense Telemetry with Axes */}
        <div className="col-span-3 bg-[#0d0d0d] border border-emerald-900/30 rounded p-3 h-[580px] flex flex-col gap-3 relative">
          <div className="text-[10px] font-bold text-emerald-700 tracking-widest pb-2 border-b border-emerald-900/40">
            LIVE EDGE TELEMETRY
          </div>
          
          <div className="flex-1 border border-emerald-900/20 bg-emerald-950/10 rounded p-2 flex flex-col relative">
            <span className="text-[9px] text-emerald-600 mb-1">CYLINDER HEAD TEMP (CHT) - °C</span>
            {isSensorFailed && (
              <div className="absolute inset-0 bg-[#0a0a0a]/90 flex items-center justify-center p-2 text-yellow-500 text-[10px] text-center font-bold tracking-widest z-10 border border-yellow-900/50">
                SENSOR FAULT DETECTED (0.00°C)
              </div>
            )}
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={telemetryData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 2" stroke="#064e3b" opacity={0.3} vertical={false} />
                <XAxis dataKey="time" stroke="#064e3b" fontSize={8} tickLine={false} axisLine={false} />
                <YAxis domain={[150, 350]} stroke="#064e3b" fontSize={8} tickLine={false} axisLine={false} />
                <Line type="monotone" dataKey="cht" stroke={ isOverheating ? "#ef4444" : "#10b981"} strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="flex-1 border border-emerald-900/20 bg-emerald-950/10 rounded p-2 flex flex-col">
            <span className="text-[9px] text-emerald-600 mb-1">EXHAUST GAS TEMP (EGT) - °C</span>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={telemetryData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 2" stroke="#064e3b" opacity={0.3} vertical={false} />
                <XAxis dataKey="time" stroke="#064e3b" fontSize={8} tickLine={false} axisLine={false} />
                <YAxis domain={[600, 1000]} stroke="#064e3b" fontSize={8} tickLine={false} axisLine={false} />
                <Line type="monotone" dataKey="egt" stroke={isOverheating ? "#ef4444" : "#10b981"} strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="flex-1 border border-emerald-900/20 bg-emerald-950/10 rounded p-2 flex flex-col">
            <span className="text-[9px] text-emerald-600 mb-1">MICRO-VIBRATION FFT (Amp / Hz)</span>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={fftData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 2" stroke="#064e3b" opacity={0.3} vertical={false} />
                <XAxis dataKey="hz" stroke="#064e3b" fontSize={8} tickLine={false} axisLine={false} />
                <YAxis stroke="#064e3b" fontSize={8} tickLine={false} axisLine={false} />
                <Bar dataKey="amp" fill={ faultType === 'fracture' ? "#ef4444" : "#10b981" } isAnimationActive={true} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* COL 3: Data Analysis (Detailed XAI) */}
        <div className="col-span-3 bg-[#0d0d0d] border border-emerald-900/30 rounded p-4 h-[580px] flex flex-col">
          <div className="text-[10px] font-bold text-emerald-500 tracking-widest pb-2 border-b border-emerald-900/40 mb-4 text-center">
            PREDICTION ANALYSIS
          </div>

          <div className="flex justify-between text-[8px] text-emerald-700 tracking-widest mb-2">
            <span>RUL ESTIMATE DISTRIBUTION</span>
            <span className="text-emerald-500">95% CI: 1447-1553 HR</span>
          </div>

          <div className="h-28 w-full mb-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activeBellData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCurve" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={curveColor} stopOpacity={0.6}/>
                    <stop offset="95%" stopColor={curveColor} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 2" stroke="#064e3b" opacity={0.3} />
                <XAxis dataKey="x" stroke="#064e3b" fontSize={8} tickLine={false} axisLine={false} />
                <YAxis stroke="#064e3b" fontSize={8} tickLine={false} axisLine={false} tickFormatter={(val)=>val.toFixed(1)} />
                <Area type="monotone" dataKey="y" stroke={curveColor} strokeWidth={2} fillOpacity={1} fill="url(#colorCurve)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 border-t border-b border-emerald-900/40 py-2 mb-4 text-[9px] tracking-widest text-emerald-700">
            <div>
              <div className="mb-1">ESTIMATE</div>
              <div className={(isOverheating && !isSensorFailed) ? 'text-red-500' : 'text-emerald-400'}>{rul}</div>
            </div>
            <div>
              <div className="mb-1">HORIZON</div>
              <div className={(isOverheating && !isSensorFailed) ? 'text-red-500' : 'text-emerald-400'}>50 HR WINDOW</div>
            </div>
            <div>
              <div className="mb-1">CONFIDENCE</div>
              <div className={(isOverheating && !isSensorFailed) ? 'text-red-500' : 'text-emerald-400'}>{confidence}</div>
            </div>
          </div>

          <div className="flex justify-between text-[8px] text-emerald-600 tracking-widest mb-3 border-b border-emerald-900/40 pb-2">
            <span>XAI - PREDICTIVE CAUSAL DRIVERS (SHAP)</span>
          </div>

          <div className="flex flex-col gap-3 flex-1 overflow-y-auto pr-2">
            <div className="flex gap-3">
              <div className="flex-1 flex flex-col gap-0.5 text-[9px]">
                <div className="text-slate-300">
                  <span className="font-bold">Oil Fe Particulate Trend:</span> <span className={isOverheating ? 'text-red-400' : 'text-emerald-400'}>+25% influence</span>
                </div>
                <div className="text-[8px] text-slate-500 leading-tight">Ferrous wear rate 0.4 ppm/hr — normal bearing bed-in.</div>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-1 flex flex-col gap-0.5 text-[9px]">
                <div className="text-slate-300">
                  <span className="font-bold">Vibration Harmonic RMS:</span> <span className={faultType === 'fracture' ? 'text-red-500 animate-pulse' : 'text-emerald-400'}>{ faultType === 'fracture' ? '+82% influence' : '+18% influence'}</span>
                </div>
                <div className="text-[8px] text-slate-500 leading-tight">
                  { faultType === 'fracture' ? 'CRITICAL: 4kHz resonance detected. Bearing failure imminent.' : 'Combustion harmonics steady at 85 Hz.'}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-1 flex flex-col gap-0.5 text-[9px]">
                <div className="text-slate-300">
                  <span className="font-bold">Inter-Cyl CHT Balance:</span> <span className={faultType === 'snap' ? 'text-yellow-500' : (faultType === 'cooling' ? 'text-red-500' : 'text-emerald-400')}>{faultType === 'snap' ? '+98% ISOLATION' : (faultType === 'cooling' ? '+91% influence' : '+8% influence')}</span>
                </div>
                <div className="text-[8px] text-slate-500 leading-tight">
                  {faultType === 'snap' ? 'Data rejected. Reading violates EGT baseline. Virtual sensor active.' : (faultType === 'cooling' ? 'CRITICAL: Heat-soak cascade detected across cylinder block.' : 'Max spread 2°C across cylinders — balanced.')}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* COL 4: GCS Control & Tactical AI Event Log */}
        <div className="col-span-3 flex flex-col gap-3 h-[580px]">
          <div className="bg-[#0d0d0d] flex-[3] rounded border border-emerald-900/30 p-4 flex flex-col">
            <div className="flex justify-between text-[9px] font-bold text-emerald-600 tracking-widest pb-2 border-b border-emerald-900/40 mb-3">
              <span>GCS CONTROL DESK</span>
            </div>
            
            <div className="flex flex-col gap-2 mb-3">
              <span className="text-[8px] text-emerald-800 tracking-widest uppercase">A - Meteorological Stress</span>
              <button onClick={() => setIsHighAltitude(!isHighAltitude)} className={`border ${isHighAltitude ? 'border-emerald-500 text-emerald-400 bg-emerald-950/30' : 'border-emerald-900/30 text-emerald-700 hover:border-emerald-700 hover:text-emerald-600'} p-2 text-left transition-all flex justify-between items-center`}>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] font-bold tracking-widest">HIGH ALTITUDE (15k FT)</span>
                  <span className="text-[7px] lowercase">Reduced charge density - turbo load</span>
                </div>
                <div className={`w-2 h-2 rounded-full ${isHighAltitude ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'border border-emerald-900/50'}`}></div>
              </button>
              <button onClick={() => setIsHotWeather(!isHotWeather)} className={`border ${isHotWeather ? 'border-emerald-500 text-emerald-400 bg-emerald-950/30' : 'border-emerald-900/30 text-emerald-700 hover:border-emerald-700 hover:text-emerald-600'} p-2 text-left transition-all flex justify-between items-center`}>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] font-bold tracking-widest">HOT WEATHER (+45°C)</span>
                  <span className="text-[7px] lowercase">Cooling ΔT collapse - oil thinning</span>
                </div>
                <div className={`w-2 h-2 rounded-full ${isHotWeather ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'border border-emerald-900/50'}`}></div>
              </button>
            </div>

            <div className="flex flex-col gap-2 mb-3 flex-1">
              <span className="text-[8px] text-emerald-800 tracking-widest uppercase">B - Fault Injection Matrix</span>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => {setFaultType('snap'); setAutoRotate(false);}} className={`border ${faultType === 'snap' ? 'border-yellow-500 text-yellow-500 bg-yellow-950/20' : 'border-emerald-900/30 text-emerald-700 hover:border-emerald-700 hover:text-emerald-600'} p-2 text-left transition-all`}>
                  <span className="text-[8px] font-bold tracking-widest block mb-1">SNAP CHT SENSOR</span>
                  <span className="text-[7px] block">Anti-spoofing virtual</span>
                </button>
                <button onClick={() => {setFaultType('cooling'); setAutoRotate(true);}} className={`border ${faultType === 'cooling' ? 'border-red-500 text-red-500 bg-red-950/20' : 'border-emerald-900/30 text-emerald-700 hover:border-emerald-700 hover:text-emerald-600'} p-2 text-left transition-all`}>
                  <span className="text-[8px] font-bold tracking-widest block mb-1">FAIL COOLING</span>
                  <span className="text-[7px] block">Heat-soak cascade</span>
                </button>
                <button onClick={() => {setFaultType('fracture'); setAutoRotate(true);}} className={`border ${faultType === 'fracture' ? 'border-red-500 text-red-500 bg-red-950/20' : 'border-emerald-900/30 text-emerald-700 hover:border-emerald-700 hover:text-emerald-600'} p-2 text-left transition-all`}>
                  <span className="text-[8px] font-bold tracking-widest block mb-1">INJECT FRACTURE</span>
                  <span className="text-[7px] block">Predictive acoustic</span>
                </button>
                <button onClick={() => setFaultType('jamming')} className={`border ${faultType === 'jamming' ? 'border-red-500 text-red-500 bg-red-950/20' : 'border-emerald-900/30 text-emerald-700 hover:border-emerald-700 hover:text-emerald-600'} p-2 text-left transition-all`}>
                  <span className="text-[8px] font-bold tracking-widest block mb-1">COMMS JAMMING</span>
                  <span className="text-[7px] block">SATCOM denial</span>
                </button>
              </div>
            </div>

            <button onClick={resetSystem} className="w-full bg-emerald-950/40 border border-emerald-800 text-emerald-400 hover:bg-emerald-900/60 py-2.5 text-[10px] font-bold tracking-widest transition-all mt-auto">
              ↻ RE-BASELINE TWIN
            </button>
          </div>

          <div className="bg-[#0a0a0a] flex-[2] border border-emerald-900/30 rounded p-3 flex flex-col relative overflow-hidden font-mono text-[9px]">
            <div className="text-emerald-700 font-bold tracking-widest pb-2 border-b border-emerald-900/40 mb-2 flex items-center gap-2">
              <span className="text-emerald-500">&gt;_ TACTICAL AI EVENT LOG</span>
            </div>
            
            <div className="flex flex-col gap-1 overflow-y-auto text-emerald-600/80 leading-relaxed font-semibold">
              {isSensorFailed ? (
                <>
                  <div className="flex gap-2"><span className="text-emerald-800">16:02:45</span> <span className="text-yellow-500">Warning: CHT Sensor signal lost (0°C).</span></div>
                  <div className="flex gap-2"><span className="text-emerald-800">16:02:46</span> <span className="text-emerald-400">Initiating SHAP causal isolation...</span></div>
                  <div className="flex gap-2"><span className="text-emerald-800">16:02:46</span> <span className="text-emerald-400">Physics model verified. Engine healthy.</span></div>
                </>
              ) : faultType === 'fracture' ? (
                <>
                  <div className="flex gap-2"><span className="text-emerald-800">16:02:45</span> <span className="text-red-500">CRITICAL: Acoustic anomaly at 4kHz.</span></div>
                  <div className="flex gap-2"><span className="text-emerald-800">16:02:46</span> <span className="text-red-400">Bearing failure highly probable.</span></div>
                  <div className="flex gap-2"><span className="text-emerald-800">16:02:46</span> <span className="text-red-500">ACTION: Throttle limit engaged. Abort.</span></div>
                </>
              ) : faultType === 'cooling' ? (
                <>
                  <div className="flex gap-2"><span className="text-emerald-800">16:02:45</span> <span className="text-red-500">CRITICAL: Heat-soak cascade detected.</span></div>
                  <div className="flex gap-2"><span className="text-emerald-800">16:02:46</span> <span className="text-red-400">EGT diverging from map baseline (+15%).</span></div>
                  <div className="flex gap-2"><span className="text-emerald-800">16:02:46</span> <span className="text-red-500">ACTION: Enrich fuel mixture immediately.</span></div>
                </>
              ) : faultType === 'jamming' ? (
                <>
                  <div className="flex gap-2"><span className="text-emerald-800">16:02:45</span> <span className="text-red-500">ERROR: SATCOM UPLINK SEVERED.</span></div>
                  <div className="flex gap-2"><span className="text-emerald-800">16:02:46</span> <span className="text-red-500">ERROR: NO HEARTBEAT FROM EDGE NODE.</span></div>
                </>
              ) : (
                <>
                  <div className="flex gap-2"><span className="text-emerald-800">16:02:45</span> <span className="text-emerald-600">Telemetry sync established.</span></div>
                  <div className="flex gap-2"><span className="text-emerald-800">16:02:46</span> <span className="text-emerald-600">Acoustic harmonics baseline OK.</span></div>
                  <div className="flex gap-2"><span className="text-emerald-800">16:02:47</span> <span className="text-emerald-600">Ready for edge inference.</span></div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
