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
import { PkDatePipe, PkIcon } from 'ngx-pk-ui';
import dayjs from 'dayjs';
import { DrgsService } from '../../../services/drgs.service';
import { MainService } from '../../../services/main.service';
import { ExcelService } from '../../../services/excel.service';

@Component({
  selector: 'app-data-list',
  imports: [
    FormsModule, DecimalPipe,
    PkDatePipe, PkIcon
  ],
  templateUrl: './data-list.component.html',
  styleUrl: './data-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataListComponent implements OnInit {
  private cmiService = inject(DrgsService);
  private mainService = inject(MainService);
  private excel = inject(ExcelService);
  private cdr = inject(ChangeDetectorRef);

  loading = signal(false);
  userInfo = signal<any>({});
  modalDetail = signal(false);

  searchType = 'HN';
  searchValue = '';
  searchDate = dayjs().subtract(3, 'months').format('YYYY-MM-DD');
  month = dayjs(this.searchDate).month();
  year = dayjs(this.searchDate).year() + 543;
  yearList: number[] = [];

  dataList: any[] = [];
  dataListAll: any[] = [];
  currentRow: any = {};
  structure: string[] = [];

  rowCount = 0;
  currentPage = 1;
  itemsPerPage = 10;
  pageCount = 0;
  pageList: number[] = [1];

  readonly thMonth = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];

  async ngOnInit(): Promise<void> {
    const info = await this.mainService.decodeToken();
    this.userInfo.set(info ?? {});
    for (let i = this.year; i > 2560; i--) this.yearList.push(i);
    this.cdr.markForCheck();
  }

  resetVar(): void {
    this.dataList = [];
    this.dataListAll = [];
  }

  async getData(): Promise<void> {
    this.loading.set(true);
    await this.onSearch();
    this.currentPage = 1;
    this.loading.set(false);
    this.cdr.markForCheck();
  }

  async onSearch(): Promise<void> {
    this.loading.set(true);
    if (this.searchDate && ['DATEADM', 'DATEDSC'].includes(this.searchType)) {
      this.month = dayjs(this.searchDate).month();
      this.year = dayjs(this.searchDate).year() + 543;
    }
    const searchValue =
      ['DATEADM', 'DATEDSC'].includes(this.searchType) ? this.searchDate : this.searchValue;

    const result: any = await this.cmiService.getIPD(
      this.userInfo().hcode, +this.year - 543, +this.month + 1,
      this.searchType, searchValue, this.currentPage, this.itemsPerPage
    );

    if (result?.status === 200) {
      this.dataList = result.data.rows.map((row: any) => {
        for (const fld in row) {
          row[fld] = row[fld] === '0000-00-00' ? null : row[fld];
          if (fld.includes('TIME')) {
            row[fld] = !row[fld] || row[fld] === '0000'
              ? null
              : row[fld].replace(/(\d{2})(\d{2})/, '$1:$2');
          }
        }
        return row;
      });
      this.rowCount = result.data.row_count;
      this.pageCount = Math.ceil(this.rowCount / this.itemsPerPage);
    } else {
      this.dataList = [];
      this.rowCount = 0;
    }
    this.setPageList();
    this.loading.set(false);
    this.cdr.markForCheck();
  }

  async getAll(): Promise<void> {
    if (this.dataListAll?.length > 0) return;
    if (this.searchDate && ['DATEADM', 'DATEDSC'].includes(this.searchType)) {
      this.month = dayjs(this.searchDate).month();
      this.year = dayjs(this.searchDate).year() + 543;
    }
    const searchValue =
      ['DATEADM', 'DATEDSC'].includes(this.searchType) ? this.searchDate : this.searchValue;

    const resultAll: any = await this.cmiService.getIPD(
      this.userInfo().hcode, +this.year - 543, +this.month + 1,
      this.searchType, searchValue, 1, 20000
    );
    this.dataListAll = resultAll?.status === 200 ? (resultAll.data.rows ?? []) : [];
  }

  showDetail(row: any): void {
    this.structure = Object.keys(row);
    this.currentRow = row;
    this.modalDetail.set(true);
    this.cdr.markForCheck();
  }

  async onExport(): Promise<void> {
    this.loading.set(true);
    await this.getAll();
    if (this.dataListAll.length) {
      await this.excel.exportAsExcelFile(
        this.dataListAll,
        'admission_' + dayjs(this.dataListAll[0].DATEDSC).format('YYYY_MM_'),
        dayjs().format('YYYYMMDD_HHmmss')
      );
    }
    this.loading.set(false);
    this.cdr.markForCheck();
  }

  paginatedData(): any[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.dataListAll.slice(startIndex, startIndex + this.itemsPerPage);
  }

  setPageList(): void {
    this.pageList = [];
    for (let i = 1; i <= this.pageCount; i++) this.pageList.push(i);
  }

  gotoPage(): void {
    if (this.dataListAll?.length > 0) {
      this.dataList = this.paginatedData();
    } else {
      this.onSearch();
    }
  }

  onNextPage(): void {
    if (this.currentPage < this.pageCount) {
      this.currentPage++;
      if (this.dataListAll?.length > 0) {
        this.dataList = this.paginatedData();
      } else {
        this.onSearch();
      }
      this.cdr.markForCheck();
    }
  }

  onPreviousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      if (this.dataListAll?.length > 0) {
        this.dataList = this.paginatedData();
      } else {
        this.onSearch();
      }
      this.cdr.markForCheck();
    }
  }

  setPage(): void {
    this.currentPage = 1;
    if (this.dataListAll?.length > 0) {
      this.pageCount = Math.ceil(this.rowCount / this.itemsPerPage);
      this.setPageList();
      this.dataList = this.paginatedData();
    } else {
      this.onSearch();
    }
    this.cdr.markForCheck();
  }
}
