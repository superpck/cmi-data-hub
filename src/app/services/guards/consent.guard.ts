import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { DrgsService } from '../drgs.service';
import dayjs from 'dayjs';

export const consentGuard: CanActivateFn = async (route, state) => {
  const router = inject(Router);
  const drgsService = inject(DrgsService);

  try {
    const result = await drgsService.getConsent('download');
    
    // ตรวจสอบว่ามี consent และยังไม่หมดอายุ (ภายใน 6 เดือน)
    if (result?.status === 200 && result?.result?.date) {
      const consentDate = dayjs(result.result.date);
      const now = dayjs();
      const monthsDiff = now.diff(consentDate, 'month', true);
      
      // ถ้ายังไม่เกิน 6 เดือน ให้ผ่าน
      if (monthsDiff < 6) {
        return true;
      }
    }
    
    // ถ้าไม่มี consent หรือหมดอายุแล้ว redirect ไปหน้า consent form
    router.navigate(['/cmi-api/consent'], {
      queryParams: { returnUrl: state.url }
    });
    return false;
  } catch (error) {
    // กรณี error หรือไม่พบ consent
    router.navigate(['/cmi-api/consent'], {
      queryParams: { returnUrl: state.url }
    });
    return false;
  }
};
