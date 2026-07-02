import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Satellite, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { authApi, userApi } from '@/src/http/api';
import type { CaptchaInfo } from '@/src/http/types';

export default function MonitorLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [captchaCode, setCaptchaCode] = useState('');
  const [captcha, setCaptcha] = useState<CaptchaInfo | null>(null);
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadCaptcha = useCallback(async () => {
    try {
      const data = await authApi.captcha();
      setCaptcha(data);
      setCaptchaCode('');
    } catch (err) {
      // 验证码加载失败不阻塞登录（后端可能未开启验证码）
      console.error('验证码加载失败', err);
    }
  }, []);

  useEffect(() => {
    loadCaptcha();
  }, [loadCaptcha]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password.trim()) {
      setError('请输入账号和密码');
      return;
    }
    setLoading(true);
    try {
      const token = await authApi.login({
        username: username.trim(),
        password,
        captchaKey: captcha?.captchaKey,
        captchaCode: captchaCode.trim() || undefined,
      });
      localStorage.setItem('monitor_token', token.accessToken);
      localStorage.setItem('monitor_refresh_token', token.refreshToken);
      // 拉取当前用户信息（失败不阻塞登录）
      try {
        const user = await userApi.getCurrentUser();
        localStorage.setItem('monitor_user', JSON.stringify(user));
      } catch {
        /* ignore */
      }
      navigate('/');
    } catch (err: any) {
      const msg =
        err?.response?.data?.msg ||
        err?.message ||
        '登录失败，请检查账号和密码';
      setError(msg);
      loadCaptcha();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-sky-500/10 rounded-xl flex items-center justify-center mx-auto mb-4 border border-sky-500/20">
              <Satellite className="w-6 h-6 text-sky-500" />
            </div>
            <h1 className="text-[clamp(22px,1.7vw,36px)] font-bold text-slate-100">监管系统登录</h1>
            <p className="text-[clamp(14px,1.05vw,20px)] text-slate-500 mt-1">卫星天线智能可视化监管</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[clamp(14px,1.05vw,20px)] text-slate-400 mb-1.5">账号</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-[clamp(14px,1.05vw,20px)] text-slate-200 focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/20 transition-colors"
                placeholder="请输入账号"
                autoComplete="username"
              />
            </div>

            <div>
              <label className="block text-[clamp(14px,1.05vw,20px)] text-slate-400 mb-1.5">密码</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 pr-10 text-[clamp(14px,1.05vw,20px)] text-slate-200 focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/20 transition-colors"
                  placeholder="请输入密码"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* 验证码 */}
            {captcha && (
              <div>
                <label className="block text-[clamp(14px,1.05vw,20px)] text-slate-400 mb-1.5">验证码</label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={captchaCode}
                    onChange={(e) => setCaptchaCode(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-[clamp(14px,1.05vw,20px)] text-slate-200 focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/20 transition-colors"
                    placeholder="请输入验证码"
                  />
                  <button
                    type="button"
                    onClick={loadCaptcha}
                    title="点击刷新验证码"
                    className="shrink-0 h-[42px] rounded-lg overflow-hidden border border-slate-800 bg-slate-950 flex items-center"
                  >
                    {captcha.captchaBase64 ? (
                      <img
                        src={captcha.captchaBase64}
                        alt="验证码"
                        className="h-full max-w-[120px] object-contain"
                      />
                    ) : (
                      <RefreshCw className="w-4 h-4 text-slate-500 mx-3" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg px-4 py-2.5 text-[clamp(14px,1.05vw,20px)] text-rose-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-sky-600 hover:bg-sky-500 disabled:bg-sky-800 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg text-[clamp(14px,1.05vw,20px)] transition-colors"
            >
              {loading ? '登录中...' : '登录'}
            </button>
          </form>

          {/* Back to admin */}
          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/admin/login')}
              className="text-[clamp(14px,1.05vw,20px)] text-slate-500 hover:text-sky-400 transition-colors"
            >
              前往管理后台 →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
