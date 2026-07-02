import { useEffect, useState, useCallback } from 'react';
import {
  Users,
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  KeyRound,
  RefreshCw,
} from 'lucide-react';
import { userApi, roleApi, deptApi } from '@/src/http/api';
import type { UserPageVO, UserForm, OptionLong } from '@/src/http/types';

export default function UserManage() {
  const [list, setList] = useState<UserPageVO[]>([]);
  const [total, setTotal] = useState(0);
  const [pageNum, setPageNum] = useState(1);
  const [pageSize] = useState(10);
  const [keywords, setKeywords] = useState('');
  const [loading, setLoading] = useState(false);

  const [roleOptions, setRoleOptions] = useState<OptionLong[]>([]);
  const [deptOptions, setDeptOptions] = useState<OptionLong[]>([]);

  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<UserForm>(emptyForm());
  const [resetTarget, setResetTarget] = useState<number | null>(null);
  const [newPwd, setNewPwd] = useState('');

  function emptyForm(): UserForm {
    return {
      username: '',
      nickname: '',
      mobile: '',
      gender: 1,
      email: '',
      status: 1,
      deptId: undefined,
      roleIds: [],
    };
  }

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await userApi.getPage({ pageNum, pageSize, keywords: keywords || undefined });
      setList(res.list || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error('加载用户列表失败', err);
    } finally {
      setLoading(false);
    }
  }, [pageNum, pageSize, keywords]);

  useEffect(() => {
    roleApi.getOptions().then(setRoleOptions).catch(() => {});
    deptApi.getOptions().then(setDeptOptions).catch(() => {});
  }, []);

  useEffect(() => {
    loadList();
  }, [loadList]);

  const handleAdd = async () => {
    if (!form.username.trim() || !form.nickname.trim() || form.roleIds.length === 0) return;
    try {
      await userApi.create(form);
      setShowAdd(false);
      setForm(emptyForm());
      loadList();
    } catch (err) {
      console.error('新增失败', err);
      alert('新增失败');
    }
  };

  const handleEdit = async (user: UserPageVO) => {
    try {
      const formData = await userApi.getForm(user.id);
      setEditingId(user.id);
      setForm(formData);
    } catch (err) {
      console.error('加载表单失败', err);
    }
  };

  const handleSaveEdit = async () => {
    if (editingId == null) return;
    try {
      await userApi.update(editingId, form);
      setEditingId(null);
      setForm(emptyForm());
      loadList();
    } catch (err) {
      console.error('修改失败', err);
      alert('修改失败');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除该用户吗？')) return;
    try {
      await userApi.remove(String(id));
      loadList();
    } catch (err) {
      console.error('删除失败', err);
      alert('删除失败');
    }
  };

  const handleToggleStatus = async (user: UserPageVO) => {
    try {
      await userApi.updateStatus(user.id, user.status === 1 ? 0 : 1);
      loadList();
    } catch (err) {
      console.error('状态切换失败', err);
    }
  };

  const handleResetPassword = async () => {
    if (resetTarget == null || !newPwd.trim()) return;
    try {
      await userApi.resetPassword(resetTarget, newPwd);
      setResetTarget(null);
      setNewPwd('');
      alert('密码重置成功');
    } catch (err) {
      console.error('重置失败', err);
      alert('重置失败');
    }
  };

  const inputClass =
    'w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-[clamp(14px,1.05vw,20px)] text-slate-200 focus:outline-none focus:border-sky-500/50';

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="pt-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[clamp(18px,1.3vw,26px)] font-medium text-slate-100 flex items-center gap-2">
          <Users className="w-5 h-5 text-sky-500" />
          用户管理
        </h2>
        <button
          onClick={() => {
            setShowAdd(true);
            setForm(emptyForm());
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-[clamp(14px,1.05vw,20px)] text-white transition-colors"
        >
          <Plus className="w-4 h-4" />
          新增用户
        </button>
      </div>

      {/* 搜索栏 */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 mb-4 flex items-center gap-3">
        <input
          type="text"
          value={keywords}
          onChange={(e) => {
            setKeywords(e.target.value);
            setPageNum(1);
          }}
          placeholder="搜索用户名/昵称/手机号"
          className={`${inputClass} max-w-xs`}
        />
        <button
          onClick={loadList}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-[clamp(14px,1.05vw,20px)] text-slate-300"
        >
          <RefreshCw className="w-4 h-4" />
          刷新
        </button>
      </div>

      {/* 新增表单 */}
      {showAdd && (
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 mb-4">
          <h3 className="text-[clamp(14px,1.05vw,20px)] font-medium text-slate-300 mb-3">新增用户</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[clamp(14px,1.05vw,20px)] text-slate-500 mb-1">用户名 *</label>
              <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className={inputClass} placeholder="输入用户名" />
            </div>
            <div>
              <label className="block text-[clamp(14px,1.05vw,20px)] text-slate-500 mb-1">昵称 *</label>
              <input value={form.nickname} onChange={(e) => setForm({ ...form, nickname: e.target.value })} className={inputClass} placeholder="输入昵称" />
            </div>
            <div>
              <label className="block text-[clamp(14px,1.05vw,20px)] text-slate-500 mb-1">手机号</label>
              <input value={form.mobile || ''} onChange={(e) => setForm({ ...form, mobile: e.target.value })} className={inputClass} placeholder="手机号" />
            </div>
            <div>
              <label className="block text-[clamp(14px,1.05vw,20px)] text-slate-500 mb-1">邮箱</label>
              <input value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} placeholder="邮箱" />
            </div>
            <div>
              <label className="block text-[clamp(14px,1.05vw,20px)] text-slate-500 mb-1">部门</label>
              <select value={form.deptId ?? ''} onChange={(e) => setForm({ ...form, deptId: e.target.value ? Number(e.target.value) : undefined })} className={inputClass}>
                <option value="">请选择</option>
                {deptOptions.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[clamp(14px,1.05vw,20px)] text-slate-500 mb-1">角色 *</label>
              <div className="flex flex-wrap gap-2 pt-1">
                {roleOptions.map((r) => (
                  <label key={r.value} className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.roleIds.includes(r.value)}
                      onChange={(e) => {
                        const ids = e.target.checked
                          ? [...form.roleIds, r.value]
                          : form.roleIds.filter((id) => id !== r.value);
                        setForm({ ...form, roleIds: ids });
                      }}
                      className="w-3.5 h-3.5 accent-sky-500 rounded"
                    />
                    <span className="text-[clamp(14px,1.05vw,20px)] text-slate-300">{r.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleAdd} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[clamp(14px,1.05vw,20px)]">
              <Save className="w-4 h-4" />确认
            </button>
            <button onClick={() => setShowAdd(false)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[clamp(14px,1.05vw,20px)]">
              <X className="w-4 h-4" />取消
            </button>
          </div>
        </div>
      )}

      {/* 编辑表单 */}
      {editingId != null && (
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 mb-4">
          <h3 className="text-[clamp(14px,1.05vw,20px)] font-medium text-slate-300 mb-3">编辑用户 (ID: {editingId})</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[clamp(14px,1.05vw,20px)] text-slate-500 mb-1">用户名</label>
              <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="block text-[clamp(14px,1.05vw,20px)] text-slate-500 mb-1">昵称</label>
              <input value={form.nickname} onChange={(e) => setForm({ ...form, nickname: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="block text-[clamp(14px,1.05vw,20px)] text-slate-500 mb-1">手机号</label>
              <input value={form.mobile || ''} onChange={(e) => setForm({ ...form, mobile: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="block text-[clamp(14px,1.05vw,20px)] text-slate-500 mb-1">邮箱</label>
              <input value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="block text-[clamp(14px,1.05vw,20px)] text-slate-500 mb-1">部门</label>
              <select value={form.deptId ?? ''} onChange={(e) => setForm({ ...form, deptId: e.target.value ? Number(e.target.value) : undefined })} className={inputClass}>
                <option value="">请选择</option>
                {deptOptions.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[clamp(14px,1.05vw,20px)] text-slate-500 mb-1">角色</label>
              <div className="flex flex-wrap gap-2 pt-1">
                {roleOptions.map((r) => (
                  <label key={r.value} className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.roleIds.includes(r.value)}
                      onChange={(e) => {
                        const ids = e.target.checked
                          ? [...form.roleIds, r.value]
                          : form.roleIds.filter((id) => id !== r.value);
                        setForm({ ...form, roleIds: ids });
                      }}
                      className="w-3.5 h-3.5 accent-sky-500 rounded"
                    />
                    <span className="text-[clamp(14px,1.05vw,20px)] text-slate-300">{r.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-[clamp(14px,1.05vw,20px)] text-slate-500 mb-1">状态</label>
              <select value={form.status ?? 1} onChange={(e) => setForm({ ...form, status: Number(e.target.value) })} className={inputClass}>
                <option value={1}>启用</option>
                <option value={0}>禁用</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleSaveEdit} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[clamp(14px,1.05vw,20px)]">
              <Save className="w-4 h-4" />保存
            </button>
            <button onClick={() => { setEditingId(null); setForm(emptyForm()); }} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[clamp(14px,1.05vw,20px)]">
              <X className="w-4 h-4" />取消
            </button>
          </div>
        </div>
      )}

      {/* 重置密码 */}
      {resetTarget != null && (
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 mb-4">
          <h3 className="text-[clamp(14px,1.05vw,20px)] font-medium text-slate-300 mb-3">重置用户密码 (ID: {resetTarget})</h3>
          <div className="flex items-end gap-3">
            <div className="flex-1 max-w-xs">
              <label className="block text-[clamp(14px,1.05vw,20px)] text-slate-500 mb-1">新密码</label>
              <input type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} className={inputClass} placeholder="输入新密码" />
            </div>
            <button onClick={handleResetPassword} className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[clamp(14px,1.05vw,20px)]">确认</button>
            <button onClick={() => { setResetTarget(null); setNewPwd(''); }} className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[clamp(14px,1.05vw,20px)]">取消</button>
          </div>
        </div>
      )}

      {/* 用户列表 */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden overflow-x-auto">
        <table className="w-full text-[clamp(14px,1.05vw,20px)]">
          <thead>
            <tr className="border-b border-slate-800 text-slate-500">
              <th className="text-left px-5 py-3 font-medium">ID</th>
              <th className="text-left px-5 py-3 font-medium">用户名</th>
              <th className="text-left px-5 py-3 font-medium">昵称</th>
              <th className="text-left px-5 py-3 font-medium">部门</th>
              <th className="text-left px-5 py-3 font-medium">角色</th>
              <th className="text-left px-5 py-3 font-medium">手机号</th>
              <th className="text-left px-5 py-3 font-medium">状态</th>
              <th className="text-left px-5 py-3 font-medium">创建时间</th>
              <th className="text-right px-5 py-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {list.map((user) => (
              <tr key={user.id} className="hover:bg-slate-800/30 transition-colors">
                <td className="px-5 py-3 text-slate-400">{user.id}</td>
                <td className="px-5 py-3 text-slate-200">{user.username}</td>
                <td className="px-5 py-3 text-slate-200">{user.nickname || '--'}</td>
                <td className="px-5 py-3 text-slate-300">{user.deptName || '--'}</td>
                <td className="px-5 py-3 text-slate-300">{user.roleNames || '--'}</td>
                <td className="px-5 py-3 text-slate-400">{user.mobile || '--'}</td>
                <td className="px-5 py-3">
                  <button onClick={() => handleToggleStatus(user)}>
                    <span className={`inline-flex px-2 py-0.5 rounded cursor-pointer ${user.status === 1 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                      {user.status === 1 ? '启用' : '禁用'}
                    </span>
                  </button>
                </td>
                <td className="px-5 py-3 text-slate-400 whitespace-nowrap">{user.createTime || '--'}</td>
                <td className="px-5 py-3 text-right whitespace-nowrap">
                  <button onClick={() => handleEdit(user)} title="编辑" className="text-sky-400 hover:text-sky-300 mr-3">
                    <Edit2 className="w-4 h-4 inline" />
                  </button>
                  <button onClick={() => setResetTarget(user.id)} title="重置密码" className="text-amber-400 hover:text-amber-300 mr-3">
                    <KeyRound className="w-4 h-4 inline" />
                  </button>
                  <button onClick={() => handleDelete(user.id)} title="删除" className="text-rose-400 hover:text-rose-300">
                    <Trash2 className="w-4 h-4 inline" />
                  </button>
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr>
                <td colSpan={9} className="px-5 py-8 text-center text-slate-500">
                  {loading ? '加载中...' : '暂无用户数据'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 分页 */}
      <div className="flex items-center justify-between mt-4 text-[clamp(14px,1.05vw,20px)] text-slate-500">
        <span>共 {total} 条</span>
        <div className="flex items-center gap-2">
          <button
            disabled={pageNum <= 1}
            onClick={() => setPageNum((p) => p - 1)}
            className="px-3 py-1 rounded-lg bg-slate-800 disabled:opacity-40 hover:bg-slate-700 text-slate-300"
          >
            上一页
          </button>
          <span>{pageNum} / {totalPages}</span>
          <button
            disabled={pageNum >= totalPages}
            onClick={() => setPageNum((p) => p + 1)}
            className="px-3 py-1 rounded-lg bg-slate-800 disabled:opacity-40 hover:bg-slate-700 text-slate-300"
          >
            下一页
          </button>
        </div>
      </div>
    </div>
  );
}
