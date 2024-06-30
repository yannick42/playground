
import { setUpCanvas, drawPointAt, drawArrow, drawLine } from '../common/canvas.helper.js';
import { randInt } from '../common/common.helper.js';

const bookListEl = document.getElementById("book_list");

function main() {
    //document.querySelector("#refresh").addEventListener('click', (e) => redraw());

    redraw();
}


/**
 * TODO: get it from localStorage !
 */
function getBookList() {
    return [{
        title: 'Structure and Interpretation of Computer Programs, 2nd ed. (1996)',
        nb_pages: 855,
        id: 'SICP',
        content: [{
            title: '1 - Building Abstractions with Procedures',
            start_page: 1,
            content: [{
                title: '1.1 - The Elements of Programming',
                start_page: 6,
                content: [{
                    id: '1.1.1',
                    title: '1.1.1 - Expressions',
                    start_page: 7
                },{
                    id: '1.1.2',
                    title: '1.1.2 - Naming and the Environment',
                    start_page: 10
                },{
                    id: '1.1.3',
                    title: '1.1.3 - Evaluating Combinations',
                    start_page: 12
                },{
                    id: '1.1.4',
                    title: '1.1.4 - Compound Procedures',
                    start_page: 15
                },{
                    id: '1.1.5',
                    title: '1.1.5 - The Substitution Model for Procedure Application',
                    start_page: 18
                },{
                    id: '1.1.6',
                    title: '1.1.6 - Conditional Expressions and Predicates',
                    start_page: 22
                },{
                    id: '1.1.7',
                    title: '1.1.7 - Example: Square Roots by Newton\'s Method',
                    start_page: 28
                },{
                    id: '1.1.8',
                    title: '1.1.8 - Procedures as Black-Box Abstractions',
                    start_page: 33
                }]
            },{
                title: '1.2 - Procedures and the Processes They Generate',
                start_page: 40,
                content: [{
                    id: '1.2.1',
                    title: '1.2.1 - Linear Recursion and Iteration',
                    start_page: 41
                },{
                    id: '1.2.2',
                    title: '1.2.2 - Tree recursion',
                    start_page: 47
                },{
                    id: '1.2.3',
                    title: '1.2.3 - Orders of Growth',
                    start_page: 54
                },{
                    id: '1.2.4',
                    title: '1.2.4 - Exponentiation',
                    start_page: 57
                },{
                    id: '1.2.5',
                    title: '1.2.5 - Greatest Common Divisors',
                    start_page: 62
                },{
                    id: '1.2.6',
                    title: '1.2.6 - Example: Testing for Primality',
                    start_page: 65
                }]
            },{
                title: '1.3 - Formulating Abstractions with Higher-Order Procedures',
                start_page: 74,
                content: [{
                    id: '1.3.1',
                    title: '1.3.1 - Procedures as Arguments',
                    start_page: 76
                },{
                    id: '1.3.2',
                    title: '1.3.2 - Constructing Procedures using lambda',
                    start_page: 83
                },{
                    id: '1.3.3',
                    title: '1.3.3 - Procedures as General Methods',
                    start_page: 89
                },{
                    id: '1.3.4',
                    title: '1.3.4 - Procedures as Returned Values',
                    start_page: 97
                }]
            }]
        },{
            title: '2 - Building Abstractions with Data',
            start_page: 107,
            content: [{
                title: '2.1 - Introduction to Data Abstraction',
                start_page: 112,
                content: [{
                    id: '2.1.1',
                    title: '2.1.1 - Example: Arithmetic Operations for Rational Numbers',
                    start_page: 113
                },{
                    id: '2.1.2',
                    title: '2.1.2 - Abstraction Barriers',
                    start_page: 118
                },{
                    id: '2.1.3',
                    title: '2.1.3 - What is Meant by Data?',
                    start_page: 122
                },{
                    id: '2.1.4',
                    title: '2.1.4 - Extended Exercice: Interval Arithmetic',
                    start_page: 126
                }]
            },{
                title: '2.2 - Hierarchical Data and the Closure Property',
                start_page: 132,
                content: [{
                    id: '2.2.1',
                    title: '2.2.1 - Representing Sequences',
                    start_page: 134
                },{
                    id: '2.2.2',
                    title: '2.2.2 - Hierarchical Structures',
                    start_page: 147
                },{
                    id: '2.2.3',
                    title: '2.2.3 - Sequences as Conventional Interfaces',
                    start_page: 154
                },{
                    id: '2.2.4',
                    title: '2.2.4 - Example: A Picture Language',
                    start_page: 172
                }]
            },{
                title: '2.3 - Symbolic Data',
                start_page: 192,
                content: [{
                    id: '2.3.1',
                    title: '2.3.1 - Quotation',
                    start_page: 192
                },{
                    id: '2.3.2',
                    title: '2.3.2 - Example: Symbolic Differentiation',
                    start_page: 197
                },{
                    id: '2.3.3',
                    title: '2.3.3 - Example: Representing Sets',
                    start_page: 205
                },{
                    id: '2.3.4',
                    title: '2.3.4 - Example: Huffman Encoding Trees',
                    start_page: 218
                }]
            },{
                title: '2.4 - Multiple Representation for Abstract Data',
                start_page: 229,
                content: [{
                    id: '2.4.1',
                    title: '2.4.1 - Representations for Complex Numbers',
                    start_page: 232
                },{
                    id: '2.4.2',
                    title: '2.4.2 - Tagged data',
                    start_page: 237
                },{
                    id: '2.4.3',
                    title: '2.4.3 - Data-Directed Progamming and Additivity',
                    start_page: 242
                }]
            },{
                title: '2.5 - Systems with Generic Operations',
                start_page: 254,
                content: [{
                    id: '2.5.1',
                    title: '2.5.1 - Generic Arithmetic Operations',
                    start_page: 255
                },{
                    id: '2.5.2',
                    title: '2.5.2 - Combining Data of Different Types',
                    start_page: 262
                },{
                    id: '2.5.3',
                    title: '2.5.3 - Example: Symbolic Algebra',
                    start_page: 274
                }]
            }]
        }]
    }]
}

