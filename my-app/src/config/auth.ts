import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged
} from 'firebase/auth';
import type { User, UserCredential } from 'firebase/auth';
import { auth } from './firebase';

// Auth service class
export class AuthService {
  // Sign up with email and password
  static async signUp(email: string, password: string): Promise<UserCredential> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log('✅ User signed up successfully:', userCredential.user.email);
      return userCredential;
    } catch (error: any) {
      console.error('❌ Sign up error:', error.message);
      throw error;
    }
  }

  // Sign in with email and password
  static async signIn(email: string, password: string): Promise<UserCredential> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('✅ User signed in successfully:', userCredential.user.email);
      return userCredential;
    } catch (error: any) {
      console.error('❌ Sign in error:', error.message);
      throw error;
    }
  }

  // Sign out
  static async signOut(): Promise<void> {
    try {
      await signOut(auth);
      console.log('✅ User signed out successfully');
    } catch (error: any) {
      console.error('❌ Sign out error:', error.message);
      throw error;
    }
  }

  // Get current user
  static getCurrentUser(): User | null {
    return auth.currentUser;
  }

  // Get Firebase ID token
  static async getIdToken(): Promise<string> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No user is currently signed in');
    }
    
    try {
      const token = await user.getIdToken();
      return token;
    } catch (error: any) {
      console.error('❌ Error getting ID token:', error.message);
      throw error;
    }
  }

  // Listen to auth state changes
  static onAuthStateChanged(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
  }
}

export default AuthService;
