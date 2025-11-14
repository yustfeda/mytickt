import type { AdminPage } from "../types";

export const adminMenuItems: { id: AdminPage; name: string; icon: string; }[] = [
    { id: 'dashboard', name: 'Beranda', icon: 'fa-home' },
    { id: 'products', name: 'Kelola Produk', icon: 'fa-box' },
    { id: 'users', name: 'Kelola Pengguna', icon: 'fa-users' },
    { id: 'purchases', name: 'Kelola Pesanan', icon: 'fa-gift' },
    { id: 'leaderboard', name: 'Kelola Leaderboard', icon: 'fa-trophy' },
    { id: 'messages', name: 'Pesan', icon: 'fa-envelope' },
    { id: 'reviews', name: 'Kelola Ulasan', icon: 'fa-star' },
    { id: 'buttons', name: 'Kelola Tombol', icon: 'fa-plus-square' },
];
