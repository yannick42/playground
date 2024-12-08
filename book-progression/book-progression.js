
import { setUpCanvas, drawPointAt, drawArrow, drawLine } from '../common/canvas.helper.js';
import { randInt } from '../common/common.helper.js';
import { computeBézierCurve, round } from '../common/math.helper.js';

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js"
import { getStorage, ref, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js"
import { getAuth, signOut, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js"
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"

const firebaseConfig = {
    apiKey: "AIzaSyAvPeqHFoSYuETGai2VoAtDmbP8a_F3QR0", // no risk : https://firebase.google.com/docs/projects/api-keys
    authDomain: "book-progression.firebaseapp.com",
    projectId: "book-progression",
    storageBucket: "book-progression.appspot.com",
    messagingSenderId: "1017563463675",
    appId: "1:1017563463675:web:4c84cebf8c0c78a7d0d55e",
    measurementId: "G-BS2RFS52ET"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app);
let userData;
//const analytics = getAnalytics(app);
const storage = getStorage(app);
const firestore = getFirestore(app);

let payload;

document.getElementById('sync').addEventListener('click', async (event) => {
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
        // Data saved successfully to Firestore!
      })
      .catch((error) => {
        console.error("Error saving data to Firestore:", error);
      });
})


document.getElementById('connect').addEventListener('click', async (event) => {
    const userCred = await signInWithPopup(auth, new GoogleAuthProvider());
    userData = userCred.user;
    console.log("connected: user =", userData);

    event.target.style.display = 'none';
    document.getElementById('sync').style.display = 'block';
    document.getElementById('disconnect').style.display = 'block';
})

document.getElementById('disconnect').addEventListener('click', async (event) => {
    try {
        await signOut(auth);
        console.log("User signed out");

        // Clear user info on the webpage
        document.getElementById("user-info").innerHTML = "You are logged out.";
        document.getElementById('disconnect').style.display = 'none';
        document.getElementById('sync').style.display = 'none';
        document.getElementById('connect').style.display = 'block';
    } catch (error) {
        console.error("Error signing out:", error);
    }
})

// Check if a user is already signed in
onAuthStateChanged(auth, async (user) => {
    if (user) {
      // User is signed in
      console.warn("User is signed in", user);
      payload = _getLocalStorageObj('book_progress'); // from local storage first ?!
  
      userData = user;
  
      // Get user details
      const displayName = user.displayName;
      //const email = user.email;
      //const photoURL = user.photoURL;
      const uid = user.uid; // User's unique ID
  
      // Example: Show user's details on the webpage
      document.getElementById("user-info").innerHTML = `<p>Welcome, <b>${displayName}</b>!</p>`;

      document.getElementById('disconnect').style.display = 'block';
      document.getElementById('sync').style.display = 'block';
      document.getElementById('connect').style.display = 'none';
    } else {
      // No user is signed in
      document.getElementById('disconnect').style.display = 'none';
      document.getElementById('sync').style.display = 'none';
      document.getElementById('connect').style.display = 'block';
    }
  });


// check regularly if sync. is needed !
setInterval(() => {

    const last = payload; // null at the beginning
    const current = _getLocalStorageObj('book_progress');

    if(JSON.stringify(last?.sort((a, b) => a.id > b.id ? 1 : -1)) != JSON.stringify(current.sort((a, b) => a.id > b.id ? 1 : -1))) {
        document.getElementById("user-info").style.backgroundColor = 'lightgrey';
    } else {
        document.getElementById("user-info").style.backgroundColor = 'transparent';
    }

    console.warn(last, current);

}, 5000);





















const bookListEl = document.getElementById("book_list");
const searchEl = document.querySelector("input[type='search']");
const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");

function main() {
    visibleBooks = getBookList();

    console.warn(JSON.stringify(visibleBooks))

    //document.querySelector("#refresh").addEventListener('click', (e) => redraw());
    redraw(visibleBooks); // get all books

    const hashElements = window.parent.location.hash.split('|');
    console.log("hashElements:", hashElements)
    hashElements.forEach(element => {
        const el = element.split(',')
        if(el[0] === 'search') {
            searchEl.value = el[1];
            // send ENTER ! to run search
            const keyEvent = new KeyboardEvent("keyup", {
                key: "ArrowLeft",
                bubbles: true,
                cancelable: true
            })
            searchEl.dispatchEvent(keyEvent);
        }
    });
}