function createHtml(book) {
    const html = `
        <div id="${book.id}" class="book">
            <span class="title">${book.title}</span>${book.authors ? ` ${book.authors.join(', ')}` : ''}

            <div class="progress-bar">
                <div class="progress"></div>
            </div>

            <div class="level">
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
    const bookProgress = JSON.parse(localStorage.getItem('book_progress') ?? '[]');
    return bookProgress.find(b => b.id === bookId) ?? {id: bookId, progress: []} ;
}

function getProgressForId(bookId, id) {
    //console.log("checking if", id, " from book =", bookId, "is true -> ", getProgress(bookId)?.progress?.includes(id))
    return getProgress(bookId)?.progress?.includes(id);
}

function setProgress(bookId, newValue) {
    const booksProgress = JSON.parse(localStorage.getItem('book_progress') ?? '[]');
    const newProgress = booksProgress.filter(prog => prog.id !== bookId);
    newProgress.push(newValue);
    localStorage.setItem('book_progress', JSON.stringify(newProgress)); // in LocalStorage
}

function addEvents() {

    const els = document.querySelectorAll("#book_list [class^='content_title']")

    els.forEach(el => {
        if(el.id) {
            el.addEventListener('click', (e) => {

                const bookId = 'SICP';

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
                // save new progress
                setProgress(bookId, book);



                // TODO
                // compute progression
                // by getting the "next" element (even if it is an other chapter !) then (next_start_page - start_page)
                // sum everything and divide by the total pages
                updateProgressBar(book)
            })
        }
    })
}

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
}

function redraw() {
    // get all books
    const books = getBookList();
    // get html structure
    const booksHtml = books.map(book => createHtml(book))
    // add it to the DOM
    booksHtml.forEach(html => bookListEl.innerHTML += html);

    // on click
    addEvents();

    // update initial progress
    const bookProgress = JSON.parse(localStorage.getItem('book_progress') ?? '[]');
    bookProgress.forEach(b => {
        const book = getProgress(b.id);
        updateProgressBar(book)
    });
}

main();
