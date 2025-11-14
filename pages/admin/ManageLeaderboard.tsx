import React, { useState, useEffect } from 'react';
import type { LeaderboardEntry } from '../../types';
import { listenToLeaderboard } from '../../services/firebase';

const ManageLeaderboard = () => {
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    useEffect(() => {
        const unsubscribe = listenToLeaderboard(setLeaderboard);
        return () => unsubscribe();
    }, []);
    return  <div className="overflow-x-auto bg-gray-800 rounded-md">
        <table className="w-full text-left">
            <thead>
                <tr className="border-b border-gray-600">
                    <th className="p-3">#</th>
                    <th className="p-3">Pengguna</th>
                    <th className="p-3">Total Kemenangan</th>
                    <th className="p-3">Item yang Didapat</th>
                    <th className="p-3">Terakhir Aktif</th>
                </tr>
            </thead>
            <tbody>
                {leaderboard.map((l) => (
                    <tr key={l.uid} className="border-b border-gray-700">
                        <td className="p-3">{l.rank}</td>
                        <td className="p-3">{l.nickname} <span className="text-gray-400 text-sm">({l.email})</span></td>
                        <td className="p-3">{l.itemsObtained}</td>
                        <td className="p-3 text-xs">{l.obtainedItems.join(', ')}</td>
                        <td className="p-3">{new Date(l.lastLogin).toLocaleString('id-ID')}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>;
};

export default ManageLeaderboard;
