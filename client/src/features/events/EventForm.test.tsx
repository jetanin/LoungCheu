// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { EventForm } from './EventForm.js';

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe('CR-01 TEST-08 create form (AC-07)', () => {
  it.each(['ab', '  ab  ', '🌱🌱'])('shows the 3–120 error and sends no POST for %s', async title => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    render(<EventForm onAuthRequired={vi.fn()}/>);
    for (const [label, value] of [
      ['ชื่อกิจกรรม', title], ['รายละเอียด', 'รายละเอียด'], ['สถานที่', 'บางมด'], ['จำนวนที่นั่ง', '2'],
      ['วันที่ปิดรับลงทะเบียน', '2099-01-01'], ['เวลาปิดรับลงทะเบียน', '09:00'],
      ['วันที่เริ่มกิจกรรม', '2099-01-01'], ['เวลาเริ่มกิจกรรม', '10:00'],
      ['วันที่สิ้นสุดกิจกรรม', '2099-01-01'], ['เวลาสิ้นสุดกิจกรรม', '12:00'],
    ]) fireEvent.change(screen.getByLabelText(label, { exact: true }), { target: { value } });
    fireEvent.click(screen.getByRole('button', { name: 'บันทึก DRAFT' }));
    expect(await screen.findByText('กรุณากรอก 3–120 ตัวอักษร')).toBeTruthy();
    expect(fetch).not.toHaveBeenCalled();
  });
});
