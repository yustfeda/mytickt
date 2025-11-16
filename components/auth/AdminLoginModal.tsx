import React, { useState } from 'react';
import Modal from '../common/Modal';

interface AdminLoginModalProps {
    onClose: () => void;
    onLogin: (password: string) => string | void;
}

const AdminLoginModal: React.FC<AdminLoginModalProps> = ({ onClose, onLogin }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const loginError = onLogin(password);
        if (loginError) {
            setError(loginError);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPassword(e.target.value);
        if (error) setError(''); // hapus error saat user mulai mengetik
    };

    return (
        <Modal isOpen={true} onClose={onClose} title="Reset Admin Panel">
            <form onSubmit={handleSubmit} className="space-y-4">

                <label className="text-gray-300 text-sm font-medium">
                    Masukkan Token Admin
                </label>

                <input
                    type="password"
                    value={password}
                    onChange={handleChange}
                    placeholder="Masukkan token..."
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-md 
                    focus:outline-none focus:ring-2 focus:ring-brand-orange text-white"
                    required
                />

                {error && (
                    <p className="text-red-500 text-sm text-center">{error}</p>
                )}

                <button
                    type="submit"
                    className="w-full bg-brand-orange hover:bg-orange-500 text-white 
                    font-bold py-3 px-4 rounded-md transition-colors"
                >
                    Reset
                </button>
            </form>
        </Modal>
    );
};

export default AdminLoginModal;