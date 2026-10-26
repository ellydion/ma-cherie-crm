'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useProfileStore } from '@/lib/store/profileStore';
import { useSettingsStore } from '@/lib/store/settingsStore';
import { useZone } from '@/lib/useZone';
import { toast } from '@/lib/store/toastStore';
import { friendlyError } from '@/lib/errors';
import { AppSettings, LOYALTY_LEVELS } from '@/lib/settings';
import { zoneLabel } from '@/lib/zone';

const input = 'w-full bg-[#2C241E] border border-[#5C4030] rounded-2xl px-4 py-3';

function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <label className="flex items-start justify-between gap-4 py-2 cursor-pointer">
      <span>
        <span className="block">{label}</span>
        {hint && <span className="block text-sm text-[#C8A77E]">{hint}</span>}
      </span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-1 w-5 h-5 accent-[#C8A77E] shrink-0" />
    </label>
  );
}

function NumberField({ value, onChange, label, hint, min = 0, max, step = 1 }: { value: number; onChange: (v: number) => void; label: string; hint?: string; min?: number; max?: number; step?: number }) {
  return (
    <label className="block py-2">
      <span className="block mb-1">{label}</span>
      <input type="number" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className={input} />
      {hint && <span className="block text-sm text-[#C8A77E] mt-1">{hint}</span>}
    </label>
  );
}

/** Своя карточка сотрудника: имя, должность, телефон, аватар. Роль и зону здесь не меняют. */
function ProfileForm() {
  const profileId = useProfileStore((s) => s.profile?.id);
  return <ProfileFields key={profileId || 'none'} />;
}

function ProfileFields() {
  const { profile, updateProfile } = useProfileStore();
  const [name, setName] = useState(profile?.name || '');
  const [position, setPosition] = useState(profile?.position || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [avatar, setAvatar] = useState(profile?.avatar || '');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!profile?.id || saving) return;
    if (!name.trim()) { toast.error('Имя обязательно'); return; }
    const payload = { name: name.trim(), position: position.trim(), phone: phone.trim() || null, avatar: avatar.trim() || null };
    setSaving(true);
    const { data, error } = await supabase.from('profiles').update(payload).eq('id', profile.id).select('id');
    setSaving(false);
    if (error) { toast.error(friendlyError(error)); return; }
    if (!data?.length) { toast.error('Профиль не найден или нет прав на изменение'); return; }
    updateProfile({ name: payload.name, position: payload.position, phone: payload.phone || '', avatar: payload.avatar || profile.avatar });
    toast.success('Профиль сохранён');
  };

  return (
    <div className="card p-6 space-y-3">
      <h2 className="text-xl font-semibold">Мой профиль</h2>
      <p className="text-sm text-[#C8A77E]">{profile?.email} · зона: {zoneLabel(profile?.zone || 'all')}</p>
      <label className="block"><span className="block mb-1">Имя</span><input value={name} onChange={(e) => setName(e.target.value)} className={input} /></label>
      <label className="block"><span className="block mb-1">Должность</span><input value={position} onChange={(e) => setPosition(e.target.value)} className={input} /></label>
      <label className="block"><span className="block mb-1">Телефон</span><input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" className={input} /></label>
      <label className="block"><span className="block mb-1">Аватар (эмодзи)</span><input value={avatar} onChange={(e) => setAvatar(e.target.value)} maxLength={8} className={input} /></label>
      <button type="button" onClick={save} disabled={saving} className="btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-60">
        {saving && <Loader2 className="w-4 h-4 animate-spin" />} Сохранить профиль
      </button>
    </div>
  );
}

/** Настройки заведения: только для админа. Запись дополнительно защищена RLS (is_admin()). */
function AdminSettings() {
  const { settings, loaded, load } = useSettingsStore();
  useEffect(() => { void load(); }, [load]);
  if (!loaded) return <p className="text-[#C8A77E]">Загрузка настроек...</p>;
  return <AdminForm initial={settings} />;
}

