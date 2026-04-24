export interface CabinetIrSummary {
  id: string;
  name: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  updatedAt: string;
}

export interface CabinetIrRecord extends CabinetIrSummary {
  data: ArrayBuffer;
}
