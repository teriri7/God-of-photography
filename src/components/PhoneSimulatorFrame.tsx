import React, { useState, useEffect } from 'react';
import { Wifi, Battery, Sparkles, Smartphone, Monitor } from 'lucide-react';

interface PhoneSimulatorFrameProps {
  children: React.ReactNode;
  isSimulator: boolean;
  onToggleSimulator: () => void;
}

export const PhoneSimulatorFrame: React.FC<PhoneSimulatorFrameProps> = ({
  children,
  isSimulator,
  onToggleSimulator,
}) => {
  const [time, setTime] = useState('12:00');
  const [isMobileScreen, setIsMobileScreen] = useState(false);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
      setTime(`${hours}:${mins}`);
    };
    updateClock();
    const timer = setInterval(updateClock, 10000);

    const checkMobile = () => {
      setIsMobileScreen(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => {
      clearInterval(timer);
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // 如果是在移动设备本身或小屏浏览器，直接沉浸式铺满全屏，并添加安全区避让手机系统状态栏
  if (isMobileScreen || !isSimulator) {
    return (
      <div className="w-full h-screen overflow-hidden flex flex-col bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100 pt-[max(env(safe-area-inset-top,0px),34px)]">
        {children}
      </div>
    );
  }

  // Windows 桌面环境：展示精致的手机外框模拟器
  return (
    <div className="w-full min-h-screen bg-slate-900/95 flex flex-col items-center justify-center p-4 relative overflow-hidden select-none">
      {/* 桌面背景装饰光晕 */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />

      {/* 顶部桌面操作提示栏 */}
      <div className="mb-3 flex items-center space-x-3 px-4 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/80 text-xs text-slate-300 shadow-lg z-20">
        <span className="flex items-center space-x-1.5 text-pink-400 font-semibold">
          <Smartphone className="w-4 h-4" />
          <span>手机端调试模式</span>
        </span>
        <span className="text-slate-500">|</span>
        <span className="text-[11px] text-slate-400">
          iPhone 15 Pro 比例视窗 (393×852)
        </span>
        <button
          onClick={onToggleSimulator}
          className="ml-2 px-2.5 py-0.5 rounded-full bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 border border-pink-500/30 text-[11px] transition-colors"
        >
          切换全屏视图
        </button>
      </div>

      {/* 手机机身模拟器外壳 */}
      <div className="relative w-[393px] h-[830px] rounded-[52px] bg-slate-950 p-[12px] shadow-[0_25px_70px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.1),0_0_20px_rgba(244,114,182,0.2)] flex flex-col z-10 transition-all duration-300 ring-1 ring-white/10">
        
        {/* 屏幕内屏 */}
        <div className="relative w-full h-full rounded-[42px] overflow-hidden bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100 flex flex-col shadow-inner">
          
          {/* 手机状态栏与灵动岛 */}
          <div className="w-full h-10 px-6 flex items-center justify-between z-30 pt-1 shrink-0 text-slate-800">
            {/* 时间 */}
            <span className="text-xs font-bold font-mono tracking-tight">{time}</span>

            {/* 灵动岛药丸 (Dynamic Island) */}
            <div className="w-24 h-6 bg-black rounded-full flex items-center justify-end px-2.5 space-x-1 shadow-xs">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-800 ring-1 ring-slate-700/80" />
              <div className="w-1.5 h-1.5 rounded-full bg-pink-500/40" />
            </div>

            {/* 信号与电量 */}
            <div className="flex items-center space-x-1 text-slate-700">
              <Wifi className="w-3.5 h-3.5" />
              <Battery className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* 手机屏幕主应用容器 */}
          <div className="flex-1 w-full overflow-hidden flex flex-col relative">
            {children}
          </div>

          {/* 手机底部 Home Bar 横条 */}
          <div className="w-full h-4 flex items-center justify-center pb-1 shrink-0">
            <div className="w-32 h-1 bg-slate-400/40 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
};
