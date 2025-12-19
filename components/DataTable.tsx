import React from 'react';
import { ExtractedRecord, TARGET_PARTIES } from '../types';

interface DataTableProps {
  records: ExtractedRecord[];
  onDelete: (id: string) => void;
}

// Optimization: Use React.memo so the table doesn't fully re-render 
// every time the parent state changes, unless 'records' prop actually changes.
export const DataTable: React.FC<DataTableProps> = React.memo(({ records, onDelete }) => {
  if (records.length === 0) return null;

  return (
    <div className="overflow-x-auto border rounded-lg shadow-sm bg-white">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 py-3 text-left font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10 w-48">Filename</th>
            <th className="px-3 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-3 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">LGA</th>
            <th className="px-3 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">PU Code</th>
            <th className="px-3 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Accredited</th>
            <th className="px-3 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Valid Votes</th>
            {TARGET_PARTIES.map(party => (
              <th key={party} className="px-3 py-3 text-left font-medium text-gray-500 uppercase tracking-wider w-16">{party}</th>
            ))}
            <th className="px-3 py-3 text-right font-medium text-gray-500 uppercase tracking-wider sticky right-0 bg-gray-50">Action</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {records.map((record) => (
            <tr key={record.id} className="hover:bg-gray-50">
              <td className="px-3 py-2 whitespace-nowrap sticky left-0 bg-white z-10 border-r">
                <div className="flex items-center space-x-2">
                  {record.imageUrl && (
                    <img 
                      src={record.imageUrl} 
                      alt="thumb" 
                      loading="lazy" 
                      className="w-8 h-8 object-cover rounded" 
                    />
                  )}
                  <span className="truncate max-w-[150px]" title={record.filename}>{record.filename}</span>
                </div>
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                  ${record.status === 'success' ? 'bg-green-100 text-green-800' : 
                    record.status === 'error' ? 'bg-red-100 text-red-800' : 
                    record.status === 'processing' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                  {record.status}
                </span>
              </td>
              {record.data ? (
                <>
                  <td className="px-3 py-2 whitespace-nowrap">{record.data.lga}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{record.data.delimitation}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{record.data.accreditedVoters}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{record.data.totalValidVotes}</td>
                  {TARGET_PARTIES.map(party => (
                    <td key={party} className="px-3 py-2 whitespace-nowrap text-gray-600">
                      {record.data?.votes[party] ?? '-'}
                    </td>
                  ))}
                </>
              ) : (
                 <td colSpan={4 + TARGET_PARTIES.length} className="px-3 py-2 text-gray-400 text-center italic">
                    {record.status === 'error' ? record.error : 'Waiting...'}
                 </td>
              )}
              <td className="px-3 py-2 whitespace-nowrap text-right text-sm font-medium sticky right-0 bg-white border-l">
                <button 
                  onClick={() => onDelete(record.id)}
                  className="text-red-600 hover:text-red-900"
                >
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});