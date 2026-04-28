import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Eye, EyeOff } from 'lucide-react';
import { login } from '@/src/api/admin';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await login({ username, password });
      localStorage.setItem('admin_token', res.token);
      localStorage.setItem('admin_user', JSON.stringify(res.user));
      navigate('/admin/config');
    } catch (err: any) {
      setError(err.message || '登录失败');
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
              <Shield className="w-6 h-6 text-sky-500" />
            </div>
            <h1 className="text-[clamp(22px,1.7vw,36px)] font-bold text-slate-100">管理后台登录</h1>
            <p className="text-[clamp(14px,1.05vw,20px)] text-slate-500 mt-1">卫星天线智能可视化监管系统</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[clamp(14px,1.05vw,20px)] text-slate-400 mb-1.5">用户名</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-[clamp(14px,1.05vw,20px)] text-slate-200 focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/20 transition-colors"
                placeholder="请输入用户名"
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
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[clamp(14px,1.05vw,20px)] text-slate-600 mt-1.5">Mock 账号: admin / admin123</p>
            </div>

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

          {/* Back to dashboard */}
          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/')}
              className="text-[clamp(14px,1.05vw,20px)] text-slate-500 hover:text-sky-400 transition-colors"
            >
              ← 返回可视化大屏
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
