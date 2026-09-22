import React, { useState, useRef, useEffect, useMemo, Suspense } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, useGLTF, Center, Html } from '@react-three/drei';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid, ReferenceLine, Tooltip } from 'recharts';

// --- 3D ENGINE MODEL WITH HTML OVERLAYS ---
function EngineModel({ faultType, autoRotate, tick, tempOffset }) {
  const { scene } = useGLTF('/engine.gltf');
  const modelRef = useRef();
  
  const isOverheating = faultType === 'fracture' || faultType === 'cooling';
  const isFailed = faultType === 'snap';
  const isJammed = faultType === 'jamming';

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

  // Simulated live cylinder temps for the 3D overlays
  const cylTemp = isFailed ? 0 : Math.round((faultType === 'cooling' ? 115 : 85) + tempOffset + (Math.sin(tick) * 0.8));
  const anomalyScore = isOverheating ? (faultType === 'fracture' ? '7.8' : '9.2') : '0.2';

  return (
    <Center>
      <primitive ref={modelRef} object={scene} scale={isOverheating ? 1.02 : 1}>
        
        {/* ONLY SHOW OVERLAYS IF COMM LINK IS ACTIVE */}
        {!isJammed && (
          <>
            {/* 4 CYLINDER THERMAL MARKERS (Inline-4 Engine) */}
            <Html position={[-0.6, 0.8, 0.2]} center className="pointer-events-none">
              <div className={`w-6 h-6 rounded-full border flex items-center justify-center text-[8px] font-bold bg-black/60 backdrop-blur-md transition-colors ${isOverheating ? 'border-red-500 text-red-400 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'border-emerald-500 text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.4)]'}`}>
                {cylTemp}
              </div>
            </Html>
            <Html position={[-0.2, 0.8, 0.2]} center className="pointer-events-none">
              <div className={`w-6 h-6 rounded-full border flex items-center justify-center text-[8px] font-bold bg-black/60 backdrop-blur-md transition-colors ${isOverheating ? 'border-red-500 text-red-400 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'border-emerald-500 text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.4)]'}`}>
                {cylTemp + 1}
              </div>
            </Html>
            <Html position={[0.2, 0.8, 0.2]} center className="pointer-events-none">
              <div className={`w-6 h-6 rounded-full border flex items-center justify-center text-[8px] font-bold bg-black/60 backdrop-blur-md transition-colors ${isOverheating ? 'border-red-500 text-red-400 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'border-emerald-500 text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.4)]'}`}>
                {cylTemp - 1}
              </div>
            </Html>
            {/* Added 4th Cylinder Tracker */}
            <Html position={[0.6, 0.8, 0.2]} center className="pointer-events-none">
              <div className={`w-6 h-6 rounded-full border flex items-center justify-center text-[8px] font-bold bg-black/60 backdrop-blur-md transition-colors ${isOverheating ? 'border-red-500 text-red-400 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'border-emerald-500 text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.4)]'}`}>
                {cylTemp + 2}
              </div>
            </Html>

            {/* TACTICAL DETAIL CARD */}
            <Html position={[1.4, 0.2, 0]} center className="pointer-events-none w-48">
              <div className="bg-[#0a0a0a]/90 border border-emerald-900/60 p-2.5 backdrop-blur-md text-left font-mono shadow-xl">
                <div className="text-[8px] text-slate-400 mb-2 border-b border-emerald-900/40 pb-1 font-bold tracking-widest uppercase">
                  CYLINDER 3 DETAIL
                </div>
                <div className="flex justify-between text-[9px] mb-1 tracking-widest">
                  <span className="text-slate-500">CURRENT CHT</span>
                  <span className={`font-bold ${isOverheating ? 'text-red-500' : 'text-emerald-400'}`}>{cylTemp}°C {(isOverheating && !isFailed) ? '(CRIT)' : '(NOM)'}</span>
                </div>
                <div className="flex justify-between text-[9px] mb-1 tracking-widest">
                  <span className="text-slate-500">PREDICTED TREND</span>
                  <span className={isOverheating ? 'text-red-500' : 'text-emerald-400'}>{isOverheating ? '+4.2°C/hr' : '+0.2°C/hr'}</span>
                </div>
                <div className="flex justify-between text-[9px] mb-1 tracking-widest">
                  <span className="text-slate-500">REM. CYL LIFE</span>
                  <span className="text-emerald-400">{isOverheating ? '1,420 cyc' : '17,960 cyc'}</span>
                </div>
                <div className="flex justify-between text-[9px] mb-2 tracking-widest">
                  <span className="text-slate-500">AI ANOMALY SCORE</span>
                  <span className={`font-bold ${isOverheating ? 'text-red-500' : 'text-emerald-400'}`}>{anomalyScore} / 10.0</span>
                </div>
                <div className="text-[8px] text-slate-400 border-t border-emerald-900/40 pt-1 mt-1 leading-tight">
                  {faultType === 'cooling' ? 'Heat-soak failure mapping active.' : (faultType === 'fracture' ? 'Acoustic vibration exceeding limits.' : 'Wear trajectory on-track.')}
                </div>
              </div>
            </Html>
          </>
        )}
      </primitive>
    </Center>
  );
}

