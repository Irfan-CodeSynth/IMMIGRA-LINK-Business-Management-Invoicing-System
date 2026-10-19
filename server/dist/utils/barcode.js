"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateBarcodeSvg = generateBarcodeSvg;
exports.generateQrCodeDataUrl = generateQrCodeDataUrl;
// @ts-ignore
const xmldom_1 = require("xmldom");
const jsbarcode_1 = __importDefault(require("jsbarcode"));
const qrcode_1 = __importDefault(require("qrcode"));
function generateBarcodeSvg(data) {
    try {
        const document = new xmldom_1.DOMImplementation().createDocument("http://www.w3.org/1999/xhtml", "html", null);
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        (0, jsbarcode_1.default)(svg, data, {
            xmlDocument: document,
            format: "CODE128",
            displayValue: false,
            margin: 0,
            height: 35,
            width: 1.5,
            lineColor: "#000000",
            background: "transparent",
        });
        const xmlSerializer = new xmldom_1.XMLSerializer();
        return xmlSerializer.serializeToString(svg);
    }
    catch (error) {
        console.error("Barcode generation error:", error);
        return "";
    }
}
async function generateQrCodeDataUrl(text) {
    try {
        return await qrcode_1.default.toDataURL(text, {
            margin: 1,
            width: 120,
            color: {
                dark: "#06183D",
                light: "#FFFFFF",
            },
        });
    }
    catch (error) {
        console.error("QR code generation error:", error);
        return "";
    }
}
