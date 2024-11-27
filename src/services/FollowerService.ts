import { db } from '../firebase';
import { 
  collection, 
  addDoc, 
  deleteDoc, 
  query, 
  where, 
  getDocs, 
  updateDoc, 
  doc, 
  getDoc,
  setDoc,
  increment, 
  arrayUnion, 
  arrayRemove 
} from 'firebase/firestore';

export const followUser = async (followerId: string, followedId: string) => {
  try {
    // 1. Verifica/crea/aggiorna il documento dell'utente seguito
    const followedUserRef = doc(db, 'users', followedId);
    const followedUserDoc = await getDoc(followedUserRef);
    
    if (!followedUserDoc.exists()) {
      // Crea il documento se non esiste
      await setDoc(followedUserRef, {
        followers: [followerId],
        followersCount: 1,
        following: [],
        followingCount: 0
      });
    } else {
      // Aggiorna il documento esistente
      await updateDoc(followedUserRef, {
        followers: arrayUnion(followerId),
        followersCount: increment(1)
      });
    }

    // 2. Verifica/crea/aggiorna il documento dell'utente che segue
    const followerUserRef = doc(db, 'users', followerId);
    const followerUserDoc = await getDoc(followerUserRef);

    if (!followerUserDoc.exists()) {
      // Crea il documento se non esiste
      await setDoc(followerUserRef, {
        followers: [],
        followersCount: 0,
        following: [followedId],
        followingCount: 1
      });
    } else {
      // Aggiorna il documento esistente
      await updateDoc(followerUserRef, {
        following: arrayUnion(followedId),
        followingCount: increment(1)
      });
    }

    // 3. Crea il documento nella collezione followers
    await addDoc(collection(db, 'followers'), {
      followerId,
      followedId,
      timestamp: new Date()
    });

  } catch (error) {
    console.error('Errore nel seguire l\'utente:', error);
    throw error;
  }
};

export const unfollowUser = async (followerId: string, followedId: string) => {
  try {
    const q = query(
      collection(db, 'followers'), 
      where('followerId', '==', followerId),
      where('followedId', '==', followedId)
    );
    const snapshot = await getDocs(q);
    snapshot.docs.forEach(async (doc) => {
      await deleteDoc(doc.ref);
    });

    const followedUserRef = doc(db, 'users', followedId);
    await updateDoc(followedUserRef, {
      followersCount: increment(-1),
      followers: arrayRemove(followerId)
    });

    const followerUserRef = doc(db, 'users', followerId);
    await updateDoc(followerUserRef, {
      followingCount: increment(-1),
      following: arrayRemove(followedId)
    });

  } catch (error) {
    console.error('Errore nel smettere di seguire l\'utente:', error);
    throw error;
  }
}; 