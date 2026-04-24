export interface PitchAnalysis {
  frequency: number | null;
  clarity: number;
  signal: number;
}

export interface TunerSnapshot extends PitchAnalysis {
  stabilizedFrequency: number | null;
  recentNotes: string[];
}
