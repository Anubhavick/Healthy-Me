import { db, storage } from './firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, limit } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Meal } from '../types';

export class FirebaseService {
  private mealsCollection = 'meals';
  private imagesFolder = 'meal-images';

  // Save meal to Firestore
  async saveMeal(meal: Meal, imageBlob?: Blob): Promise<string> {
    try {
      let imageUrl = meal.imageDataUrl;
      
      // Upload image to Firebase Storage if blob provided
      if (imageBlob) {
        const imageRef = ref(storage, `${this.imagesFolder}/${meal.id}`);
        const snapshot = await uploadBytes(imageRef, imageBlob);
        imageUrl = await getDownloadURL(snapshot.ref);
      }

      // Save meal data to Firestore
      const mealData = {
        ...meal,
        imageDataUrl: imageUrl,
        createdAt: new Date(),
        syncedAt: new Date()
      };

      const docRef = await addDoc(collection(db, this.mealsCollection), mealData);
      return docRef.id;
    } catch (error) {
      throw error;
    }
  }

  // Get all meals from Firestore
  async getMeals(limitCount: number = 50): Promise<Meal[]> {
    try {
      const q = query(
        collection(db, this.mealsCollection),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      const meals: Meal[] = [];
      
      querySnapshot.forEach((doc) => {
        meals.push({
          id: doc.id,
          ...doc.data()
        } as Meal);
      });

      return meals;
    } catch (error) {
      throw error;
    }
  }

  // Delete meal from Firestore
  async deleteMeal(mealId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, this.mealsCollection, mealId));
    } catch (error) {
      throw error;
    }
  }

  // Convert data URL to blob for upload
  dataURLtoBlob(dataURL: string): Blob {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  }

  // Sync local storage with Firebase
  async syncMeals(): Promise<{
    uploaded: number;
    downloaded: number;
    errors: string[];
  }> {
    const result = {
      uploaded: 0,
      downloaded: 0,
      errors: [] as string[]
    };

    try {
      // Get local meals
      const localMealsData = localStorage.getItem('mealHistory');
      const localMeals: Meal[] = localMealsData ? JSON.parse(localMealsData) : [];

      // Get Firebase meals
      const firebaseMeals = await this.getMeals();
      const firebaseMealIds = new Set(firebaseMeals.map(meal => meal.id));

      // Upload local meals that aren't in Firebase
      for (const meal of localMeals) {
        if (!firebaseMealIds.has(meal.id)) {
          try {
            const imageBlob = this.dataURLtoBlob(meal.imageDataUrl);
            await this.saveMeal(meal, imageBlob);
            result.uploaded++;
          } catch (error) {
            result.errors.push(`Failed to upload meal ${meal.id}: ${error}`);
          }
        }
      }

      // Update local storage with Firebase meals
      const mergedMeals = [...firebaseMeals];
      localStorage.setItem('mealHistory', JSON.stringify(mergedMeals));
      result.downloaded = firebaseMeals.length;

      return result;
    } catch (error) {
      result.errors.push(`Sync failed: ${error}`);
      return result;
    }
  }
}

export const firebaseService = new FirebaseService();
