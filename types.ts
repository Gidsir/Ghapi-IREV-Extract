export interface ElectionData {
  lga: string;
  registrationArea: string;
  pollingUnit: string;
  delimitation: string;
  votersOnRegister: number;
  accreditedVoters: number;
  ballotPapersIssued: number;
  unusedBallotPapers: number;
  spoiledBallotPapers: number;
  rejectedBallots: number;
  totalValidVotes: number;
  totalUsedBallotPapers: number;
  votes: Record<string, number>;
}

export interface ExtractedRecord {
  id: string;
  filename: string;
  status: 'pending' | 'processing' | 'success' | 'error';
  data?: ElectionData;
  error?: string;
  imageUrl: string;
}

// The specific list of parties requested by the user
export const TARGET_PARTIES = [
  'ACCORD', 'AA', 'AAC', 'ADC', 'ADP', 'APC', 'APGA', 
  'APM', 'APP', 'BP', 'LP', 'NNPP', 'NRM', 'PDP', 
  'PRP', 'SDP', 'YP', 'YPP', 'ZLP'
];