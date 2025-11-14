// Fix: The project seems to be using Firebase v8 SDK.
// The code has been refactored from v9 modular syntax to v8 namespaced syntax to fix import errors.
// Fix: Use Firebase v9 compatibility imports for v8 syntax.
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import 'firebase/compat/auth';
import type { Product, User, Review, LeaderboardEntry, PurchaseHistoryItem, PrivateMessage } from '../types';

const firebaseConfig = {
  apiKey: "AIzaSyAL9vEXEb0x_BdDL24taZpepgvfUXZDr24",
  authDomain: "apkl-e2b85.firebaseapp.com",
  databaseURL: "https://apkl-e2b85-default-rtdb.firebaseio.com",
  projectId: "apkl-e2b85",
  storageBucket: "apkl-e2b85.firebasestorage.app",
  messagingSenderId: "982401562012",
  appId: "1:982401562012:web:ec959f491a7139f7f7c459"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();
export const auth = firebase.auth();


const snapshotToArrWithId = <T,>(snapshot: firebase.database.DataSnapshot): T[] => {
    const result: T[] = [];
    if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
            result.push({ id: childSnapshot.key, ...childSnapshot.val() } as T);
        });
    }
    return result;
};


// Product Functions
export const listenToProducts = (callback: (products: Product[]) => void): (() => void) => {
    const productsRef = db.ref('products');
    const listener = (snapshot: firebase.database.DataSnapshot) => {
        const products = snapshotToArrWithId<Product>(snapshot);
        callback(products);
    };
    productsRef.on('value', listener);
    return () => productsRef.off('value', listener);
};

export const addProduct = async (product: Omit<Product, 'id'>): Promise<void> => {
    await db.ref('products').push(product);
};

export const updateProduct = async (productId: string, updates: Partial<Product>): Promise<void> => {
    await db.ref(`products/${productId}`).update(updates);
};

export const deleteProduct = async (productId: string): Promise<void> => {
    await db.ref(`products/${productId}`).remove();
};


// User Functions
export const listenToUsers = (callback: (users: User[]) => void): (() => void) => {
    const usersRef = db.ref('users');
    const listener = (snapshot: firebase.database.DataSnapshot) => {
        const users = snapshotToArrWithId<User>(snapshot);
        callback(users.map(u => ({...u, uid: (u as any).id})));
    };
    usersRef.on('value', listener);
    return () => usersRef.off('value', listener);
};

export const getUser = async (uid: string): Promise<User | null> => {
    const snapshot = await db.ref(`users/${uid}`).get();
    if (!snapshot.exists()) return null;
    return { uid, ...snapshot.val() } as User;
};

export const createUser = async (uid: string, email: string, nickname: string): Promise<User> => {
    // FIX: Removed `isMysteryBoxWinner` as it's not a property of the User type.
    const newUser: Omit<User, 'uid'> = {
        nickname,
        email,
        lastLogin: new Date().toISOString(),
        isActive: true,
        mysteryBoxAttempts: 0,
        role: 'user',
    };
    await db.ref(`users/${uid}`).set(newUser);
    return { uid, ...newUser };
};

export const updateUser = async (uid: string, updates: Partial<User>): Promise<void> => {
    await db.ref(`users/${uid}`).update(updates);
};

export const deleteUser = async (uid: string): Promise<void> => {
    await db.ref(`users/${uid}`).remove();
};

// Review Functions
export const listenToReviews = (callback: (reviews: Review[]) => void): (() => void) => {
    const reviewsRef = db.ref('reviews');
    const listener = (snapshot: firebase.database.DataSnapshot) => {
        const reviews = snapshotToArrWithId<Review>(snapshot);
        const sortedReviews = reviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        callback(sortedReviews);
    };
    reviewsRef.on('value', listener);
    return () => reviewsRef.off('value', listener);
};
export const addReview = async (review: Omit<Review, 'id' | 'createdAt'>): Promise<void> => {
    await db.ref('reviews').push({
        ...review,
        createdAt: new Date().toISOString()
    });
};
export const updateReview = async (reviewId: string, updates: Partial<Review>): Promise<void> => {
    await db.ref(`reviews/${reviewId}`).update(updates);
}
export const deleteReview = async (reviewId: string): Promise<void> => {
    await db.ref(`reviews/${reviewId}`).remove();
};