/**
 * Links
 */
const arrowsList = [
    ['Cormen', 'AlgoForOptimization', 'solid'],
    ['Cormen', 'NumericalRecipes', 'solid'],
    ['AlgoForOptimization', 'AlgoForDecisionMaking', 'solid'],
];

const bookIds = [
    'SICP', 'CG', 'VG', 'LinearAlgebraHefferon',
    'Cormen', 'HoML3', 'AlgoForOptimization',
    'NumericalRecipes', 'AlgoForDecisionMaking', 'KR',
    'FluentPython'
];

const booksIds_from_GCS = [];

/**
 * TODO: get it from localStorage too ! (or backend ?!)
 */
async function getBookListFromFirebase() {

    const books = [];

    for (const bookId of bookIds) {
        let fetched;
        // hard-coded books stored in Firebase Storage (GCS)
        try {
            let url = await getDownloadURL(ref(storage, 'gs://book-progression.appspot.com/' + bookId + '.json'));
            fetched = await fetch(url);
            booksIds_from_GCS.push(bookId);
        } catch(e) {
            console.error(`loading ${bookId} from local`);
            fetched = await fetch('./books/'+bookId+'.json');
        }
        books.push(await fetched.json());
    };
    
    console.warn(books);
    return books;
}

function getBookList() {
    return bookList;
}

function createHtml(book) {

    if(! getProgress(book.id)) { // init to hidden if not present
        setVisibility(book.id, false);
    }

    const html = `
        <div id="${book.id}" class="book${booksIds_from_GCS.includes(book.id) ? ' gcs' : ''}">
            <div>

                ${book.front_cover ? `<div class="front-cover"><img src="${book.front_cover}" width=35 height=55 /></div>` : ''}
                
                <div style="width: 100%">
                    <div class="top-right">
                        ${book.main_url ? `<div class="outside_link"><a target="_blank" href="${book.main_url}">URL</a></div>` : ''}
                        ${book.pdf_url ? `<div class="outside_link"><a target="_blank" href="${book.pdf_url}">PDF</a></div>` : ''}
                        <div class="toggle">${getVisibility(book.id) ? '➖' : '➕'}</div>
                        ${book.tags?.length ? `<div class="tags">${book.tags?.map(tag => {
                            return `<span class="tag" style="background-color: ${tag.bgColor}; color: ${tag.textColor}">${tag.text}</span>`
                        }).join('')}</div>` : ''}
                    </div>
                    
                    <div class="title_authors"><span class="title">${book.title}</span>${book.authors ? ` <span class="authors">by ${book.authors}</span>` : ''}</div>

                    <div class="progress-bar">
                        <div class="progress"></div>
                        <span class="progress-value"></span>
                    </div>
                </div>
            </div>

            <div class="level ${getVisibility(book.id) ? '' : 'toggled'}">
                ${createLevel(book, book.content, 0).join('')}
            </div>
        </div>
    `;
    return html;
}

function createLevel(book, content, level) {
    return content.map(el => {
        const isChecked = el.id ? getProgressForId(book.id, el.id) : false;
        return `
        <div class="content ${el.content ? '' : 'leaf'}">

            <span${el.id ? ' id="'+el.id+'"' : ''} class="content_title_${level}">
                <span ${isChecked ? 'class="checked"' : ''}>
                    ${el.content ? '' : `<input type="checkbox" ${isChecked ? ' checked' : ''}/>`} ${searchEl.value ? el.title.replace(new RegExp(searchEl.value, 'ig'), (m) => '<mark>' + m + '</mark>') : el.title}
                </span>
                ${el.tooltip ? '<span class="info" title="' + el.tooltip + '">🛈</span>' : ''}
            </span>
            <span class="start_page">${el.start_page ?? ''}</span>

            ${el.content ? createLevel(book, el.content, level + 1).join('') : ''}
        </div>
        `
    });
}


// TODO: the compute the page number of the next element !
function findNextEntry(book, id) {
    book.content.forEach(content => {

    });
    return nextEntry;
}





/**
 * LocalStorage
 */
function getProgress(bookId) {
    const bookProgress = _getLocalStorageObj('book_progress');
    return bookProgress.find(b => b.id === bookId);
}

function getProgressForId(bookId, id) {
    //console.log("checking if", id, " from book =", bookId, "is true -> ", getProgress(bookId)?.progress?.includes(id))
    return getProgress(bookId)?.progress?.includes(id);
}

