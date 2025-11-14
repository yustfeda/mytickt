import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import 'firebase/compat/auth';
import type { Product, User, Review, LeaderboardEntry, PurchaseHistoryItem, PrivateMessage, CustomButton } from '../types';

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

type WithId<T> = T & { id: string };

const snapshotToArrWithId = <T,>(snapshot: firebase.database.DataSnapshot): WithId<T>[] => {
    const result: WithId<T>[] = [];
    if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
            result.push({ id: childSnapshot.key as string, ...childSnapshot.val() });
        });
    }
    return result;
};


// Product Functions
export const listenToProducts = (callback: (products: Product[]) => void): (() => void) => {
    const productsRef = db.ref('products');
    const listener = (snapshot: firebase.database.DataSnapshot) => {
        callback(snapshotToArrWithId<Omit<Product, 'id'>>(snapshot));
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
        const usersWithId = snapshotToArrWithId<Omit<User, 'uid'>>(snapshot);
        callback(usersWithId.map(u => ({ ...u, uid: u.id })));
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
    // Note: This does not delete the user from Firebase Auth, only the database.
    await db.ref(`users/${uid}`).remove();
};

// Review Functions
export const listenToReviews = (callback: (reviews: Review[]) => void): (() => void) => {
    const reviewsRef = db.ref('reviews');
    const listener = (snapshot: firebase.database.DataSnapshot) => {
        const reviews = snapshotToArrWithId<Omit<Review, 'id'>>(snapshot);
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

    let users: User[] = [];
    let history: PurchaseHistoryItem[] = [];

    const calculateLeaderboard = () => {
        if (!users.length || !history.length) {
            callback([]);
            return;
        }

        const winsByUser = history.reduce((acc, purchase) => {
            if (purchase.type === 'mysterybox' && purchase.status === 'success' && purchase.prize) {
                if (!acc[purchase.userId]) {
                    acc[purchase.userId] = [];
                }
                acc[purchase.userId].push(purchase.prize);
            }
            return acc;
        }, {} as Record<string, string[]>);

        const leaderboardData = Object.keys(winsByUser).map(userId => {
            const user = users.find(u => u.uid === userId);
            if (!user) return null;

            const prizesWon = winsByUser[userId];
            return {
                uid: user.uid,
                nickname: user.nickname,
                email: user.email,
                lastLogin: user.lastLogin,
                itemsObtained: prizesWon.length,
                obtainedItems: prizesWon,
            };
        }).filter((entry): entry is Omit<LeaderboardEntry, 'rank'> => entry !== null);
        
        const sortedLeaderboard = leaderboardData
            .sort((a, b) => b.itemsObtained - a.itemsObtained)
            .map((entry, index) => ({ ...entry, rank: index + 1 }));

        callback(sortedLeaderboard);
    };

    const userListener = usersRef.on('value', (snapshot) => {
        users = snapshotToArrWithId<Omit<User, 'uid'>>(snapshot).map(u => ({ ...u, uid: u.id }));
        calculateLeaderboard();
    });

    const historyListener = historyRef.on('value', (snapshot) => {
        history = snapshotToArrWithId<Omit<PurchaseHistoryItem, 'id'>>(snapshot);
        calculateLeaderboard();
    });

    return () => {
        usersRef.off('value', userListener);
        historyRef.off('value', historyListener);
    };
};

// Purchase History Functions
export const listenToUserPurchaseHistory = (userId: string | null, callback: (history: PurchaseHistoryItem[]) => void): (() => void) => {
    const historyRef = db.ref('purchaseHistory');
    const query = userId ? historyRef.orderByChild('userId').equalTo(userId) : historyRef;
    
    const listener = (snapshot: firebase.database.DataSnapshot) => {
        const history = snapshotToArrWithId<Omit<PurchaseHistoryItem, 'id'>>(snapshot);
        callback(history.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    };
    query.on('value', listener);
    return () => query.off('value', listener);
};


export const createPurchaseHistory = async (userId: string, itemData: { type: 'product', productName: string, productId: string } | { type: 'mysterybox', productName: string }): Promise<string | null> => {
    const item: Omit<PurchaseHistoryItem, 'id'> = {
        userId,
        timestamp: new Date().toISOString(),
        status: 'pending',
        ...itemData
    };

    if(item.type === 'mysterybox') {
        const userRef = db.ref(`users/${userId}/mysteryBoxAttempts`);
        await userRef.transaction((currentAttempts) => (currentAttempts || 0) + 1);
    }
    
    const newItemRef = await db.ref('purchaseHistory').push(item);
    return newItemRef.key;
};

export const updatePurchaseStatus = async (purchaseId: string, newStatus: 'success' | 'rejected', prize?: string): Promise<void> => {
    const purchaseRef = db.ref(`purchaseHistory/${purchaseId}`);
    const purchaseSnapshot = await purchaseRef.get();
    
    if (!purchaseSnapshot.exists()) return;

    const purchaseData = { id: purchaseSnapshot.key, ...purchaseSnapshot.val() } as PurchaseHistoryItem;
    
    const updates: Partial<PurchaseHistoryItem> = { status: newStatus };

    if (purchaseData.type === 'product' && purchaseData.productId && newStatus === 'success') {
        const productRef = db.ref(`products/${purchaseData.productId}/stock`);
        await productRef.transaction((currentStock) => {
            return (currentStock && currentStock > 0) ? currentStock - 1 : 0;
        });
    }

    if (purchaseData.type === 'mysterybox' && newStatus === 'success' && prize) {
        updates.prize = prize;
    }

    await purchaseRef.update(updates);
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
    const query = messagesRef.orderByChild('userId').equalTo(userId);
    const listener = (snapshot: firebase.database.DataSnapshot) => {
        const userMessages = snapshotToArrWithId<Omit<PrivateMessage, 'id'>>(snapshot);
        callback(userMessages.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    };
    query.on('value', listener);
    return () => query.off('value', listener);
}

export const markMessageAsRead = async (messageId: string): Promise<void> => {
    await db.ref(`privateMessages/${messageId}`).update({ isRead: true });
}

// Custom Button Functions
export const listenToCustomButtons = (callback: (buttons: CustomButton[]) => void): (() => void) => {
    const buttonsRef = db.ref('customButtons');
    const listener = (snapshot: firebase.database.DataSnapshot) => {
        callback(snapshotToArrWithId<Omit<CustomButton, 'id'>>(snapshot));
    };
    buttonsRef.on('value', listener);
    return () => buttonsRef.off('value', listener);
};

export const addCustomButton = async (button: Omit<CustomButton, 'id'>): Promise<void> => {
    await db.ref('customButtons').push(button);
};

export const updateCustomButton = async (buttonId: string, updates: Partial<CustomButton>): Promise<void> => {
    await db.ref(`customButtons/${buttonId}`).update(updates);
};

export const deleteCustomButton = async (buttonId: string): Promise<void> => {
    await db.ref(`customButtons/${buttonId}`).remove();
};
