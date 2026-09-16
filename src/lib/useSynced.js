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
      let init = data.map(r => fromRow(r, inv));
      if (init.length === 0) {
        const local = load(localKey, null);
        const seed = Array.isArray(local) && local.length ? local : fallback;
        if (seed.length) {
          const { error: e2 } = await sb.from(table).insert(seed.map(o => toRow(o, ren)));
          if (e2) setError(`${table}: ${e2.message}`); else init = seed;
        }
      }
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
    const up = rows.filter(r => { const o = oldMap.get(r.id); return !o || stable(o) !== stable(r) });
    const del = old.filter(r => !newIds.has(r.id)).map(r => r.id);
    (async () => {
      if (up.length) { const { error } = await sb.from(table).upsert(up.map(o => toRow(o, ren))); if (error) setError(`${table}: ${error.message}`) }
      if (del.length) { const { error } = await sb.from(table).delete().in("id", del); if (error) setError(`${table}: ${error.message}`) }
    })();
  }, [rows, ready]);

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

  useEffect(() => {
    if (!hasSupabase) return;
    let alive = true;
    (async () => {
      const { data, error } = await sb.from("settings").select("value").eq("key", key).maybeSingle();
      if (!alive) return;
      if (error) { setError(`settings: ${error.message}`); return }
      let v = fallback;
      if (data) v = data.value;
      else { v = load(key, fallback); await sb.from("settings").upsert({ key, value: v }) }
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
        const j = JSON.stringify(payload.new.value);
        if (j !== synced.current) { synced.current = j; setVal(payload.new.value) }
      }).subscribe();
    return () => { sb.removeChannel(channel) };
  }, [ready]);

  return [val, setVal, { ready, error }];
}
