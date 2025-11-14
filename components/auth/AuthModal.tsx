import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Modal from '../common/Modal';

interface AuthModalProps {
  mode: 'login' | 'register';
  onClose: () => void;
  setNotification: (message: string) => void;
  switchTo: (mode: 'login' | 'register') => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ mode, onClose, setNotification, switchTo }) => {
    const { login, register } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [nickname, setNickname] = useState(''); // Only for register
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        let result;
        if (mode === 'login') {
            result = await login(email, password);
        } else {
            result = await register(email, password, nickname);
        }

        setIsLoading(false);
        if (result.success) {
            setNotification(result.message);
            onClose();
        } else {
            setError(result.message);
        }
    };
    
    const title = (mode === 'login' ? 'Login Pengguna' : 'Registrasi Akun');
    const buttonText = mode === 'login' ? 'Masuk' : 'Daftar';
    const switchText = mode === 'login' ? 'Belum punya akun? Daftar' : 'Sudah punya akun? Login';
    const switchAction = () => { setError(''); switchTo(mode === 'login' ? 'register' : 'login'); };

    return (
        <Modal isOpen={true} onClose={onClose} title={title}>
            <form onSubmit={handleSubmit} className="space-y-4">
                 <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-orange text-white"
                    required
                />
                 <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-orange text-white"
                    required
                />
                {mode === 'register' && (
                     <input
                        type="text"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        placeholder="Nama Panggilan"
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-orange text-white"
                        required
                    />
                )}
                {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                <button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full bg-brand-orange hover:bg-orange-500 text-white font-bold py-3 px-4 rounded-md transition-colors disabled:bg-gray-500"
                >
                    {isLoading ? 'Memproses...' : buttonText}
                </button>
                 <button type="button" onClick={switchAction} className="w-full text-center text-sm text-brand-blue hover:underline">
                    {switchText}
                </button>
            </form>
        </Modal>
    );
};

export default AuthModal;
