
export function saveUserData(firestore, userData) {
    console.log("syncing...", userData);

    const userDoc = doc(firestore, "users", userData.uid);

    // state to store remotely in user's data
    payload = _getLocalStorageObj('book_progress');

    setDoc(userDoc, {
        username: userData.displayName,
        email: userData.email,
        payload
    })
      .then(() => {
        console.log("Data saved successfully to Firestore!")
      })
      .catch((error) => {
        console.error("Error saving data to Firestore:", error);
      });
}