function setProgress(bookId, newValue) {
    const booksProgress = _getLocalStorageObj('book_progress');
    const newProgress = booksProgress.filter(prog => prog.id !== bookId);
    newProgress.push(newValue);
    localStorage.setItem('book_progress', JSON.stringify(newProgress)); // in LocalStorage
}

function _getLocalStorageObj(itemName) {
    return JSON.parse(localStorage.getItem(itemName) ?? '[]');
}

function setVisibility(bookId, value) {
    //console.log("setVisibility:", bookId, "to", value)
    const booksProgress = _getLocalStorageObj('book_progress');
    // get and keep unchanged books
    const newObject = booksProgress.filter(prog => prog.id !== bookId);
    // modify current book
    let currentBook = booksProgress.find(prog => prog.id === bookId);
    //console.log("setVis:", currentBook)
    if(currentBook) { // if present
        currentBook['visibility'] = value;
    } else {
        currentBook = { 'id': bookId, 'visibility': value, 'progress': []}
    }
    // save it
    newObject.push(currentBook);
    localStorage.setItem('book_progress', JSON.stringify(newObject)); // in LocalStorage
    return value;
}

function getVisibility(bookId) {
    const booksProgress = _getLocalStorageObj('book_progress');
    return booksProgress.find(prog => prog.id === bookId)?.visibility ?? true;
}

function setBookVisibility(bookId, visible) {
    const el = document.getElementById(bookId);
    //console.log("el:", el)
    el.style.display = visible ? 'block' : 'none';
}
// local storage



function removeEvents() {

    const toggleEls = document.querySelectorAll("#book_list .toggle");
    toggleEls.forEach(el => el.removeEventListener('click', toggleEventFn));

    const titleEls = document.querySelectorAll("#book_list [class^='content_title']")
    titleEls.forEach(el => el.id && el.removeEventListener('click', clickCheckboxEvent));
}



function clickCheckboxEvent (e) {

    const bookId = e.target.offsetParent.id; // use nearest positionned parent ? (because of position: relative ?)
    
    const checkbox = e.target.querySelector("input[type='checkbox']");
    checkbox.checked = !checkbox.checked; // toggle checkbox

    const book = getProgress(bookId);

    if(checkbox.checked) {
        e.target.classList.add('checked');

        // add selected section into progress list (at the end)
        if(e.target.parentNode.id && ! book.progress.includes(e.target.parentNode.id)) book.progress.push(e.target.parentNode.id) // add to completed ids (eg. 1.1.1, ...)

    } else {
        e.target.classList.remove('checked');

        // remove unselected section from progress list
        if(book.progress.includes(e.target.parentNode.id)) book.progress = book.progress.filter(id => id !== e.target.parentNode.id); // remove
    }

    // save new progress to localStorage
    book.last_updated_at = Date.now();
    console.log(book.id, ", progress changed !");
    setProgress(bookId, book);

    //
    // update UI
    //
    updateProgressBar(book);
    updateOverallProgress();
}


/**
 * on +/- click to expand/shrink books
 */
const toggleEventFn = function(e) {
    const parentEl = e.target.offsetParent.parentNode.parentNode.parentNode;
    const bookId = parentEl.id;

    const currentVisibility = getVisibility(bookId);
    const newVisibility = setVisibility(bookId, !currentVisibility);

    //console.log("clicked on", bookId, "currently:", currentVisibility, "->", newVisibility);

    if(newVisibility) {
        parentEl.querySelector('.level').classList.remove('toggled'); // opened
        parentEl.querySelector(".toggle").innerText = '➖';
        //
        // toggle/close all the others if open !
        //
        const test = visibleBooks
            .filter(book => book.id !== bookId && getVisibility(book.id)) // only on the others if open
            .forEach(book => {
                setVisibility(book.id, false);
                const el = document.querySelector("#" + book.id + " > .level");
                el.classList.add('toggled'); // close them
                el.parentNode.querySelector(".toggle").innerText = '➕';
            });
    } else {
        parentEl.querySelector('.level').classList.add('toggled'); // closed
        parentEl.querySelector(".toggle").innerText = '➕';
    }

    updateArrows();
}

/**
 * Events
 */
