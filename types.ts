export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  maxStock: number; // Added to calculate stock progress
  isActive: boolean;
  category: string;
  description: string;
  imageUrl: string;
  buyLink: string;
}

export interface User {
  uid: string; // Firebase Auth User ID
  nickname: string;
  lastLogin: string;
  email: string;
  isActive: boolean;
  mysteryBoxAttempts: number;
  role: 'user'; // Role is always user for non-admins
}

export interface Review {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

export interface LeaderboardEntry {
  rank: number;
  uid: string;
  nickname: string;
  email: string;
  lastLogin: string;
  itemsObtained: number; // Total mystery box wins
  obtainedItems: string[]; // List of names of prizes won from mystery box
}

export interface PurchaseHistoryItem {
    id: string;
    userId: string; // User UID
    type: 'product' | 'mysterybox';
    productName: string;
    timestamp: string;
    status: 'success' | 'pending' | 'rejected';
    productId?: string; // For stock management on product purchases
    isOpened?: boolean; // For mystery boxes that have been opened
    prize?: string; // Prize for winning a mystery box
}

export interface PrivateMessage {
    id: string;
    userId: string; // Recipient User ID
    text: string;
    timestamp: string;
    isRead: boolean;
}

export interface CustomButton {
  id: string;
  name: string;
  url: string;
  icon: string;
  isActive: boolean;
}


export type Page = 'home' | 'leaderboard' | 'admin' | 'mysterybox' | 'history' | 'messages';
export type AdminPage = 'dashboard' | 'products' | 'users' | 'purchases' | 'leaderboard' | 'messages' | 'reviews' | 'buttons';