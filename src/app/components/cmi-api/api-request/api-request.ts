import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatePipe, DecimalPipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { from, map, startWith } from 'rxjs';
import {
  PkDatagridModule, PkIcon, PkSplit,
  PkSplitPanel, PkTabsModule,
  PkToastrService, PkTooltip,
  PkDatePipe, PkExportButton,
  PkAlertService
} from 'ngx-pk-ui';
import { DrgsService } from '../../../services/drgs.service';
import { MainService } from '../../../services/main.service';
import { ExcelService } from '../../../services/excel.service';
import { Router, RouterLink } from '@angular/router';

const THIS_YEAR = new Date().getFullYear() + 543;

const THAI_REGIONS = Array.from({ length: 13 }, (_, i) => ({
  value: i + 1,
  label: `เขต ${i + 1}`,
}));

const THAI_PROVINCES: { code: string; name: string; region: number }[] = [
  // เขต 1
  { code: '50', name: 'เชียงใหม่', region: 1 },
  { code: '51', name: 'ลำพูน', region: 1 },
  { code: '52', name: 'ลำปาง', region: 1 },
  { code: '53', name: 'อุตรดิตถ์', region: 2 },
  { code: '54', name: 'แพร่', region: 1 },
  { code: '55', name: 'น่าน', region: 1 },
  { code: '56', name: 'พะเยา', region: 1 },
  { code: '57', name: 'เชียงราย', region: 1 },
  { code: '58', name: 'แม่ฮ่องสอน', region: 1 },
  // เขต 2
  { code: '63', name: 'ตาก', region: 2 },
  { code: '64', name: 'สุโขทัย', region: 2 },
  { code: '65', name: 'พิษณุโลก', region: 2 },
  { code: '67', name: 'เพชรบูรณ์', region: 2 },
  // เขต 3
  { code: '60', name: 'นครสวรรค์', region: 3 },
  { code: '61', name: 'อุทัยธานี', region: 3 },
  { code: '62', name: 'กำแพงเพชร', region: 3 },
  { code: '66', name: 'พิจิตร', region: 3 },
  // เขต 4
  { code: '12', name: 'นนทบุรี', region: 4 },
  { code: '13', name: 'ปทุมธานี', region: 4 },
  { code: '14', name: 'พระนครศรีอยุธยา', region: 4 },
  { code: '15', name: 'อ่างทอง', region: 4 },
  { code: '16', name: 'ลพบุรี', region: 4 },
  { code: '17', name: 'สิงห์บุรี', region: 4 },
  { code: '19', name: 'สระบุรี', region: 4 },
  { code: '26', name: 'นครนายก', region: 4 },
  // เขต 5
  { code: '70', name: 'ราชบุรี', region: 5 },
  { code: '71', name: 'กาญจนบุรี', region: 5 },
  { code: '72', name: 'สุพรรณบุรี', region: 5 },
  { code: '73', name: 'นครปฐม', region: 5 },
  { code: '74', name: 'สมุทรสาคร', region: 5 },
  { code: '75', name: 'สมุทรสงคราม', region: 5 },
  { code: '76', name: 'เพชรบุรี', region: 5 },
  { code: '77', name: 'ประจวบคีรีขันธ์', region: 5 },
  // เขต 6
  { code: '11', name: 'สมุทรปราการ', region: 6 },
  { code: '20', name: 'ชลบุรี', region: 6 },
  { code: '21', name: 'ระยอง', region: 6 },
  { code: '22', name: 'จันทบุรี', region: 6 },
  { code: '23', name: 'ตราด', region: 6 },
  { code: '24', name: 'ฉะเชิงเทรา', region: 6 },
  { code: '25', name: 'ปราจีนบุรี', region: 6 },
  { code: '27', name: 'สระแก้ว', region: 6 },
  // เขต 7
  { code: '40', name: 'ขอนแก่น', region: 7 },
  { code: '44', name: 'มหาสารคาม', region: 7 },
  { code: '45', name: 'ร้อยเอ็ด', region: 7 },
  { code: '46', name: 'กาฬสินธุ์', region: 7 },
  // เขต 8
  { code: '38', name: 'บึงกาฬ', region: 8 },
  { code: '39', name: 'หนองบัวลำภู', region: 8 },
  { code: '41', name: 'อุดรธานี', region: 8 },
  { code: '42', name: 'เลย', region: 8 },
  { code: '43', name: 'หนองคาย', region: 8 },
  { code: '47', name: 'สกลนคร', region: 8 },
  { code: '48', name: 'นครพนม', region: 8 },
  // เขต 9
  { code: '30', name: 'นครราชสีมา', region: 9 },
  { code: '31', name: 'บุรีรัมย์', region: 9 },
  { code: '32', name: 'สุรินทร์', region: 9 },
  { code: '36', name: 'ชัยภูมิ', region: 9 },
  // เขต 10
  { code: '33', name: 'ศรีสะเกษ', region: 10 },
  { code: '34', name: 'อุบลราชธานี', region: 10 },
  { code: '35', name: 'ยโสธร', region: 10 },
  { code: '37', name: 'อำนาจเจริญ', region: 10 },
  { code: '49', name: 'มุกดาหาร', region: 10 },
  // เขต 11
  { code: '80', name: 'นครศรีธรรมราช', region: 11 },
  { code: '81', name: 'กระบี่', region: 11 },
  { code: '82', name: 'พังงา', region: 11 },
  { code: '83', name: 'ภูเก็ต', region: 11 },
  { code: '84', name: 'สุราษฎร์ธานี', region: 11 },
  { code: '85', name: 'ระนอง', region: 11 },
  { code: '86', name: 'ชุมพร', region: 11 },
  // เขต 12
  { code: '90', name: 'สงขลา', region: 12 },
  { code: '91', name: 'สตูล', region: 12 },
  { code: '92', name: 'ตรัง', region: 12 },
  { code: '93', name: 'พัทลุง', region: 12 },
  { code: '94', name: 'ปัตตานี', region: 12 },
  { code: '95', name: 'ยะลา', region: 12 },
  { code: '96', name: 'นราธิวาส', region: 12 },
  // เขต 13
  { code: '10', name: 'กรุงเทพมหานคร', region: 13 },
];

