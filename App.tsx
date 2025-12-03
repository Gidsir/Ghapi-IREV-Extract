import React, { useState, useEffect, useRef } from 'react';
import { Dropzone } from './components/Dropzone';
import { DataTable } from './components/DataTable';
import { StatsCard } from './components/StatsCard';
import { extractDataFromImage } from './services/geminiService';
import { ExtractedRecord, TARGET_PARTIES } from './types';

export default function App() {
  const [records, setRecords] = useState<ExtractedRecord[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [csvUrl, setCsvUrl] = useState<string | null>(null);
  
  // Ref to handle cancellation if needed, or keeping track of active batch
  const processingRef = useRef(false);

  const handleFilesSelected = (files: File[]) => {
    const newRecords: ExtractedRecord[] = files.map(file => ({
      id: Math.random().toString(36).substring(7),
      filename: file.name,
      status: 'pending',
      imageUrl: URL.createObjectURL(file),
      // Attach actual file object to a non-serializable property in memory (not in state for simplicity, 
      // but here we just need to pass it to the processor immediately or store in a separate map. 
      // For this demo, we'll process from state, but we need the file. 
      // A better way is to start processing immediately or add to a queue.)
    }));

    setRecords(prev => [...prev, ...newRecords]);
    
    // Trigger processing for new files
    // We pass the file objects directly to the processor via a temporary mechanism or closure
    processQueue(files, newRecords.map(r => r.id));
  };

  const processQueue = async (files: File[], recordIds: string[]) => {
    if (processingRef.current) return; // Simple concurrency lock
    processingRef.current = true;
    setIsProcessing(true);

    // Process sequentially to avoid hitting rate limits too hard (though Gemini handles concurrent requests well, browser limit is key)
    // For 100k images, a backend is needed. For this demo, we do 1 by 1 or small batches.
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const id = recordIds[i];

      setRecords(prev => prev.map(r => r.id === id ? { ...r, status: 'processing' } : r));

      try {
        const data = await extractDataFromImage(file);
        setRecords(prev => prev.map(r => r.id === id ? { ...r, status: 'success', data } : r));
      } catch (err: any) {
        setRecords(prev => prev.map(r => r.id === id ? { ...r, status: 'error', error: err.message || 'Extraction failed' } : r));
      }
    }

    setIsProcessing(false);
    processingRef.current = false;
  };

  const handleDelete = (id: string) => {
    setRecords(prev => {
        const record = prev.find(r => r.id === id);
        if (record && record.imageUrl) URL.revokeObjectURL(record.imageUrl);
        return prev.filter(r => r.id !== id);
    });
  };

  const generateCSV = () => {
    const headers = [
      'Filename', 'Status', 'LGA', 'REGISTRATION AREA', 'POLLING UNIT', 'DELIMITATION',
      'Number of Voters on the Register',
      'Number of Accredited Voters',
      'Number of Ballot Papers Issued',
      'Number of Unused Ballot Papers',
      'Number of Spoiled Ballot Papers',
      'Number of Rejected Ballots',
      'Total Valid Votes',
      'Total Used Ballot Papers',
      ...TARGET_PARTIES
    ];

    const rows = records.map(r => {
      const d = r.data;
      if (!d) return [r.filename, r.status, '', '', '', '', '', '', '', '', '', '', '', '', ...TARGET_PARTIES.map(() => '')].join(',');

      const coreData = [
        `"${r.filename}"`,
        r.status,
        `"${d.lga || ''}"`,
        `"${d.registrationArea || ''}"`,
        `"${d.pollingUnit || ''}"`,
        `"${d.delimitation || ''}"`,
        d.votersOnRegister,
        d.accreditedVoters,
        d.ballotPapersIssued,
        d.unusedBallotPapers,
        d.spoiledBallotPapers,
        d.rejectedBallots,
        d.totalValidVotes,
        d.totalUsedBallotPapers
      ];

      const votesData = TARGET_PARTIES.map(party => d.votes[party] ?? 0);
      
      return [...coreData, ...votesData].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    setCsvUrl(url);
  };

  // Regenerate CSV whenever records change successfully
  useEffect(() => {
    if (records.some(r => r.status === 'success')) {
      generateCSV();
    }
  }, [records]);

  const stats = {
    total: records.length,
    processed: records.filter(r => r.status === 'success').length,
    failed: records.filter(r => r.status === 'error').length,
    totalVotes: records.reduce((acc, r) => acc + (r.data?.totalValidVotes || 0), 0)
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center text-white font-bold">EC</div>
             <h1 className="text-xl font-bold text-gray-900">ElectionForm AI Extractor</h1>
          </div>
          <div className="flex gap-4">
             {csvUrl && stats.processed > 0 && (
               <a 
                 href={csvUrl} 
                 download={`election_data_export_${new Date().toISOString().slice(0,10)}.csv`}
                 className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
               >
                 <svg className="mr-2 -ml-1 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                 </svg>
                 Download Live CSV
               </a>
             )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Stats Row */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
          <StatsCard title="Total Images" value={stats.total} color="gray" />
          <StatsCard title="Successfully Extracted" value={stats.processed} color="green" />
          <StatsCard title="Failed / Review" value={stats.failed} color="red" />
          <StatsCard title="Total Valid Votes (Aggregated)" value={stats.totalVotes.toLocaleString()} color="indigo" />
        </div>

        {/* Upload Area */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Upload EC 8A Forms</h2>
          <Dropzone onFilesSelected={handleFilesSelected} disabled={isProcessing} />
          {isProcessing && (
            <div className="mt-4">
               <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-primary h-2.5 rounded-full animate-pulse" style={{ width: '100%' }}></div>
               </div>
               <p className="text-sm text-gray-500 mt-2 text-center">Processing images with Gemini Vision... Please wait.</p>
            </div>
          )}
        </div>

        {/* Data Table */}
        <div className="space-y-4">
            <h2 className="text-lg font-medium text-gray-900">Extraction Results</h2>
            <DataTable records={records} onDelete={handleDelete} />
        </div>
      </main>
    </div>
  );
}