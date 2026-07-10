import { Injectable } from '@angular/core';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

@Injectable({ providedIn: 'root' })
export class ExcelService {
  async exportAsExcelFile(
    json: any[],
    fileName: string,
    fileNameSuffix = '',
    bookType: XLSX.BookType = 'csv'
  ): Promise<void> {
    const options: XLSX.WritingOptions = {
      bookType,
      type: 'array',
    };
    const worksheet = XLSX.utils.json_to_sheet(json);
    const workbook: XLSX.WorkBook = { Sheets: { data: worksheet }, SheetNames: ['data'] };
    const fileBuffer: ArrayBuffer = XLSX.write(workbook, options);
    const blob = new Blob([fileBuffer], { type: 'application/octet-stream' });
    saveAs(blob, `${fileName}${fileNameSuffix}.${bookType}`);
  }
}
