import { useState, useEffect } from 'react';
import { db } from '@/firebase';
import { doc, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';

export function useFollow(targetUserId: string, currentUserId: string) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    // Controlla se l'utente sta già seguendo o ha una richiesta pendente
    const checkFollowStatus = async () => {
      const targetUserDoc = await getDoc(doc(db, 'users', targetUserId));
      const targetUserData = targetUserDoc.data();
      
      if (targetUserData) {
        setIsFollowing(targetUserData.followers?.includes(currentUserId) || false);
        setIsPending(targetUserData.followRequests?.includes(currentUserId) || false);
      }
    };

    if (targetUserId && currentUserId) {
      checkFollowStatus();
    }
  }, [targetUserId, currentUserId]);

  const handleFollow = async (isPrivate: boolean) => {
    if (!targetUserId || !currentUserId) return;

    try {
      const targetUserRef = doc(db, 'users', targetUserId);
      const currentUserRef = doc(db, 'users', currentUserId);

      if (isPrivate) {
        // Se l'account è privato, aggiungi una richiesta di follow
        await updateDoc(targetUserRef, {
          followRequests: arrayUnion(currentUserId)
        });
        setIsPending(true);
      } else {
        // Se l'account è pubblico, segui direttamente
        await updateDoc(targetUserRef, {
          followers: arrayUnion(currentUserId)
        });
        await updateDoc(currentUserRef, {
          following: arrayUnion(targetUserId)
        });
        setIsFollowing(true);
      }
    } catch (error) {
      console.error('Errore nel follow:', error);
    }
  };

  const handleUnfollow = async () => {
    if (!targetUserId || !currentUserId) return;

    try {
      const targetUserRef = doc(db, 'users', targetUserId);
      const currentUserRef = doc(db, 'users', currentUserId);

      // Rimuovi il follow o la richiesta pendente
      await updateDoc(targetUserRef, {
        followers: arrayRemove(currentUserId),
        followRequests: arrayRemove(currentUserId)
      });
      await updateDoc(currentUserRef, {
        following: arrayRemove(targetUserId)
      });
      
      setIsFollowing(false);
      setIsPending(false);
    } catch (error) {
      console.error('Errore nell\'unfollow:', error);
    }
  };

  return {
    isFollowing,
    isPending,
    handleFollow,
    handleUnfollow
  };
} 