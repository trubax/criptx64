import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { followUser, unfollowUser } from '../lib/follow';

interface FollowButtonProps {
  targetUserId: string;
}

export function FollowButton({ targetUserId }: FollowButtonProps) {
  const { currentUser } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Controlla lo stato del follow all'avvio e dopo ogni cambiamento
  const checkFollowStatus = async () => {
    if (!currentUser) return;
    
    try {
      const followingRef = doc(db, 'users', currentUser.uid, 'following', targetUserId);
      const docSnap = await getDoc(followingRef);
      setIsFollowing(docSnap.exists());
    } catch (error) {
      console.error('Errore nel controllo follow:', error);
    }
  };

  useEffect(() => {
    checkFollowStatus();
  }, [currentUser, targetUserId]);

  const handleFollowClick = async () => {
    if (!currentUser) return;
    setIsLoading(true);

    try {
      if (isFollowing) {
        await unfollowUser(targetUserId);
      } else {
        await followUser(targetUserId);
      }
      await checkFollowStatus(); // Ricontrolla lo stato dopo l'operazione
    } catch (error) {
      console.error('Errore durante follow/unfollow:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentUser || currentUser.uid === targetUserId) {
    return null;
  }

  return (
    <button
      onClick={handleFollowClick}
      disabled={isLoading}
      className={`
        px-4 py-2 rounded-lg font-medium transition-colors
        ${isFollowing 
          ? 'theme-bg-secondary hover:theme-bg-primary' 
          : 'theme-bg-accent hover:opacity-90'
        }
        ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      {isLoading 
        ? 'Caricamento...' 
        : isFollowing 
          ? 'Non seguire più' 
          : 'Segui'}
    </button>
  );
} 