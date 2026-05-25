import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import CONFIG from '../configs/config';
import dayjs from 'dayjs';

@Injectable({
  providedIn: 'root',
})
export class LoginService {
  private http = inject(HttpClient);

  providerIDPortal(typeLogin: string): Promise<any> {
    const kwd = dayjs().add(2, 'seconds').format('YYYYMMDDHHmmss');
    const url = `${CONFIG.apiEndpoint.user}/admin/providerid/create-url/${kwd}/${typeLogin}`;
    return firstValueFrom(
      this.http.get<any>(url, { params: { typeLogin } })
    );
  }

  myMOPHPortal(): Promise<any> {
    return firstValueFrom(
      this.http.get<any>(`https://referlink.moph.go.th/callback/api/my-moph/create-url`)
    );
  }
}
