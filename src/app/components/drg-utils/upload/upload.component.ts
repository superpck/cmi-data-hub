import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  effect,
  ElementRef,
  inject,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import {
  PkAlertService, PkDatePipe, PkIcon, PkModal,
  PkModalBody, PkModalFooter, PkModalHeader,
  PkTabsModule, PkToastrService
} from 'ngx-pk-ui';
import dayjs from 'dayjs';
import * as echarts from 'echarts';
import type { EChartsOption } from 'echarts';
import { DrgsService } from '../../../services/drgs.service';
import { MainService } from '../../../services/main.service';
import { ExcelService } from '../../../services/excel.service';

@Component({
  selector: 'app-upload',
  imports: [
    FormsModule, DecimalPipe, PkDatePipe,
    PkIcon, PkModal, PkModalHeader,
    PkModalBody, PkModalFooter, PkTabsModule
  ],
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UploadComponent implements OnInit, AfterViewInit {
  private drgsService = inject(DrgsService);
  private mainService = inject(MainService);
  private excel = inject(ExcelService);
  private cdr = inject(ChangeDetectorRef);
  private toastr = inject(PkToastrService);
  private alert = inject(PkAlertService);

  chartContainer = viewChild<ElementRef>('chartContainer');
  chartContainer2 = viewChild<ElementRef>('chartContainer2');
  private chartInstance: echarts.ECharts | null = null;
  private chartInstance2: echarts.ECharts | null = null;

  constructor() {
    // Effect to init charts when data and container are ready
    effect(() => {
      const container = this.chartContainer()?.nativeElement;
      const container2 = this.chartContainer2()?.nativeElement;
      const data = this.chartData();
      const data2 = this.referInChartData();
      const tab = this.activeTab();
      
      if (container && data && tab === 'summary') {
        setTimeout(() => this.initChart(), 100);
      }
      
      if (container2 && data2 && tab === 'summary') {
        setTimeout(() => this.initReferInChart(), 100);
      }
    });
  }

  userInfo = signal<any>({});
  loading = signal(false);
  activeTab = signal('upload');
  activeStatsTab = signal('overview');
  uploadProgress = signal(0);
  uploadStatus = signal('');
  uploadError = signal('');
  uploadCompleted = signal(false);
  modalDetail = signal(false);
  modalList = signal(false);
  sendingRows = 100;

  // Stats signals
  stats = signal({
    totalCases: 0,
    casesWithAdjrw0: 0,
    totalAdjrw: 0,
    cmi: 0,
    totalAmount: 0,
    totalPerCase: 0,
    totalPerAdjrw: 0,
    totalPerActlos: 0,
    sumLosMinusLeaveday: 0,
    avgActlosPerCase: 0,
    activeBed: 0,
    totalDays: 0,
    percentExceedWtlos: 0,
    percentExceedOT: 0,
    strokeRefer: 0,
    strokeNoRefer: 0,
    strokeTotal: 0,
    strokeRtpaWithin3h: 0,
    strokeRtpaWithin4h: 0,
    strokeRtpaWithin6h: 0,
    strokeRtpaWithin12h: 0,
    strokeRtpaWithin24h: 0,
    strokeRtpaOver24h: 0,
    strokeTotalAmount: 0,
    strokeTotalAdjrw: 0,
    strokeAvgLos: 0,
    strokeAvgAmount: 0,
    strokeAmountPerAdjrw: 0,
    strokeDeath: 0,
    strokeDeathRate: 0,
    strokeCmi: 0,
    appendicitisTotal: 0,
    appendicitisWithin24h: 0,
    appendicitis24to48h: 0,
    appendicitisOver48h: 0,
    appendicitisTotalAmount: 0,
    appendicitisTotalAdjrw: 0,
    appendicitisAvgLos: 0,
    appendicitisAvgAmount: 0,
    appendicitisAmountPerAdjrw: 0,
    appendicitisDeath: 0,
    appendicitisDeathRate: 0,
    appendicitisCmi: 0,
    deliveryTotal: 0,
    deliveryNormal: 0,
    deliveryCesarean: 0,
    deliveryCesareanEmergency: 0,
    deliveryOther: 0,
    deliveryDeath: 0,
    deliverySingleLive: 0,
    deliverySingleStillbirth: 0,
    deliveryTwinsBothLive: 0,
    deliveryTwinsOneLiveOneStillbirth: 0,
    maternalDeath: 0,
    sepsisTotal: 0,
    sepsisDeath: 0,
    sepsisDeathRate: 0,
    sepsisTotalLos: 0,
    sepsisAvgLos: 0,
    sepsisTotalAmount: 0,
    sepsisAvgAmount: 0,
    sepsisTotalAdjrw: 0,
    sepsisCmi: 0,
    amiTotal: 0,
    amiWithPCI: 0,
    amiWithCABG: 0,
    amiWithPciCabgWithin24h: 0,
    amiDeath: 0,
    amiDeathRate: 0,
    amiAvgLos: 0,
    amiAvgAmount: 0,
    amiCmi: 0,
    hipFxTotal: 0,
    hipFxWithSurgery: 0,
    hipFxSurgeryWithin48h: 0,
    hipFxSurgeryWithin72h: 0,
    hipFxSurgeryAfter72h: 0,
    hipFxDeath: 0,
    hipFxDeathRate: 0,
    hipFxAvgLos: 0,
    hipFxAvgAmount: 0,
    hipFxCmi: 0,
  });

  chartData = signal<any>(null);
  referInChartData = signal<any>(null);

  data: any[] = [];
  dataList: any[] = [];
  dataShow: any[] = [];
  sumMonthly: any[] = [];
  currentRow: any = {};
  structure: string[] = [];
  lineNo = 0;
  reccount = 0;
  recno = 0;
  currentShow = '';
  showTitle = '';
  searchText = '';

  readonly pageSizeOptions = [10, 20, 50];

  currentPageSummary = 1;
  itemsPerPageSummary = 10;
  currentPageDetail = 1;
  itemsPerPageDetail = 10;
  currentPageModal = 1;
  itemsPerPageModal = 10;

  readonly thMonthAbbr = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

  get paginatedSummary(): any[] {
    const start = (this.currentPageSummary - 1) * +this.itemsPerPageSummary;
    return this.sumMonthly.slice(start, start + +this.itemsPerPageSummary);
  }
  get totalPagesSummary(): number {
    return Math.ceil(this.sumMonthly.length / +this.itemsPerPageSummary);
  }
  get filteredDetail(): any[] {
    if (!this.searchText) return this.dataList;
    const q = this.searchText.toLowerCase();
    return this.dataList.filter((row) =>
      [row.HN, row.AN, row.DRG, row.PDX, row.SDX].some(
        (v) => v && String(v).toLowerCase().includes(q)
      )
    );
  }
  get paginatedDetail(): any[] {
    const start = (this.currentPageDetail - 1) * +this.itemsPerPageDetail;
    return this.filteredDetail.slice(start, start + +this.itemsPerPageDetail);
  }
  get totalPagesDetail(): number {
    return Math.ceil(this.filteredDetail.length / +this.itemsPerPageDetail);
  }
  get paginatedModal(): any[] {
    const start = (this.currentPageModal - 1) * +this.itemsPerPageModal;
    return this.dataShow.slice(start, start + +this.itemsPerPageModal);
  }
  get totalPagesModal(): number {
    return Math.ceil(this.dataShow.length / +this.itemsPerPageModal);
  }

  setPageDetail(page: number): void {
    if (page >= 1 && page <= this.totalPagesDetail) this.currentPageDetail = page;
    this.cdr.markForCheck();
  }
  setPageModal(page: number): void {
    if (page >= 1 && page <= this.totalPagesModal) this.currentPageModal = page;
    this.cdr.markForCheck();
  }

  async ngOnInit(): Promise<void> {
    const info = await this.mainService.decodeToken();
    this.userInfo.set(info ?? {});
    this.cdr.markForCheck();
  }

  ngAfterViewInit(): void {
    // Chart will be initialized when data is loaded
  }

  /**
   * Sanitize string value by replacing problematic characters with empty string
   * - Replaces backslash (\) with empty string
   * - Replaces ASCII control characters (< 32) except tab, CR, LF with empty string
   */
  private sanitizeValue(value: any): any {
    if (typeof value !== 'string') return value;
    
    // Replace backslash with empty string
    let sanitized = value.replace(/\\/g, '');
    
    // Replace ASCII control characters (0-31) except common whitespace
    // Keep: tab(9), LF(10), CR(13)
    // Replace: NULL(0) and other control chars
    sanitized = sanitized.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F]/g, '');
    
    return sanitized;
  }

  async upload(item: any): Promise<void> {
    const answer = await this.alert.confirm('ยืนยันการอัปโหลดข้อมูลไปยัง CMI Data Hub?');
    console.log('User confirmation:', answer);
    if (!answer) return;
    
    // alert('ยังไม่พร้อมใช้งาน');
    this.toastr.info('กำลังส่งข้อมูลไปยังระบบ CMI Data Hub...', 'โปรดรอ');
    // console.log('Uploading data for month:', item);
    if (this.dataList.length === 0) {
      this.alert.error('ไม่มีข้อมูลในหน้านี้');
      return;
    }
    try {
      this.loading.set(true);
      this.uploadProgress.set(0);
      this.uploadStatus.set('กำลังเตรียมข้อมูล...');
      this.uploadError.set('');
      let rows = JSON.parse(JSON.stringify(this.dataList));
      const upd = dayjs().format('YYYY-MM-DD HH:mm:ss');
      const totalRows = rows.length;
      const timesSend = Math.ceil(rows.length / this.sendingRows);
      for (let i = 0; i < timesSend; i++) {
        const batch = rows.slice(i * this.sendingRows, (i + 1) * this.sendingRows);
        for (let row of batch) {
          delete row.SDX;

          for (const key in row) {
            const columnName = key.toLowerCase();
            if (key != columnName) {
              row[columnName] = row[key];
              delete row[key];
            }
            // Sanitize string values to remove problematic control characters
            row[columnName] = this.sanitizeValue(row[columnName]);
          }
          row.upd = upd;
          row.source = 'datahub';
        }
        const sentRows = Math.min((i + 1) * this.sendingRows, totalRows);
        this.uploadStatus.set(`กำลังส่งข้อมูล ${sentRows.toLocaleString()}/${totalRows.toLocaleString()} รายการ`);
        const result = await this.drgsService.saveIPD(batch);
        if (result?.status === 200) {
          // this.toastr.success('uploaded successfully', `Batch ${i + 1}/${timesSend}`);
          const progress = Math.round(((i + 1) / timesSend) * 100);
          this.uploadProgress.set(progress);
          this.cdr.markForCheck();
        } else {
          this.toastr.error(JSON.stringify(result), `Batch ${i + 1}/${timesSend} failed to upload:`);
          const errorMsg = result?.message || result?.error?.message || `เกิดข้อผิดพลาดในการส่งข้อมูลในชุดที่ ${i + 1}`;
          this.uploadError.set(errorMsg);
          this.alert.error(errorMsg);
          this.loading.set(false);
          this.uploadProgress.set(0);
          this.uploadStatus.set('');
          return;
        }
      }
      this.uploadStatus.set('อัปโหลดสำเร็จ!');
      this.uploadCompleted.set(true);
      setTimeout(() => {
        this.uploadProgress.set(0);
        this.uploadStatus.set('');
      }, 2000);
      this.loading.set(false);
    } catch (error: any) {
      console.error('Upload error:', error);
      const errorMsg = error?.message || 'เกิดข้อผิดพลาดในการอัปโหลดข้อมูล';
      this.alert.error(errorMsg);
      this.uploadError.set(errorMsg);
      alert(errorMsg);
      this.loading.set(false);
      this.uploadProgress.set(0);
      this.uploadStatus.set('');
    }
  }

  fileUpload(event: Event): void {
    this.data = [];
    this.lineNo = 0;
    this.uploadCompleted.set(false);
    this.uploadError.set('');
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    this.loading.set(true);

    const fileReader = new FileReader();
    fileReader.onload = async () => {
      const text = fileReader.result as string;
      this.data = text.replace(/\n/g, '').split(/\r/);
      this.lineNo = this.data.length;
      await this.readLines(this.data);
      this.loading.set(false);
      this.activeTab.set('summary');
      this.cdr.markForCheck();
    };
    fileReader.onerror = () => {
      this.loading.set(false);
      this.cdr.markForCheck();
    };
    fileReader.readAsText(file);

    this.loading.set(false);
  }

  async readLines(data: string[]): Promise<void> {
    this.structure = data[0].toUpperCase().split(',');
    this.dataList = [];
    this.sumMonthly = [];

    for (let i = 1; i < data.length; i++) {
      const aLine = data[i].replace(/"/g, '').split(',');
      if (!aLine || aLine[0] === '') continue;

      let nColumn = -1;
      const row: any = {};
      for (const fld of this.structure) {
        nColumn++;
        row[fld] = aLine[nColumn];
        if (['DATEADM', 'DATEDSC'].includes(fld)) {
          row[fld] = dayjs(row[fld]).format('YYYY-MM-DD');
        }
        if (fld.includes('TIME') && row[fld] && !row[fld].includes(':')) {
          row[fld] = row[fld].substring(0, 2) + ':' + row[fld].substring(2, 4);
        }
        if (row[fld] && ['PERSON_ID', 'CID'].includes(fld)) {
          row[fld] = row[fld].replace(/-/g, '');
        }
      }
      row.RW = +row.RW;
      row.ADJRW = +row.ADJRW;
      row.DISCHS = +row.DISCHS;
      row.DISCHT = +row.DISCHT;
      row.LOS = +row.LOS;
      row.SEX = +row.SEX;
      row.TOTAL = +row.TOTAL || 0;
      row.WTLOS = +row.WTLOS || 0;
      row.OT = +row.OT || 0;
      row.LEAVEDAY = +row.LEAVEDAY || 0;
      row.ACTLOS = (+row.LOS || 0) - (+row.LEAVEDAY || 0);

      if (!row.PERSON_ID && row.CID) { row.PERSON_ID = row.CID; delete row.CID; }

      const monthly = dayjs(row.DATEDSC).format('YYYY-MM');
      const txtMonth = this.thMonthAbbr[dayjs(row.DATEDSC).month()] + ' ' + (dayjs(row.DATEDSC).year() + 543);

      const idx = this.sumMonthly.findIndex((o) => o.monthly === monthly);
      if (idx < 0) {
        this.sumMonthly.push({
          monthly, txtMonth, cases: 1,
          rw: row.RW, rw0: +row.ADJRW === 0 ? 1 : 0, adjrw: row.ADJRW, cmi: row.ADJRW,
          refer: row.REFERIN?.length === 5 ? 1 : 0,
          referRw0: +row.ADJRW === 0 && row.REFERIN?.length === 5 ? 1 : 0,
          referAdjrw: row.REFERIN?.length === 5 ? +row.ADJRW : 0,
          referCMI: row.REFERIN?.length === 5 ? +row.ADJRW : 0,
          dead: row.DISCHS === 8 || row.DISCHS === 9 ? 1 : 0,
          deadRw0: (row.DISCHS === 8 || row.DISCHS === 9) && +row.ADJRW === 0 ? 1 : 0,
          deadAdjrw: row.DISCHS === 8 || row.DISCHS === 9 ? +row.ADJRW : 0,
          deadCMI: (row.DISCHS === 8 || row.DISCHS === 9) ? +row.ADJRW : 0,
          sent: false,
        });
      } else {
        const r = this.sumMonthly[idx];
        this.sumMonthly[idx] = {
          monthly, txtMonth,
          cases: r.cases + 1,
          rw: r.rw + row.RW,
          rw0: r.rw0 + (row.ADJRW === 0 ? 1 : 0),
          adjrw: r.adjrw + row.ADJRW,
          cmi: r.adjrw / ((r.cases - r.rw0) <= 0 ? 1 : r.cases - r.rw0),
          refer: r.refer + (row.REFERIN?.length === 5 ? 1 : 0),
          referRw0: r.referRw0 + (+row.ADJRW === 0 && row.REFERIN?.length === 5 ? 1 : 0),
          referAdjrw: r.referAdjrw + (row.REFERIN?.length === 5 ? +row.ADJRW : 0),
          referCMI: r.referAdjrw / ((r.refer - r.referRw0) <= 0 ? 1 : r.refer - r.referRw0),
          dead: r.dead + (row.DISCHS === 8 || row.DISCHS === 9 ? 1 : 0),
          deadRw0: r.deadRw0 + ((row.DISCHS === 8 || row.DISCHS === 9) && +row.ADJRW === 0 ? 1 : 0),
          deadAdjrw: r.deadAdjrw + (row.DISCHS === 8 || row.DISCHS === 9 ? +row.ADJRW : 0),
          deadCMI: r.deadAdjrw / ((r.dead - r.deadRw0) <= 0 ? 1 : r.dead - r.deadRw0),
          sent: false,
        };
      }
      this.dataList.push(row);
    }

    this.dataList = this.dataList.map((item) => {
      item.wtlos = Math.ceil(item.WTLOS || 0);
      item.SDX = '';
      for (let i = 1; i < 13; i++) {
        if (item['SDX' + i]) item.SDX += (item.SDX ? ', ' : '') + item['SDX' + i];
      }
      return item;
    });

    this.sumMonthly = [...this.sumMonthly].sort((a, b) => a.monthly.localeCompare(b.monthly));

    // Calculate stats and prepare chart data
    this.calculateStats();
    this.prepareChartData();
    this.prepareReferInChartData();
  }

  calculateStats(): void {
    const totalCases = this.dataList.length;
    const totalAdjrw = this.dataList.reduce((sum, row) => sum + (+row.ADJRW || 0), 0);
    const casesWithAdjrw = this.dataList.filter(row => +row.ADJRW > 0).length;
    const casesWithAdjrw0 = this.dataList.filter(row => +row.ADJRW === 0).length;
    const totalAmount = this.dataList.reduce((sum, row) => sum + (+row.TOTAL || 0), 0);
    const totalAmountWithAdjrw = this.dataList
      .filter(row => +row.ADJRW > 0)
      .reduce((sum, row) => sum + (+row.TOTAL || 0), 0);

    // Calculate LOS statistics (ACTLOS = LOS - LEAVEDAY)
    const sumLosMinusLeaveday = this.dataList.reduce((sum, row) => {
      return sum + (+row.ACTLOS || 0);
    }, 0);

    const casesExceedWtlos = this.dataList.filter(row => {
      const actlos = +row.ACTLOS || 0;
      const wtlos = Math.ceil(+row.WTLOS || 0);
      return actlos > wtlos;
    }).length;

    const casesExceedOT = this.dataList.filter(row => {
      const actlos = +row.ACTLOS || 0;
      const ot = Math.ceil(+row.OT || 0);
      return actlos > ot;
    }).length;

    // Calculate Active Bed (total ACTLOS / number of days from first to last DATEDSC)
    let totalDays = 0;
    let activeBed = 0;
    if (this.dataList.length > 0) {
      const dates = this.dataList
        .map(row => row.DATEDSC)
        .filter(d => d)
        .sort();
      
      if (dates.length > 0) {
        const minDate = dayjs(dates[0]);
        const maxDate = dayjs(dates[dates.length - 1]);
        totalDays = maxDate.diff(minDate, 'day') + 1; // +1 to include both first and last day
        activeBed = totalDays > 0 ? sumLosMinusLeaveday / totalDays : 0;
      }
    }

    // Calculate Stroke statistics (ICD I60-I64)
    const isStroke = (icd: string): boolean => {
      if (!icd) return false;
      const code = icd.trim().toUpperCase();
      return code.startsWith('I60') || code.startsWith('I61') || 
             code.startsWith('I62') || code.startsWith('I63') || code.startsWith('I64');
    };

    const strokeCases = this.dataList.filter(row => {
      if (isStroke(row.PDX)) return true;
      for (let i = 1; i <= 13; i++) {
        if (isStroke(row[`SDX${i}`])) return true;
      }
      return false;
    });

    const strokeRefer = strokeCases.filter(row => row.REFERIN?.length === 5).length;
    const strokeNoRefer = strokeCases.filter(row => !row.REFERIN || row.REFERIN.length !== 5).length;
    const strokeTotal = strokeCases.length;

    // Calculate Stroke with rtPA by time intervals (cumulative)
    const getRtpaHours = (row: any): number | null => {
      for (let i = 1; i <= 20; i++) {
        if (row[`PROC${i}`] === '9910') {
          const dateIn = row[`DATEIN${i}`];
          const timeIn = row[`TIMEIN${i}`];
          
          if (dateIn && row.DATEADM) {
            const admitDateTime = dayjs(`${row.DATEADM} ${row.TIMEADM || '00:00'}`);
            const procDateTime = dayjs(`${dateIn} ${timeIn || '00:00'}`);
            const hoursDiff = procDateTime.diff(admitDateTime, 'hour', true);
            
            if (hoursDiff >= 0) {
              return hoursDiff;
            }
          }
          break;
        }
      }
      return null;
    };

    const strokeRtpaWithin3h = strokeCases.filter(row => {
      const hours = getRtpaHours(row);
      return hours !== null && hours <= 3;
    }).length;
    const strokeRtpaWithin4h = strokeCases.filter(row => {
      const hours = getRtpaHours(row);
      return hours !== null && hours > 3 && hours <= 4;
    }).length;
    const strokeRtpaWithin6h = strokeCases.filter(row => {
      const hours = getRtpaHours(row);
      return hours !== null && hours > 4 && hours <= 6;
    }).length;
    const strokeRtpaWithin12h = strokeCases.filter(row => {
      const hours = getRtpaHours(row);
      return hours !== null && hours > 6 && hours <= 12;
    }).length;
    const strokeRtpaWithin24h = strokeCases.filter(row => {
      const hours = getRtpaHours(row);
      return hours !== null && hours > 12 && hours <= 24;
    }).length;
    const strokeRtpaOver24h = strokeCases.filter(row => {
      const hours = getRtpaHours(row);
      return hours !== null && hours > 24;
    }).length;

    // Calculate additional Stroke statistics
    const strokeTotalAmount = strokeCases.reduce((sum, row) => sum + (+row.TOTAL || 0), 0);
    const strokeTotalAdjrw = strokeCases.reduce((sum, row) => sum + (+row.ADJRW || 0), 0);
    const strokeTotalLos = strokeCases.reduce((sum, row) => sum + (+row.ACTLOS || 0), 0);
    const strokeAvgLos = strokeTotal > 0 ? strokeTotalLos / strokeTotal : 0;
    const strokeAvgAmount = strokeTotal > 0 ? strokeTotalAmount / strokeTotal : 0;
    const strokeAmountPerAdjrw = strokeTotalAdjrw > 0 ? strokeTotalAmount / strokeTotalAdjrw : 0;
    
    const strokeDeath = strokeCases.filter(row => {
      const discht = String(row.DISCHT || '').trim();
      return discht === '8' || discht === '9';
    }).length;
    const strokeDeathRate = strokeTotal > 0 ? (strokeDeath / strokeTotal) * 100 : 0;
    
    const strokeCasesWithAdjrw = strokeCases.filter(row => +row.ADJRW > 0).length;
    const strokeCmi = strokeCasesWithAdjrw > 0 ? strokeTotalAdjrw / strokeCasesWithAdjrw : 0;

    // Calculate Appendicitis statistics (ICD K35-K37)
    const isAppendicitis = (icd: string): boolean => {
      if (!icd) return false;
      const code = icd.trim().toUpperCase();
      return code.startsWith('K35') || code.startsWith('K36') || code.startsWith('K37');
    };

    const appendicitisCases = this.dataList.filter(row => {
      if (isAppendicitis(row.PDX)) return true;
      for (let i = 1; i <= 13; i++) {
        if (isAppendicitis(row[`SDX${i}`])) return true;
      }
      return false;
    });

    const hasSurgery = (row: any): { hasProc: boolean; timeCategory: string } => {
      let hasProc = false;
      let timeCategory = '';

      for (let i = 1; i <= 20; i++) {
        const proc = row[`PROC${i}`];
        if (proc === '4701' || proc === '4709') {
          hasProc = true;
          
          // Calculate time difference
          const dateIn = row[`DATEIN${i}`];
          const timeIn = row[`TIMEIN${i}`];
          
          if (dateIn && row.DATEADM) {
            const admitDateTime = dayjs(`${row.DATEADM} ${row.TIMEADM || '00:00'}`);
            const procDateTime = dayjs(`${dateIn} ${timeIn || '00:00'}`);
            const hoursDiff = procDateTime.diff(admitDateTime, 'hour', true);
            
            if (hoursDiff >= 0 && hoursDiff <= 24) {
              timeCategory = 'within24h';
              break;
            } else if (hoursDiff > 24 && hoursDiff <= 48) {
              timeCategory = '24to48h';
              break;
            } else if (hoursDiff > 48) {
              timeCategory = 'over48h';
              break;
            }
          }
        }
      }
      
      return { hasProc, timeCategory };
    };

    const appendicitisTotal = appendicitisCases.length;
    const appendicitisWithin24h = appendicitisCases.filter(row => {
      const { timeCategory } = hasSurgery(row);
      return timeCategory === 'within24h';
    }).length;
    const appendicitis24to48h = appendicitisCases.filter(row => {
      const { timeCategory } = hasSurgery(row);
      return timeCategory === '24to48h';
    }).length;
    const appendicitisOver48h = appendicitisCases.filter(row => {
      const { timeCategory } = hasSurgery(row);
      return timeCategory === 'over48h';
    }).length;

    // Calculate additional Appendicitis statistics
    const appendicitisTotalAmount = appendicitisCases.reduce((sum, row) => sum + (+row.TOTAL || 0), 0);
    const appendicitisTotalAdjrw = appendicitisCases.reduce((sum, row) => sum + (+row.ADJRW || 0), 0);
    const appendicitisTotalLos = appendicitisCases.reduce((sum, row) => sum + (+row.ACTLOS || 0), 0);
    const appendicitisAvgLos = appendicitisTotal > 0 ? appendicitisTotalLos / appendicitisTotal : 0;
    const appendicitisAvgAmount = appendicitisTotal > 0 ? appendicitisTotalAmount / appendicitisTotal : 0;
    const appendicitisAmountPerAdjrw = appendicitisTotalAdjrw > 0 ? appendicitisTotalAmount / appendicitisTotalAdjrw : 0;
    
    const appendicitisDeath = appendicitisCases.filter(row => {
      const discht = String(row.DISCHT || '').trim();
      return discht === '8' || discht === '9';
    }).length;
    const appendicitisDeathRate = appendicitisTotal > 0 ? (appendicitisDeath / appendicitisTotal) * 100 : 0;
    
    const appendicitisCasesWithAdjrw = appendicitisCases.filter(row => +row.ADJRW > 0).length;
    const appendicitisCmi = appendicitisCasesWithAdjrw > 0 ? appendicitisTotalAdjrw / appendicitisCasesWithAdjrw : 0;

    // Calculate Delivery statistics
    const isDelivery = (row: any): boolean => {
      // Check PDX
      if (row.PDX) {
        const pdx = row.PDX.trim().toUpperCase();
        if (pdx.startsWith('O80') || pdx.startsWith('O82') || 
            (pdx.startsWith('O') && pdx >= 'O60' && pdx <= 'O84')) {
          return true;
        }
      }
      // Check SDX
      for (let i = 1; i <= 13; i++) {
        const sdx = row[`SDX${i}`];
        if (sdx) {
          const code = sdx.trim().toUpperCase();
          if (code.startsWith('O80') || code.startsWith('O82') || 
              (code.startsWith('O') && code >= 'O60' && code <= 'O84')) {
            return true;
          }
        }
      }
      return false;
    };

    const deliveryCases = this.dataList.filter(row => isDelivery(row));
    const deliveryTotal = deliveryCases.length;
    
    const deliveryNormal = deliveryCases.filter(row => {
      if (row.PDX?.startsWith('O80')) return true;
      for (let i = 1; i <= 13; i++) {
        if (row[`SDX${i}`]?.startsWith('O80')) return true;
      }
      return false;
    }).length;

    const deliveryCesarean = deliveryCases.filter(row => {
      if (row.PDX?.startsWith('O82')) return true;
      for (let i = 1; i <= 13; i++) {
        if (row[`SDX${i}`]?.startsWith('O82')) return true;
      }
      return false;
    }).length;

    const deliveryCesareanEmergency = deliveryCases.filter(row => {
      const checkCode = (code: string): boolean => {
        if (!code) return false;
        const c = code.trim().toUpperCase();
        return c.startsWith('O82.1') || c === 'O821';
      };
      if (checkCode(row.PDX)) return true;
      for (let i = 1; i <= 13; i++) {
        if (checkCode(row[`SDX${i}`])) return true;
      }
      return false;
    }).length;

    const deliveryOther = deliveryTotal - deliveryNormal - deliveryCesarean;

    const deliveryDeath = deliveryCases.filter(row => {
      const discht = String(row.DISCHT || '').trim();
      return discht === '8' || discht === '9';
    }).length;

    // Calculate delivery outcome statistics (Z37.x)
    const deliverySingleLive = deliveryCases.filter(row => {
      const checkCode = (code: string): boolean => {
        if (!code) return false;
        const c = code.trim().toUpperCase();
        return c.startsWith('Z37.0') || c === 'Z370';
      };
      if (checkCode(row.PDX)) return true;
      for (let i = 1; i <= 13; i++) {
        if (checkCode(row[`SDX${i}`])) return true;
      }
      return false;
    }).length;

    const deliverySingleStillbirth = deliveryCases.filter(row => {
      const checkCode = (code: string): boolean => {
        if (!code) return false;
        const c = code.trim().toUpperCase();
        return c.startsWith('Z37.1') || c === 'Z371';
      };
      if (checkCode(row.PDX)) return true;
      for (let i = 1; i <= 13; i++) {
        if (checkCode(row[`SDX${i}`])) return true;
      }
      return false;
    }).length;

    const deliveryTwinsBothLive = deliveryCases.filter(row => {
      const checkCode = (code: string): boolean => {
        if (!code) return false;
        const c = code.trim().toUpperCase();
        return c.startsWith('Z37.2') || c === 'Z372';
      };
      if (checkCode(row.PDX)) return true;
      for (let i = 1; i <= 13; i++) {
        if (checkCode(row[`SDX${i}`])) return true;
      }
      return false;
    }).length;

    const deliveryTwinsOneLiveOneStillbirth = deliveryCases.filter(row => {
      const checkCode = (code: string): boolean => {
        if (!code) return false;
        const c = code.trim().toUpperCase();
        return c.startsWith('Z37.3') || c === 'Z373';
      };
      if (checkCode(row.PDX)) return true;
      for (let i = 1; i <= 13; i++) {
        if (checkCode(row[`SDX${i}`])) return true;
      }
      return false;
    }).length;

    // Calculate Maternal Death statistics
    // ICD: O80-O86, O95, O721, O151, O881, O85 AND DISCHT in (8, 9)
    const maternalDeath = this.dataList.filter(row => {
      // Check if DISCHT is 8 or 9
      const discht = String(row.DISCHT || '').trim();
      if (discht !== '8' && discht !== '9') return false;

      // Check maternal death ICD codes
      const isMaternalDeathCode = (code: string): boolean => {
        if (!code) return false;
        const c = code.trim().toUpperCase();
        // O80-O86
        if (c >= 'O80' && c <= 'O86') return true;
        // O95
        if (c.startsWith('O95')) return true;
        // O72.1, O15.1, O88.1
        if (c.startsWith('O72.1') || c === 'O721') return true;
        if (c.startsWith('O15.1') || c === 'O151') return true;
        if (c.startsWith('O88.1') || c === 'O881') return true;
        // O85
        if (c.startsWith('O85')) return true;
        return false;
      };

      // Check PDX
      if (isMaternalDeathCode(row.PDX)) return true;
      // Check SDX
      for (let i = 1; i <= 13; i++) {
        if (isMaternalDeathCode(row[`SDX${i}`])) return true;
      }
      return false;
    }).length;

    // Calculate Sepsis statistics (A40, A41)
    const isSepsis = (row: any): boolean => {
      const checkCode = (code: string): boolean => {
        if (!code) return false;
        const c = code.trim().toUpperCase();
        return c.startsWith('A40') || c.startsWith('A41');
      };
      // Check PDX
      if (checkCode(row.PDX)) return true;
      // Check SDX
      for (let i = 1; i <= 13; i++) {
        if (checkCode(row[`SDX${i}`])) return true;
      }
      return false;
    };

    const sepsisCases = this.dataList.filter(row => isSepsis(row));
    const sepsisTotal = sepsisCases.length;

    const sepsisDeath = sepsisCases.filter(row => {
      const discht = String(row.DISCHT || '').trim();
      return discht === '8' || discht === '9';
    }).length;

    const sepsisDeathRate = sepsisTotal > 0 ? (sepsisDeath / sepsisTotal) * 100 : 0;

    const sepsisTotalLos = sepsisCases.reduce((sum, row) => sum + (+row.ACTLOS || 0), 0);
    const sepsisAvgLos = sepsisTotal > 0 ? sepsisTotalLos / sepsisTotal : 0;

    const sepsisTotalAmount = sepsisCases.reduce((sum, row) => sum + (+row.TOTAL || 0), 0);
    const sepsisAvgAmount = sepsisTotal > 0 ? sepsisTotalAmount / sepsisTotal : 0;

    const sepsisTotalAdjrw = sepsisCases.reduce((sum, row) => sum + (+row.ADJRW || 0), 0);
    const sepsisCasesWithAdjrw = sepsisCases.filter(row => +row.ADJRW > 0).length;
    const sepsisCmi = sepsisCasesWithAdjrw > 0 ? sepsisTotalAdjrw / sepsisCasesWithAdjrw : 0;

    // Calculate AMI statistics (I21-I22)
    const isAMI = (row: any): boolean => {
      const checkCode = (code: string): boolean => {
        if (!code) return false;
        const c = code.trim().toUpperCase();
        return c.startsWith('I21') || c.startsWith('I22');
      };
      // Check PDX
      if (checkCode(row.PDX)) return true;
      // Check SDX
      for (let i = 1; i <= 13; i++) {
        if (checkCode(row[`SDX${i}`])) return true;
      }
      return false;
    };

    const hasPCI = (row: any): boolean => {
      const pciCodes = ['3601', '3602', '3605', '3606', '3607', '3609'];
      for (let i = 1; i <= 20; i++) {
        const proc = row[`PROC${i}`];
        if (proc && pciCodes.includes(proc.trim())) return true;
      }
      return false;
    };

    const hasCABG = (row: any): boolean => {
      for (let i = 1; i <= 20; i++) {
        const proc = row[`PROC${i}`];
        if (proc) {
          const p = proc.trim();
          // CABG 3610-3619
          if (p >= '3610' && p <= '3619') return true;
        }
      }
      return false;
    };

    const amiCases = this.dataList.filter(row => isAMI(row));
    const amiTotal = amiCases.length;

    const amiWithPCI = amiCases.filter(row => hasPCI(row)).length;
    const amiWithCABG = amiCases.filter(row => hasCABG(row)).length;

    // Check PCI/CABG within 24h (assume if they have the procedure, it's within admission period)
    // For better accuracy, would need DATEADM, TIMEADM vs procedure date/time
    const amiWithPciCabgWithin24h = amiCases.filter(row => {
      // Simple proxy: if LOS >= 1 and has PCI or CABG, assume within 24h
      // Real implementation would compare DATEADM+TIMEADM with procedure datetime
      const los = +row.LOS || 0;
      return (hasPCI(row) || hasCABG(row));
    }).length;

    const amiDeath = amiCases.filter(row => {
      const discht = String(row.DISCHT || '').trim();
      return discht === '8' || discht === '9';
    }).length;

    const amiDeathRate = amiTotal > 0 ? (amiDeath / amiTotal) * 100 : 0;

    const amiTotalLos = amiCases.reduce((sum, row) => sum + (+row.ACTLOS || 0), 0);
    const amiAvgLos = amiTotal > 0 ? amiTotalLos / amiTotal : 0;

    const amiTotalAmount = amiCases.reduce((sum, row) => sum + (+row.TOTAL || 0), 0);
    const amiAvgAmount = amiTotal > 0 ? amiTotalAmount / amiTotal : 0;

    const amiTotalAdjrw = amiCases.reduce((sum, row) => sum + (+row.ADJRW || 0), 0);
    const amiCasesWithAdjrw = amiCases.filter(row => +row.ADJRW > 0).length;
    const amiCmi = amiCasesWithAdjrw > 0 ? amiTotalAdjrw / amiCasesWithAdjrw : 0;

    // Calculate Hip Fracture statistics (S720-S722) in elderly (age 60+)
    const isHipFracture = (row: any): boolean => {
      const checkCode = (code: string): boolean => {
        if (!code) return false;
        const c = code.trim().toUpperCase();
        return c.startsWith('S720') || c.startsWith('S721') || c.startsWith('S722');
      };
      // Check PDX
      if (checkCode(row.PDX)) return true;
      // Check SDX
      for (let i = 1; i <= 13; i++) {
        if (checkCode(row[`SDX${i}`])) return true;
      }
      return false;
    };

    const hasHipSurgery = (row: any): { hasProc: boolean; hoursToSurgery: number | null } => {
      const surgeryProcs = ['8151', '8152', '7935', '7805'];
      
      for (let i = 1; i <= 20; i++) {
        const proc = row[`PROC${i}`];
        if (proc && surgeryProcs.includes(proc.trim())) {
          const dateIn = row[`DATEIN${i}`];
          const timeIn = row[`TIMEIN${i}`];
          
          if (dateIn && row.DATEADM) {
            const admitDateTime = dayjs(`${row.DATEADM} ${row.TIMEADM || '00:00'}`);
            const procDateTime = dayjs(`${dateIn} ${timeIn || '00:00'}`);
            const hoursDiff = procDateTime.diff(admitDateTime, 'hour', true);
            
            if (hoursDiff >= 0) {
              return { hasProc: true, hoursToSurgery: hoursDiff };
            }
          }
          // If no valid date, still count as having procedure
          return { hasProc: true, hoursToSurgery: null };
        }
      }
      return { hasProc: false, hoursToSurgery: null };
    };

    const hipFxCases = this.dataList.filter(row => {
      // Check if hip fracture
      if (!isHipFracture(row)) return false;
      // Check if age 60+
      const age = +row.AGE_Y || 0;
      return age >= 60;
    });

    const hipFxTotal = hipFxCases.length;

    const hipFxWithSurgery = hipFxCases.filter(row => hasHipSurgery(row).hasProc).length;

    const hipFxSurgeryWithin48h = hipFxCases.filter(row => {
      const { hasProc, hoursToSurgery } = hasHipSurgery(row);
      return hasProc && hoursToSurgery !== null && hoursToSurgery <= 48;
    }).length;

    const hipFxSurgeryWithin72h = hipFxCases.filter(row => {
      const { hasProc, hoursToSurgery } = hasHipSurgery(row);
      return hasProc && hoursToSurgery !== null && hoursToSurgery > 48 && hoursToSurgery <= 72;
    }).length;

    const hipFxSurgeryAfter72h = hipFxCases.filter(row => {
      const { hasProc, hoursToSurgery } = hasHipSurgery(row);
      return hasProc && hoursToSurgery !== null && hoursToSurgery > 72;
    }).length;

    const hipFxDeath = hipFxCases.filter(row => {
      const discht = String(row.DISCHT || '').trim();
      return discht === '8' || discht === '9';
    }).length;

    const hipFxDeathRate = hipFxTotal > 0 ? (hipFxDeath / hipFxTotal) * 100 : 0;

    const hipFxTotalLos = hipFxCases.reduce((sum, row) => sum + (+row.ACTLOS || 0), 0);
    const hipFxAvgLos = hipFxTotal > 0 ? hipFxTotalLos / hipFxTotal : 0;

    const hipFxTotalAmount = hipFxCases.reduce((sum, row) => sum + (+row.TOTAL || 0), 0);
    const hipFxAvgAmount = hipFxTotal > 0 ? hipFxTotalAmount / hipFxTotal : 0;

    const hipFxTotalAdjrw = hipFxCases.reduce((sum, row) => sum + (+row.ADJRW || 0), 0);
    const hipFxCasesWithAdjrw = hipFxCases.filter(row => +row.ADJRW > 0).length;
    const hipFxCmi = hipFxCasesWithAdjrw > 0 ? hipFxTotalAdjrw / hipFxCasesWithAdjrw : 0;

    this.stats.set({
      totalCases,
      casesWithAdjrw0,
      totalAdjrw,
      cmi: casesWithAdjrw > 0 ? totalAdjrw / casesWithAdjrw : 0,
      totalAmount,
      totalPerCase: totalCases > 0 ? totalAmount / totalCases : 0,
      totalPerAdjrw: totalAdjrw > 0 ? totalAmountWithAdjrw / totalAdjrw : 0,
      totalPerActlos: sumLosMinusLeaveday > 0 ? totalAmount / sumLosMinusLeaveday : 0,
      sumLosMinusLeaveday,
      avgActlosPerCase: totalCases > 0 ? sumLosMinusLeaveday / totalCases : 0,
      activeBed,
      totalDays,
      percentExceedWtlos: totalCases > 0 ? (casesExceedWtlos / totalCases) * 100 : 0,
      percentExceedOT: totalCases > 0 ? (casesExceedOT / totalCases) * 100 : 0,
      strokeRefer,
      strokeNoRefer,
      strokeTotal,
      strokeRtpaWithin3h,
      strokeRtpaWithin4h,
      strokeRtpaWithin6h,
      strokeRtpaWithin12h,
      strokeRtpaWithin24h,
      strokeRtpaOver24h,
      strokeTotalAmount,
      strokeTotalAdjrw,
      strokeAvgLos,
      strokeAvgAmount,
      strokeAmountPerAdjrw,
      strokeDeath,
      strokeDeathRate,
      strokeCmi,
      appendicitisTotal,
      appendicitisWithin24h,
      appendicitis24to48h,
      appendicitisOver48h,
      appendicitisTotalAmount,
      appendicitisTotalAdjrw,
      appendicitisAvgLos,
      appendicitisAvgAmount,
      appendicitisAmountPerAdjrw,
      appendicitisDeath,
      appendicitisDeathRate,
      appendicitisCmi,
      deliveryTotal,
      deliveryNormal,
      deliveryCesarean,
      deliveryCesareanEmergency,
      deliveryOther,
      deliveryDeath,
      deliverySingleLive,
      deliverySingleStillbirth,
      deliveryTwinsBothLive,
      deliveryTwinsOneLiveOneStillbirth,
      maternalDeath,
      sepsisTotal,
      sepsisDeath,
      sepsisDeathRate,
      sepsisTotalLos,
      sepsisAvgLos,
      sepsisTotalAmount,
      sepsisAvgAmount,
      sepsisTotalAdjrw,
      sepsisCmi,
      amiTotal,
      amiWithPCI,
      amiWithCABG,
      amiWithPciCabgWithin24h,
      amiDeath,
      amiDeathRate,
      amiAvgLos,
      amiAvgAmount,
      amiCmi,
      hipFxTotal,
      hipFxWithSurgery,
      hipFxSurgeryWithin48h,
      hipFxSurgeryWithin72h,
      hipFxSurgeryAfter72h,
      hipFxDeath,
      hipFxDeathRate,
      hipFxAvgLos,
      hipFxAvgAmount,
      hipFxCmi,
    });
  }

  prepareChartData(): void {
    // Group by REFERIN
    const groups: { [key: string]: any[] } = {
      'ไม่มี Refer': [],
      'มี Refer': [],
    };

    this.dataList.forEach(row => {
      const hasRefer = row.REFERIN && row.REFERIN.length === 5;
      const key = hasRefer ? 'มี Refer' : 'ไม่มี Refer';
      groups[key].push(row);
    });

    const chartData = Object.keys(groups).map(key => {
      const items = groups[key];
      const count = items.length;
      const sumAdjrw = items.reduce((sum, row) => sum + (+row.ADJRW || 0), 0);
      const casesWithAdjrw = items.filter(row => +row.ADJRW > 0).length;
      const cmi = casesWithAdjrw > 0 ? sumAdjrw / casesWithAdjrw : 0;
      const sumTotal = items.reduce((sum, row) => sum + (+row.TOTAL || 0), 0);

      return {
        name: key,
        count,
        sumAdjrw,
        cmi,
        sumTotal,
      };
    });

    this.chartData.set(chartData);
    // Chart will be initialized by effect
  }

  initChart(): void {
    const container = this.chartContainer()?.nativeElement;
    if (!container || !this.chartData()) return;

    if (this.chartInstance) {
      this.chartInstance.dispose();
    }

    this.chartInstance = echarts.init(container);
    const data = this.chartData();

    const option: EChartsOption = {
      title: {
        text: 'สรุปข้อมูลแยกตาม Refer In',
        left: 'center',
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
      },
      legend: {
        data: ['จำนวนราย', 'Sum AdjRW', 'CMI', 'Sum Total (บาท)'],
        top: '10%',
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: data.map((d: any) => d.name),
      },
      yAxis: [
        {
          type: 'value',
          name: 'จำนวน',
          position: 'left',
        },
        {
          type: 'value',
          name: 'CMI',
          position: 'right',
        },
      ],
      series: [
        {
          name: 'จำนวนราย',
          type: 'bar',
          data: data.map((d: any) => d.count),
          itemStyle: { color: '#5470c6' },
        },
        {
          name: 'Sum AdjRW',
          type: 'bar',
          data: data.map((d: any) => parseFloat(d.sumAdjrw.toFixed(2))),
          itemStyle: { color: '#91cc75' },
        },
        {
          name: 'CMI',
          type: 'line',
          yAxisIndex: 1,
          data: data.map((d: any) => parseFloat(d.cmi.toFixed(4))),
          itemStyle: { color: '#fac858' },
        },
        {
          name: 'Sum Total (บาท)',
          type: 'bar',
          data: data.map((d: any) => Math.round(d.sumTotal / 1000)),
          itemStyle: { color: '#ee6666' },
        },
      ],
    };

    this.chartInstance.setOption(option);
  }

  prepareReferInChartData(): void {
    // Group by REFERIN (hospital code)
    const referInMap: { [key: string]: any[] } = {};

    this.dataList.forEach(row => {
      const referin = row.REFERIN;
      if (referin && referin.length === 5) {
        if (!referInMap[referin]) {
          referInMap[referin] = [];
        }
        referInMap[referin].push(row);
      }
    });

    const chartData = Object.keys(referInMap)
      .map(hcode => {
        const items = referInMap[hcode];
        const count = items.length;
        const sumAdjrw = items.reduce((sum, row) => sum + (+row.ADJRW || 0), 0);

        return {
          hcode,
          count,
          sumAdjrw,
        };
      })
      .sort((a, b) => b.count - a.count) // Sort by count descending
      .slice(0, 20); // Top 20 hospitals

    this.referInChartData.set(chartData);
  }

  initReferInChart(): void {
    const container = this.chartContainer2()?.nativeElement;
    if (!container || !this.referInChartData()) return;

    if (this.chartInstance2) {
      this.chartInstance2.dispose();
    }

    this.chartInstance2 = echarts.init(container);
    const data = this.referInChartData();

    const option: EChartsOption = {
      title: {
        text: 'Top 20 สถานพยาบาลที่ส่งต่อมา (Refer In)',
        left: 'center',
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          const data = params[0];
          return `<strong>${data.name}</strong><br/>
                  จำนวนราย: ${data.value.toLocaleString()}<br/>
                  Sum AdjRW: ${params[1].value.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        },
      },
      legend: {
        data: ['จำนวนราย', 'Sum AdjRW'],
        top: '10%',
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: data.map((d: any) => d.hcode),
        axisLabel: {
          rotate: 45,
          interval: 0,
        },
      },
      yAxis: [
        {
          type: 'value',
          name: 'จำนวนราย',
          position: 'left',
        },
        {
          type: 'value',
          name: 'Sum AdjRW',
          position: 'right',
        },
      ],
      series: [
        {
          name: 'จำนวนราย',
          type: 'bar',
          data: data.map((d: any) => d.count),
          itemStyle: { color: '#5470c6' },
        },
        {
          name: 'Sum AdjRW',
          type: 'line',
          yAxisIndex: 1,
          data: data.map((d: any) => parseFloat(d.sumAdjrw.toFixed(2))),
          itemStyle: { color: '#ee6666' },
          lineStyle: { width: 3 },
        },
      ],
    };

    this.chartInstance2.setOption(option);
  }

  showDetail(row: any): void {
    this.currentRow = row;
    this.modalDetail.set(true);
    this.cdr.markForCheck();
  }

  showList(type: string, monthly: string): void {
    this.currentShow = type;
    this.dataShow = [];
    if (type === 'rw0') this.showTitle = 'ทะเบียนผู้ป่วยใน ที่มีค่า RW=0';
    else if (type === 'refer') this.showTitle = 'ทะเบียนผู้ป่วยใน ที่รับรักษาจากการส่งต่อ (Refer In)';
    else if (type === 'dead') this.showTitle = 'ทะเบียนผู้ป่วยใน ที่เสียชีวิต';
    else this.showTitle = '';

    this.dataShow = this.dataList.filter((row) =>
      monthly === dayjs(row.DATEDSC).format('YYYY-MM') && (
        (type === 'rw0' && +row.ADJRW === 0) ||
        (type === 'refer' && row.REFERIN?.length === 5) ||
        (type === 'dead' && (row.DISCHS === 8 || row.DISCHS === 9))
      )
    );
    this.modalList.set(true);
    this.cdr.markForCheck();
  }

  async onExport(type: string, monthly: string): Promise<void> {
    this.loading.set(true);
    const data =
      type === monthly
        ? this.dataList.filter((row) => monthly === dayjs(row.DATEDSC).format('YYYY-MM'))
        : this.dataShow;
    await this.excel.exportAsExcelFile(data, type, '_' + dayjs().format('YYYYMMDD_HHmmss'));
    this.loading.set(false);
    this.cdr.markForCheck();
  }

  async onExportAll(): Promise<void> {
    this.loading.set(true);
    await this.excel.exportAsExcelFile(this.dataList, 'cmi', '_' + dayjs().format('YYYYMMDD_HHmmss'));
    this.loading.set(false);
    this.cdr.markForCheck();
  }

  async onExportSummary(): Promise<void> {
    this.loading.set(true);
    await this.excel.exportAsExcelFile(this.sumMonthly, 'cmi_monthly', '_' + dayjs().format('YYYYMMDD_HHmmss'));
    this.loading.set(false);
    this.cdr.markForCheck();
  }
}
