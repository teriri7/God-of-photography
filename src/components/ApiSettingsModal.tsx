import React, { useState } from 'react';
import { ApiConfig } from '../types';
import { apiService } from '../services/apiService';
import { Settings, RefreshCw, Key, Globe, Check, AlertCircle, X, ShieldCheck, Eye, EyeOff } from 'lucide-react';

interface ApiSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ApiConfig;
  onSaveConfig: (newConfig: ApiConfig) => void;
  models: string[];
  onUpdateModels: (models: string[]) => void;
}

export const ApiSettingsModal: React.FC<ApiSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  models,
  onUpdateModels,
}) => {
  const [baseUrl, setBaseUrl] = useState(config.baseUrl);
  const [apiKey, setApiKey] = useState(config.apiKey);
  const [isFetching, setIsFetching] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [showKey, setShowKey] = useState(false);

  if (!isOpen) return null;

  const handleFetchModels = async () => {
    if (!baseUrl.trim() || !apiKey.trim()) {
      setStatusMessage({ text: '请先填写 API 地址和 API Key', type: 'error' });
      return;
    }

    setIsFetching(true);
    setStatusMessage({ text: '正在拉取模型列表...', type: 'info' });

    try {
      const fetchedModels = await apiService.fetchModels(baseUrl, apiKey);
      onUpdateModels(fetchedModels);
      setStatusMessage({
        text: `成功获取并缓存了 ${fetchedModels.length} 个模型！`,
        type: 'success',
      });
    } catch (err: any) {
      console.error(err);
      setStatusMessage({
        text: err.message || '拉取模型列表失败，请检查网络或 Key',
        type: 'error',
      });
    } finally {
      setIsFetching(false);
    }
  };

  const handleSave = () => {
    onSaveConfig({
      baseUrl: baseUrl.trim(),
      apiKey: apiKey.trim(),
      selectedModel: config.selectedModel,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm glass-panel p-5 rounded-3xl shadow-2xl space-y-4 border border-pink-200/80 animate-in zoom-in-95 duration-200">
        {/* 标题 */}
        <div className="flex items-center justify-between pb-2 border-b border-pink-200/60">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-pink-500 text-white flex items-center justify-center shadow-sm">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                API 与模型服务设置
              </h3>
              <p className="text-[10px] text-slate-400">
                支持 NewAPI / OpenAI 格式第三方中转站
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 表单输入 */}
        <div className="space-y-3.5">
          {/* API 网址 */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 flex items-center space-x-1">
              <Globe className="w-3.5 h-3.5 text-pink-500" />
              <span>API 基础地址 (Base URL)</span>
            </label>
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://api.example.com/"
              className="w-full glass-input px-3 py-2 rounded-xl text-xs text-slate-800 font-mono"
            />
            <span className="text-[10px] text-pink-400 block pl-1">
              默认已预填: https://api.momoapi.icu/
            </span>
          </div>

          {/* API Key */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
              <span className="flex items-center space-x-1">
                <Key className="w-3.5 h-3.5 text-pink-500" />
                <span>API 密钥 (API Key)</span>
              </span>
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="text-[10px] text-slate-400 hover:text-pink-600 flex items-center space-x-0.5"
              >
                {showKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                <span>{showKey ? '隐藏' : '显示'}</span>
              </button>
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full glass-input px-3 py-2 rounded-xl text-xs text-slate-800 font-mono pr-8"
              />
            </div>
            <span className="text-[10px] text-pink-400 block pl-1">
              已默认载入专用 Key，可直接拉取模型测试
            </span>
          </div>

          {/* 拉取模型列表按钮 */}
          <div className="pt-1">
            <button
              onClick={handleFetchModels}
              disabled={isFetching}
              className="w-full py-2 px-3 rounded-xl bg-pink-100 hover:bg-pink-200/80 text-pink-700 text-xs font-bold transition-all flex items-center justify-center space-x-1.5 border border-pink-200 active:scale-98 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
              <span>{isFetching ? '正在请求中转站模型...' : '一键拉取模型列表'}</span>
            </button>
          </div>

          {/* 状态提示信息 */}
          {statusMessage && (
            <div
              className={`p-2 rounded-xl text-[11px] flex items-center space-x-1.5 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : statusMessage.type === 'error'
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : 'bg-pink-50 text-pink-700 border border-pink-200'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              )}
              <span className="flex-1">{statusMessage.text}</span>
            </div>
          )}

          {/* 当前缓存模型展示 */}
          <div className="p-2.5 rounded-xl bg-white/50 border border-pink-100 text-[11px] text-slate-600 space-y-1">
            <div className="flex justify-between font-semibold">
              <span>当前已保存模型数:</span>
              <span className="font-mono text-pink-600 font-bold">{models.length} 款</span>
            </div>
            <p className="text-[10px] text-slate-400 truncate">
              主界面已默认匹配 [yu]gemini-3.1-flash-lite-image
            </p>
          </div>
        </div>

        {/* 底部保存按钮 */}
        <div className="pt-2 flex space-x-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-semibold hover:bg-slate-200 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-400 hover:from-pink-600 hover:to-rose-500 text-white text-xs font-bold shadow-md shadow-pink-300/50 transition-all flex items-center justify-center space-x-1"
          >
            <Check className="w-3.5 h-3.5" />
            <span>保存配置</span>
          </button>
        </div>
      </div>
    </div>
  );
};
