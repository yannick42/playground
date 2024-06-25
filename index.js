import { entries } from './entries.js';

let currentHash = '', // current demo selected
    searchText = '';

const searchInputEl = document.querySelector("#search");
const toggleMenuEl = document.querySelector("#toggle-menu");
const menu = document.querySelector("#menu");
const menuEntriesEl = document.querySelector("#menu-entries");

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


                closeMenu();
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

            closeMenu();
        }
    }
});

let isClosedMenu = false;

function closeMenu() {
    console.log("close menu")
    const root = document.querySelector(':root');
    root.style.setProperty('--menu-width', '25px');
    searchInputEl.style.display = 'none';
    menuEntriesEl.style.display = 'none';
    isClosedMenu = true;
    toggleMenuEl.innerText = '⏻';
}

function openMenu() {
    console.log("open menu")
    const root = document.querySelector(':root');
    root.style.setProperty('--menu-width', ''); // revert to 20% (css)
    searchInputEl.style.display = 'inline-block';
    menuEntriesEl.style.display = 'flex';
    isClosedMenu = false;
    searchInputEl.focus(); // ready to search something !
    toggleMenuEl.innerText = '⏼';
}


toggleMenuEl.addEventListener('click', (e) => isClosedMenu ? openMenu() : closeMenu());


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
            to.parentNode.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    }
}

function addMenuEntry(entry, highlightedText = '') {
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

    const name = highlightedText ? entry.name.replace(new RegExp(highlightedText, 'ig'), (m) => '<mark>' + m + '</mark>') : entry.name;
    const desc = highlightedText ? entry.desc.replace(new RegExp(highlightedText, 'ig'), (m) => '<mark>' + m + '</mark>') : entry.desc;

    const html = `<span${entry.classes ? ' class="' + entry.classes.join(' ') + '"' : ''}>
        <a id="${entry.id}" href="${entry.href}" target="iframe">${name}</a> ${chips?.join(' ') ?? ''}<br/>
        <span class="desc">${desc}</span>
    </span>`;

    const container = document.createElement('container');
    container.innerHTML = html;
    menuEntriesEl.appendChild(container.firstChild);
}

function updateFilteredEntries(entries, searchText = '') {
    document.querySelector("#menu-entries").innerHTML = ''; // clear !!
    entries.filter(entry => {
        return entry.name.toLowerCase().includes(searchText.toLowerCase()) ||
            entry.desc.toLowerCase().includes(searchText.toLowerCase()) ||
            entry.id.toLowerCase().includes(searchText.toLowerCase()) ||
            entry.searchContext?.toLowerCase().includes(searchText.toLowerCase());
    }).forEach(entry => addMenuEntry(entry, searchText));
}

function visibleEntries(entries) {
    return entries.filter(entry => {
        return entry.name.toLowerCase().includes(searchText.toLowerCase()) ||
            entry.desc.toLowerCase().includes(searchText.toLowerCase()) ||
            entry.id.toLowerCase().includes(searchText.toLowerCase()) ||
            entry.searchContext?.toLowerCase().includes(searchText.toLowerCase());
    });
}
