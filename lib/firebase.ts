import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
// import { getAnalytics } from "firebase/analytics"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyAdIi9ALdQ1kWTMeguW0zlv2ivJxDBLWfc",
  authDomain: "zapchast-a4f1c.firebaseapp.com",
  projectId: "zapchast-a4f1c",
  storageBucket: "zapchast-a4f1c.firebasestorage.app",
  messagingSenderId: "247653871099",
  appId: "1:247653871099:web:85ac16d7d402139180ef5e",
  measurementId: "G-3HF94E3WGE",
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)

// Initialize Analytics only in browser environment
// let analytics
// if (typeof window !== "undefined") {
//   analytics = getAnalytics(app)
// }

// export { analytics }
