// Render a receipt DOM node to a single A4 PDF and trigger download.
// Uses html2canvas-pro (supports modern color spaces like oklch from Tailwind v4)
// + jsPDF. Both are dynamically imported so the heavy code is only loaded
// when the user actually requests a download.

export async function downloadReceiptPdf(
  node: HTMLElement | null,
  receiptNumber: string,
): Promise<void> {
  if (!node) return;
  try {
    const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
      import("html2canvas-pro"),
      import("jspdf"),
    ]);

    const canvas = await html2canvas(node, {
      backgroundColor: "#ffffff",
      scale: Math.min(2, (window.devicePixelRatio || 1) * 1.5),
      useCORS: true,
      logging: false,
    });

    const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const margin = 12;
    const maxW = pageW - margin * 2;
    const maxH = pageH - margin * 2;

    // Fit the captured image into the page while preserving aspect ratio.
    const ratio = canvas.width / canvas.height;
    let drawW = maxW;
    let drawH = drawW / ratio;
    if (drawH > maxH) {
      drawH = maxH;
      drawW = drawH * ratio;
    }
    const x = (pageW - drawW) / 2;
    const y = (pageH - drawH) / 2;

    const img = canvas.toDataURL("image/jpeg", 0.95);
    pdf.addImage(img, "JPEG", x, y, drawW, drawH, undefined, "FAST");
    pdf.save(`PERX-${receiptNumber}.pdf`);
  } catch (err) {
    console.warn("[receipt-pdf] download failed, falling back to print", err);
    try {
      window.print();
    } catch {
      /* noop */
    }
  }
}
