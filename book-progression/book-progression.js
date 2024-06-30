
import { setUpCanvas, drawPointAt, drawArrow, drawLine } from '../common/canvas.helper.js';
import { randInt } from '../common/common.helper.js';
import { computeBézierCurve } from '../common/math.helper.js';

// hard-coded books
import { SICP } from './books/SICP.js';
import { CG } from './books/CG.js';;
import { VG } from './books/VG.js';

/**
 * TODO:
 * 
 * 

- start all closed (if no config. in localStorage)






 */

















const bookListEl = document.getElementById("book_list");
const searchEl = document.querySelector("input[type='search']");
const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");


function main() {
    //document.querySelector("#refresh").addEventListener('click', (e) => redraw());
    redraw(getBookList()); // get all books
}




/**
 * Links
 */
const arrowsList = [
    ['SICP', 'CG', 'solid'],
    ['CG', 'VG', 'dashed']
]

/**
 * TODO: get it from localStorage too ! (or backend ?!)
 */
function getBookList() {
    return [SICP, CG, VG];
}

function createHtml(book) {

    if(! getProgress(book.id)) { // init to hidden
        setVisibility(book.id, false);
    }

    const html = `
        <div id="${book.id}" class="book">
            <div>

                ${book.front_cover ? `<div class="front-cover"><img src="${book.front_cover}" width=46 height=68 /></div>` : ''}
                
                <div style="width: 100%">
                    <div class="toggle">${getVisibility(book.id) ? '➖' : '➕'}</div>
                    ${book.tags?.length ? `<div class="tags">${book.tags?.map(tag => {
                        return `<span class="tag" style="background-color: ${tag.bgColor}; color: ${tag.textColor}">${tag.text}</span>`
                    }).join('')}</div>` : ''}

                    <div class="title">${book.title}</div>${book.authors ? ` ${book.authors.join(', ')}` : ''}

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

            <span${el.id ? ' id="'+el.id+'"' : ''} class="content_title_${level}${isChecked ? ' checked' : ''}">
                ${el.content ? '' : `<input type="checkbox" ${isChecked ? ' checked' : ''}/>`} ${el.title.replace(new RegExp(searchEl.value, 'ig'), (m) => '<mark>' + m + '</mark>')}
            </span>
            <span class="start_page">${el.start_page}</span>

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
    console.log("setVisibility:", bookId, "to", value)
    const booksProgress = _getLocalStorageObj('book_progress');
    // get and keep unchanged books
    const newObject = booksProgress.filter(prog => prog.id !== bookId);
    // modify current book
    let currentBook = booksProgress.find(prog => prog.id === bookId);
    console.log("setVis:", currentBook)
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


function removeEvents() {

    const toggleEls = document.querySelectorAll("#book_list .toggle");
    toggleEls.forEach(el => el.removeEventListener('click', toggleEventFn));

    const titleEls = document.querySelectorAll("#book_list [class^='content_title']")
    titleEls.forEach(el => el.id && el.removeEventListener('click', clickCheckboxEvent));
}

function clickCheckboxEvent (e) {

    console.log("???");
    
    const bookId = e.target.offsetParent.id; // use nearest positionned parent ? (because of position: relative ?)
    
    const checkbox = e.target.querySelector("input[type='checkbox']");
    checkbox.checked = !checkbox.checked; // toggle

    const book = getProgress(bookId);
    if(checkbox.checked) {
        e.target.classList.add('checked');

        if(! book.progress.includes(e.target.id)) book.progress.push(e.target.id) // add to completed ids (eg. 1.1.1, ...)

    } else {
        e.target.classList.remove('checked');

        if(book.progress.includes(e.target.id)) book.progress = book.progress.filter(id => id !== e.target.id); // remove
    }
    // save new progress to localStorage
    setProgress(bookId, book);

    updateProgressBar(book)
}

const toggleEventFn = function(e) {
    const bookId = e.target.offsetParent.id;
    const currentVisibility = getVisibility(bookId);

    const newVisibility = setVisibility(bookId, !currentVisibility);

    if(newVisibility) {
        e.target.offsetParent.querySelector('.level').classList.remove('toggled');
        e.target.innerText = '➖';
        const test = getBookList().filter(book => book.id != bookId).forEach(book => book.visibility && document.querySelector("#"+book.id+" .toggle").click());
    } else {
        e.target.offsetParent.querySelector('.level').classList.add('toggled');
        e.target.innerText = '➕';
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
    searchEl.addEventListener('keyup', searchKeyUp);

}

function searchKeyUp(e) {

    // filter all the books objects (remove unnecessary leaf + if not leaf && not necessary -> remove !)

    const searchStr = e.target.value;
    console.log("searching for", searchStr)

    let copy = structuredClone(getBookList());

    function prune(book, content, depth) {
        //console.log("pruning content:", content, "at depth:", depth)

        //if(content.length) { // is there a deeper level ?
            // search & prune list recursively
            content = content.map(entry => entry.content ?
                    prune(entry, entry.content, depth + 1) // todo ? can be not passing the test but its children yes...
                : { id: entry.id, title: entry.title, start_page: entry.start_page }
            ).filter(entry => entry); // remove nulls
            
            // list of found matchings
            const filteredContent = content.filter(entry => {
                const test = entry.title.toLowerCase().includes(searchStr.toLowerCase());
                //console.log(">", entry.title, "is matching ?", test);
                return test || content.every(entry => entry.content?.length > 0);
            });

            return filteredContent.length === 0 ?
                null : // nothing found, this "node" will be removed, also its children as they don't have any values in them..
                { id: book.id, title: book.title, start_page: book.start_page, content: filteredContent };
        //}

        //return; // never reached ?!
    }

    if(searchStr) {
        copy.forEach(book => {
            const res = book.content.map(entry => prune(entry, entry.content, 0)).filter(entry => entry); // remove nulls
            //console.log(">>> res:", res);
            book.content = res;
        });
        //console.warn("result:", copy);
    }

    removeEvents();
    // erase all .....
    bookListEl.innerHTML = '';

    redraw(searchStr ? copy : getBookList());
}


function updateArrows()
{
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    setUpCanvas(ctx, canvas.width, canvas.height, 'white')

    const pointSize = 5, color = "#467799";

    arrowsList.forEach(([from, to, style]) => {

        const fromBBox = document.getElementById(from).getBoundingClientRect();
        const pt1 = [
            fromBBox.left + canvas.offsetLeft,
            (fromBBox.bottom - fromBBox.top) / 2 + fromBBox.top - 12.5 - pointSize/2 + window.pageXOffset
        ];

        const toBBox = document.getElementById(to).getBoundingClientRect();
        const pt2 = [
            toBBox.left + canvas.offsetLeft,
            (toBBox.bottom - toBBox.top) / 2 + toBBox.top - 15 /*??*/ + window.pageXOffset
        ];
        drawPointAt(ctx, pt1[0], pt1[1], 5, color); // starting point only (end = arrow)
        
        const arrows = [
            [pt1[0], pt1[1], pt1[0]-100, pt1[1]],
            [pt2[0], pt2[1], pt2[0]-100, pt2[1]]
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

    const value = Math.round(count ? (book.progress?.length ?? 0) / count * 100 : 0);

    document.querySelector("#"+bookItem.id+" .progress").style.width = value + '%';
    document.querySelector("#"+bookItem.id+" .progress-value").innerText = `${value} %`;
}



function redraw(books) {

    // get html structure
    const booksHtml = books.map(book => createHtml(book))
    // add it to the DOM
    booksHtml.forEach(html => bookListEl.innerHTML += html);

    // UI: on clicks, ...
    addEvents();

    // update initial progress (if present in localStorage ?!)
    const bookProgress = JSON.parse(localStorage.getItem('book_progress') ?? '[]');
    bookProgress.forEach(b => {
        const book = getProgress(b.id);
        updateProgressBar(book);
    });

    updateArrows(); // to keep them at their position

    searchEl.focus();
}


main();
