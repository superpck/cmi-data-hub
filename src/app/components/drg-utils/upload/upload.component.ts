import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { PkDatePipe, PkIcon, PkModal, PkModalBody, PkModalFooter, PkModalHeader } from 'ngx-pk-ui';
import dayjs from 'dayjs';
import { DrgsService } from '../../../services/drgs.service';
import { MainService } from '../../../services/main.service';
import { ExcelService } from '../../../services/excel.service';

@Component({
  selector: 'app-upload',
  imports: [FormsModule, DecimalPipe, PkDatePipe, PkIcon, PkModal, PkModalHeader, PkModalBody, PkModalFooter],
  templateUrl: './upload.component.html',
  styleUrl: './upload.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UploadComponent implements OnInit {
  private cmiService = inject(DrgsService);
  private mainService = inject(MainService);
  private excel = inject(ExcelService);
  private cdr = inject(ChangeDetectorRef);

  userInfo = signal<any>({});
  loading = signal(false);
  modalDetail = signal(false);
  modalList = signal(false);

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

  async upload(item: any): Promise<void> {
    alert('ยังไม่พร้อมใช้งาน');
  }

  fileUpload(event: Event): void {
    this.data = [];
    this.lineNo = 0;
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
      this.cdr.markForCheck();
    };
    fileReader.onerror = () => {
      this.loading.set(false);
      this.cdr.markForCheck();
    };
    fileReader.readAsText(file);
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