function AdminForm({ initial }: { initial: AppSettings }) {
  const save = useSettingsStore((s) => s.save);
  const [form, setForm] = useState<AppSettings>(initial);
  const [saving, setSaving] = useState(false);

  const pos = form.pos;
  const setPos = (patch: Partial<AppSettings['pos']>) => setForm((f) => ({ ...f, pos: { ...f.pos, ...patch } }));

  const onSave = async () => {
    if (saving) return;
    if (!pos.cashEnabled && !pos.transferEnabled) { toast.error('Нужен хотя бы один способ оплаты'); return; }
    setSaving(true);
    const err = await save(form);
    setSaving(false);
    if (err) toast.error(err); else toast.success('Настройки сохранены');
  };

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h2 className="text-xl font-semibold mb-2">Касса</h2>
        <Toggle label="Десерты в кофейне" hint="Десерты видны на кассе кофейни, а их продажи у баристы в дашборде и отчётах" checked={pos.dessertsInCoffee} onChange={(v) => setPos({ dessertsInCoffee: v })} />
        <Toggle label="Показывать скрытые товары на кассе" hint="Товары, убранные в техкартах (дубли и снятые позиции)" checked={pos.showHiddenOnPos} onChange={(v) => setPos({ showHiddenOnPos: v })} />
        <Toggle label="Автосписание по техкартам" hint="При продаже списывать ингредиенты и остатки товара" checked={pos.autoWriteOff} onChange={(v) => setPos({ autoWriteOff: v })} />
        <Toggle label="Оплата наличными" checked={pos.cashEnabled} onChange={(v) => setPos({ cashEnabled: v })} />
        <Toggle label="Оплата переводом" checked={pos.transferEnabled} onChange={(v) => setPos({ transferEnabled: v })} />
        <label className="block py-2"><span className="block mb-1">Стол по умолчанию</span><input value={pos.defaultTable} onChange={(e) => setPos({ defaultTable: e.target.value })} className={input} /></label>
      </div>

      <div className="card p-6">
        <h2 className="text-xl font-semibold mb-2">Лояльность</h2>
        <div className="grid grid-cols-2 gap-3">
          {LOYALTY_LEVELS.map((l) => (
            <NumberField key={l} label={`Скидка ${l}, %`} min={0} max={100} value={pos.loyaltyDiscounts[l]}
              onChange={(v) => setPos({ loyaltyDiscounts: { ...pos.loyaltyDiscounts, [l]: v } })} />
          ))}
        </div>
        <NumberField label="Сомов за 1 балл" hint="0 отключает начисление баллов" min={0} value={pos.somPerPoint} onChange={(v) => setPos({ somPerPoint: v })} />
      </div>

      <div className="card p-6">
        <h2 className="text-xl font-semibold mb-2">Склад и экраны</h2>
        <NumberField label="Минимальный остаток для нового ингредиента" min={0} step={0.01} value={form.inventory.defaultMinThreshold}
          onChange={(v) => setForm((f) => ({ ...f, inventory: { ...f.inventory, defaultMinThreshold: v } }))} />
        <NumberField label="Автообновление дашборда, отчётов и смен, сек" min={5} max={600} value={pos.refreshSeconds} onChange={(v) => setPos({ refreshSeconds: v })} />
      </div>

      <div className="card p-6">
        <h2 className="text-xl font-semibold mb-2">Заведение</h2>
        <label className="block py-2"><span className="block mb-1">Название в меню</span>
          <input value={form.company.name} onChange={(e) => setForm((f) => ({ ...f, company: { ...f.company, name: e.target.value } }))} className={input} />
        </label>
      </div>

      <button type="button" onClick={onSave} disabled={saving} className="btn-primary w-full py-4 flex items-center justify-center gap-2 disabled:opacity-60">
        {saving && <Loader2 className="w-4 h-4 animate-spin" />} Сохранить настройки
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const { isAdmin } = useZone();

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-3xl sm:text-4xl font-semibold">Настройки</h1>
      {isAdmin ? (
        <>
          <AdminSettings />
          <ProfileForm />
        </>
      ) : (
        <>
          <ProfileForm />
          <p className="text-sm text-[#C8A77E]">
            Данные гостей (имя, телефон, уровень) вносятся в разделе <Link href="/customers" className="underline">Клиенты</Link>.
            Настройки заведения меняет администратор.
          </p>
        </>
      )}
    </div>
  );
}
