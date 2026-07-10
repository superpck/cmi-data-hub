import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { LoginService } from '../../services/login.service';
import { PkToastrService } from 'ngx-pk-ui';
import CONFIG from '../../configs/config';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [NgOptimizedImage],
  templateUrl: './login.html',
  styleUrl: './login.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {
  config = CONFIG;
  private readonly authService = inject(AuthService);
  loginService = inject(LoginService);
  toastr = inject(PkToastrService);
  providerType = window.location.hostname.includes('localhost') ? 'CMILoginBeta' : 'CMILogin';

  loginWith(provider: string): void {
    // TODO: implement OAuth redirect
    console.log(`Login with: ${provider}`);
  }

  async loginByProviderID() {
    sessionStorage.setItem('pendingProvider', 'providerid');
    const response: any = await this.authService.providerIDPortal(this.providerType);
    if (response.statusCode == 200 && response.url) {
      this.navigateTo(response.url);
      return;
    } else {
      this.toastr.error(response.message || (!response.url ? 'ไม่พบ url' : ''), 'Error!');
    }

    // let result: any = await this.loginService.providerIDPortal(this.providerType);
    // if (result.statusCode == 200 && result.url) {
    //   const redirectUrl = result.url
    //   window.location.replace(redirectUrl);
    // } else {
    //   this.toastr.error(result.message || (!result.url ? 'ไม่พบ url' : ''), 'Error!');
    // }
  }

  async loginByMyMOPH() {
    sessionStorage.setItem('pendingProvider', 'MYMOPH');
    let result: any = await this.loginService.myMOPHPortal();
    if (result?.authUrl) {
      window.location.replace(result.authUrl);
    } else {
      this.toastr.error(result.message || (!result.authUrl ? 'ไม่พบ url' : ''), 'Error!');
    }
  }

  private navigateTo(url: string): void {
    if (typeof window !== 'undefined') {
      window.location.href = url;
    } else {
      console.warn('Cannot redirect to third-party auth outside the browser context.', url);
    }
  }

}
