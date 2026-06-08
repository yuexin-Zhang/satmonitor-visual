import { useState } from 'react';
import { Users, Plus, Trash2, Edit2, Save, X, Eye, EyeOff } from 'lucide-react';
import { MOCK_USERS } from '@/src/http/mock';
import type { User } from '@/src/http/types';

const ROLE_OPTIONS = [
  { value: 'administrator', label: '管理员' },
  { value: 'operator', label: '操作员' },
  { value: 'viewer', label: '查看员' },
];

const DEPT_OPTIONS = ['技术部', '运维部', '工程部', '综合部'];

export default function UserManage() {
  const [userList, setUserList] = useState<User[]>([...MOCK_USERS]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<User>>({});
  const [showAdd, setShowAdd] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    department: '技术部',
    role: 'operator',
    status: 'active' as const,
  });
  const [showPwd, setShowPwd] = useState(false);

  const handleEdit = (user: User) => {
    setEditingId(user.id);
    setEditForm({ ...user });
  };

  const handleSaveEdit = () => {
    if (!editingId || !editForm) return;
    setUserList((prev) =>
      prev.map((u) => (u.id === editingId ? { ...u, ...editForm } : u)),
    );
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    if (!confirm('确定删除该用户吗？')) return;
    setUserList((prev) => prev.filter((u) => u.id !== id));
  };

  const handleAdd = () => {
    if (!newUser.username.trim() || !newUser.password.trim()) return;
    const created: User = {
      id: String(Date.now()),
      username: newUser.username,
      department: newUser.department,
      role: newUser.role,
      status: newUser.status,
      createdAt: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
    };
    setUserList((prev) => [...prev, created]);
    setShowAdd(false);
    setNewUser({ username: '', password: '', department: '技术部', role: 'operator', status: 'active' });
    setShowPwd(false);
  };

  const inputClass =
    'w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-[clamp(14px,1.05vw,20px)] text-slate-200 focus:outline-none focus:border-sky-500/50';

  return (
    <div className="pt-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[clamp(18px,1.3vw,26px)] font-medium text-slate-100 flex items-center gap-2">
          <Users className="w-5 h-5 text-sky-500" />
          用户管理
        </h2>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-[clamp(14px,1.05vw,20px)] text-white transition-colors"
        >
          <Plus className="w-4 h-4" />
          新增用户
        </button>
      </div>

      {/* 新增用户表单 */}
      {showAdd && (
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 mb-4">
          <h3 className="text-[clamp(14px,1.05vw,20px)] font-medium text-slate-300 mb-3">新增用户</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[clamp(14px,1.05vw,20px)] text-slate-500 mb-1">用户名</label>
              <input
                type="text"
                value={newUser.username}
                onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                className={inputClass}
                placeholder="输入用户名"
              />
            </div>
            <div>
              <label className="block text-[clamp(14px,1.05vw,20px)] text-slate-500 mb-1">密码</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className={`${inputClass} pr-9`}
                  placeholder="输入密码"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-[clamp(14px,1.05vw,20px)] text-slate-500 mb-1">所属部门</label>
              <select
                value={newUser.department}
                onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                className={inputClass}
              >
                {DEPT_OPTIONS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[clamp(14px,1.05vw,20px)] text-slate-500 mb-1">角色</label>
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                className={inputClass}
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={handleAdd}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[clamp(14px,1.05vw,20px)] transition-colors"
              >
                <Save className="w-4 h-4" />
                确认
              </button>
              <button
                onClick={() => setShowAdd(false)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[clamp(14px,1.05vw,20px)] transition-colors"
              >
                <X className="w-4 h-4" />
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 用户列表 */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-[clamp(14px,1.05vw,20px)]">
          <thead>
            <tr className="border-b border-slate-800 text-slate-500">
              <th className="text-left px-5 py-3 font-medium">ID</th>
              <th className="text-left px-5 py-3 font-medium">用户名</th>
              <th className="text-left px-5 py-3 font-medium">所属部门</th>
              <th className="text-left px-5 py-3 font-medium">角色</th>
              <th className="text-left px-5 py-3 font-medium">状态</th>
              <th className="text-left px-5 py-3 font-medium">创建时间</th>
              <th className="text-right px-5 py-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {userList.map((user) => (
              <tr key={user.id} className="hover:bg-slate-800/30 transition-colors">
                <td className="px-5 py-3 text-slate-400">{user.id}</td>
                <td className="px-5 py-3">
                  {editingId === user.id ? (
                    <input
                      type="text"
                      value={editForm.username || ''}
                      onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                      className={inputClass}
                    />
                  ) : (
                    <span className="text-slate-200">{user.username}</span>
                  )}
                </td>
                <td className="px-5 py-3">
                  {editingId === user.id ? (
                    <select
                      value={editForm.department || ''}
                      onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                      className={inputClass}
                    >
                      {DEPT_OPTIONS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-slate-300">{user.department || '--'}</span>
                  )}
                </td>
                <td className="px-5 py-3">
                  {editingId === user.id ? (
                    <select
                      value={editForm.role || ''}
                      onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                      className={inputClass}
                    >
                      {ROLE_OPTIONS.map((r) => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  ) : (
                    <span
                      className={`inline-flex px-2 py-0.5 rounded text-[clamp(14px,1.05vw,20px)] ${
                        user.role === 'administrator'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : user.role === 'operator'
                          ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                          : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                      }`}
                    >
                      {ROLE_OPTIONS.find((r) => r.value === user.role)?.label || user.role}
                    </span>
                  )}
                </td>
                <td className="px-5 py-3">
                  {editingId === user.id ? (
                    <select
                      value={editForm.status || ''}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value as 'active' | 'inactive' })}
                      className={inputClass}
                    >
                      <option value="active">启用</option>
                      <option value="inactive">禁用</option>
                    </select>
                  ) : (
                    <span
                      className={`inline-flex px-2 py-0.5 rounded text-[clamp(14px,1.05vw,20px)] ${
                        user.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {user.status === 'active' ? '启用' : '禁用'}
                    </span>
                  )}
                </td>
                <td className="px-5 py-3 text-slate-400">{user.createdAt}</td>
                <td className="px-5 py-3 text-right">
                  {editingId === user.id ? (
                    <button onClick={handleSaveEdit} className="text-emerald-400 hover:text-emerald-300 mr-3">
                      <Save className="w-4 h-4" />
                    </button>
                  ) : (
                    <button onClick={() => handleEdit(user)} className="text-sky-400 hover:text-sky-300 mr-3">
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                  <button onClick={() => handleDelete(user.id)} className="text-rose-400 hover:text-rose-300">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {userList.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-slate-500">
                  暂无用户数据
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
