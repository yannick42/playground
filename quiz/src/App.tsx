import { useState } from 'react'
//import reactLogo from './assets/react.svg'
import './App.css'

import { TriviaApp } from './Trivia';
import { MyMenu } from './MyMenu';

function App() {

  const [deck, setDeck] = useState("Geography");

  const handleDeckName = (deckName) => {
    setDeck(deckName);
  };

  return (
    <>
      <MyMenu sendName={handleDeckName} />
      <div class="mx-auto flex max-w-lg items-center gap-x-4 rounded-xl
                  bg-white p-6 shadow-lg outline outline-black/5 dark:bg-slate-800
                  dark:shadow-none dark:-outline-offset-1 dark:outline-white/10">
        <TriviaApp deckName={deck} />
      </div>
    </>
  )
}

export default App
