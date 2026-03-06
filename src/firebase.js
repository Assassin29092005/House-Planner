// Firebase Configuration
import { initializeApp } from 'firebase/app';
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    updateProfile,
    browserSessionPersistence,
    setPersistence,
} from 'firebase/auth';
import {
    getFirestore,
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    getDoc,
    getDocs,
    query,
    where,
    orderBy,
    serverTimestamp,
} from 'firebase/firestore';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Use session persistence so auth state is cleared when the tab/browser is closed.
// This ensures the app always starts from the login page on a new session.
setPersistence(auth, browserSessionPersistence);

// ─── AUTH ───
export const signUp = async (email, password, fullName) => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Set display name
        await updateProfile(userCredential.user, { displayName: fullName });
        return { data: userCredential, error: null };
    } catch (error) {
        return { data: null, error };
    }
};

export const signIn = async (email, password) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return { data: userCredential, error: null };
    } catch (error) {
        return { data: null, error };
    }
};

export const signOut = async () => {
    try {
        await firebaseSignOut(auth);
        return { error: null };
    } catch (error) {
        return { error };
    }
};

export const getUser = () => {
    return auth.currentUser;
};

export const onAuthChange = (callback) => {
    return onAuthStateChanged(auth, callback);
};

// ─── PROJECTS (Firestore) ───
const PROJECTS_COLLECTION = 'projects';

export const saveProject = async (projectData, projectId = null) => {
    const user = getUser();
    if (!user) return { data: null, error: 'Not authenticated' };

    const payload = {
        user_id: user.uid,
        name: projectData.name || 'Untitled',
        data: projectData,
        thumbnail: projectData.thumbnail || null,
        updated_at: serverTimestamp(),
    };

    try {
        if (projectId) {
            const docRef = doc(db, PROJECTS_COLLECTION, projectId);
            await updateDoc(docRef, payload);
            return { data: { id: projectId, ...payload }, error: null };
        } else {
            payload.created_at = serverTimestamp();
            const docRef = await addDoc(collection(db, PROJECTS_COLLECTION), payload);
            return { data: { id: docRef.id, ...payload }, error: null };
        }
    } catch (error) {
        return { data: null, error };
    }
};

export const loadProject = async (projectId) => {
    try {
        const docRef = doc(db, PROJECTS_COLLECTION, projectId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { data: { id: docSnap.id, ...docSnap.data() }, error: null };
        }
        return { data: null, error: 'Project not found' };
    } catch (error) {
        return { data: null, error };
    }
};

export const listProjects = async () => {
    const user = getUser();
    if (!user) return { data: [], error: 'Not authenticated' };

    try {
        const q = query(
            collection(db, PROJECTS_COLLECTION),
            where('user_id', '==', user.uid),
            orderBy('updated_at', 'desc')
        );
        const snapshot = await getDocs(q);
        const projects = snapshot.docs.map(d => ({
            id: d.id,
            ...d.data(),
            // Convert Firestore Timestamps to ISO strings for display
            created_at: d.data().created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
            updated_at: d.data().updated_at?.toDate?.()?.toISOString() || new Date().toISOString(),
        }));
        return { data: projects, error: null };
    } catch (error) {
        return { data: [], error };
    }
};

export const deleteProject = async (projectId) => {
    const user = getUser();
    if (!user) return { error: 'Not authenticated' };

    try {
        // Verify ownership before deleting
        const docRef = doc(db, PROJECTS_COLLECTION, projectId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().user_id === user.uid) {
            await deleteDoc(docRef);
        }
        return { error: null };
    } catch (error) {
        return { error };
    }
};

export const getShareLink = (projectId) => {
    return `${window.location.origin}/editor?project=${projectId}`;
};
