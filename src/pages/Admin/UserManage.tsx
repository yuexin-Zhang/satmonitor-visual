import { useEffect, useState } from 'react';
import { Users, Plus, Trash2, Edit2, Save, X } from 'lucide-react';
import { fetchUsers, createUser, updateUser, deleteUser } from '@/src/api/admin';
import type { User } from '@/src/api/admin';

export default function UserManage() {
  const [userList, setUserList] = useState<User[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<User>>({});
  const [showAdd, setShowAdd] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', role: 'operator', status: 'active' });

  const loadUsers = () => {
    fetchUsers().then(setUserList).catch(() => {});
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleEdit = (user: User) => {
    setEditingId(user.id);
    setEditForm({ ...user });
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editForm) return;
    try {
      await updateUser(editingId, editForm);
      setEditingId(null);
      loadUsers();
    } catch (err) {
      console.error('更新失败', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除该用户吗？')) return;
    try {
      await deleteUser(id);
      loadUsers();
    } catch (err) {
      console.error('删除失败', err);
    }
  };

  const handleAdd = async () => {
    if (!newUser.username.trim()) return;
    try {
      await createUser(newUser);
      setShowAdd(false);
      setNewUser({ username: '', role: 'operator', status: 'active' });
      loadUsers();
    } catch (err) {
      console.error('创建失败', err);
    }
  };

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
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <label className="block text-[clamp(14px,1.05vw,20px)] text-slate-500 mb-1">用户名</label>
              <input
                type="text"
                value={newUser.username}
                onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-[clamp(14px,1.05vw,20px)] text-slate-200 focus:outline-none focus:border-sky-500/50"
                placeholder="输入用户名"
              />
            </div>
            <div>
              <label className="block text-[clamp(14px,1.05vw,20px)] text-slate-500 mb-1">角色</label>
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                className="bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-[clamp(14px,1.05vw,20px)] text-slate-200 focus:outline-none focus:border-sky-500/50"
              >
                <option value="operator">操作员</option>
                <option value="administrator">管理员</option>
              </select>
            </div>
            <button
              onClick={handleAdd}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-[clamp(14px,1.05vw,20px)] text-white transition-colors"
            >
              <Save className="w-4 h-4" />
              确认
            </button>
            <button
              onClick={() => setShowAdd(false)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-[clamp(14px,1.05vw,20px)] text-slate-300 transition-colors"
            >
              <X className="w-4 h-4" />
              取消
            </button>
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
                      className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-[clamp(14px,1.05vw,20px)] text-slate-200 focus:outline-none focus:border-sky-500/50"
                    />
                  ) : (
                    <span className="text-slate-200">{user.username}</span>
                  )}
                </td>
                <td className="px-5 py-3">
                  {editingId === user.id ? (
                    <select
                      value={editForm.role || ''}
                      onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                      className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-[clamp(14px,1.05vw,20px)] text-slate-200 focus:outline-none focus:border-sky-500/50"
                    >
                      <option value="operator">操作员</option>
                      <option value="administrator">管理员</option>
                    </select>
                  ) : (
                    <span
                      className={`inline-flex px-2 py-0.5 rounded text-[clamp(14px,1.05vw,20px)] ${
                        user.role === 'administrator'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                      }`}
                    >
                      {user.role === 'administrator' ? '管理员' : '操作员'}
                    </span>
                  )}
                </td>
                <td className="px-5 py-3">
                  {editingId === user.id ? (
                    <select
                      value={editForm.status || ''}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                      className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-[clamp(14px,1.05vw,20px)] text-slate-200 focus:outline-none focus:border-sky-500/50"
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
                    <button
                      onClick={handleSaveEdit}
                      className="text-emerald-400 hover:text-emerald-300 mr-3"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleEdit(user)}
                      className="text-sky-400 hover:text-sky-300 mr-3"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(user.id)}
                    className="text-rose-400 hover:text-rose-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {userList.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
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
