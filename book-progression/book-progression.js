
import { setUpCanvas, drawPointAt, drawArrow, drawLine } from '../common/canvas.helper.js';
import { randInt } from '../common/common.helper.js';

// hard-coded books
import { SICP } from './SICP.js';

const bookListEl = document.getElementById("book_list");


function main() {
    //document.querySelector("#refresh").addEventListener('click', (e) => redraw());
    redraw();
}


/**
 * TODO: get it from localStorage too ! (or backend ?!)
 */
function getBookList() {
    return [SICP]
}

function createHtml(book) {
    const html = `
        <div id="${book.id}" class="book">
            <div class="toggle">${getVisibility(book.id) ? '➖' : '➕'}</div>

            <span class="title">${book.title}</span>${book.authors ? ` ${book.authors.join(', ')}` : ''}

            <div class="progress-bar">
                <div class="progress"></div>
                <span class="progress-value"></span>
            </div>

            <div class="level ${getVisibility(book.id) ? '' : 'toggled'}">
                ${createLevel(book, book.content, 0).join('')}
            </div>
        </div>
    `;
    return html;
}

function createLevel(book, content, level) {
    //const content = el.content;

    return content.map(el => {
        const isChecked = el.id ? getProgressForId(book.id, el.id) : false;
        return `
        <div class="content ${el.content ? '' : 'leaf'}">

            <span${el.id ? ' id="'+el.id+'"' : ''} class="content_title_${level}${isChecked ? ' checked' : ''}">
                ${el.content ? '' : `<input type="checkbox" ${isChecked ? ' checked' : ''}/>`} ${el.title}
            </span>
            <span class="start_page">${el.start_page}</span>

            ${el.content ? createLevel(book, el.content, level + 1).join('') : ''}
        </div>
        `
    });
}


function findNextEntry(book, id) {
    book.content.forEach(content => {



    });

    return nextEntry;
}

function getProgress(bookId) {
    const bookProgress = _getLocalStorageObj('book_progress');
    return bookProgress.find(b => b.id === bookId) ?? {id: bookId, progress: []} ;
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
    const booksProgress = _getLocalStorageObj('book_progress');
    // get and keep unchanged books
    const newObject = booksProgress.filter(prog => prog.id !== bookId);
    // modify current book
    const currentBook = booksProgress.find(prog => prog.id === bookId);
    currentBook['visibility'] = value;
    // save it
    newObject.push(currentBook);
    localStorage.setItem('book_progress', JSON.stringify(newObject)); // in LocalStorage
    return value;
}

function getVisibility(bookId) {
    const booksProgress = _getLocalStorageObj('book_progress');
    return booksProgress.find(prog => prog.id === bookId)?.visibility ?? true;
}

function addEvents() {

    //
    // handle toggle book view : list vs progress_only
    //
    const toggleEls = document.querySelectorAll("#book_list .toggle");
    toggleEls.forEach(el => {
        el.addEventListener('click', (e) => {
            const bookId = e.target.offsetParent.id;
            const currentVisibility = getVisibility(bookId);

            const newVisibility = setVisibility(bookId, !currentVisibility);

            if(newVisibility) {
                e.target.offsetParent.querySelector('.level').classList.remove('toggled');
                e.target.innerText = '➖';
            } else {
                e.target.offsetParent.querySelector('.level').classList.add('toggled');
                e.target.innerText = '➕';
            }
        });
    });



    const titleEls = document.querySelectorAll("#book_list [class^='content_title']")
    // for each book section/title ? -> tick a checkbox ! 
    titleEls.forEach(el => {
        if(el.id) {
            el.addEventListener('click', (e) => {

                const bookId = e.target.offsetParent.id; // use nearest positionned parent ? (because of position: relative ?)
                console.log(e.target.innerText, "clicked")

                const checkbox = e.target.querySelector("input[type='checkbox']");
                checkbox.checked = !checkbox.checked; // toggle

                const book = getProgress(bookId);
                if(checkbox.checked) {
                    e.target.classList.add('checked');

                    if(! book.progress.includes(e.target.id)) book.progress.push(e.target.id) // add

                } else {
                    e.target.classList.remove('checked');

                    if(book.progress.includes(e.target.id)) book.progress = book.progress.filter(id => id !== e.target.id); // remove
                }
                // save new progress to localStorage
                setProgress(bookId, book);

                updateProgressBar(book)
            })
        }
    })
}

// TODO
// compute "true" progression using pages
//      by getting the "next" element (even if it is an other chapter !) then (next_start_page - start_page)
// sum everything and divide by the total pages of the book (easy)
function updateProgressBar(book) {

    function countIds(content) {
        // add current level ids
        count += content.map(c => c.id ? 1 : 0).reduce((acc, value) => acc += value, 0);
        // recursive call on children
        content.forEach(c => c.content?.length && countIds(c.content));
    }
    
    let count = 0;

    const bookItem = getBookList().find(b => b.id == book.id);
    countIds(bookItem.content);

    const value = Math.round(book.progress?.length / count * 100);
    console.log("value:", value);
    document.querySelector("#"+bookItem.id+" .progress").style.width = value + '%';
    document.querySelector("#"+bookItem.id+" .progress-value").innerText = `${value}%`;
}

function redraw() {
    // get all books
    const books = getBookList();
    // get html structure
    const booksHtml = books.map(book => createHtml(book))
    // add it to the DOM
    booksHtml.forEach(html => bookListEl.innerHTML += html);

    // UI: on clicks, ...
    addEvents();

    // update initial progress
    const bookProgress = JSON.parse(localStorage.getItem('book_progress') ?? '[]');
    bookProgress.forEach(b => {
        const book = getProgress(b.id);
        updateProgressBar(book)
    });
}

main();
