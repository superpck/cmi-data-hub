import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { PkIcon, PkAlertService } from 'ngx-pk-ui';
import { DrgsService } from '../../../services/drgs.service';

@Component({
  selector: 'app-consent-form',
  imports: [PkIcon],
  templateUrl: './consent-form.html',
  styleUrls: ['./consent-form.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConsentForm {
  private readonly router = inject(Router);
  private readonly drgsService = inject(DrgsService);
  private readonly alert = inject(PkAlertService);

  readonly loading = signal(false);
  readonly accepted = signal(false);

  async acceptConsent(): Promise<void> {
    this.loading.set(true);
    try {
      const result = await this.drgsService.saveConsent('download');
      if (result?.status === 200) {
        this.accepted.set(true);
        this.alert.success('บันทึกการยอมรับเงื่อนไขเรียบร้อย', 'สำเร็จ');
        setTimeout(() => {
          this.router.navigate(['/cmi-api/download']);
        }, 1000);
      } else {
        this.alert.error(result?.message || 'ไม่สามารถบันทึกการยอมรับเงื่อนไขได้', 'ผิดพลาด');
      }
    } catch (error: any) {
      this.alert.error(error?.message || 'เกิดข้อผิดพลาด', 'ผิดพลาด');
    } finally {
      this.loading.set(false);
    }
  }

  cancel(): void {
    this.router.navigate(['/cmi-api/about']);
  }
}
