export interface Recording {
  id: number;
  filePath: string;
  fileName: string;
  title: string | null;
  artist: string | null;
  comment: string | null;
  notes: string | null;
  // BWF bext chunk fields
  originator: string | null;       // device/recorder name
  originatorReference: string | null;
  timeReference: number | null;    // sample offset from midnight
  bwfDescription: string | null;
  // Derived
  recordedAt: string | null;       // ISO string derived from timeReference + date
  durationSeconds: number | null;
  sampleRate: number | null;
  bitDepth: number | null;
  channels: number | null;
  format: string | null;           // 'wav' | 'mp3'
  fileSizeBytes: number | null;
  importedAt: string;
}

export interface Collection {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
}

export interface RecordingCollection {
  recordingId: number;
  collectionId: number;
}
