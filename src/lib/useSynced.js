// Lớp đồng bộ dữ liệu: React state <-> Supabase (fallback localStorage nếu chưa cấu hình)
// - Lần đầu: nếu bảng trống -> nạp từ localStorage (dữ liệu cũ) hoặc dữ liệu mẫu
// - Mỗi khi state đổi: so sánh với bản trước, chỉ ghi các dòng thêm/sửa/xoá
// - Realtime: thay đổi từ máy khác tự cập nhật vào state
import { useState, useEffect, useRef } from "react";
import { sb, hasSupabase } from "./supabase";

export const load = (key, fallback) => { try { const d = localStorage.getItem("vf_" + key); return d ? JSON.parse(d) : fallback } catch { return fallback } };
export const save = (key, val) => { try { localStorage.setItem("vf_" + key, JSON.stringify(val)) } catch {} };

const snake = s => s.replace(/[A-Z]/g, m => "_" + m.toLowerCase());
const camel = s => s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
const toRow = (o, ren) => { const r = {}; for (const k in o) { if (o[k] === undefined) continue; r[ren[k] || snake(k)] = o[k] } return r };
const fromRow = (r, inv) => { const o = {}; for (const k in r) { if (r[k] === null) continue; o[inv[k] || camel(k)] = r[k] } return o };
const stable = o => JSON.stringify(o, Object.keys(o).sort());
const invert = ren => Object.fromEntries(Object.entries(ren).map(([a, b]) => [b, a]));

export function useSynced(table, fallback, opts = {}) {
  const { ren = {}, localKey = table } = opts;
  const inv = invert(ren);
  const [rows, setRows] = useState(() => hasSupabase ? [] : load(localKey, fallback));
  const [ready, setReady] = useState(!hasSupabase);
  const [error, setError] = useState(null);
  const prev = useRef(hasSupabase ? null : null);

  // Nạp lần đầu
  useEffect(() => {
    if (!hasSupabase) return;
    let alive = true;
    (async () => {
      const { data, error } = await sb.from(table).select("*");
      if (!alive) return;
      if (error) { setError(`${table}: ${error.message}`); return }
      const init = data.map(r => fromRow(r, inv)); // bảng trống thì để trống — KHÔNG tự nạp dữ liệu mẫu
      prev.current = init; setRows(init); setReady(true);
    })();
    return () => { alive = false };
  }, []);

  // Ghi thay đổi
  useEffect(() => {
    if (!hasSupabase) { save(localKey, rows); return }
    if (!ready || prev.current === null || prev.current === rows) return;
    const old = prev.current; prev.current = rows;
    const oldMap = new Map(old.map(r => [r.id, r]));
    const newIds = new Set(rows.map(r => r.id));
    const ins = rows.filter(r => !oldMap.has(r.id));
    const upd = rows.filter(r => { const o = oldMap.get(r.id); return o && stable(o) !== stable(r) });
    const del = old.filter(r => !newIds.has(r.id)).map(r => r.id);
    (async () => {
      if (ins.length) { const { error } = await sb.from(table).upsert(ins.map(o => toRow(o, ren)), { onConflict: "id", ignoreDuplicates: true }); if (error) setError(`${table}: ${error.message}`) } // trùng id (tab khác đã ghi) thì bỏ qua, không ghi đè
      for (const r of upd) { const { error } = await sb.from(table).update(toRow(r, ren)).eq("id", r.id); if (error) { setError(`${table}: ${error.message}`); break } }
      if (del.length) { const { error } = await sb.from(table).delete().in("id", del); if (error) setError(`${table}: ${error.message}`) }
    })();
  }, [rows, ready]);

  // Tải lại từ server khi quay lại tab (tránh tab bỏ quên giữ dữ liệu cũ)
  useEffect(() => {
    if (!hasSupabase || !ready) return;
    let last = Date.now();
    const onVis = async () => {
      if (document.visibilityState !== "visible" || Date.now() - last < 5000) return;
      last = Date.now();
      const { data, error } = await sb.from(table).select("*");
      if (error || !data) return;
      const fresh = data.map(r => fromRow(r, inv));
      // không đổi gì thì bỏ qua — tránh render lại làm mất form đang nhập
      const cur = new Map((prev.current || []).map(r => [r.id, stable(r)]));
      if (cur.size === fresh.length && fresh.every(r => cur.get(r.id) === stable(r))) return;
      prev.current = fresh; setRows(fresh);
    };
    document.addEventListener("visibilitychange", onVis); window.addEventListener("focus", onVis);
    return () => { document.removeEventListener("visibilitychange", onVis); window.removeEventListener("focus", onVis) };
  }, [ready]);

  // Realtime từ máy khác
  useEffect(() => {
    if (!hasSupabase || !ready) return;
    const channel = sb.channel("rt:" + table)
      .on("postgres_changes", { event: "*", schema: "public", table }, payload => {
        const applyTo = list => {
          if (payload.eventType === "DELETE") { const id = payload.old?.id; return list.filter(r => r.id !== id) }
          const o = fromRow(payload.new, inv);
          const i = list.findIndex(r => r.id === o.id);
          if (i < 0) return [...list, o];
          if (stable(list[i]) === stable(o)) return list;
          const n = list.slice(); n[i] = o; return n;
        };
        prev.current = applyTo(prev.current);
        setRows(applyTo);
      }).subscribe();
    return () => { sb.removeChannel(channel) };
  }, [ready]);

  return [rows, setRows, { ready, error }];
}

// Một giá trị đơn (bảng settings: key/value)
export function useSyncedValue(key, fallback) {
  const [val, setVal] = useState(() => hasSupabase ? fallback : load(key, fallback));
  const [ready, setReady] = useState(!hasSupabase);
  const [error, setError] = useState(null);
  const synced = useRef(null); // giá trị (JSON) đã có trên server
  // cột settings.value trên Supabase là text: giá trị không phải chuỗi (mảng/đối tượng) về dạng JSON string
  const parse = v => { if (typeof v === "string" && typeof fallback !== "string") { try { return JSON.parse(v) } catch {} } return v };

  useEffect(() => {
    if (!hasSupabase) return;
    let alive = true;
    (async () => {
      const { data, error } = await sb.from("settings").select("value").eq("key", key).maybeSingle();
      if (!alive) return;
      if (error) { setError(`settings: ${error.message}`); return }
      let v = fallback;
      if (data) v = parse(data.value);
      else { v = load(key, fallback); await sb.from("settings").upsert({ key, value: v }) } // lỗi (nếu không phải admin) bỏ qua, dùng fallback
      synced.current = JSON.stringify(v); setVal(v); setReady(true);
    })();
    return () => { alive = false };
  }, []);

  useEffect(() => {
    if (!hasSupabase) { save(key, val); return }
    if (!ready) return;
    const j = JSON.stringify(val);
    if (j === synced.current) return;
    synced.current = j;
    sb.from("settings").upsert({ key, value: val }).then(({ error }) => { if (error) setError(`settings: ${error.message}`) });
  }, [val, ready]);

  useEffect(() => {
    if (!hasSupabase || !ready) return;
    const channel = sb.channel("rt:settings:" + key)
      .on("postgres_changes", { event: "*", schema: "public", table: "settings", filter: `key=eq.${key}` }, payload => {
        if (!payload.new) return;
        const v = parse(payload.new.value), j = JSON.stringify(v);
        if (j !== synced.current) { synced.current = j; setVal(v) }
      }).subscribe();
    return () => { sb.removeChannel(channel) };
  }, [ready]);

  return [val, setVal, { ready, error }];
}
