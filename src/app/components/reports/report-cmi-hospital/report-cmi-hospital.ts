import { Component, OnInit, signal, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PkIcon, PkToastrService, PkTooltip } from 'ngx-pk-ui';
import dayjs from 'dayjs';
import { CmiService } from '../../../services/cmi.service';
import { NgxEchartsDirective } from 'ngx-echarts';
import { EChartsOption } from 'echarts';

@Component({
  selector: 'app-report-cmi-hospital',
  imports: [
    CommonModule, FormsModule, RouterLink,
    PkIcon, PkTooltip,
    NgxEchartsDirective
  ],
  templateUrl: './report-cmi-hospital.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./report-cmi-hospital.scss'],
})
export class ReportCmiHospital implements OnInit {
  private readonly cmiService = inject(CmiService);
  private readonly toastr = inject(PkToastrService);

  loading = signal<boolean>(false);

  monthStart = signal<number>(10);
  yearStart = signal<number>(dayjs().subtract(1, 'month').year() + 543);
  monthEnd = signal<number>(dayjs().month() + 1);
  yearEnd = signal<number>(dayjs().year() + 543);
  dayCount = signal<number>(365);

  yearList: number[] = []

  hospitalLevel = signal<string>('A');
  provinceCode = signal<string>('');
  regionCode = signal<string>('');

  dataList = signal<any[]>([]);
  sumHospitals = signal<any[]>([]);

  chartOptions = computed<EChartsOption>(() => {
    const data = this.sumHospitals().slice(0, 10);
    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'value',
        name: 'CMI'
      },
      yAxis: {
        type: 'category',
        data: data.map(d => d.hname_abbr || d.hname).reverse(),
      },
      series: [
        {
          name: 'CMI',
          type: 'bar',
          data: data.map(d => d.cmi).reverse(),
          itemStyle: {
            color: '#0e8539'
          },
          label: {
            show: true,
            position: 'right',
            formatter: (params: any) => Number(params.value).toFixed(4)
          }
        }
      ]
    };
  });

  ngOnInit(): void {
    this.yearStart.set(dayjs().subtract(dayjs().month() < 9 ? 1 : 0, 'year').year() + 543);
    const currentYear = dayjs().year();
    for (let i = 0; i < 5; i++) {
      this.yearList.push(currentYear - i + 543);
    }
  }

  async process() {
    const dateStart = dayjs(`${this.yearStart() - 543}-${this.monthStart()}-01`);
    const dateEnd = dayjs(`${this.yearEnd() - 543}-${this.monthEnd()}-01`).endOf('month');
    if (dateEnd.diff(dateStart, 'year') > 0) {
      this.toastr.error('ข้อมูลต้องไม่เกิน 1 ปี');
      return;
    }

    this.loading.set(true);
    try {
      const options = {
        isFiscalYear: true,
        year: this.yearStart(),
        splevel: this.hospitalLevel(),
        chwcode: this.provinceCode(),
        region: this.regionCode(),
      };
      const result: any = await this.cmiService.reportHospitalCMI(options);
      let sumHospitals: any[] = [];
      const columnNumber = [
        'target', 'drg_group_cnt', 'cases', 'actlos', 'los', 'los_over', 'rw0_cases',
        'adjrw', 'cmi', 'dead_cases', 'dead_adjrw', 'dead_cmi', 'dead_rw0', 'dead_los',
        'referin_cases', 'referin_adjrw', 'price'];
      let rows = result?.data || result?.rows || [];
      for (let row of rows) {
        for (const col of columnNumber) {
          row[col] = Number(row[col]) || 0;
        }
        row.actlos = row.actlos || row.los;
        /* 
          actlos :  2466
          adjrw :  "669.8485"
          cases :  733
          chwcode :  "11"
          cmi :  "0.9138"
          date_process :  "2024-01-30T21:17:04.000Z"
          dead_adjrw :  "50.1307"
          dead_cases :  24
          dead_cmi :  2.0888
          dead_los :  113
          dead_rw0 :  0
          drg_group_cnt :  195
          hcode :  "10754"
          hname :  "โรงพยาบาลบางจาก"
          hname_abbr :  "รพ.บางจาก"
          lastupdate :  "2024-01-30T21:17:04.000Z"
          los_over :  201
          mm :  10
          monthly :  "202210"
          price :  "5982256.00"
          referin_adjrw :  "0.0000"
          referin_cases :  0
          referin_cmi :  null
          referin_los :  0
          referin_rw0 :  0
          region :  6
          rw0_cases :  0
          splevel :  "F1"
          target :  "0.60"
          yy :  2022
  */

        const ind = sumHospitals.findIndex((item: any) => item.hcode === row.hcode);
        if (ind < 0) {
          sumHospitals.push(row);
        } else {
          for (const col of columnNumber) {
            sumHospitals[ind][col] += row[col];
          }
          sumHospitals[ind]['cmi'] = sumHospitals[ind]['adjrw'] / (sumHospitals[ind]['cases'] - sumHospitals[ind]['rw0_cases']);
          sumHospitals[ind]['dead_cmi'] = sumHospitals[ind]['dead_adjrw'] / (sumHospitals[ind]['dead_cases'] - sumHospitals[ind]['dead_rw0']);
        }
      };
      this.sumHospitals.set(sumHospitals.sort((a: any, b: any) => b.cmi - a.cmi));
      this.dataList.set(rows);
      // console.log('result', this.dataList());
      // console.log('sumHospitals', sumHospitals);
    } finally {
      this.loading.set(false);
    }
  }
}
