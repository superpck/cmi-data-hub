import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import CONFIG from '../configs/config';

@Injectable({
  providedIn: 'root',
})
export class AIService {
  private http = inject(HttpClient);

  createHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'x-api-key': CONFIG.apiKey
    });
  }

  aiProcess(payload: any): Promise<any> {
    try {
      if (!payload || !payload.user) {
        return Promise.reject('Payload must have a user message');
      }
      const url = `${CONFIG.apiEndpoint.ai.url}${CONFIG.apiEndpoint.ai.message_endpoint}`;
      const headers = this.createHeaders();
      console.log('AI API URL:', url);
      const payloadData = {
        model: CONFIG.aiModel,
        messages: [
          {
            role: "system",
            content: payload?.system || "คุณคือ AI ผู้เชี่ยวชาญด้านเวชระเบียนและรหัสโรค (Medical Coder) จงวิเคราะห์ข้อมูลผู้ป่วยและสรุปผลเป็นรูปแบบ JSON เท่านั้น โดยบังคับให้มีคีย์ต่อไปนี้: principal_diagnosis (โรคหลัก), icd_10_pdx (รหัสโรคหลัก), secondary_diagnosis (โรคร่วม/แทรกซ้อน ถ้าไม่มีให้ใส่ None), procedure (หัตถการ)"
          },
          { role: 'user', content: payload.user }
        ],
        max_tokens: payload.user.length + 2000,
        response_format: {
          type: "json_object"
        }
      };
      console.log('Payload to AI API:', payloadData);
      return firstValueFrom(
        this.http.post<any>(url, payloadData, { headers })
      );
    } catch (error) {
      console.error('Error in aiProcess:', error);
      return Promise.reject(error);
    }
  }
}
