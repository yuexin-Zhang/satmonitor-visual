import { useEffect, useState } from 'react';
import { UserCircle, Save, KeyRound } from 'lucide-react';
import { profileApi } from '@/src/http/api';
import type { UserProfileVO, UserProfileForm, PasswordUpdateForm } from '@/src/http/types';

export default function Profile() {
  const [profile, setProfile] = useState<UserProfileVO | null>(null);
  const [form, setForm] = useState<UserProfileForm>({});
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [pwdForm, setPwdForm] = useState<PasswordUpdateForm>({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [pwdSaving, setPwdSaving] = useState(false);

  const load = async () => {
    try {
      const res = await profileApi.get();
      setProfile(res);
      setForm({ nickname: res.nickname, avatar: res.avatar, gender: res.gender, mobile: res.mobile, email: res.email });
    } catch (err) { console.error(err); }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await profileApi.update(form);
      setEditing(false);
      load();
      alert('个人信息已更新');
    } catch (err) { console.error(err); alert('保存失败'); }
    finally { setSaving(false); }
  };

  const handleChangePassword = async () => {
    if (!pwdForm.newPassword || pwdForm.newPassword !== pwdForm.confirmPassword) {
      alert('两次密码输入不一致');
      return;
    }
    setPwdSaving(true);
    try {
      await profileApi.changePassword(pwdForm);
      setPwdForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      alert('密码修改成功');
    } catch (err) { console.error(err); alert('密码修改失败'); }
    finally { setPwdSaving(false); }
  };

  const inputClass = 'w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-[clamp(14px,1.05vw,20px)] text-slate-200 focus:outline-none focus:border-sky-500/50';

  return (
    <div className="pt-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[clamp(18px,1.3vw,26px)] font-medium text-slate-100 flex items-center gap-2">
          <UserCircle className="w-5 h-5 text-sky-500" />个人中心
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 个人信息 */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[clamp(16px,1.2vw,24px)] font-medium text-slate-200">基本信息</h3>
            {!editing ? (
              <button onClick={() => setEditing(true)} className="text-[clamp(14px,1.05vw,20px)] text-sky-400 hover:text-sky-300">编辑</button>
            ) : (
              <div className="flex gap-2">
                <button onClick={handleSave} disabled={saving} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-[clamp(14px,1.05vw,20px)]"><Save className="w-3.5 h-3.5" />保存</button>
                <button onClick={() => { setEditing(false); if (profile) setForm({ nickname: profile.nickname, avatar: profile.avatar, gender: profile.gender, mobile: profile.mobile, email: profile.email }); }} className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[clamp(14px,1.05vw,20px)]">取消</button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-sky-500/20 flex items-center justify-center text-[clamp(22px,1.6vw,34px)] text-sky-400 font-bold">
                {(profile?.nickname || profile?.username || '?')[0]?.toUpperCase()}
              </div>
              <div>
                <div className="text-[clamp(16px,1.2vw,24px)] text-slate-200 font-medium">{profile?.nickname || '--'}</div>
                <div className="text-[clamp(14px,1.05vw,20px)] text-slate-500">@{profile?.username}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-[clamp(14px,1.05vw,20px)]">
              {editing ? (
                <>
                  <div><label className="block text-slate-500 mb-1">昵称</label><input value={form.nickname || ''} onChange={(e) => setForm({ ...form, nickname: e.target.value })} className={inputClass} /></div>
                  <div><label className="block text-slate-500 mb-1">性别</label><select value={form.gender ?? 0} onChange={(e) => setForm({ ...form, gender: Number(e.target.value) })} className={inputClass}><option value={0}>未知</option><option value={1}>男</option><option value={2}>女</option></select></div>
                  <div><label className="block text-slate-500 mb-1">手机号</label><input value={form.mobile || ''} onChange={(e) => setForm({ ...form, mobile: e.target.value })} className={inputClass} /></div>
                  <div><label className="block text-slate-500 mb-1">邮箱</label><input value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} /></div>
                </>
              ) : (
                <>
                  <div><span className="text-slate-500">部门</span><div className="text-slate-200 mt-1">{profile?.deptName || '--'}</div></div>
                  <div><span className="text-slate-500">角色</span><div className="text-slate-200 mt-1">{profile?.roleNames || '--'}</div></div>
                  <div><span className="text-slate-500">手机号</span><div className="text-slate-200 mt-1">{profile?.mobile || '--'}</div></div>
                  <div><span className="text-slate-500">邮箱</span><div className="text-slate-200 mt-1">{profile?.email || '--'}</div></div>
                  <div><span className="text-slate-500">创建时间</span><div className="text-slate-200 mt-1">{profile?.createTime || '--'}</div></div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 修改密码 */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
          <h3 className="text-[clamp(16px,1.2vw,24px)] font-medium text-slate-200 mb-4 flex items-center gap-2"><KeyRound className="w-4 h-4 text-sky-500" />修改密码</h3>
          <div className="space-y-4">
            <div><label className="block text-[clamp(14px,1.05vw,20px)] text-slate-500 mb-1">原密码</label><input type="password" value={pwdForm.oldPassword} onChange={(e) => setPwdForm({ ...pwdForm, oldPassword: e.target.value })} className={inputClass} /></div>
            <div><label className="block text-[clamp(14px,1.05vw,20px)] text-slate-500 mb-1">新密码</label><input type="password" value={pwdForm.newPassword} onChange={(e) => setPwdForm({ ...pwdForm, newPassword: e.target.value })} className={inputClass} /></div>
            <div><label className="block text-[clamp(14px,1.05vw,20px)] text-slate-500 mb-1">确认密码</label><input type="password" value={pwdForm.confirmPassword} onChange={(e) => setPwdForm({ ...pwdForm, confirmPassword: e.target.value })} className={inputClass} /></div>
            <button onClick={handleChangePassword} disabled={pwdSaving} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-[clamp(14px,1.05vw,20px)]"><Save className="w-4 h-4" />确认修改</button>
          </div>
        </div>
      </div>
    </div>
  );
}
