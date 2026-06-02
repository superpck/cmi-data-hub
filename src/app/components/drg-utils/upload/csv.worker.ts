/// <reference lib="webworker" />

// Import dayjs for date processing (must be available in worker context)
import dayjs from 'dayjs';

interface WorkerMessage {
  type: 'parse';
  file: File;
}

interface WorkerResult {
  type: 'success' | 'error' | 'progress';
  dataList?: any[];
  sumMonthly?: any[];
  lineNo?: number;
  error?: string;
  progress?: number;
}

const thMonthAbbr = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

addEventListener('message', ({ data }: MessageEvent<WorkerMessage>) => {
  if (data.type === 'parse') {
    parseCSVFile(data.file);
  }
});

function parseCSVFile(file: File): void {
  const reader = new FileReader();

  reader.onload = () => {
    try {
      const text = reader.result as string;
      const lines = text.replace(/\n/g, '').split(/\r/);
      const lineNo = lines.length;

      // Parse CSV data
      const structure = lines[0].toUpperCase().split(',');
      const dataList: any[] = [];
      const sumMonthly: any[] = [];

      for (let i = 1; i < lines.length; i++) {
        const aLine = lines[i].replace(/"/g, '').split(',');
        if (!aLine || aLine[0] === '') continue;

        let nColumn = -1;
        const row: any = {};
        for (const fld of structure) {
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
        const txtMonth = thMonthAbbr[dayjs(row.DATEDSC).month()] + ' ' + (dayjs(row.DATEDSC).year() + 543);

        const idx = sumMonthly.findIndex((o) => o.monthly === monthly);
        if (idx < 0) {
          sumMonthly.push({
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
          const r = sumMonthly[idx];
          sumMonthly[idx] = {
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
        dataList.push(row);

        // Send progress updates every 1000 rows
        if (i % 1000 === 0) {
          const progress = Math.round((i / lines.length) * 100);
          postMessage({ type: 'progress', progress } as WorkerResult);
        }
      }

      // Post-process dataList
      const processedDataList = dataList.map((item) => {
        item.wtlos = Math.ceil(item.WTLOS || 0);
        item.SDX = '';
        for (let i = 1; i < 13; i++) {
          if (item['SDX' + i]) item.SDX += (item.SDX ? ', ' : '') + item['SDX' + i];
        }
        return item;
      });

      // Sort sumMonthly
      const sortedSumMonthly = [...sumMonthly].sort((a, b) => a.monthly.localeCompare(b.monthly));

      // Send results back to main thread
      postMessage({
        type: 'success',
        dataList: processedDataList,
        sumMonthly: sortedSumMonthly,
        lineNo
      } as WorkerResult);
    } catch (error: any) {
      postMessage({
        type: 'error',
        error: error?.message || 'Error parsing CSV file'
      } as WorkerResult);
    }
  };

  reader.onerror = () => {
    postMessage({
      type: 'error',
      error: 'Error reading file'
    } as WorkerResult);
  };

  reader.readAsText(file);
}