@Component({
  selector: 'app-api-request',
  imports: [
    ReactiveFormsModule,
    DatePipe, DecimalPipe, PkSplit,
    PkSplitPanel, PkIcon, PkTooltip,
    PkDatagridModule, PkTabsModule,
    PkDatePipe, RouterLink,
    PkExportButton
  ],
  templateUrl: './api-request.html',
  styleUrls: ['./api-request.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApiRequest {
  private readonly fb = inject(FormBuilder);
  private readonly drgsService = inject(DrgsService);
  private readonly mainService = inject(MainService);
  private readonly excelService = inject(ExcelService);
  private readonly router = inject(Router);
  private toastr = inject(PkToastrService)
  private alert = inject(PkAlertService);

  readonly loading = signal(false);
  readonly result = signal<{ filename: string; size: number; savedAt: Date } | null>(null);
  readonly error = signal<string | null>(null);

  activeTab = signal('file');
  dataList = signal<any[]>([]);
  isBeta = window.location.hostname === 'localhost' || window.location.pathname.includes('-beta');

  readonly exportColumns: string[] = [
    'hcode', 'hn_id', 'dateadm', 'datedsc', 'drg',
    'adjrw', 'wtlos', 'ot', 'pdx', 'sdx', 'proc', 'inscl',
  ];
  readonly exportHeaders: Record<string, string> = {
    hcode: 'HCode', hn_id: 'HN ID', dateadm: 'Admit', datedsc: 'Discharge',
    drg: 'DRG', adjrw: 'Adj RW', wtlos: 'WtLOS', ot: 'OT',
    pdx: 'PDX', sdx: 'SDX', proc: 'Procedure', inscl: 'INSCL',
  };

  readonly form = this.fb.group({
    year: [THIS_YEAR, Validators.required],
    month: ['1', Validators.required],
    region: [''],
    province: [''],
    hospcode: ['', Validators.pattern(/^\d{5}$|^\d{9}$/)],
    format: ['CSV'],
    rowPerPage: [50],
  });

  readonly regions = THAI_REGIONS;

  readonly years = Array.from({ length: THIS_YEAR - 2564 + 1 }, (_, i) => 2564 + i).reverse();

  readonly months = [
    { value: 1, label: 'มกราคม' }, { value: 2, label: 'กุมภาพันธ์' },
    { value: 3, label: 'มีนาคม' }, { value: 4, label: 'เมษายน' },
    { value: 5, label: 'พฤษภาคม' }, { value: 6, label: 'มิถุนายน' },
    { value: 7, label: 'กรกฎาคม' }, { value: 8, label: 'สิงหาคม' },
    { value: 9, label: 'กันยายน' }, { value: 10, label: 'ตุลาคม' },
    { value: 11, label: 'พฤศจิกายน' }, { value: 12, label: 'ธันวาคม' },
  ];

  readonly userInfo = toSignal(from(this.mainService.decodeToken()), { initialValue: null as any });

  readonly filteredProvinces = toSignal(
    this.form.get('region')!.valueChanges.pipe(
      startWith(null as number | null),
      map(region => region ? THAI_PROVINCES.filter(p => p.region === +region) : THAI_PROVINCES),
    ),
    { initialValue: THAI_PROVINCES },
  );

  onRegionChange(): void {
    this.form.get('province')?.reset('');
  }

  private async saveBlobToFile(blob: Blob, suggestedName: string): Promise<void> {
    if (typeof (window as any).showSaveFilePicker === 'function') {
      try {
        const handle: FileSystemFileHandle = await (window as any).showSaveFilePicker({
          suggestedName,
          types: [{ description: 'ZIP archive', accept: { 'application/zip': ['.zip'] } }],
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        return;
      } catch (e: unknown) {
        if (e instanceof DOMException && e.name === 'AbortError') throw e;
        // SecurityError: user gesture lost after async work — fall through to anchor fallback
      }
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = suggestedName;
    a.click();
    URL.revokeObjectURL(url);
  }

  async onSubmit(): Promise<void> {
    this.dataList.set([]);
    if (this.form.invalid) return;
    const { year, month, region, province, hospcode, rowPerPage } = this.form.getRawValue();
    if (!year || !month) return;

    if (province || hospcode) {
      await this.fetchData();
    } else {
      await this.downloadZip();
    }
  }

  async fetchData(): Promise<void> {
    if (this.form.invalid) return;
    const { year, month, region, province, hospcode, format } = this.form.getRawValue();
    if (!year || !month) return;

    this.loading.set(true);
    this.result.set(null);
    this.error.set(null);

    try {
      let options: any = { year, month: Number(month), format };
      if (region) options.region = region;
      if (province) options.province = province;
      if (hospcode) options.hospcode = String(hospcode);

      const result: any = await this.drgsService.cmiDataHub(options);
      if (format === 'CSV') {
        const disposition = result.headers?.get('Content-Disposition') ?? '';
        const match = disposition.match(/filename="?([^"]+)"?/);
        const filename = match?.[1] ?? `data_${year}_${String(month).padStart(2, '0')}.zip`;
        const blob = result.body as Blob;
        await this.saveBlobToFile(blob, filename);
        this.result.set({ filename, size: blob.size, savedAt: new Date() });
      } else {
        this.dataList.set(result?.rows || result?.data || []);
        const dataList = this.dataList().map((row: any) => {
          row.sdx = row.sdx1;
          for (let i = 2; i <= 12; i++) {
            if (row[`sdx${i}`]) {
              row.sdx += `, ${row[`sdx${i}`]}`;
            }
          }

          row.proc = row.proc1;
          for (let i = 2; i <= 20; i++) {
            if (row[`proc${i}`]) {
              row.proc += `, ${row[`proc${i}`]}`;
            }
          }
          return row;
        });
        this.dataList.set(dataList);
        this.activeTab.set('json');
        if (result?.status != 200) {
          this.alert.error(result?.message || result?.status || '', 'Error!');
        }
      }
    } catch (e: any) {
      if (e instanceof DOMException && e.name === 'AbortError') return;
      this.error.set(e instanceof Error ? e.message : 'เกิดข้อผิดพลาด');
      this.alert.error(e?.message || '', 'เกิดข้อผิดพลาด');
    } finally {
      this.loading.set(false);
    }
  }

  async downloadZip(): Promise<void> {
    if (this.form.invalid) return;
    const { year, month, region } = this.form.getRawValue();
    if (!year || !month) return;
    this.loading.set(true);
    this.result.set(null);
    this.error.set(null);
    try {
      const blob = await this.drgsService.downloadZipFile(year, Number(month), region);
      const filename = `drg_data_${year}_${String(month).padStart(2, '0')}.zip`;
      await this.saveBlobToFile(blob, filename);
      this.result.set({ filename, size: blob.size, savedAt: new Date() });
    } catch (e: unknown) {
      if (e instanceof DOMException && e.name === 'AbortError') return;
      this.error.set(e instanceof Error ? e.message : 'เกิดข้อผิดพลาด');
    } finally {
      this.loading.set(false);
    }
  }

  downloadCsv(): void {
    const { year, month } = this.form.getRawValue();
    const suffix = `_${year}_${String(month).padStart(2, '0')}`;
    this.excelService.exportAsExcelFile(this.dataList(), 'drg_data', suffix, 'csv');
  }

  reset(): void {
    this.form.reset({ year: THIS_YEAR, month: '1', region: '', province: '', hospcode: '', rowPerPage: 50 });
    this.result.set(null);
    this.error.set(null);
  }

  logout(): void {
    sessionStorage.clear();
    this.router.navigate(['/login']);
  }
}

