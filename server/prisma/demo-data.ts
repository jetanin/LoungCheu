import type { EventStatus, PrismaClient } from '@prisma/client';
import { demoUsers } from '../src/modules/accounts/seed.js';

export const demoEventIds = {
  open: 'de202600-0000-4000-8000-000000000001',
  full: 'de202600-0000-4000-8000-000000000002',
  expired: 'de202600-0000-4000-8000-000000000003',
  draft: 'de202600-0000-4000-8000-000000000004',
  closed: 'de202600-0000-4000-8000-000000000005',
  otherOwner: 'de202600-0000-4000-8000-000000000006',
} as const;

type Scenario = { id: string; title: string; description: string; location: string; capacity: number; status: EventStatus;
  owner: string; startDays: number; startHour: number; endHour: number; closeDays: number; attendees: string[] };
const scenarios: Scenario[] = [
  { id: demoEventIds.open, title: '[DEMO] React Workshop เริ่มสร้างเว็บด้วยกัน', description: 'เรียนรู้พื้นฐาน React และลองสร้างหน้าเว็บร่วมกับเพื่อน เหมาะสำหรับผู้เริ่มต้น', location: 'อาคารเรียนรวม ห้องคอมพิวเตอร์ 301', capacity: 3, status: 'PUBLISHED',
    owner: 'organizer.a', startDays: 7, startHour: 9, endHour: 12, closeDays: 6, attendees: ['participant.b'] },
  { id: demoEventIds.full, title: '[DEMO] เวิร์กช็อปถ่ายภาพในมหาวิทยาลัย', description: 'ฝึกจัดองค์ประกอบภาพและออกเดินถ่ายภาพในมหาวิทยาลัย รับกลุ่มเล็กเพื่อให้คำแนะนำทั่วถึง', location: 'ลานกิจกรรมกลางมหาวิทยาลัย', capacity: 2, status: 'PUBLISHED',
    owner: 'organizer.a', startDays: 10, startHour: 13, endHour: 16, closeDays: 9, attendees: ['participant.b', 'participant.c'] },
  { id: demoEventIds.expired, title: '[DEMO] เตรียมความพร้อมสมัครงาน', description: 'แลกเปลี่ยนวิธีเตรียมเรซูเม่และฝึกสัมภาษณ์กับรุ่นพี่ กิจกรรมนี้หมดเขตรับลงทะเบียนแล้ว', location: 'อาคารเรียนรวม ห้อง 402', capacity: 25, status: 'PUBLISHED',
    owner: 'organizer.a', startDays: 2, startHour: 9, endHour: 12, closeDays: -1, attendees: [] },
  { id: demoEventIds.draft, title: '[DEMO] วางแผนกิจกรรมชมรม', description: 'ประชุมระดมความคิดสำหรับกิจกรรมชมรม ผู้จัดตรวจรายละเอียดก่อนเผยแพร่ได้', location: 'ห้องประชุมชมรม', capacity: 20, status: 'DRAFT',
    owner: 'organizer.a', startDays: 14, startHour: 10, endHour: 12, closeDays: 13, attendees: [] },
  { id: demoEventIds.closed, title: '[DEMO] กิจกรรมอาสาพัฒนาชุมชน', description: 'กิจกรรมอาสาที่จัดเสร็จแล้ว เก็บรายละเอียดและจำนวนผู้ลงทะเบียนไว้ให้ดูย้อนหลัง', location: 'ศูนย์กิจกรรมอาสา', capacity: 15, status: 'CLOSED',
    owner: 'organizer.a', startDays: -3, startHour: 9, endHour: 12, closeDays: -4, attendees: ['participant.a'] },
  { id: demoEventIds.otherOwner, title: '[DEMO] Design Thinking สำหรับนักศึกษา', description: 'ลองตั้งโจทย์และออกแบบแนวทางแก้ปัญหาจากเรื่องใกล้ตัว ทำงานเป็นกลุ่มและนำเสนอไอเดีย', location: 'ห้องเรียนรู้ร่วมกัน อาคาร B', capacity: 20, status: 'PUBLISHED',
    owner: 'organizer.b', startDays: 8, startHour: 10, endHour: 12, closeDays: 7, attendees: [] },
];

export async function seedDemoEvents(db: PrismaClient, now = new Date()) {
  if (!Number.isFinite(now.getTime())) throw new Error('Demo seed requires a valid clock');
  // Calculate local calendar days at ordinary Bangkok hours, independent of
  // the machine timezone. Existing fixtures retain their original dates.
  const today = new Date(now.getTime() + 7 * 3600000);
  const wall = (days: number, hour: number) => new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + days, hour - 7));
  return db.$transaction(async tx => {
    // Serialize concurrent seed runs only; application Event mutations retain
    // their existing Event -> Registration lock order.
    await tx.$queryRaw`SELECT true AS locked FROM pg_advisory_xact_lock(20261106, 2)`;
    const expected = demoUsers.filter(user => user.isActive);
    const accounts = await tx.user.findMany({ where: { username: { in: expected.map(user => user.username) } } });
    for (const profile of expected) {
      const account = accounts.find(user => user.username === profile.username);
      if (!account || account.role !== profile.role || !account.isActive) throw new Error(`Required demo account is missing or invalid: ${profile.username}`);
    }
    const accountId = (username: string) => accounts.find(user => user.username === username)!.id;
    const result = { createdEvents: 0, createdRegistrations: 0, skippedEvents: 0 };
    for (const [index, scenario] of scenarios.entries()) {
      // Never reset a record that has already been used or modified. Sample
      // registrations are inserted only with their newly-created Event.
      if (await tx.event.findUnique({ where: { id: scenario.id }, select: { id: true } })) { result.skippedEvents++; continue; }
      const createdAt = wall(-20 - index, 9);
      await tx.event.create({ data: { id: scenario.id, title: scenario.title, description: scenario.description, location: scenario.location,
        capacity: scenario.capacity, status: scenario.status, organizerId: accountId(scenario.owner),
        startsAt: wall(scenario.startDays, scenario.startHour), endsAt: wall(scenario.startDays, scenario.endHour),
        registrationClosesAt: wall(scenario.closeDays, 18), createdAt, updatedAt: createdAt } });
      result.createdEvents++;
      for (const username of scenario.attendees) {
        await tx.registration.create({ data: { eventId: scenario.id, participantId: accountId(username), status: 'ACTIVE',
          registeredAt: wall(scenario.status === 'CLOSED' ? -5 : -1, 12) } });
        result.createdRegistrations++;
      }
    }
    return result;
  }, { maxWait: 5000, timeout: 15000 });
}
