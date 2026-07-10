import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, lastValueFrom } from 'rxjs';
import Config from '../configs/config';

@Injectable({ providedIn: 'root' })
export class CmiService {
  private http = inject(HttpClient);
  private readonly url = Config.apiEndpoint.drg_data;

  async reportHospitalCMI(options: any): Promise<any> {
    try {
      const result = await firstValueFrom(this.http.post(`${this.url}/report/sum-hcode`, options));
      return result;
    } catch (error: any) {
      return error;
    }
  }

}
