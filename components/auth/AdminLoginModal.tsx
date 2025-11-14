import React, { useState } from 'react';
import Modal from '../common/Modal';

const AdminLoginModal: React.FC<{
    onClose: () => void;
    onLogin: (password: string) => string | void;
}> = ({ onClose, onLogin }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const loginError = onLogin(password);
        if (loginError) {
            setError(loginError);
        }
    };
    
    return (
        <Modal isOpen={true} onClose={onClose} title="Reset">
            <form onSubmit={handleSubmit} className="space-y-4">
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-orange text-white"
                    required
                />
                {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                <button 
                    type="submit" 
                    className="w-full bg-brand-orange hover:bg-orange-500 text-white font-bold py-3 px-4 rounded-md transition-colors"
                >
                    Masuk
                </button>
            </form>
        </Modal>
    );
};

export default AdminLoginModal;
