/**
 * Print/export an HTML document through a hidden iframe, mirroring the
 * ReceiptBill print pattern. Callers pass the full printable HTML body.
 */
export const printHtml = (html: string): void => {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'absolute';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  document.body.appendChild(iframe);
  const iframeDoc = iframe.contentWindow?.document;
  if (!iframeDoc) {
    document.body.removeChild(iframe);
    window.print();
    return;
  }
  iframeDoc.open();
  iframeDoc.write(`<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${document.title}</title>
<style>
  @page { size: A4 landscape; margin: 10mm; }
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; box-sizing: border-box; }
  html, body { margin: 0; padding: 0; font-family: -apple-system, 'Segoe UI', Roboto, sans-serif; }
  body { font-size: 11px; line-height: 1.5; color: #111; padding: 24px; }
  h1 { font-size: 18px; margin: 0 0 4px; }
  h2 { font-size: 14px; margin: 0 0 2px; }
  h3 { font-size: 12px; margin: 0 0 2px; }
  .muted { color: #6b7280; }
  .right { text-align: right; }
  .mono { font-variant-numeric: tabular-nums; }
  .divider { border: 0; border-top: 1px solid #d1d5db; margin: 12px 0; }
  .summary { display: flex; flex-wrap: wrap; gap: 10px; }
  .summary-item { border: 1px solid #e5e7eb; border-radius: 8px; padding: 8px 12px; min-width: 140px; }
  .summary-item .k { font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; }
  .summary-item .v { font-size: 15px; font-weight: 600; }
  table { border-collapse: collapse; width: 100%; margin-top: 12px; }
  th, td { padding: 6px 8px; text-align: left; border-bottom: 1px solid #e5e7eb; vertical-align: top; }
  thead th { background: #f3f4f6; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #374151; }
  tr, th, td { break-inside: avoid; page-break-inside: avoid; }
  thead { display: table-header-group; }
  .pos { color: #047857; font-weight: 600; }
  .neg { color: #b91c1c; font-weight: 600; }
  .badge { display: inline-block; padding: 1px 7px; border-radius: 999px; font-size: 10px; font-weight: 600; }
  .badge-pending { background: #fef3c7; color: #92400e; }
  .badge-confirmed { background: #d1fae5; color: #065f46; }
  .badge-sale { background: #dbeafe; color: #1e40af; }
  .badge-buy { background: #fee2e2; color: #991b1b; }
  .badge-fund { background: #e9d5ff; color: #6b21a8; }
  @media print {
    body { padding: 0; }
  }
</style>
</head>
<body>${html}</body>
</html>`);
  iframeDoc.close();
  iframe.contentWindow?.focus();
  setTimeout(() => {
    iframe.contentWindow?.print();
    setTimeout(() => {
      if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
    }, 500);
  }, 200);
};
