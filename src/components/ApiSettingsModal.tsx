import React, { useState } from 'react';
import { ApiEndpoint } from '../types';
import { apiService } from '../services/apiService';
import {
  Settings,
  RefreshCw,
  Key,
  Globe,
  Check,
  AlertCircle,
  X,
  ShieldCheck,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Edit2,
  Tag,
  Radio,
} from 'lucide-react';

interface ApiSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  endpoints: ApiEndpoint[];
  activeEndpointId: string;
  onSelectEndpoint: (id: string) => void;
  onUpdateEndpoints: (endpoints: ApiEndpoint[]) => void;
  onToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const ApiSettingsModal: React.FC<ApiSettingsModalProps> = ({
  isOpen,
  onClose,
  endpoints,
  activeEndpointId,
  onSelectEndpoint,
  onUpdateEndpoints,
  onToast,
}) => {
  // 当前正在编辑的 endpoint id（为 null 表示在查看列表）
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(false);

  // 编辑表单字段
  const [name, setName] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);

  // 拉取模型状态
  const [isFetching, setIsFetching] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  if (!isOpen) return null;

  // 开始编辑某条线路
  const handleStartEdit = (ep: ApiEndpoint) => {
    setEditingId(ep.id);
    setIsCreatingNew(false);
    setName(ep.name);
    setBaseUrl(ep.baseUrl);
    setApiKey(ep.apiKey);
    setStatusMessage(null);
  };

  // 开始新增线路
  const handleStartCreate = () => {
    setEditingId(null);
    setIsCreatingNew(true);
    setName(`线路 ${endpoints.length + 1}`);
    setBaseUrl('https://');
    setApiKey('');
    setStatusMessage(null);
  };

  // 取消编辑/新增
  const handleCancelForm = () => {
    setEditingId(null);
    setIsCreatingNew(false);
    setStatusMessage(null);
  };

  // 保存当前线路
  const handleSaveForm = () => {
    if (!name.trim()) {
      setStatusMessage({ text: '请填写线路名称', type: 'error' });
      return;
    }
    if (!baseUrl.trim() || !apiKey.trim()) {
      setStatusMessage({ text: '请填写完整的 API 地址与密钥', type: 'error' });
      return;
    }

    if (isCreatingNew) {
      const newEndpoint: ApiEndpoint = {
        id: `ep-${Date.now()}`,
        name: name.trim(),
        baseUrl: baseUrl.trim(),
        apiKey: apiKey.trim(),
        models: ['[yu]gemini-3.1-flash-lite-image', '[yu1]gemini-3.1-flash-image', 'gpt-image-2'],
        selectedModel: '[yu]gemini-3.1-flash-lite-image',
        selectedVisionModel: 'tsc1-gpt-5.6-sol',
      };
      const nextList = [...endpoints, newEndpoint];
      onUpdateEndpoints(nextList);
      onSelectEndpoint(newEndpoint.id);
      onToast(`已添加并启用「${newEndpoint.name}」`, 'success');
      handleCancelForm();
    } else if (editingId) {
      const nextList = endpoints.map((ep) => {
        if (ep.id === editingId) {
          return {
            ...ep,
            name: name.trim(),
            baseUrl: baseUrl.trim(),
            apiKey: apiKey.trim(),
          };
        }
        return ep;
      });
      onUpdateEndpoints(nextList);
      onToast('已保存线路配置', 'success');
      handleCancelForm();
    }
  };

  // 删除线路
  const handleDeleteEndpoint = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (endpoints.length <= 1) {
      onToast('至少需保留一条 API 线路', 'error');
      return;
    }
    const filtered = endpoints.filter((ep) => ep.id !== id);
    onUpdateEndpoints(filtered);
    if (activeEndpointId === id) {
      onSelectEndpoint(filtered[0].id);
    }
    onToast('已删除该线路', 'info');
  };

  // 拉取指定线路的模型列表
  const handleFetchModelsForCurrent = async () => {
    const targetUrl = baseUrl.trim();
    const targetKey = apiKey.trim();

    if (!targetUrl || !targetKey) {
      setStatusMessage({ text: '请先填写 API 地址和 API Key', type: 'error' });
      return;
    }

    setIsFetching(true);
    setStatusMessage({ text: '正在拉取模型列表...', type: 'info' });

    try {
      const fetchedModels = await apiService.fetchModels(targetUrl, targetKey);
      if (editingId) {
        const nextList = endpoints.map((ep) => {
          if (ep.id === editingId) {
            return { ...ep, models: fetchedModels };
          }
          return ep;
        });
        onUpdateEndpoints(nextList);
      }
      setStatusMessage({
        text: `成功获取并缓存了 ${fetchedModels.length} 个模型！`,
        type: 'success',
      });
      onToast(`成功拉取 ${fetchedModels.length} 个模型`, 'success');
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

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-200">
      <div className="w-full max-w-sm glass-panel p-4 rounded-3xl shadow-2xl space-y-3.5 border border-pink-200/80 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* 顶部标题栏 */}
        <div className="flex items-center justify-between pb-2 border-b border-pink-200/60 shrink-0">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-pink-500 to-rose-400 text-white flex items-center justify-center shadow-sm">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-800">
                多 API 线路与服务设置
              </h3>
              <p className="text-[9px] text-slate-400">
                支持添加多个中转站并自定义名称自由切换
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

        {/* 内容区 */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-0.5 no-scrollbar">
          {/* 如果正在编辑或新增某条线路 */}
          {isCreatingNew || editingId ? (
            <div className="space-y-3 p-3 rounded-2xl bg-white/70 border border-pink-200">
              <div className="flex items-center justify-between pb-1 border-b border-pink-100">
                <span className="text-xs font-bold text-pink-700 flex items-center space-x-1">
                  <Tag className="w-3.5 h-3.5" />
                  <span>{isCreatingNew ? '添加新 API 线路' : '编辑线路配置'}</span>
                </span>
                <button
                  onClick={handleCancelForm}
                  className="text-[10px] text-slate-400 hover:text-slate-600 font-medium"
                >
                  返回列表
                </button>
              </div>

              {/* 线路自定义名称 */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-700 block">
                  自定义线路名称:
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="例如：MomoAPI、个人高速中转、备用线路"
                  className="w-full glass-input px-2.5 py-1.5 rounded-xl text-xs text-slate-800 font-medium"
                />
              </div>

              {/* API Base URL */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-700 flex items-center space-x-1">
                  <Globe className="w-3 h-3 text-pink-500" />
                  <span>API 基础地址 (Base URL):</span>
                </label>
                <input
                  type="text"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="https://api.example.com/"
                  className="w-full glass-input px-2.5 py-1.5 rounded-xl text-xs text-slate-800 font-mono"
                />
              </div>

              {/* API Key */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-700 flex items-center space-x-1">
                    <Key className="w-3 h-3 text-pink-500" />
                    <span>API 密钥 (API Key):</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="text-[9px] text-slate-400 hover:text-pink-600 flex items-center space-x-0.5"
                  >
                    {showKey ? <EyeOff className="w-2.5 h-2.5" /> : <Eye className="w-2.5 h-2.5" />}
                    <span>{showKey ? '隐藏' : '显示'}</span>
                  </button>
                </div>
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full glass-input px-2.5 py-1.5 rounded-xl text-xs text-slate-800 font-mono"
                />
              </div>

              {/* 拉取模型按钮 */}
              <div className="pt-0.5">
                <button
                  type="button"
                  onClick={handleFetchModelsForCurrent}
                  disabled={isFetching}
                  className="w-full py-1.5 px-2 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-700 text-[10px] font-bold border border-pink-200 flex items-center justify-center space-x-1 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${isFetching ? 'animate-spin' : ''}`} />
                  <span>{isFetching ? '正在请求模型列表...' : '拉取此线路可用模型'}</span>
                </button>
              </div>

              {/* 状态消息 */}
              {statusMessage && (
                <div
                  className={`p-2 rounded-xl text-[10px] flex items-center space-x-1.5 ${
                    statusMessage.type === 'success'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : statusMessage.type === 'error'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-pink-50 text-pink-700 border border-pink-200'
                  }`}
                >
                  {statusMessage.type === 'success' ? (
                    <ShieldCheck className="w-3 h-3 shrink-0" />
                  ) : (
                    <AlertCircle className="w-3 h-3 shrink-0" />
                  )}
                  <span className="flex-1">{statusMessage.text}</span>
                </div>
              )}

              {/* 保存/取消 */}
              <div className="flex space-x-2 pt-1">
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="flex-1 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleSaveForm}
                  className="flex-1 py-1.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-400 hover:from-pink-600 hover:to-rose-500 text-white text-xs font-bold shadow-xs flex items-center justify-center space-x-1"
                >
                  <Check className="w-3 h-3" />
                  <span>保存线路</span>
                </button>
              </div>
            </div>
          ) : (
            /* 线路列表模式 */
            <div className="space-y-2">
              <div className="flex items-center justify-between pb-0.5">
                <span className="text-[11px] font-bold text-slate-700">
                  已配置线路 ({endpoints.length})
                </span>
                <button
                  onClick={handleStartCreate}
                  className="px-2 py-0.8 rounded-full bg-pink-500 hover:bg-pink-600 text-white text-[10px] font-bold flex items-center space-x-1 shadow-xs active:scale-95"
                >
                  <Plus className="w-3 h-3" />
                  <span>添加线路</span>
                </button>
              </div>

              {/* 线路卡片列表 */}
              <div className="space-y-2">
                {endpoints.map((ep) => {
                  const isActive = ep.id === activeEndpointId;
                  return (
                    <div
                      key={ep.id}
                      onClick={() => onSelectEndpoint(ep.id)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer relative ${
                        isActive
                          ? 'bg-pink-50/80 border-pink-400 shadow-sm ring-1 ring-pink-300'
                          : 'bg-white/60 hover:bg-white/90 border-pink-100 hover:border-pink-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 min-w-0">
                          <div
                            className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                              isActive
                                ? 'border-pink-500 bg-pink-500 text-white'
                                : 'border-slate-300 bg-white'
                            }`}
                          >
                            {isActive && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                          <span className="text-xs font-bold text-slate-800 truncate">
                            {ep.name}
                          </span>
                          {isActive && (
                            <span className="text-[9px] px-1.5 py-0.2 bg-pink-200 text-pink-800 rounded-full font-bold shrink-0">
                              当前使用
                            </span>
                          )}
                        </div>

                        {/* 操作区 */}
                        <div className="flex items-center space-x-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleStartEdit(ep)}
                            title="编辑"
                            className="p-1 rounded-lg hover:bg-pink-100 text-slate-500 hover:text-pink-600 transition-colors"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          {endpoints.length > 1 && (
                            <button
                              onClick={(e) => handleDeleteEndpoint(ep.id, e)}
                              title="删除"
                              className="p-1 rounded-lg hover:bg-rose-100 text-slate-400 hover:text-rose-600 transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* URL 与模型信息 */}
                      <div className="mt-1 pl-5.5 text-[10px] space-y-0.5">
                        <p className="text-slate-500 font-mono truncate">{ep.baseUrl}</p>
                        <div className="flex items-center justify-between text-slate-400 text-[9px]">
                          <span>已缓存模型: {ep.models?.length || 0} 个</span>
                          <span>默认: {ep.selectedModel || ep.models?.[0] || '默认'}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 底部完成按钮 */}
        <div className="pt-2 border-t border-pink-100 shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-400 hover:from-pink-600 hover:to-rose-500 text-white text-xs font-bold shadow-md shadow-pink-300/50 flex items-center justify-center space-x-1"
          >
            <Check className="w-3.5 h-3.5" />
            <span>完成</span>
          </button>
        </div>
      </div>
    </div>
  );
};

