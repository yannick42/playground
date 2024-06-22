import { entries } from './entries.js';

let currentHash = '', // current demo selected
    searchText = '';

const searchInputEl = document.querySelector("#search");

window.onload = function() {
    updateFilteredEntries(entries); // load initial list (everything !)

    document.querySelector("#numberOfPages").innerText = entries.length;

    // handle the initial hash if needed (to click on the wanted tool)
    onHashChange();
    console.log("initial hash:", currentHash);

    searchInputEl.focus(); // ready to search something !

    if (window.location.search) {
        const searchParam = new URLSearchParams(window.location.search.substring(1));
        const initialSearch = searchParam.get('search');
        if (initialSearch) {
            searchInputEl.value = initialSearch;
            search(initialSearch);

            const visibles = visibleEntries(entries);
            if(visibles.length === 1) { // if only 1 visible -> run it
                //goTo(visibles[0].id);
                const aLink = document.querySelector('#' + visibles[0].id);
                aLink?.click();

                //window.location.search = ''; // it reload the page

                const url = new URL(window.location)
                url.searchParams.delete("search");
                history.pushState(null, null, url); // '#' + visibles[0].id
            }
        }
    }
}

function onHashChange() {
    //console.log("hash changed to", window.location.hash);
    if(window.location.hash) { // changed to this
        const aLink = document.querySelector(window.location.hash);
        aLink?.click(); // click on demo
        //document.querySelector("iframe").focus();
        changeSelected(currentHash, window.location.hash);
        //currentHash = window.location.hash;
    }
}

window.addEventListener('hashchange', onHashChange, false);

searchInputEl.addEventListener('input', (e) => {
    search(e.target.value);
});

function search(text) {
    searchText = text;
    updateFilteredEntries(entries, searchText);
}

searchInputEl.addEventListener('keyup', (e) => {
    if(e.code === 'Enter') {
        const visibles = visibleEntries(entries);
        if(visibles.length === 1) { // if only 1 visible -> run it
            //goTo(visibles[0].id);
            const aLink = document.querySelector('#' + visibles[0].id);
            aLink?.click();
        }
    }
});

const menu = document.querySelector("#menu");
menu.addEventListener('click', (e) => {
    //console.log("e:", e);
    //console.log("clicked on ", e.target.id, e.target.tagName)

    if(e.target.tagName === 'A' && e.target.id) {
        console.log("clicked on a demo :", e.target.id, e);
       goTo(e.target.id);
    }
});

function goTo(id) {
    console.log("goto :", id);

    //const aLink = document.querySelector("#" + id);
    //aLink?.click(); // click on demo

    history.pushState(null, null, '#' + id); // ???

    // from, to
    changeSelected(currentHash, '#' + id); // change color to see which tool is selected

    // change to new id
    currentHash = '#' + id;
    console.log("new currentHash =", currentHash);
}

function changeSelected(fromHash, toHash) {
    //console.log("from", fromHash, "to", toHash);
    if(fromHash) {
        const from = document.querySelector(fromHash);
        if(from) {
            from.parentNode.classList.remove('highlighted-demo');
        }
    }
    if(toHash) {
        const to = document.querySelector(toHash);
        if(to) {
            to.parentNode.classList.add('highlighted-demo');
            to.parentNode.scrollIntoView(false);
        }
    }
}

function addMenuEntry(entry) {
    const chips = entry.chips?.map(chip => `<span class="chip ${chip.type}">${chip.text}</span>`);

    if(entry.id === currentHash.substring(1)) {
        console.log("matching :", entry.id)
        if(Array.isArray(entry.classes)) {
            entry.classes.push('highlighted-demo');
        } else {
            entry.classes = ['highlighted-demo'];
        }
    } else {
        if(Array.isArray(entry.classes)) {
            entry.classes = entry.classes.filter(c => c !== 'highlighted-demo');
        }
    }

    const html = `<span${entry.classes ? ' class="' + entry.classes.join(' ') + '"' : ''}>
        <a id="${entry.id}" href="${entry.href}" target="iframe">${entry.name}</a> ${chips?.join(' ') ?? ''}<br/>
        <span class="desc">${entry.desc}</span>
    </span>`;

    const container = document.createElement('container');
    container.innerHTML = html;
    document.querySelector("#menu-entries").appendChild(container.firstChild);
}

function updateFilteredEntries(entries, searchText = '') {
    document.querySelector("#menu-entries").innerHTML = ''; // clear !!
    entries.filter(entry => {
        return entry.name.toLowerCase().includes(searchText.toLowerCase()) ||
            entry.desc.toLowerCase().includes(searchText.toLowerCase());
    }).forEach(entry => addMenuEntry(entry));
}

function visibleEntries(entries) {
    return entries.filter(entry => {
        return entry.name.toLowerCase().includes(searchText.toLowerCase()) ||
            entry.desc.toLowerCase().includes(searchText.toLowerCase());
    });
}
