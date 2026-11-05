import { ApiError } from '../../shared/errors.js';

export interface RegistrationEvent {
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED';
  registration_closes_at: Date;
  capacity: number;
}

export function assertRegistrationOpen(event: RegistrationEvent | null, now: Date): void {
  if (!event || event.status === 'DRAFT') {
    throw new ApiError(404, 'EVENT_NOT_FOUND', 'ไม่พบกิจกรรม');
  }
  if (event.status !== 'PUBLISHED' || now.getTime() >= event.registration_closes_at.getTime()) {
    throw new ApiError(409, 'REGISTRATION_CLOSED', 'กิจกรรมนี้ปิดรับลงทะเบียนแล้ว');
  }
}

export function assertSeatAvailable(alreadyRegistered: boolean, count: number, capacity: number): void {
  if (alreadyRegistered) throw new ApiError(409, 'ALREADY_REGISTERED', 'คุณลงทะเบียนกิจกรรมนี้แล้ว');
  if (count >= capacity) throw new ApiError(409, 'EVENT_FULL', 'กิจกรรมเต็มแล้ว');
}