function addEvents() {

    window.addEventListener("resize", (event) => updateArrows());
    window.addEventListener("scroll", (event) => updateArrows());

    //
    // handle toggle book view : list vs progress_only
    //
    const toggleEls = document.querySelectorAll("#book_list .toggle");
    toggleEls.forEach(el => el.addEventListener('click', toggleEventFn));

    const titleEls = document.querySelectorAll("#book_list [class^='content_title']")
    // for each book section/title ? -> tick a checkbox ! 
    titleEls.forEach(el => el.id && el.addEventListener('click', clickCheckboxEvent));

    // remove ?
    searchEl.removeEventListener('keyup', searchKeyUp);
    searchEl.removeEventListener('search', searchKeyUp);
    // add !
    searchEl.addEventListener('keyup', searchKeyUp);
    searchEl.addEventListener('search', searchKeyUp);
}

/**
 * CLEAN UP this method !
 */
function searchKeyUp(e) {
    search(e.target.value);
}

function search(text) {
    // filter all the books objects (remove unnecessary leaf + if not leaf && not necessary -> remove !)

    const searchStr = text;
    let copy;

    if(!searchStr) {
        visibleBooks = getBookList(); // reset to all books
        visibleBooks.forEach(book => {
            setVisibility(book.id, false);

            const el = document.querySelector("#" + book.id + " > .level");
            el.classList.add('toggled'); // close them
            el.innerText = '➕';
        });
    } else {

        console.log("searching for", searchStr);

        copy = structuredClone(getBookList());

        const showDebug = '4.4x'
        function pruneRecursive(book, content, depth) {
            
            if(book.title.startsWith(showDebug)) {
                console.log("pruning content:", content, "at depth:", depth)
            }

            // search & prune list recursively
            const flattenedContent = content.map(entry => entry.content /* deeper level exists */ ?
                pruneRecursive(entry, entry.content, depth + 1) // todo ? may not pass the test, but its children, yes!..
                : entry
            ).filter(entry => entry); // remove nulls (from pruning)

            if(book.title.startsWith(showDebug)) {
                console.log(flattenedContent, depth)
            }

            // list of found matchings
            const filteredContent = flattenedContent.filter(entry => {
                const containsSearch = (
                    entry.title.toLowerCase().includes(searchStr.toLowerCase()) ||
                    entry.search_context?.toLowerCase().includes(searchStr.toLowerCase()) ||
                    entry.tooltip?.toLowerCase().includes(searchStr.toLowerCase())
                );
                return containsSearch
                    /* a child (or grand-child, ...) has it ? */
                    || flattenedContent.some(entry => {

                        if(book.title.startsWith(showDebug)) {
                            console.log("?", entry);
                        }
                        return entry.content?.length > 0;
                    });
            });

            if(book.title.startsWith(showDebug)) {
                console.log(filteredContent, depth)
            }

            const returnedContent = filteredContent.length === 0 // nothing in child
            /*&& ! (
                book.title.toLowerCase().includes(searchStr.toLowerCase())
                || book.search_context?.toLowerCase().includes(searchStr.toLowerCase())
            )*/ ? // and not in this current level's title
                null : // nothing found, this "node" will be removed, also its children as they don't have any values in them..
                { ...book, content: filteredContent };
            if(book.title.startsWith(showDebug)) {
                console.warn(returnedContent, depth);
            }
            return returnedContent;
        }

        copy.forEach(book => {
            // filtered content
            book.content = book.content.map(entry => pruneRecursive(entry, entry.content, 0)).filter(entry => entry); // remove nulls
        });
        //console.warn("filtered books copy =", copy);
    }



    removeEvents();
    // erase all .....
    bookListEl.innerHTML = '';

    visibleBooks = searchStr ? copy : getBookList();
    redraw(visibleBooks);

    visibleBooks.forEach(book => {
        if(searchStr) {
            setVisibility(book.id, true);
            setBookVisibility(book.id, book.content.length > 0);
        }
    })

    updateArrows()
}

let visibleBooks = [];


