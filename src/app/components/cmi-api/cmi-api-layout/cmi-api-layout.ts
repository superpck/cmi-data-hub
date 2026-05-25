import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MainService } from '../../../services/main.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { from, interval, startWith, switchMap } from 'rxjs';
import CONFIG from '../../../configs/config';
import { PkToastrService } from 'ngx-pk-ui';
import { DrgsService } from '../../../services/drgs.service';

@Component({
  selector: 'app-cmi-api-layout',
  imports: [
    RouterOutlet
  ],
  templateUrl: './cmi-api-layout.html',
  styleUrls: ['./cmi-api-layout.scss'],
})
export class CmiApiLayout implements OnInit {
  private readonly mainService = inject(MainService);
  private readonly drgService = inject(DrgsService);
  private readonly toastr = inject(PkToastrService);

  readonly userInfo = toSignal(
    interval(60_000).pipe(
      startWith(0),
      switchMap(() => from(this.mainService.decodeToken())),
    ),
    { initialValue: null as any },
  );

  ngOnInit(): void {
    this.getToken();
  }

  async getToken() {
    if (sessionStorage.getItem(CONFIG.drgTokenName)) {
      return;
    }
    const result: any = await this.drgService.loginByToken(sessionStorage.getItem(CONFIG.tokenName) ?? '');
    if (result?.token) {
      sessionStorage.setItem(CONFIG.drgTokenName, result.token);
    } else {
      this.toastr.error('Failed to login with token:', result);
    }
  }

  logout(): void {
    this.drgService.clearToken();
    sessionStorage.removeItem(CONFIG.tokenName);
    window.location.reload();
  }
}
