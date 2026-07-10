import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { PkDatePipe, PkIcon, PkToastrService } from 'ngx-pk-ui';
import dayjs from 'dayjs';
import { DrgsService } from '../../../services/drgs.service';
import { MainService } from '../../../services/main.service';

@Component({
  selector: 'app-drg-seeker',
  imports: [
    CommonModule,
    FormsModule, DecimalPipe, PkDatePipe,
    PkIcon
  ],
  templateUrl: './drg-seeker.component.html',
  styleUrl: './drg-seeker.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DrgSeekerComponent implements OnInit {
  private drgService = inject(DrgsService);
  private mainService = inject(MainService);
  private cdr = inject(ChangeDetectorRef);
  private toastr = inject(PkToastrService);

  loading = signal(false);
  calculating = signal(false);
  onLogin = signal(false);
  userInfo = signal<any>({});
  calculateResult = signal<any>(null);
  TGrp = signal<any>({});
  ipdResultList = signal<any[]>([]);

  hcode = localStorage.getItem('hcode') || '';
  yearly = String(dayjs().year() + 543);
  an = '';
  hn = '';
  baseRate = 8350;

  username = '';
  password = '';

  ipdData: any = {};
  pdx: any = { code: '', name: '' };
  dxList: any[] = [];
  opList: any[] = [];

  seqDx = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  seqOp = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];

  referHospitalDetail: any = {};

  async ngOnInit(): Promise<void> {
    this.resetVar();
    await this.libs();
  }

  async libs(): Promise<void> {
    const info = await this.mainService.tokenDecode();
    this.userInfo.set(info ?? {});
    this.hcode = info?.hcode || this.hcode;

    const result: any = await this.drgService.ipdResult();
    this.ipdResultList.set(result?.rows ?? []);
    this.cdr.markForCheck();
  }

  resetVar(type = ''): void {
    this.ipdData = {
      sex: 1, los: 1, los_day: 1, age: 15, age_day: 0, weight: 0, ipdResult: '21', price: 1000,
    };
    this.referHospitalDetail = {};
    this.pdx = { code: '', name: '' };
    this.dxList = [];
    for (let i = 0; i < 13; i++) this.dxList.push({ code: '', name: '' });
    this.opList = [];
    for (let i = 0; i < 20; i++) this.opList.push({ code: '', name: '' });

    if (type === 'all') {
      this.an = '000000';
      this.hn = '000000';
      this.calculateResult.set(null);
    }
  }

  async checkAN(): Promise<void> {
    this.calculateResult.set(null);
    this.resetVar();
    if (this.an && this.an.length > 4) {
      this.loading.set(true);
      const year = Number(this.yearly) - 543;
      const result: any = await this.drgService.getIPDByAN(this.an, year);
      const row = result?.data || {};
      if (row?.AN || row?.an) {
        this.ipdData = row;
        for (const fld in this.ipdData) {
          const val = this.ipdData[fld] === '0000-00-00' ? null : this.ipdData[fld];
          delete this.ipdData[fld];
          this.ipdData[fld.toLowerCase()] = val;
        }
        this.ipdData.ipdResult = this.ipdData.dischs + this.ipdData.discht;
        this.ipdData.los_day = this.ipdData.los || 0;
        this.ipdData.price = this.ipdData.total || 0;
        this.ipdData.sex = Number(this.ipdData.sex || 0);
        this.pdx.code = this.ipdData.pdx || '';
        this.checkDx(-1);

        this.dxList = [];
        for (let i = 0; i < 13; i++) {
          this.dxList.push({ code: this.ipdData[`sdx${i + 1}`] || '', name: '' });
          this.checkDx(i);
        }
        this.opList = [];
        for (let i = 0; i < 20; i++) {
          this.opList.push({ code: this.ipdData[`proc${i + 1}`] || '', name: '' });
          this.checkOP(i);
        }
        await this.calculate();
      } else {
        this.toastr.error('ไม่พบข้อมูล IPD จาก AN ที่ระบุ');
        this.pdx.code = '';
        this.checkDx(-1);
        this.dxList = [];
        for (let i = 0; i < 13; i++) {
          this.dxList.push({ code: '', name: '' });
          this.checkDx(i);
        }
        this.opList = [];
        for (let i = 0; i < 20; i++) {
          this.opList.push({ code: '', name: '' });
          this.checkOP(i);
        }
      }
    }
    this.loading.set(false);
    this.cdr.markForCheck();
  }

  async checkDx(seq = -1): Promise<void> {
    if (seq === -1) {
      if (this.pdx.code) {
        this.pdx.code = this.pdx.code.trim().toUpperCase();
        const result: any = await this.drgService.icd10(this.pdx.code);
        this.pdx.name =
          result?.status === 200 && result.rows?.length
            ? result.rows[0].who_full_desc || result.rows[0].desc
            : '';
      } else {
        this.pdx.name = '';
      }
    } else {
      if (!this.dxList[seq]?.code) { this.dxList[seq].name = ''; return; }
      this.dxList[seq].code = this.dxList[seq].code.trim().toUpperCase();
      const result: any = await this.drgService.icd10(this.dxList[seq].code);
      this.dxList[seq].name =
        result?.status === 200 && result.rows?.length
          ? result.rows[0].who_full_desc || result.rows[0].desc
          : '';
    }
    this.cdr.markForCheck();
  }

  async checkOP(seq = 0): Promise<void> {
    if (!this.opList[seq]?.code) { this.opList[seq].name = ''; return; }
    this.opList[seq].code = this.opList[seq].code.trim().toUpperCase();
    const code = this.opList[seq].code.split('+')[0];
    const result: any = await this.drgService.icdCM(code);
    this.opList[seq].name =
      result?.status === 200 && result.rows?.length ? result.rows[0].procedname : '';
    this.cdr.markForCheck();
  }

  async calculate(): Promise<void> {
    if (!this.pdx.code) return;
    localStorage.setItem('hcode', this.hcode);
    this.calculating.set(true);

    const dxList = this.dxList.filter((dx) => dx.code.trim() !== '');
    const opList = this.opList.filter((op) => op.code.trim() !== '');

    const data: any = {
      hcode: this.hcode, hn: this.hn, an: this.an || '1',
      sex: Number(this.ipdData?.sex || 0), age: Number(this.ipdData?.age || 0), age_day: Number(this.ipdData?.age_day || 0),
      los_day: Number(this.ipdData?.los_day || 0), los_hour: Number(this.ipdData?.los_hour || 0),
      weight: Number(this.ipdData?.weight || 0), price: Number(this.ipdData?.price || 0),
      dischs: this.ipdData.ipdResult?.substring(0, 1) || '2',
      discht: this.ipdData.ipdResult?.substring(1, 2) || '1',
      pdx: this.pdx.code,
      sdx: dxList.map((item) => item.code),
      proc: opList.map((item) => item.code),
    };

    localStorage.setItem('last-drg-seeker', JSON.stringify({
      hcode: this.hcode, an: this.an, hn: this.hn,
      ipdData: this.ipdData, dxList: this.dxList, opList: this.opList,
    }));

    try {
      const response = await this.drgService.drgSeeker('6', [data]);
      const res = response?.data ? { ...response.data[0] } : {};
      res.errorText = '';
      res.warningText = '';

      if (res?.drg) {
        const drgResult: any = await this.drgService.drgName(res.drg);
        res.drgName = drgResult?.rows?.length ? drgResult.rows[0].drgname : '';
        res.default_rw0d = drgResult?.rows?.length ? drgResult.rows[0].rw0d : null;
        res.default_wtlos = drgResult?.rows?.length ? drgResult.rows[0].wtlos : null;

        this.calculateResult.set(res);
        this.TGrp.set(response?.tgrp || {});
        this.calCarry();

        if (res.err) {
          const errResult: any = await this.drgService.drgError(res.err);
          if (errResult?.status === 200 && errResult.rows?.length > 0) {
            res.errorText = res.err + ' ' + (errResult.rows[0].name || '');
          }
        }
        if (res.warn) {
          const warnCodes = this.detectBinaryCode(res.warn);
          for (const warn of warnCodes) {
            const warnResult: any = await this.drgService.drgWarning(warn);
            if (warnResult?.status === 200 && warnResult.rows?.length > 0) {
              res.warningText +=
                (res.warningText ? ', ' : '') + warn + ': ' + (warnResult.rows[0].name || '');
            }
          }
        }
      }
      this.calculateResult.set({ ...res });
      this.TGrp.set(response?.tgrp || {});
    } catch (error) {
      this.calculateResult.set(null);
      console.error(error);
    }

    this.calculating.set(false);
    this.cdr.markForCheck();
  }

  calCarry(): void {
    const res = this.calculateResult();
    if (!res) return;
    const carryRw = (res.adjrw ?? 0) - (res.rw ?? 0);
    res.carry_rw = (carryRw > 0 ? '+' : '') + carryRw.toFixed(4);
    const carryLos = (this.ipdData?.los_day || 0) - Math.ceil(res.wtlos ?? 0);
    res.carry_los = (carryLos > 0 ? '+' : '') + carryLos;
    this.calculateResult.set({ ...res });
    this.cdr.markForCheck();
  }

  detectBinaryCode(code: number): number[] {
    return [1, 2, 4, 8, 16, 32, 64, 128, 256, 512].filter((item) => (code & item) === item);
  }

  timeOnly(value: string | null | undefined): string {
    if (!value) return '';
    const t = String(value);
    return t.includes(':') ? t.substring(0, 5) : t.replace(/(\d{2})(\d{2})/, '$1:$2').substring(0, 5);
  }

  toggleLogin(): void {
    // if (this.userInfo()?.hcode) {
    //   this.drgService.clearToken();
    //   this.userInfo.set({});
    // }
    this.onLogin.set(!this.onLogin());
    console.log('Login toggled. Current state:', this.onLogin());
  }

  async login(): Promise<void> {
    this.loading.set(true);
    try {
      const loginResult: any = await this.drgService.login(this.username, this.password);
      if (loginResult?.status === 200 && loginResult.token) {
        this.drgService.setToken(loginResult.token);
        const info = await this.mainService.tokenDecode();
        this.userInfo.set(info ?? {});
        this.hcode = info?.hcode || this.hcode;
        this.onLogin.set(false);
        await this.libs();
      } else {
        alert('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
      }
    } catch (error) {
      console.error(error);
    }
    this.loading.set(false);
    this.cdr.markForCheck();
  }
}
