import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PkToastrService } from 'ngx-pk-ui';
import CONFIG from '../../../configs/config';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'callback',
  imports: [],
  templateUrl: './callback.html',
  styleUrl: './callback.scss',
})
export class Callback implements OnInit {
  isLoading = false;
  private lastRoute: string | null = null;

  private readonly authService = inject(AuthService);
  private readonly toastr = inject(PkToastrService);
  private readonly router = inject(Router);

  redirectRoute = {
    login: '/login',
    default: '/drg-util/drg-seeker'
  };

  ngOnInit(): void {
    this.handleAuthCallback();
  }

  async handleAuthCallback(): Promise<void> {
    if (typeof window === 'undefined') {
      return;
    }

    this.isLoading = true;

    // With hash routing, window.location.search is always empty.
    // Params are inside the hash fragment — parse them directly.
    const hashParams = this.extractParamsFromHash(window.location.hash);
    let event = hashParams.get('event') ?? sessionStorage.getItem('pendingProvider');
    sessionStorage.removeItem('pendingProvider');
    let code = hashParams.get('code');
    let state = hashParams.get('state');
    let saved = hashParams.get('saved');

    if (event === 'providerid' && code) {
      this.toastr.info('Processing Provider ID login callback...');
      try {
        const response: any = await this.authService.providerIDSignin(code, saved + '-' + state, null);
        if (response.statusCode == 200 && response.token) {
          sessionStorage.setItem(CONFIG.tokenName, response.token);
          this.toastr.success('เข้าสู่ระบบสำเร็จ ');
          this.safeNavigate(this.redirectRoute.default);
        } else {
          const message = response.message ?? 'ไม่สามารถรับ token จาก ProviderID ได้ กรุณาลองใหม่อีกครั้ง';
          this.toastr.error(message);
          this.safeNavigate(this.redirectRoute.login);
        }
      } catch (error) {
        const message = error instanceof Error
          ? `${error.message}: ไม่สามารถดำเนินการ ProviderID ได้`
          : 'ไม่สามารถดำเนินการ ProviderID ได้';
        this.toastr.error(message);
        this.safeNavigate(this.redirectRoute.login);
      } finally {
        this.clearCallbackQuery();
      }
    } else if (event === 'MYMOPH' && code && state) {
      try {
        const response: any = await this.authService.myMophSignin(code, state);
        if (response?.status == 200 && response?.token) {
          sessionStorage.setItem(CONFIG.tokenName, response.token);
          this.toastr.success('เข้าสู่ระบบสำเร็จ ');
          this.safeNavigate(this.redirectRoute.default);
        } else {
          const message = response.message ?? 'ไม่สามารถรับ token จาก MyMOPH ได้ กรุณาลองใหม่อีกครั้ง';
          this.toastr.error(message);
          this.safeNavigate(this.redirectRoute.login);
        }
      } catch (error) {
        const message = error instanceof Error
          ? `${error.message}: ไม่สามารถดำเนินการ MyMOPH ได้`
          : 'ไม่สามารถดำเนินการ MyMOPH ได้';
        this.toastr.error(message);
        this.safeNavigate(this.redirectRoute.login);
      } finally {
        this.clearCallbackQuery();
      }
    } else if (event === 'logout') {
      // Handle logout callback
    }

    this.isLoading = false;
  }

  private extractParamsFromHash(hash: string): URLSearchParams {
    if (!hash) {
      return new URLSearchParams();
    }

    const normalizedHash = hash.startsWith('#') ? hash.slice(1) : hash;
    const queryStartIndex = normalizedHash.indexOf('?');

    let rawQuery = '';

    if (queryStartIndex >= 0) {
      rawQuery = normalizedHash.slice(queryStartIndex + 1);
    } else if (normalizedHash.includes('=')) {
      rawQuery = normalizedHash;
    }

    if (!rawQuery) {
      return new URLSearchParams();
    }

    return new URLSearchParams(rawQuery);
  }

  private safeNavigate(url: string): void {
    if (this.lastRoute === url && this.router.url === url) {
      return;
    }

    this.lastRoute = url;
    this.router.navigateByUrl(url).catch(() => {
      this.lastRoute = null;
    });
  }

  private clearCallbackQuery(): void {
    if (typeof window === 'undefined') {
      return;
    }

    const url = window.location.pathname + window.location.hash;
    window.history.replaceState({}, document.title, url);
  }
}
