import { db } from './firebase';
import { doc, updateDoc, increment, setDoc, getDoc } from 'firebase/firestore';

/**
 * Updates the user's total points and daily XP history.
 * @param userId - The physical UID of the user.
 * @param xp - The amount of XP to add.
 */
export async function updateXP(userId: string, xp: number) {
  if (!userId || xp <= 0) return;

  const today = new Date().toISOString().split('T')[0];
  const userRef = doc(db, 'users', userId);
  const activityRef = doc(db, 'users', userId, 'progress', 'activity');

  try {
    // 1. Update total points in the main user document
    await updateDoc(userRef, {
      points: increment(xp)
    });

    // 2. Update daily activity in the subcollection
    // We use setDoc with merge: true because the activity document might not exist yet
    await setDoc(activityRef, {
      [today]: increment(xp)
    }, { merge: true });

    console.log(`XP Updated for ${userId}: +${xp} points on ${today}`);
  } catch (error) {
    console.error('Error updating XP:', error);
    
    // Fallback: If updateDoc fails (e.g. document doesn't exist yet), try to set it
    // This is useful for first-time users if the profile isn't fully initialized
    try {
      await setDoc(userRef, { points: xp }, { merge: true });
      await setDoc(activityRef, { [today]: increment(xp) }, { merge: true });
    } catch (innerError) {
      console.error('Critical Error in XP update fallback:', innerError);
    }
  }
}
