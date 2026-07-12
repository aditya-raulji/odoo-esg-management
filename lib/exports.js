'use client';

import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

/**
 * Export data to Excel (.xlsx) file with multiple sheets.
 * @param {Object} sheets - Object mapping sheet names to arrays of JSON objects.
 * @param {string} filename - Output filename.
 */
export function exportToExcel(sheets, filename = 'report.xlsx') {
  if (typeof window === 'undefined') return;
  try {
    const wb = XLSX.utils.book_new();
    Object.entries(sheets).forEach(([sheetName, data]) => {
      // Clean data for export
      const cleaned = data.map(item => {
        const row = {};
        Object.entries(item).forEach(([key, val]) => {
          if (typeof val === 'object' && val !== null) {
            // Ignore nested objects / format as string
            row[key] = JSON.stringify(val);
          } else {
            row[key] = val;
          }
        });
        return row;
      });
      const ws = XLSX.utils.json_to_sheet(cleaned);
      XLSX.utils.book_append_sheet(wb, ws, sheetName.substring(0, 31));
    });
    XLSX.writeFile(wb, filename);
  } catch (err) {
    console.error('Failed to export to Excel:', err);
    throw err;
  }
}

/**
 * Export primary table data to a CSV file.
 * @param {Array<Object>} data - Array of JSON objects.
 * @param {string} filename - Output filename.
 */
export function exportToCSV(data, filename = 'report.csv') {
  if (typeof window === 'undefined') return;
  if (!data || data.length === 0) return;
  
  try {
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          let cell = row[header] === null || row[header] === undefined ? '' : String(row[header]);
          if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
            cell = `"${cell.replace(/"/g, '""')}"`;
          }
          return cell;
        }).join(',')
      )
    ];
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    console.error('Failed to export to CSV:', err);
    throw err;
  }
}

/**
 * Export report elements to PDF (A4).
 * @param {string} title - Report title.
 * @param {Array<Object>} tables - Array of table specifications: { title, headers, rows }.
 * @param {string} filename - Output filename.
 * @param {Object} kpiData - Key-value map of KPI metrics to display in a strip at the top.
 */
export function exportToPDF(title, tables, filename = 'report.pdf', kpiData = null) {
  if (typeof window === 'undefined') return;
  
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Dark-themed premium header background block
    doc.setFillColor(20, 20, 23); // --panel: #141417
    doc.rect(0, 0, 210, 45, 'F');

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(34, 197, 94); // --green
    doc.text('EcoSphere ESG Management', 14, 18);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(13);
    doc.setTextColor(237, 237, 239); // --text
    doc.text(`${title} Report`, 14, 27);
    
    doc.setFontSize(10);
    doc.setTextColor(142, 142, 147); // --muted
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 35);

    // Green separator line
    doc.setDrawColor(34, 197, 94);
    doc.setLineWidth(1);
    doc.line(14, 40, 196, 40);

    let currentY = 55;

    // Render KPI strip
    if (kpiData) {
      doc.setFillColor(27, 27, 31); // --panel2
      doc.rect(14, currentY, 182, 22, 'F');
      doc.setDrawColor(39, 39, 44); // --border
      doc.setLineWidth(0.5);
      doc.rect(14, currentY, 182, 22);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(142, 142, 147); // --muted

      const kpis = Object.entries(kpiData);
      const colWidth = 182 / kpis.length;

      kpis.forEach(([label, val], idx) => {
        const xPos = 14 + (idx * colWidth) + (colWidth / 2);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(142, 142, 147);
        doc.text(label, xPos, currentY + 7, { align: 'center' });

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(237, 237, 239);
        doc.text(String(val), xPos, currentY + 15, { align: 'center' });
      });

      currentY += 32;
    }

    // Render Tables
    tables.forEach((table, tIdx) => {
      // Check if page overflow
      if (currentY > 240) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(20, 20, 23); // Dark text for white background sections
      doc.text(table.title, 14, currentY);
      currentY += 6;

      // Theme aware color mapping for table headers
      let headerBg = [59, 130, 246]; // Blue default
      const lowerTitle = title.toLowerCase();
      if (lowerTitle.includes('environmental')) {
        headerBg = [34, 197, 94]; // Green
      } else if (lowerTitle.includes('social')) {
        headerBg = [59, 130, 246]; // Blue
      } else if (lowerTitle.includes('governance')) {
        headerBg = [168, 85, 247]; // Purple
      } else if (lowerTitle.includes('esg')) {
        headerBg = [249, 115, 22]; // Orange
      }

      doc.autoTable({
        startY: currentY,
        head: [table.headers],
        body: table.rows,
        theme: 'grid',
        styles: {
          fontSize: 9,
          font: 'helvetica',
          textColor: [40, 40, 40],
          lineColor: [220, 220, 220],
          lineWidth: 0.1
        },
        headStyles: {
          fillColor: headerBg,
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        margin: { left: 14, right: 14 },
        didParseCell: function(data) {
          // You can customize colors of cells here if needed
        }
      });

      currentY = doc.lastAutoTable.finalY + 12;
    });

    // Add page numbers
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(142, 142, 147);
      doc.text(`Page ${i} of ${pageCount}`, 196, 287, { align: 'right' });
    }

    doc.save(filename);
  } catch (err) {
    console.error('Failed to export to PDF:', err);
    throw err;
  }
}
