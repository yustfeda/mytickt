import React from 'react';
import type { User } from '../../types';

const UserWelcomeDashboard: React.FC<{ user: User; pendingCount: number }> = ({ user, pendingCount }) => {
    return (
        <div className="bg-gray-800/50 border border-gray-700 p-4 rounded-lg mb-8 flex flex-col sm:flex-row justify-between items-center animate-fade-in">
            <div className="mb-4 sm:mb-0">
                <h2 className="text-2xl font-bold">Selamat datang, <span className="text-brand-orange">{user.nickname}!</span></h2>
                <div className="flex items-center gap-2 text-sm text-green-400">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                    Online
                </div>
            </div>
            <div>
                <p className="text-gray-300">Anda memiliki <span className="font-bold text-yellow-400">{pendingCount}</span> pesanan menunggu konfirmasi.</p>
            </div>
        </div>
    );
};

export default UserWelcomeDashboard;