// Leaderboard Functions
export const listenToLeaderboard = (callback: (leaderboard: LeaderboardEntry[]) => void): (() => void) => {
    const usersRef = db.ref('users');
    const historyRef = db.ref('purchaseHistory');

    const listener = () => {
        usersRef.once('value').then(userSnapshot => {
            historyRef.once('value').then(historySnapshot => {
                const users = snapshotToArrWithId<User>(userSnapshot).map(u => ({...u, uid: (u as any).id}));
                const history = snapshotToArrWithId<PurchaseHistoryItem>(historySnapshot);

                const leaderboardData = users.filter(u => u.isActive && u.role === 'user').map(user => {
                    const userHistory = history.filter(h => h.userId === user.uid);
                    const successfulPurchases = userHistory.filter(h => h.status === 'success');
                    const itemsObtained = successfulPurchases.length;
                    const obtainedItems = successfulPurchases.map(h => h.productName);
                    const purchaseCount = userHistory.length;
                    
                    return {
                        uid: user.uid,
                        nickname: user.nickname,
                        email: user.email,
                        lastLogin: user.lastLogin,
                        itemsObtained,
                        purchaseCount,
                        obtainedItems,
                    };
                });
                
                const sortedLeaderboard = leaderboardData
                    .filter(entry => entry.itemsObtained > 0) // Only show users who have won something
                    .sort((a, b) => b.itemsObtained - a.itemsObtained || new Date(b.lastLogin).getTime() - new Date(a.lastLogin).getTime())
                    .map((entry, index) => ({ ...entry, rank: index + 1 }));

                callback(sortedLeaderboard);
            });
        });
    };

    // Listen to changes on both users and history to re-calculate
    usersRef.on('value', listener);
    historyRef.on('value', listener);

    return () => {
        usersRef.off('value', listener);
        historyRef.off('value', listener);
    };
};

// Purchase History Functions (User & Admin)
export const listenToUserPurchaseHistory = (userId: string | null, callback: (history: PurchaseHistoryItem[]) => void): (() => void) => {
    const historyRef = db.ref('purchaseHistory');
    const listener = (snapshot: firebase.database.DataSnapshot) => {
        const allHistory = snapshotToArrWithId<PurchaseHistoryItem>(snapshot);
        // If a specific userId is provided, filter for it. If null, return all for admin.
        const relevantHistory = userId ? allHistory.filter(item => item.userId === userId) : allHistory;
        callback(relevantHistory.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    };
    historyRef.on('value', listener);
    return () => historyRef.off('value', listener);
};


export const createPurchaseHistory = async (userId: string, itemData: { type: 'product', productName: string, productId: string } | { type: 'mysterybox', productName: string }): Promise<string | null> => {
    const item: Omit<PurchaseHistoryItem, 'id'> = {
        userId,
        timestamp: new Date().toISOString(),
        status: 'pending',
        ...itemData
    };

    if(item.type === 'mysterybox') {
        // Increment user's attempt counter
        const userRef = db.ref(`users/${userId}/mysteryBoxAttempts`);
        await userRef.transaction((currentAttempts) => (currentAttempts || 0) + 1);
    }
    
    const newItemRef = await db.ref('purchaseHistory').push(item);
    return newItemRef.key;
};

export const updatePurchaseStatus = async (purchaseId: string, newStatus: 'success' | 'rejected'): Promise<void> => {
    const purchaseRef = db.ref(`purchaseHistory/${purchaseId}`);
    const purchaseSnapshot = await purchaseRef.get();
    
    if (!purchaseSnapshot.exists()) return;

    const purchaseData = purchaseSnapshot.val() as PurchaseHistoryItem;

    // If it's a product purchase and it's being approved, decrement stock
    if (purchaseData.type === 'product' && purchaseData.productId && newStatus === 'success') {
        const productRef = db.ref(`products/${purchaseData.productId}/stock`);
        await productRef.transaction((currentStock) => {
            return (currentStock && currentStock > 0) ? currentStock - 1 : 0;
        });
    }

    await purchaseRef.update({ status: newStatus });
};

export const openMysteryBox = async (purchaseId: string): Promise<void> => {
    await db.ref(`purchaseHistory/${purchaseId}`).update({ isOpened: true });
}

export const deletePurchaseHistoryItem = async (historyId: string): Promise<void> => {
    await db.ref(`purchaseHistory/${historyId}`).remove();
};


// Private Message Functions
export const sendGlobalMessage = async (text: string, allUsers: User[]): Promise<void> => {
    const userIds = allUsers.filter(u => u.role === 'user').map(u => u.uid);
    const messagePromises = userIds.map(uid => sendPrivateMessage(uid, `[PENGUMUMAN] ${text}`));
    await Promise.all(messagePromises);
};

export const sendPrivateMessage = async (userId: string, text: string): Promise<void> => {
    const message: Omit<PrivateMessage, 'id'> = {
        userId,
        text,
        timestamp: new Date().toISOString(),
        isRead: false
    };
    await db.ref('privateMessages').push(message);
}

export const listenToUserMessages = (userId: string, callback: (messages: PrivateMessage[]) => void): (() => void) => {
    const messagesRef = db.ref('privateMessages');
    const listener = (snapshot: firebase.database.DataSnapshot) => {
        const allMessages = snapshotToArrWithId<PrivateMessage>(snapshot);
        const userMessages = allMessages
            .filter(m => m.userId === userId)
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        callback(userMessages);
    };
    messagesRef.on('value', listener);
    return () => messagesRef.off('value', listener);
}

export const markMessageAsRead = async (messageId: string): Promise<void> => {
    await db.ref(`privateMessages/${messageId}`).update({ isRead: true });
}
