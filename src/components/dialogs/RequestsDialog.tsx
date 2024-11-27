import { Dialog, DialogContent, DialogTitle } from "../ui/Dialog";
import { Avatar } from "@/components/ui/Avatar";
import { Check, X } from "lucide-react";
import { useState, useEffect } from "react";
import { db } from "@/firebase";
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";

interface RequestsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export function RequestsDialog({ isOpen, onClose, userId }: RequestsDialogProps) {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      if (!userId) return;
      
      const userRef = doc(db, "users", userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists() && userDoc.data().followRequests) {
        const requestIds = userDoc.data().followRequests;
        const requestsData = await Promise.all(
          requestIds.map(async (requestId: string) => {
            const requestUserDoc = await getDoc(doc(db, "users", requestId));
            return { id: requestId, ...requestUserDoc.data() };
          })
        );
        setRequests(requestsData);
      }
      setLoading(false);
    };

    fetchRequests();
  }, [userId, isOpen]);

  const handleAccept = async (requesterId: string) => {
    const userRef = doc(db, "users", userId);
    const requesterRef = doc(db, "users", requesterId);

    await updateDoc(userRef, {
      followers: arrayUnion(requesterId),
      followRequests: arrayRemove(requesterId)
    });

    await updateDoc(requesterRef, {
      following: arrayUnion(userId)
    });

    setRequests(requests.filter(request => request.id !== requesterId));
  };

  const handleReject = async (requesterId: string) => {
    const userRef = doc(db, "users", userId);
    
    await updateDoc(userRef, {
      followRequests: arrayRemove(requesterId)
    });

    setRequests(requests.filter(request => request.id !== requesterId));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogTitle>Richieste di follow</DialogTitle>
        <div className="max-h-[70vh] overflow-y-auto">
          {loading ? (
            <div className="text-center p-4">Caricamento...</div>
          ) : requests.length === 0 ? (
            <div className="text-center p-4 text-gray-500">
              Non hai richieste in sospeso
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar src={request.photoURL} alt={request.displayName} />
                    <span className="font-medium">{request.displayName}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAccept(request.id)}
                      className="p-2 rounded-full hover:bg-green-50 text-green-600 transition-colors"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleReject(request.id)}
                      className="p-2 rounded-full hover:bg-red-50 text-red-600 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 