import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore"; 
import { getAuth, onAuthStateChanged } from "firebase/auth"; 
import { getStorage } from "firebase/storage";


const firebaseConfig = {
  apiKey: "AIzaSyDTFQt3jJc0lp-dOwLF4BaFCJPJOeVgJdo",
  authDomain: "happysausage-application.firebaseapp.com",
  databaseURL: "https://happysausage-application-default-rtdb.firebaseio.com",
  projectId: "happysausage-application",
  storageBucket: "happysausage-application.firebasestorage.app",
  messagingSenderId: "429663349448",
  appId: "1:429663349448:web:00478dcd67d5cd40d113fd",
  measurementId: "G-6V8GCS71FZ"
};


const app = initializeApp(firebaseConfig);


export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

// Function to fetch user role from Firestore based on UID
export const getUserRole = async (userUid) => {
  try {
    const userDocRef = doc(db, "Users", userUid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const data = userDoc.data();
      return data.role || 'warehouse_staff'; // Default to warehouse_staff if role is missing
    } else {
      console.log("No user data found");
      return 'warehouse_staff'; // Default for new or missing users
    }
  } catch (error) {
    console.error("Error fetching user role: ", error);
    return 'warehouse_staff'; // Fallback in case of error
  }
};


export const checkAuthState = (callback) => {
  onAuthStateChanged(auth, callback); 
};
