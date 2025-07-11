import * as React from 'react';
import { IAnalysisResults } from '../../models/IAnalysisResults';

export class ExcelGenerator {
  public static generateExcel(results: IAnalysisResults): void {
    // Dynamically import xlsx
    import('xlsx').then((XLSX) => {
      const workbook = XLSX.utils.book_new();
      
      // Create Notes sheet
      const notesData = this.createNotesSheet(results);
      const notesSheet = XLSX.utils.aoa_to_sheet(notesData);
      // Apply bold to section titles in Notes sheet
      this.applyBoldToRows(notesSheet, [0, 2, 5, 7, 8, 12, 14]);
      // Set column widths for Notes sheet
      notesSheet['!cols'] = [
        { wch: 28 }, // Label column
        { wch: 40 }, // Value column
        { wch: 20 },
        { wch: 20 }
      ];
      XLSX.utils.book_append_sheet(workbook, notesSheet, 'Notes');
      
      // Create Data Comparison sheet
      const comparisonData = this.createComparisonSheet(results);
      const comparisonSheet = XLSX.utils.aoa_to_sheet(comparisonData);
      // Apply bold to all rows that are section titles or table headers in Data Comparison
      const boldRows = [];
      for (let i = 0; i < comparisonData.length; i++) {
        const row = comparisonData[i];
        if (row[0] && (row[0].includes('Company Results') || row[0].includes('Company vs. Broker') || row[0] === 'Peril Data Comparison' || row[0] === 'Metric')) {
          boldRows.push(i);
        }
      }
      this.applyBoldToRows(comparisonSheet, boldRows);
      // Set column widths for Data Comparison sheet (enough for all side-by-side tables)
      comparisonSheet['!cols'] = [
        { wch: 22 }, { wch: 18 }, { wch: 18 }, { wch: 12 }, { wch: 4 }, { wch: 4 },
        { wch: 22 }, { wch: 18 }, { wch: 18 }, { wch: 12 }, { wch: 4 }, { wch: 4 },
        { wch: 22 }, { wch: 18 }, { wch: 18 }, { wch: 12 }
      ];
      XLSX.utils.book_append_sheet(workbook, comparisonSheet, 'Data Comparison');
      
      // Download the file
      const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const fileName = `Notes_${timestamp}.xlsx`;
      
      XLSX.writeFile(workbook, fileName);
    });
  }

  private static createNotesSheet(results: IAnalysisResults): any[][] {
    const notes = [
      ['Analysis Notes'],
      [''],
      ['Main Driving Peril:', results.notes.mainDrivingPeril],
      ['AAL % Change:', `${results.notes.aalPercentageChange >= 0 ? '+' : ''}${results.notes.aalPercentageChange.toFixed(1)}%`],
      [''],
      ['Exposure Change Analysis:', results.notes.exposureChangeAnalysis],
      [''],
      ['Database Information:'],
      ['Current Year:', results.databaseInfo.currentYear.join(', ')],
      ['Previous Year:', results.databaseInfo.previousYear?.join(', ') || 'N/A'],
      ['Broker Current Year:', results.databaseInfo.brokerCurrentYear?.join(', ') || 'N/A'],
      ['Broker Previous Year:', results.databaseInfo.brokerPreviousYear?.join(', ') || 'N/A'],
      [''],
      ['Reinsurance Details:', results.notes.reinsuranceDetails],
      [''],
      ['Additional Notes:'],
      ['']
    ];

    if (results.notes.brokerComparisonNotes) {
      notes.splice(8, 0, ['Broker Comparison:', results.notes.brokerComparisonNotes], ['']);
    }

    return notes;
  }

  private static createComparisonSheet(results: IAnalysisResults): any[][] {
    const data = [
      ['Peril Data Comparison'],
      ['']
    ];

    // For each peril, show company, broker, and comparison tables side by side with blank columns between
    Object.entries(results.perils).forEach(([perilName, perilData], idx, arr) => {
      // Headers for side-by-side tables
      data.push([
        `${perilName} - Company Results`, '', '', '', '', '', `${perilName} - Broker Results`, '', '', '', '', '', `${perilName} - Company vs. Broker` 
      ]);
      data.push([
        'Metric', 'Current Year', 'Previous Year', '% Change', '', '',
        'Metric', 'Current Year', 'Previous Year', '% Change', '', '',
        'Metric', 'Company', 'Broker', 'Difference'
      ]);
      // Data rows (AAL, TIV)
      const co = perilData;
      const br = results.brokerComparisons?.[perilName];
      // Company
      const coAAL = ['AAL', this.formatCurrency(co.currentYear.aal)];
      if (co.previousYear) {
        coAAL.push(this.formatCurrency(co.previousYear.aal));
        coAAL.push(this.formatPercentage(co.percentageChange?.aal || 0));
      } else {
        coAAL.push('N/A', 'N/A');
      }
      coAAL.push('', '');
      // Broker
      let brAAL = ['AAL', '', '', ''];
      if (br) {
        brAAL = ['AAL', this.formatCurrency(br.broker.aal), this.formatCurrency(br.broker.previousAal ?? 0), this.formatPercentage(br.percentageDifference.aal)];
      }
      brAAL.push('', '');
      // Comparison
      let cmpAAL = ['AAL', '', '', ''];
      if (br) {
        cmpAAL = ['AAL', this.formatCurrency(br.company.aal), this.formatCurrency(br.broker.aal), this.formatPercentage(br.percentageDifference.aal)];
      }
      data.push([...coAAL, ...brAAL, ...cmpAAL]);
      // TIV
      const coTIV = ['TIV', this.formatCurrency(co.currentYear.tiv)];
      if (co.previousYear) {
        coTIV.push(this.formatCurrency(co.previousYear.tiv));
        coTIV.push(this.formatPercentage(co.percentageChange?.tiv || 0));
      } else {
        coTIV.push('N/A', 'N/A');
      }
      coTIV.push('', '');
      let brTIV = ['TIV', '', '', ''];
      if (br) {
        brTIV = ['TIV', this.formatCurrency(br.broker.tiv), this.formatCurrency(br.broker.previousTiv ?? 0), this.formatPercentage(br.percentageDifference.tiv)];
      }
      brTIV.push('', '');
      let cmpTIV = ['TIV', '', '', ''];
      if (br) {
        cmpTIV = ['TIV', this.formatCurrency(br.company.tiv), this.formatCurrency(br.broker.tiv), this.formatPercentage(br.percentageDifference.tiv)];
      }
      data.push([...coTIV, ...brTIV, ...cmpTIV]);
      // Add two blank rows before next peril
      data.push(['']);
      data.push(['']);
    });
    return data;
  }

  private static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  private static formatPercentage(value: number): string {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  }

  // Helper to apply bold font to specified rows in a sheet
  private static applyBoldToRows(sheet: any, rowIndices: number[]) {
    rowIndices.forEach(rowIdx => {
      for (let col = 0; ; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: rowIdx, c: col });
        const cell = sheet[cellRef];
        if (!cell) break;
        cell.s = cell.s || {};
        cell.s.font = cell.s.font || {};
        cell.s.font.bold = true;
      }
    });
  }
} 