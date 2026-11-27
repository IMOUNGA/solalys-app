import type { AttendanceStatus } from '@/types/event';

export const ATTENDANCE_LABEL: Record<AttendanceStatus, string> = {
  present: 'Présent',
  late: 'En retard',
  excused: 'Absence prévenue',
  absent: 'Absent',
};

export const ATTENDANCE_COLOR: Record<AttendanceStatus, { bg: string; text: string }> = {
  present: { bg: '#DCFCE7', text: '#15803D' },
  late: { bg: '#FEF3C7', text: '#B45309' },
  excused: { bg: '#E0E7FF', text: '#4338CA' },
  absent: { bg: '#FEE2E2', text: '#B91C1C' },
};

export const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

const normalizeTitle = (title: string) =>
  title.trim().toLowerCase().replace(/\s+/g, ' ').replace(/[‐-―]/g, '-');

/** Même règle que le serveur : case cochée, sinon président, vice-président ou secrétaire. */
export function roleManagesAttendance(role: { title: string; manageAttendance?: boolean | null }): boolean {
  if (role.manageAttendance !== null && role.manageAttendance !== undefined) return role.manageAttendance;
  const t = normalizeTitle(role.title);
  return /^présidente?$/.test(t) || /^vice-? ?présidente?$/.test(t) || /^secrétaire( général(e)?)?$/.test(t);
}
