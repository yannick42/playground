
import * as firebase from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
//import { firebaseConfig } from './firebase-config.js';

// web app Firebase configuration
export const firebaseConfig = {
    apiKey: "AIzaSyAvPeqHFoSYuETGai2VoAtDmbP8a_F3QR0", // no risk : https://firebase.google.com/docs/projects/api-keys
    authDomain: "book-progression.firebaseapp.com",
    projectId: "book-progression",
    storageBucket: "book-progression.appspot.com",
    messagingSenderId: "1017563463675",
    appId: "1:1017563463675:web:4c84cebf8c0c78a7d0d55e",
    measurementId: "G-BS2RFS52ET"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);

export { app };