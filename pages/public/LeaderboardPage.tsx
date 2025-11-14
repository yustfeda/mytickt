import React, { useState, useEffect } from 'react';
import type { LeaderboardEntry } from '../../types';
import { listenToLeaderboard } from '../../services/firebase';

const LeaderboardPage = () => {
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    
    useEffect(() => {
        const unsubscribe = listenToLeaderboard(setLeaderboard);
        return () => unsubscribe();
    }, []);

    return (
        <div className="bg-gray-800 p-4 sm:p-8 rounded-lg shadow-2xl animate-fade-in max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-6 text-brand-orange">Papan Peringkat Pemenang</h2>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-gray-700">
                            <th className="p-2 sm:p-4">#</th>
                            <th className="p-2 sm:p-4">Pengguna</th>
                            <th className="p-2 sm:p-4 text-center">Total Kemenangan</th>
                            <th className="p-2 sm:p-4">Item yang Didapat</th>
                            <th className="p-2 sm:p-4">Terakhir Aktif</th>
                        </tr>
                    </thead>
                    <tbody>
                        {leaderboard.map((entry) => (
                            <tr key={entry.uid} className="border-b border-gray-600 hover:bg-gray-700/50">
                                <td className="p-2 sm:p-4 font-bold text-lg">{entry.rank}</td>
                                <td className="p-2 sm:p-4">
                                    <div>{entry.nickname}</div>
                                    <div className="text-xs text-gray-400">{entry.email}</div>
                                </td>
                                <td className="p-2 sm:p-4 text-center font-semibold text-green-400">{entry.itemsObtained}</td>
                                <td className="p-2 sm:p-4 text-xs text-gray-400">
                                    {entry.obtainedItems.join(', ')}
                                </td>
                                <td className="p-2 sm:p-4 text-xs text-gray-400">{new Date(entry.lastLogin).toLocaleString('id-ID')}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {leaderboard.length === 0 && <p className="text-center py-4">Papan peringkat kosong. Jadilah pemenang pertama!</p>}
            </div>
        </div>
    );
};

export default LeaderboardPage;
