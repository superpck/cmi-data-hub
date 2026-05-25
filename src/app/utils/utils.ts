import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
dayjs.extend(duration);

export const randomString = async (length: number, format = 'AlphaNumeric') => {
  // format AlphaNumeric=String+number, Special=AlphaNumeric+Special characters
  length = Math.max(1, Math.min(1024, length));
  const characters1 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const characters2 = '@ABCDEFGHIJKLMNOPQRSTUVWXYZ-*^abcdefghijklmnopqrstuvwxyz0123456789!$_';
  const characters = format?.substring(0, 1).toUpperCase() === 'S' ? characters2 : characters1;
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => characters[b % characters.length]).join('');
}

export const isNumeric = (value: unknown): boolean => {
  return !isNaN(parseFloat(String(value))) && isFinite(Number(value));
}

export const dateLen = async (date1: any, date2: any = dayjs()) => {
  if (date1 === undefined || date1 === null || date1 === '0000-00-00' || date1 === '0000-00-00 00:00:00' || date1 === 'Invalid Date' ||
    date2 === undefined || date2 === null || date2 === '0000-00-00' || date2 === '0000-00-00 00:00:00' || date2 === 'Invalid Date') {
    return false;
  }
  if (!date1 || !date2) {
    return null;
  }

  date1 = dayjs(date1);
  date2 = dayjs(date2);
  const diff = date2.diff(date1, 'millisecond');
  const dur = dayjs.duration(diff);

  return {
    days: Math.floor(dur.asDays()),
    year: dur.years(),
    month: dur.months(),
    day: dur.days(),
    hour: dur.hours(),
    minute: dur.minutes(),
    second: dur.seconds(),
    millisecond: diff
  }
}

export const thaiDateArray = (date: any = dayjs()) => {
  const thaiMonthAbbr = [
    'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
  ];
  const txtMonth = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม', 'กรุณาเลือกเดือน'];
  const thDow = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
  const thDowAbbr = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
  const nMonth = dayjs(date).get('month');
  return {
    dow: dayjs(date).format('d'),
    day: dayjs(date).get('date'),
    month: nMonth,
    year: dayjs(date).get('year'),
    thDow: thDow[+dayjs(date).format('d')],
    thDowAbbr: thDowAbbr[+dayjs(date).format('d')],
    thMonth: txtMonth[nMonth],
    thMonthAbbr: thaiMonthAbbr[nMonth],
    thYear: (+dayjs(date).get('year') + 543)
  };
};

export const thaiDate = (date: any = dayjs()) => {
  return dayjs(date).get('date') + '/' + (+dayjs(date).get('month') + 1) + '/' + (+dayjs(date).get('year') + 543);
};

export const thaiDateAbbr = (date: any = dayjs(), withYear = true) => {
  const dateArray: any = thaiDateArray(date);
  return dateArray.day + ' ' + dateArray.thMonthAbbr +
    (withYear ? (' ' + dateArray.thYear) : '');
};
export const thaiDateFull = (date = dayjs(), withYear = true) => {
  const dateArray: any = thaiDateArray(date);
  return 'วัน' + dateArray.thDow + ' ที่ ' + dateArray.day + ' ' + dateArray.thMonth +
    (withYear ? (' พ.ศ.' + dateArray.thYear) : '');
};
export const timeMinute = (date = dayjs()) => {
  return dayjs(date).format('HH:mm');
};
export const timeSecond = (date = dayjs()) => {
  return dayjs(date).format('HH:mm:ss');
};
export const sleep = (millisecond: number = 1000) => {
  const clampedMs = Math.min(Math.max(millisecond, 100), 86_400_000); // 1 day in ms
  return new Promise(resolve => setTimeout(resolve, clampedMs));
};

/**
 * เรียงลำดับ array ตาม column ที่กำหนด รองรับหลาย column
 * @param dataArray - array ข้อมูลที่ต้องการเรียง
 * @param columnList - รายชื่อ column ที่ใช้เรียง (เรียงตามลำดับ)
 * @param direction - ทิศทางการเรียง 'asc' (น้อย→มาก) หรือ 'desc' (มาก→น้อย) default: 'asc'
 * @example orderBy(data, ['dept', 'name'], 'asc')
 */
export const orderBy = <T>(dataArray: T[], columnList: (keyof T)[], direction: 'asc' | 'desc' = 'asc'): T[] => {
  if (!Array.isArray(dataArray) || dataArray.length === 0) return dataArray;
  const dir = direction === 'desc' ? -1 : 1;
  return [...dataArray].sort((a, b) => {
    for (const col of columnList) {
      const va = a[col];
      const vb = b[col];
      if (va === vb) continue;
      if (va === null || va === undefined) return dir;
      if (vb === null || vb === undefined) return -dir;
      if (va < vb) return -dir;
      if (va > vb) return dir;
    }
    return 0;
  });
};

/**
 * จัดกลุ่ม array ตาม column ที่กำหนด
 * @param dataArray - array ข้อมูลที่ต้องการจัดกลุ่ม
 * @param columnList - รายชื่อ column ที่ใช้เป็น key ในการจัดกลุ่ม (คั่นด้วย '|')
 * @returns Record<string, T[]> โดย key คือค่าจาก columnList
 * @example
 * groupBy(data, ['region'])
 * // { r1: [{...}, {...}], r2: [{...}], r3: [{...}, ...] }
 */
export const groupBy = <T>(dataArray: T[], columnList: (keyof T)[]): Record<string, T[]> => {
  if (!Array.isArray(dataArray) || dataArray.length === 0) return {};
  return dataArray.reduce((groups, item) => {
    const key = columnList.map(col => String(item[col] ?? '')).join('|');
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
    return groups;
  }, {} as Record<string, T[]>);
};

/**
 * กรองรายการซ้ำออกจาก array โดยอิงจาก column ที่กำหนด เก็บรายการแรกที่พบ
 * @param dataArray - array ข้อมูลที่ต้องการกรอง
 * @param columnList - รายชื่อ column ที่ใช้ตรวจสอบความซ้ำ
 * @example uniqBy(data, ['CID']) // ตัดผู้ป่วยซ้ำตาม CID
 */
export const uniqBy = <T>(dataArray: T[], columnList: (keyof T)[]): T[] => {
  if (!Array.isArray(dataArray) || dataArray.length === 0) return dataArray;
  const seen = new Set<string>();
  return dataArray.filter(item => {
    const key = columnList.map(col => String(item[col] ?? '')).join('|');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

/**
 * รวมผลรวมของ column ที่กำหนด โดยจัดกลุ่มตาม columnList (uniq by)
 * @param dataArray - array ข้อมูลที่ต้องการหาผลรวม
 * @param columnList - รายชื่อ column ที่ใช้เป็น group key (ถ้าเป็น [] จะรวมทั้งหมดใน key '__total__')
 * @param sumColumn - ชื่อ column ที่ต้องการ sum
 * @returns Record<string, number> โดย key คือค่าจาก columnList
 * @example sumBy(data, ['dept'], 'amount') // { 'IT': 5000, 'HR': 3000 }
 */
export const sumBy = <T>(dataArray: T[], columnList: (keyof T)[], sumColumn: keyof T): Record<string, number> => {
  if (!Array.isArray(dataArray) || dataArray.length === 0) return {};
  return dataArray.reduce((acc, item) => {
    const key = columnList.length > 0
      ? columnList.map(col => String(item[col] ?? '')).join('|')
      : '__total__';
    const val = parseFloat(item[sumColumn] as any) || 0;
    acc[key] = (acc[key] ?? 0) + val;
    return acc;
  }, {} as Record<string, number>);
};