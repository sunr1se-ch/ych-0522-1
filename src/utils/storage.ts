import type { BestRecord } from '@/types';

const STORAGE_KEY = 'breath-training-best-records';

export function getBestRecord(musicId: string): BestRecord | null {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;
    const records = JSON.parse(data) as Record<string, BestRecord>;
    return records[musicId] || null;
  } catch {
    return null;
  }
}

export function saveBestRecord(record: BestRecord): boolean {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    const records: Record<string, BestRecord> = data ? JSON.parse(data) : {};
    const existing = records[record.musicId];

    if (!existing || isBetterRecord(record, existing)) {
      records[record.musicId] = record;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

function isBetterRecord(newRecord: BestRecord, oldRecord: BestRecord): boolean {
  if (newRecord.totalHitRate > oldRecord.totalHitRate) return true;
  if (newRecord.totalHitRate < oldRecord.totalHitRate) return false;
  if (newRecord.maxCombo > oldRecord.maxCombo) return true;
  if (newRecord.maxCombo < oldRecord.maxCombo) return false;
  return newRecord.averageDeviation < oldRecord.averageDeviation;
}

export function clearAllRecords(): void {
  localStorage.removeItem(STORAGE_KEY);
}