function updateArrows()
{
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    setUpCanvas(ctx, canvas.width, canvas.height, 'white');

    const pointSize = 5, color = "#467799";

    arrowsList.forEach(([from, to, style]) => {

        const fromEl = document.getElementById(from);
        const toEl = document.getElementById(to);

        //console.warn(`(${from}->${to}) >`, fromEl.style.display, toEl.style.display)
        if(fromEl.style.display == 'none' || toEl.style.display == 'none') return; // skip this one !

        const fromBBox = fromEl.getBoundingClientRect();
        const pt1 = [
            fromBBox.left + canvas.offsetLeft,
            (fromBBox.bottom - fromBBox.top) / 2 + fromBBox.top - 12.5 - pointSize/2 + window.pageXOffset
        ];

        const toBBox = toEl.getBoundingClientRect();
        const pt2 = [
            toBBox.left + canvas.offsetLeft,
            (toBBox.bottom - toBBox.top) / 2 + toBBox.top - 15 /*??*/ + window.pageXOffset
        ];
        drawPointAt(ctx, pt1[0], pt1[1], 5, color); // starting point only (end = arrow)
        
        const arrows = [
            [pt1[0], pt1[1], pt1[0]-randInt(80, 100), pt1[1]],
            [pt2[0], pt2[1], pt2[0]-randInt(80, 100), pt2[1]]
        ];
        const curvePoints = computeBézierCurve(ctx, [pt1, pt2], arrows, 1/25);

        // draw curve
        const nbCurvePoints = curvePoints.length;
        curvePoints.forEach((point, i) => {
            if(i + 1 === nbCurvePoints) return; // last point
            drawLine(ctx, point[0], point[1], curvePoints[i+1][0], curvePoints[i+1][1], 2, color);
        });
        
        // final end : arrow
        drawArrow(ctx, curvePoints[nbCurvePoints-2][0], curvePoints[nbCurvePoints-2][1], curvePoints[nbCurvePoints-1][0], curvePoints[nbCurvePoints-1][1], color, 2 /*width*/, /*head_len*/ 10);

    });
}


function countIds(content) {
    // current level ids
    let count = content.map(c => c.id ? 1 : 0).reduce((acc, value) => acc += value, 0);
    // + recursive call on children
    return count + content.map(c => c.content?.length ? countIds(c.content) : 0).reduce((acc, value) => acc += value, 0);
}

// TODO
// compute "true" progression using pages
//      by getting the "next" element (even if it is an other chapter !) then (next_start_page - start_page)
// sum everything and divide by the total pages of the book (easy)
function updateProgressBar(book) {

    //console.log(">", book.id, getBookList().map(o => o.id));
    const bookItem = getBookList().find(b => b.id == book.id);
    //console.log(bookItem)
    if(bookItem) {
        let count = countIds(bookItem.content);
        let perc = (count ? (book.progress?.length ?? 0) / count : 0) * 100;
        const value = Math.round(perc);

        document.querySelector("#"+bookItem.id+" .progress").style.width = value + '%';
        document.querySelector("#"+bookItem.id+" .progress-value").innerText = `${value} %`;
    } else {
        console.error("What ?!", book, "not found")
    }
}


function overallAverage(onlyIfStarted=true) {
    let sum = 0,
        cnt = 0;

    getBookList().forEach(bookItem => {
        const book = getProgress(bookItem.id);
        if (book.progress?.length || !onlyIfStarted) {
            let count = countIds(bookItem.content);
            let perc = (count ? (book.progress?.length ?? 0) / count : 0) * 100;

            cnt++;
            sum += perc;
        }
    });

    return cnt ? sum / cnt : 0;
}


/**
 * called: in main & when searching for text
 */
function redraw(books) {
    // update initial progress (if present in localStorage ?!)
    const bookProgress = JSON.parse(localStorage.getItem('book_progress') ?? '[]');
        
    // get html structure
    const orderedBooks = books
        .sort((a, b) => {
            const bookA = getProgress(a.id);
            const bookB = getProgress(b.id);
            //console.log(bookA.id, bookB.id, bookA.last_updated_at, bookB.last_updated_at)
            return (bookA.last_updated_at??0) < (bookB.last_updated_at??0) ? 1 : -1
        });
    //console.error(orderedBooks)
    const booksHtml = orderedBooks.map(book => createHtml(book))
    // add it to the DOM
    booksHtml.forEach(html => bookListEl.innerHTML += html);

    // UI: on clicks, ...
    addEvents();
    
    bookProgress.forEach(b => {
        console.log("b:", b)
        if(b) {
            const book = getProgress(b.id);
            updateProgressBar(book);
        }
    });

    updateArrows(); // to keep them at their position

    searchEl.focus();

    updateOverallProgress();
}

function updateOverallProgress() {
    document.getElementById('score').innerHTML = `<u>Current progression : <b><i>${round(overallAverage(), 2)}%</i></b></u>`;
}

const bookList = await getBookListFromFirebase();
main();