// --- MAIN DASHBOARD ---
export default function GCSDashboard() {
  const [faultType, setFaultType] = useState('none'); 
  const [isHighAltitude, setIsHighAltitude] = useState(false);
  const [isHotWeather, setIsHotWeather] = useState(false);
  const [autoRotate, setAutoRotate] = useState(false);
  
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (faultType === 'jamming') return;
    const timer = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, [faultType]);

  const isOverheating = faultType === 'fracture' || faultType === 'cooling';
  const isSensorFailed = faultType === 'snap';
  const isJammed = faultType === 'jamming';
  
  const tempOffset = (isHighAltitude ? 5 : 0) + (isHotWeather ? 10 : 0); 
  
  let rul = "1500:00";
  let confidence = "98.4%";
  if (faultType === 'snap') { rul = "1500:00"; confidence = "96.2%"; }
  if (faultType === 'fracture') { rul = "0014:00"; confidence = "41.2%"; }
  if (faultType === 'cooling') { rul = "0008:00"; confidence = "32.1%"; }
  if (faultType === 'jamming') { rul = "--:--"; confidence = "--%"; }

  const formatTime = (t) => {
    const mins = Math.floor(t / 60) % 60;
    const secs = t % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // DYNAMIC 15-POINT TELEMETRY (Smooth Rolling Wave)
  const telemetryData = useMemo(() => {
    return Array.from({ length: 15 }, (_, i) => {
        const offset = 14 - i;
        const historicalTick = tick > offset ? tick - offset : 0;
        const timeLabel = formatTime(historicalTick);
        
        // Add math random to jitter to make it look like raw sensor noise
        const jitter = (Math.sin(historicalTick) * 0.8) + (Math.random() * 0.4 - 0.2);
        const egtJitter = (Math.cos(historicalTick) * 3) + (Math.random() * 2 - 1);

        let chtVal = 85 + tempOffset + jitter;
        let egtVal = 710 + tempOffset + egtJitter;

        if (faultType === 'fracture') {
            chtVal = 92 + tempOffset + jitter;
            egtVal = 820 + tempOffset + egtJitter;
        } else if (faultType === 'cooling') {
            chtVal = 115 + tempOffset + (jitter * 2);
            egtVal = 880 + tempOffset + (egtJitter * 2);
        } else if (faultType === 'snap') {
            chtVal = 0; 
        }

        return { time: timeLabel, cht: Number(chtVal.toFixed(1)), egt: Number(egtVal.toFixed(1)) };
    });
  }, [tick, faultType, tempOffset]);

  const fftData = useMemo(() => {
    const base = [20, 35, 15, 25, 40, 30, 10];
    return base.map((amp, i) => {
        let currentAmp = amp + (Math.random() * 6 - 3);
        if (faultType === 'fracture' && i === 3) currentAmp = 95 + (Math.random() * 5); 
        if (faultType === 'fracture' && i === 5) currentAmp = 80 + (Math.random() * 5); 
        return { hz: `${i + 1}k`, amp: Math.max(0, currentAmp) };
    });
  }, [tick, faultType]);

  const liveRPM = isJammed ? '---' : (isOverheating ? 1840 + (tick % 4) : 2552 + (tick % 5 - 2));
  const liveOil = isJammed ? '--' : (53.8 + Math.sin(tick) * 0.1).toFixed(1);

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

  // Custom Tooltip for Recharts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0a0a0a]/90 border border-emerald-900/60 p-2 text-[9px] font-mono backdrop-blur-sm">
          <p className="text-slate-400 mb-1 border-b border-emerald-900/40 pb-1">{`TIME: ${label}`}</p>
          <p className={isOverheating ? 'text-red-400' : 'text-emerald-400'}>
            <span className="font-bold">{payload[0].name.toUpperCase()}:</span> {payload[0].value}°C
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-emerald-500 p-4 font-mono flex flex-col uppercase selection:bg-emerald-900 overflow-hidden relative">
      
      {/* FIXED JAMMING OVERLAY WITH RESTART BUTTON */}
      {isJammed && (
        <div className="absolute inset-0 z-[100] bg-[#0a0a0a]/90 backdrop-blur-md flex flex-col items-center justify-center border-8 border-red-900/80 pointer-events-auto">
          <span className="text-red-500 text-4xl font-black tracking-widest animate-pulse mb-4 text-center drop-shadow-[0_0_15px_#ef4444]">
            SATCOM DENIAL ATTACK DETECTED
          </span>
          <span className="text-slate-300 text-sm tracking-widest mb-12 text-center">
            GCS TELEMETRY LINK SEVERED. EDGE AUTONOMY ENGAGED. LOGGING BUFFERED.
          </span>
          
          <button 
            onClick={resetSystem} 
            className="bg-red-950/80 border-2 border-red-500 text-red-100 hover:bg-red-600 hover:text-white py-4 px-10 text-sm font-bold tracking-widest transition-all shadow-[0_0_25px_#ef4444] rounded cursor-pointer"
          >
            ↻ RESTORE SATELLITE UPLINK & RE-SYNC
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
            UAV ID: <span className="text-emerald-400">TAPAS-BH-201</span> <span className="text-emerald-900 mx-2">|</span> ENG: TWIN VRDE 2.2L 220HP
          </div>
          <div className="text-[9px] text-slate-600 tracking-widest mt-1">
            DRDO / VRDE - INLINE-4 TURBO CRDi DIESEL - JET-A1
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
              <span className={isJammed ? '' : 'animate-pulse'}>((•))</span> UPLINK: {isJammed ? '0.0 kbps' : (faultType !== 'none' ? '15.0 kbps' : '1.0 Hz')}
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-12 gap-3 min-h-0">
        
        {/* COL 1: 3D Engine Canvas */}
        <div className="col-span-3 bg-[#0d0d0d] border border-emerald-900/30 rounded relative flex flex-col overflow-hidden h-[580px]">
          <div className="absolute top-4 left-4 right-4 z-10 flex justify-between text-[9px] tracking-widest text-emerald-700 border-b border-emerald-900/40 pb-2 font-bold bg-[#0d0d0d]/50 backdrop-blur-sm">
            <span>DIGITAL TWIN VISUALIZER</span>
            <span className={isJammed ? 'text-red-500' : 'text-emerald-500'}>{isJammed ? 'OFFLINE' : 'LIVE'}</span>
          </div>
          
          <div className="absolute bottom-16 left-4 z-20">
            <button onClick={() => setAutoRotate(!autoRotate)} className="bg-emerald-950/80 hover:bg-emerald-900 text-emerald-400 py-1.5 px-3 rounded text-[8px] font-bold tracking-widest border border-emerald-800/50 transition-all backdrop-blur-sm cursor-pointer">
              {autoRotate ? '■ PAUSE' : '▶ AUTO-ROTATE'}
            </button>
          </div>

          <div className="flex-1 w-full h-full cursor-grab active:cursor-grabbing mt-8 mb-12">
            <Canvas camera={{ position: [-1.5, 1.5, 4.5], fov: 45 }} dpr={[1, 2]}>
              <ambientLight intensity={0.5} />
              <directionalLight position={[10, 10, 5]} intensity={2.5} />
              <pointLight position={[-10, -10, -5]} intensity={1} />
              <Suspense fallback={null}>
                <EngineModel faultType={faultType} autoRotate={autoRotate} tick={tick} tempOffset={tempOffset} />
                <Environment preset="city" />
              </Suspense>
              <OrbitControls makeDefault enableDamping dampingFactor={0.05} maxPolarAngle={Math.PI / 2 + 0.2} minDistance={2} maxDistance={8} />
            </Canvas>
          </div>

          {/* Bottom Telemetry Grid */}
          <div className="absolute bottom-0 w-full grid grid-cols-4 border-t border-emerald-900/30 bg-[#0a0a0a] text-[9px] text-emerald-700 tracking-widest divide-x divide-emerald-900/30">
            <div className="p-2 flex flex-col gap-1">
              <span>RPM</span>
              <span className={`text-sm font-bold ${isJammed ? 'text-slate-700' : (isOverheating ? 'text-red-500' : 'text-emerald-400')}`}>{liveRPM}</span>
            </div>
            <div className="p-2 flex flex-col gap-1">
              <span>VIB HZ</span>
              <span className={`text-sm font-bold ${isJammed ? 'text-slate-700' : (faultType === 'fracture' ? 'text-red-500' : 'text-emerald-400')}`}>{isJammed ? '---' : (faultType === 'fracture' ? '4000' : '85')}</span>
            </div>
            <div className="p-2 flex flex-col gap-1">
              <span>OIL (BAR)</span>
              <span className={`text-sm font-bold ${isJammed ? 'text-slate-700' : 'text-emerald-400'}`}>{isJammed ? '--' : '4.2'}</span>
            </div>
            <div className="p-2 flex flex-col gap-1">
              <span>Fe PPM</span>
              <span className={`text-sm font-bold ${isJammed ? 'text-slate-700' : 'text-emerald-400'}`}>{isJammed ? '--' : '11'}</span>
            </div>
          </div>
        </div>

        {/* COL 2: Upgraded Professional Analytics with Area Charts */}
        <div className="col-span-3 bg-[#0d0d0d] border border-emerald-900/30 rounded p-3 h-[580px] flex flex-col gap-3 relative">
          <div className="text-[10px] font-bold text-emerald-700 tracking-widest pb-2 border-b border-emerald-900/40 flex justify-between">
            <span>LIVE EDGE TELEMETRY</span>
            <span className="text-emerald-900 animate-pulse">STREAMING 15-POINT BUFFER</span>
          </div>
          
          <div className="flex-1 border border-emerald-900/20 bg-emerald-950/5 rounded p-2 flex flex-col relative overflow-hidden">
            <div className="flex justify-between mb-2">
              <span className="text-[9px] font-bold text-emerald-600 tracking-wider">COOLANT/CHT (°C)</span>
            </div>
            {isSensorFailed && (
              <div className="absolute inset-0 bg-[#0a0a0a]/90 flex items-center justify-center p-2 text-yellow-500 text-[10px] text-center font-bold tracking-widest z-10 border border-yellow-900/50 backdrop-blur-sm">
                SENSOR FAULT DETECTED (0.00°C)
              </div>
            )}
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={telemetryData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="chtColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={isOverheating ? "#ef4444" : "#10b981"} stopOpacity={0.4}/>
                    <stop offset="95%" stopColor={isOverheating ? "#ef4444" : "#10b981"} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#064e3b" opacity={0.2} vertical={false} />
                <XAxis dataKey="time" stroke="#064e3b" fontSize={7} tickLine={false} axisLine={false} minTickGap={10} />
                <YAxis domain={[70, 130]} stroke="#064e3b" fontSize={7} tickLine={false} axisLine={false} tickCount={5} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#064e3b', strokeWidth: 1, strokeDasharray: '3 3' }} />
                <ReferenceLine y={105} stroke="#ef4444" strokeDasharray="4 4" opacity={0.6} label={{ position: 'insideTopLeft', value: 'REDLINE 105°C', fill: '#ef4444', fontSize: 7, offset: 5 }} />
                <Area type="monotone" dataKey="cht" name="CHT" stroke={isOverheating ? "#ef4444" : "#10b981"} strokeWidth={2} fillOpacity={1} fill="url(#chtColor)" isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="flex-1 border border-emerald-900/20 bg-emerald-950/5 rounded p-2 flex flex-col">
            <div className="flex justify-between mb-2">
              <span className="text-[9px] font-bold text-emerald-600 tracking-wider">EXHAUST GAS TEMP (°C)</span>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={telemetryData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="egtColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={isOverheating ? "#ef4444" : "#10b981"} stopOpacity={0.4}/>
                    <stop offset="95%" stopColor={isOverheating ? "#ef4444" : "#10b981"} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#064e3b" opacity={0.2} vertical={false} />
                <XAxis dataKey="time" stroke="#064e3b" fontSize={7} tickLine={false} axisLine={false} minTickGap={10} />
                <YAxis domain={[650, 950]} stroke="#064e3b" fontSize={7} tickLine={false} axisLine={false} tickCount={5} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#064e3b', strokeWidth: 1, strokeDasharray: '3 3' }} />
                <ReferenceLine y={850} stroke="#ef4444" strokeDasharray="4 4" opacity={0.6} label={{ position: 'insideTopLeft', value: 'REDLINE 850°C', fill: '#ef4444', fontSize: 7, offset: 5 }} />
                <Area type="monotone" dataKey="egt" name="EGT" stroke={isOverheating ? "#ef4444" : "#10b981"} strokeWidth={2} fillOpacity={1} fill="url(#egtColor)" isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="flex-1 border border-emerald-900/20 bg-emerald-950/5 rounded p-2 flex flex-col">
            <span className="text-[9px] font-bold text-emerald-600 tracking-wider mb-2">MICRO-VIBRATION FFT (Amp/Hz)</span>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={fftData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#064e3b" opacity={0.2} vertical={false} />
                <XAxis dataKey="hz" stroke="#064e3b" fontSize={7} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 100]} stroke="#064e3b" fontSize={7} tickLine={false} axisLine={false} tickCount={3} />
                <Tooltip cursor={{ fill: '#064e3b', opacity: 0.2 }} contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #064e3b', fontSize: '9px', color: '#10b981' }} />
                <Bar dataKey="amp" name="Amplitude" fill={ faultType === 'fracture' ? "#ef4444" : "#10b981" } radius={[2, 2, 0, 0]} isAnimationActive={false} />
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
                <Area type="monotone" dataKey="y" stroke={curveColor} strokeWidth={2} fillOpacity={1} fill="url(#colorCurve)" isAnimationActive={false} />
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
                  { faultType === 'fracture' ? 'CRITICAL: 4kHz resonance detected. Bearing MICRO-FRACTURE imminent.' : 'Combustion harmonics steady at 85 Hz.'}
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
              <button onClick={() => setIsHighAltitude(!isHighAltitude)} className={`border ${isHighAltitude ? 'border-emerald-500 text-emerald-400 bg-emerald-950/30' : 'border-emerald-900/30 text-emerald-700 hover:border-emerald-700 hover:text-emerald-600'} p-2 text-left transition-all flex justify-between items-center cursor-pointer`}>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] font-bold tracking-widest">HIGH ALTITUDE (15k FT)</span>
                  <span className="text-[7px] lowercase">Reduced charge density - turbo load</span>
                </div>
                <div className={`w-2 h-2 rounded-full ${isHighAltitude ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'border border-emerald-900/50'}`}></div>
              </button>
              <button onClick={() => setIsHotWeather(!isHotWeather)} className={`border ${isHotWeather ? 'border-emerald-500 text-emerald-400 bg-emerald-950/30' : 'border-emerald-900/30 text-emerald-700 hover:border-emerald-700 hover:text-emerald-600'} p-2 text-left transition-all flex justify-between items-center cursor-pointer`}>
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
                <button onClick={() => {setFaultType('snap'); setAutoRotate(false);}} className={`border ${faultType === 'snap' ? 'border-yellow-500 text-yellow-500 bg-yellow-950/20' : 'border-emerald-900/30 text-emerald-700 hover:border-emerald-700 hover:text-emerald-600'} p-2 text-left transition-all cursor-pointer`}>
                  <span className="text-[8px] font-bold tracking-widest block mb-1">SNAP CHT SENSOR</span>
                  <span className="text-[7px] block">Anti-spoofing virtual</span>
                </button>
                <button onClick={() => {setFaultType('cooling'); setAutoRotate(true);}} className={`border ${faultType === 'cooling' ? 'border-red-500 text-red-500 bg-red-950/20' : 'border-emerald-900/30 text-emerald-700 hover:border-emerald-700 hover:text-emerald-600'} p-2 text-left transition-all cursor-pointer`}>
                  <span className="text-[8px] font-bold tracking-widest block mb-1">FAIL COOLING</span>
                  <span className="text-[7px] block">Heat-soak cascade</span>
                </button>
                <button onClick={() => {setFaultType('fracture'); setAutoRotate(true);}} className={`border ${faultType === 'fracture' ? 'border-red-500 text-red-500 bg-red-950/20' : 'border-emerald-900/30 text-emerald-700 hover:border-emerald-700 hover:text-emerald-600'} p-2 text-left transition-all cursor-pointer`}>
                  <span className="text-[8px] font-bold tracking-widest block mb-1">INJECT MICRO-FRACTURE</span>
                  <span className="text-[7px] block">Predictive acoustic</span>
                </button>
                <button onClick={() => setFaultType('jamming')} className={`border ${faultType === 'jamming' ? 'border-red-500 text-red-500 bg-red-950/20' : 'border-emerald-900/30 text-emerald-700 hover:border-emerald-700 hover:text-emerald-600'} p-2 text-left transition-all cursor-pointer`}>
                  <span className="text-[8px] font-bold tracking-widest block mb-1">COMMS JAMMING</span>
                  <span className="text-[7px] block">SATCOM denial</span>
                </button>
              </div>
            </div>

            <button onClick={resetSystem} className="w-full bg-emerald-950/40 border border-emerald-800 text-emerald-400 hover:bg-emerald-900/60 py-2.5 text-[10px] font-bold tracking-widest transition-all mt-auto cursor-pointer">
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
                  <div className="flex gap-2"><span className="text-emerald-800">16:02:46</span> <span className="text-red-400">Bearing MICRO-FRACTURE highly probable.</span></div>
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
