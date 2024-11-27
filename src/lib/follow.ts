import { db, auth } from '../firebase';
import { doc, setDoc, deleteDoc, collection, writeBatch, increment, getDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

export async function sendFollowRequest(targetUserId: string) {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('Utente non autenticato');

  const followRequestRef = doc(
    db,
    'users',
    targetUserId,
    'followRequests',
    currentUser.uid
  );

  await setDoc(followRequestRef, {
    requestedAt: new Date(),
    requesterId: currentUser.uid,
    requesterName: currentUser.displayName,
    requesterPhoto: currentUser.photoURL
  });
}

export const followUser = async (currentUserId: string, targetUserId: string): Promise<boolean> => {
  if (!currentUserId || !targetUserId) {
    console.log('🚫 ID mancanti:', { currentUserId, targetUserId });
    throw new Error('ID utente mancanti');
  }

  try {
    console.log('👤 Tentativo di follow:', { currentUserId, targetUserId });
    
    const batch = writeBatch(db);
    const currentUserRef = doc(db, 'users', currentUserId);
    const targetUserRef = doc(db, 'users', targetUserId);

    // Verifica esistenza documenti
    const [currentUserDoc, targetUserDoc] = await Promise.all([
      getDoc(currentUserRef),
      getDoc(targetUserRef)
    ]);

    if (!currentUserDoc.exists() || !targetUserDoc.exists()) {
      console.error('❌ Uno o entrambi i documenti utente non trovati');
      return false;
    }

    // Ottieni i dati attuali
    const currentUserData = currentUserDoc.data();
    const following = Array.isArray(currentUserData?.following) ? currentUserData.following : [];
    const isFollowing = following.includes(targetUserId);
    
    console.log('📊 Stato attuale:', { isFollowing, following });

    if (isFollowing) {
      batch.update(currentUserRef, {
        following: arrayRemove(targetUserId)
      });
      batch.update(targetUserRef, {
        followers: arrayRemove(currentUserId)
      });
    } else {
      batch.update(currentUserRef, {
        following: arrayUnion(targetUserId)
      });
      batch.update(targetUserRef, {
        followers: arrayUnion(currentUserId)
      });
    }

    await batch.commit();
    console.log('✅ Batch completato con successo');
    return !isFollowing;
  } catch (error) {
    console.error('❌ Errore durante l\'operazione di follow:', error);
    return false;
  }
};

export async function unfollowUser(targetUserId: string) {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('Utente non autenticato');

  // Riferimenti ai documenti
  const currentUserRef = doc(db, 'users', currentUser.uid);
  const targetUserRef = doc(db, 'users', targetUserId);
  
  await deleteDoc(doc(db, 'users', currentUser.uid, 'following', targetUserId));
  await deleteDoc(doc(db, 'users', targetUserId, 'followers', currentUser.uid));

  // Aggiorna i contatori
  const batch = writeBatch(db);
  batch.update(currentUserRef, {
    'stats.following': increment(-1)
  });
  batch.update(targetUserRef, {
    'stats.followers': increment(-1)
  });
  
  await batch.commit();
}

export async function checkFollowRequestStatus(targetUserId: string) {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('Utente non autenticato');

  const requestDoc = await getDoc(
    doc(db, 'users', targetUserId, 'followRequests', currentUser.uid)
  );
  
  return requestDoc.exists();
} 