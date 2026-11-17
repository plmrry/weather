declare module "nexrad-level-2-data" {
  export interface HighResData {
    block_type: string;
    control_flags: number;
    data_size: number;
    first_gate: number;
    gate_count: number;
    gate_size: number;
    moment_data: (null | number)[];
    name: string;
    offset: number;
    rf_threshold: number;
    scale: number;
    snr_threshold: number;
    spare: Uint8Array;
  }

  export default class Level2Radar {
    data: unknown[];
    hasGaps: boolean;
    header: Record<string, unknown>;
    isTruncated: boolean;
    vcp: Record<string, unknown>;
    constructor(file: Uint8Array);
    getAzimuth(): number[];
    getAzimuth(scan: number): number;
    getHighresReflectivity(): HighResData[];
    getHighresReflectivity(scan: number): HighResData;
    setElevation(elevation: number): void;
  }
}
