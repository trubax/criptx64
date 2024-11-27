import { useState, useEffect } from 'react';
import { Dialog } from '../ui/dialog';
import { Heart, MessageCircle, Send, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase';
import { doc, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';
import { generateUUID } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';

interface VideoDetailDialogProps {
  video: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete?: (videoId: string) => Promise<void>;
  onUpdate?: (videoId: string, data: any) => Promise<void>;
}

export function VideoDetailDialog({
  video,
  open,
  onOpenChange,
  onDelete,
  onUpdate
}: VideoDetailDialogProps) {
  const { currentUser } = useAuth();
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState<any[]>([]);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (video) {
      setComments(video.comments || []);
      setLikesCount(video.likes?.length || 0);
      setIsLiked(video.likes?.includes(currentUser?.uid) || false);
    }
  }, [video, currentUser]);

  const handleLike = async () => {
    if (!currentUser || !video) return;

    try {
      const videoRef = doc(db, 'videos', video.id);
      const operation = isLiked ? arrayRemove : arrayUnion;
      
      await updateDoc(videoRef, {
        likes: operation(currentUser.uid)
      });

      setIsLiked(!isLiked);
      setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
    } catch (error) {
      console.error('Errore nel like:', error);
    }
  };

  const handleAddComment = async () => {
    if (!currentUser || !video || !newComment.trim()) return;

    try {
      setLoading(true);
      const comment = {
        id: generateUUID(),
        text: newComment.trim(),
        userId: currentUser.uid,
        userName: currentUser.displayName,
        userPhotoURL: currentUser.photoURL,
        createdAt: new Date().toISOString(),
        likes: []
      };

      const videoRef = doc(db, 'videos', video.id);
      await updateDoc(videoRef, {
        comments: arrayUnion(comment)
      });

      setComments(prev => [...prev, comment]);
      setNewComment('');
    } catch (error) {
      console.error('Errore nell\'aggiunta del commento:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: any) => {
    if (!date) return '';
    
    try {
      // Se è un timestamp di Firestore
      if (date?.toDate) {
        return formatDistanceToNow(date.toDate(), { addSuffix: true, locale: it });
      }
      
      // Se è una stringa ISO
      if (typeof date === 'string') {
        return formatDistanceToNow(new Date(date), { addSuffix: true, locale: it });
      }
      
      return '';
    } catch (error) {
      console.error('Errore nel formato data:', error);
      return '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] flex">
          {/* Video Section */}
          <div className="flex-1 relative">
            <video
              src={video?.videoUrl}
              className="w-full h-full object-contain"
              controls
              playsInline
              preload="metadata"
              controlsList="nodownload"
            />
          </div>

          {/* Comments Section */}
          <div className="w-[400px] flex flex-col border-l dark:border-gray-700">
            {/* Header */}
            <div className="p-4 border-b dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img
                    src={video?.userPhotoURL || `https://ui-avatars.com/api/?name=${video?.userName}`}
                    alt={video?.userName}
                    className="w-8 h-8 rounded-full"
                  />
                  <span className="font-medium">{video?.userName}</span>
                </div>
                {onDelete && (
                  <button
                    onClick={() => onDelete(video.id)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                  >
                    <Trash2 className="w-5 h-5 text-red-500" />
                  </button>
                )}
              </div>
              <p className="mt-2">{video?.caption}</p>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-2">
                  <img
                    src={comment.userPhotoURL || `https://ui-avatars.com/api/?name=${comment.userName}`}
                    alt={comment.userName}
                    className="w-8 h-8 rounded-full"
                  />
                  <div>
                    <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-lg">
                      <p className="font-medium text-sm">{comment.userName}</p>
                      <p>{comment.text}</p>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm">
                      <span>{formatDate(comment.createdAt)}</span>
                      <button className="hover:text-blue-500">Mi piace</button>
                      <button className="hover:text-blue-500">Rispondi</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="p-4 border-t dark:border-gray-700">
              <div className="flex items-center gap-4 mb-4">
                <button
                  onClick={handleLike}
                  className="flex items-center gap-1 hover:text-red-500"
                >
                  <Heart className={`w-6 h-6 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                  <span>{likesCount}</span>
                </button>
                <button className="flex items-center gap-1">
                  <MessageCircle className="w-6 h-6" />
                  <span>{comments.length}</span>
                </button>
              </div>

              {/* Comment Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Aggiungi un commento..."
                  className="flex-1 p-2 rounded border dark:border-gray-700 dark:bg-gray-700"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && newComment.trim()) {
                      handleAddComment();
                    }
                  }}
                />
                <button
                  onClick={handleAddComment}
                  disabled={!newComment.trim() || loading}
                  className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-full disabled:opacity-50"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  );
} 