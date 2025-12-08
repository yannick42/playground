

import { app } from './firebase.js';
import { getStorage, ref, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

onmessage = async (e) => {
    const storage = getStorage(app);
    const workerResult = await runWorker(e, storage);
    postMessage(workerResult);
};

async function runWorker(e, storage) {
    // You can initialize Firebase here if needed

    const bookId = e.data;
    const gsUrl = `gs://book-progression.appspot.com/books/${bookId}.json`;

    let workerResult; // json data or error message
    try {
        const url = await getDownloadURL(ref(storage, gsUrl));
        const fetched = await fetch(url);
        const json =  await fetched.json();
        //console.error("Book data fetched in worker:", json);

        workerResult = json;
    } catch (err) {
        console.error("Error fetching book data in worker:", err);
        workerResult = { error: "Failed to fetch book data" };
    }
    workerResult.bookId = bookId;

    return workerResult;
}