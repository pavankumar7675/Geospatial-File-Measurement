export async function inspectZip(file: File): Promise<{ hasShp: boolean; hasShx: boolean; hasDbf: boolean; hasPrj: boolean }> {
  const buffer = await file.arrayBuffer();
  const view = new DataView(buffer);
  
  // Search for End of Central Directory (EOCD) signature: 0x06054b50
  let eocdOffset = -1;
  for (let i = buffer.byteLength - 22; i >= 0; i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }

  if (eocdOffset === -1) {
    throw new Error("Invalid ZIP file");
  }

  const cdOffset = view.getUint32(eocdOffset + 16, true);
  const numRecords = view.getUint16(eocdOffset + 10, true);

  const files = new Set<string>();
  let offset = cdOffset;

  for (let i = 0; i < numRecords; i++) {
    if (offset + 46 > buffer.byteLength || view.getUint32(offset, true) !== 0x02014b50) {
      break;
    }
    
    const filenameLen = view.getUint16(offset + 28, true);
    const extraFieldLen = view.getUint16(offset + 30, true);
    const commentLen = view.getUint16(offset + 32, true);
    
    const nameBuffer = new Uint8Array(buffer, offset + 46, filenameLen);
    const decoder = new TextDecoder();
    const filename = decoder.decode(nameBuffer).toLowerCase();
    
    files.add(filename);
    
    offset += 46 + filenameLen + extraFieldLen + commentLen;
  }

  let hasShp = false, hasShx = false, hasDbf = false, hasPrj = false;
  
  for (const f of files) {
    if (f.endsWith('.shp')) hasShp = true;
    if (f.endsWith('.shx')) hasShx = true;
    if (f.endsWith('.dbf')) hasDbf = true;
    if (f.endsWith('.prj')) hasPrj = true;
  }

  return { hasShp, hasShx, hasDbf, hasPrj };
}
