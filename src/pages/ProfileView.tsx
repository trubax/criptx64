import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProfileData } from '../context/ProfileContext';
import { useFirestore } from '../context/FirestoreContext';
import { ProfileLayout } from '../components/ProfileLayout';
import { PostGrid } from '../components/PostGrid';
import { Lock } from 'lucide-react';

const ProfileView = () => {
  const { currentUser } = useAuth();
  const { profileData, setProfileData } = useProfileData();
  const { db } = useFirestore();
  const navigate = useNavigate();

  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [profileVisibility, setProfileVisibility] = useState<'public' | 'private' | 'followers'>('public');

  useEffect(() => {
    const loadProfileVisibility = async () => {
      if (!currentUser || !profileData.uid) return;
      
      try {
        // Carica le impostazioni di privacy dell'utente
        const userDoc = await getDoc(doc(db, 'users', profileData.uid));
        const userData = userDoc.data();
        setProfileVisibility(userData?.privacy?.profileVisibility || 'public');
        
        // Se è il proprietario del profilo, carica sempre i contenuti
        if (isOwnProfile) {
          return true;
        }

        // Controlla se l'utente corrente è un follower
        const followDoc = await getDoc(
          doc(db, 'users', currentUser.uid, 'sessions', `follow_${profileData.uid}`)
        );
        
        setIsFollowing(followDoc.exists() && followDoc.data()?.status === 'active');
      } catch (error) {
        console.error('Errore nel caricamento della visibilità:', error);
      }
    };

    loadProfileVisibility();
  }, [currentUser, profileData.uid, isOwnProfile]);

  // Funzione per controllare se l'utente può vedere i contenuti
  const canViewContent = () => {
    if (isOwnProfile) return true;
    
    switch (profileVisibility) {
      case 'public':
        return true;
      case 'private':
        return isFollowing;
      case 'followers':
        return isFollowing;
      default:
        return false;
    }
  };

  // Modifica la funzione handleFollowToggle
  const handleFollowToggle = async () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    try {
      if (isFollowing) {
        const success = await unfollowUser(profileData.uid);
        if (success) {
          setIsFollowing(false);
          // Aggiorna le statistiche
          setProfileData(prev => ({
            ...prev,
            stats: {
              ...prev.stats,
              followers: Math.max(0, (prev.stats?.followers || 0) - 1)
            }
          }));
        }
      } else {
        const success = await followUser(profileData.uid);
        if (success) {
          setIsFollowing(true);
          // Aggiorna le statistiche
          setProfileData(prev => ({
            ...prev,
            stats: {
              ...prev.stats,
              followers: (prev.stats?.followers || 0) + 1
            }
          }));
        }
      }
    } catch (error) {
      console.error('Errore durante l\'operazione di follow:', error);
      alert('Errore durante l\'operazione. Riprova più tardi.');
    }
  };

  // Nel render, modifica la visualizzazione dei contenuti
  return (
    <ProfileLayout>
      {/* ... resto del codice ... */}
      
      {canViewContent() ? (
        <>
          {/* Contenuti del profilo */}
          <div className="grid md:grid-cols-2 gap-4 p-6">
            {/* ... servizi e altri contenuti ... */}
          </div>
          
          {/* Griglia dei post */}
          <div className="p-4 mb-20">
            {activeTab === 'posts' && (
              <div className="p-4">
                <PostGrid 
                  isOwnProfile={isOwnProfile} 
                  userId={profileData.uid}
                />
              </div>
            )}
            {/* ... altri tab ... */}
          </div>
        </>
      ) : (
        <div className="p-6 text-center theme-text">
          <Lock className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-semibold mb-2">
            {profileVisibility === 'private' 
              ? 'Questo account è privato'
              : 'Contenuto visibile solo ai follower'}
          </h3>
          <p className="mb-4 text-sm opacity-70">
            Segui questo account per vedere i suoi contenuti
          </p>
          {!isFollowing && (
            <button
              onClick={handleFollowToggle}
              className="px-4 py-2 rounded-lg theme-bg-accent theme-text-on-accent"
            >
              Segui
            </button>
          )}
        </div>
      )}
    </ProfileLayout>
  );
};

export default ProfileView; 