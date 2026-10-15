const XLSX = require('xlsx');
const JSZip = require('jszip');

async function run() {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([['A', 'B'], [1, 2]]);
  XLSX.utils.book_append_sheet(wb, ws, 'Planilla');
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
  const zip = await JSZip.loadAsync(buf);
  let xml = await zip.file('xl/worksheets/sheet1.xml').async('string');
  
  // 1. sheetPr
  xml = xml.replace(/(<worksheet[^>]*>)/, '$1<sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>');
  
  // 2. pageMargins & pageSetup
  const pageXml = '<pageMargins left="0.4" right="0.4" top="0.4" bottom="0.4" header="0.2" footer="0.2"/><pageSetup paperSize="1" orientation="portrait" fitToWidth="1" fitToHeight="1"/>';
  if (xml.includes('<ignoredErrors>')) {
    xml = xml.replace('<ignoredErrors>', pageXml + '<ignoredErrors>');
  } else {
    xml = xml.replace('</worksheet>', pageXml + '</worksheet>');
  }
  
  zip.file('xl/worksheets/sheet1.xml', xml);
  const outBuf = await zip.generateAsync({ type: 'nodebuffer' });
  const wbRead = XLSX.read(outBuf);
  console.log('Read back sheets:', wbRead.SheetNames);
  console.log('Read back data:', XLSX.utils.sheet_to_json(wbRead.Sheets['Planilla']));
}
run();
