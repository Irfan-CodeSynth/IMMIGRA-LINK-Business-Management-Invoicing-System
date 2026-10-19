// @ts-ignore
import { DOMImplementation, XMLSerializer } from "xmldom";
import JsBarcode from "jsbarcode";
import QRCode from "qrcode";

export function generateBarcodeSvg(data: string): string {
  try {
    const document = new DOMImplementation().createDocument("http://www.w3.org/1999/xhtml", "html", null);
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    
    JsBarcode(svg, data, {
      xmlDocument: document,
      format: "CODE128",
      displayValue: false,
      margin: 0,
      height: 35,
      width: 1.5,
      lineColor: "#000000",
      background: "transparent",
    });

    const xmlSerializer = new XMLSerializer();
    return xmlSerializer.serializeToString(svg);
  } catch (error) {
    console.error("Barcode generation error:", error);
    return "";
  }
}

export async function generateQrCodeDataUrl(text: string): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      margin: 1,
      width: 120,
      color: {
        dark: "#06183D",
        light: "#FFFFFF",
      },
    });
  } catch (error) {
    console.error("QR code generation error:", error);
    return "";
  }
}
