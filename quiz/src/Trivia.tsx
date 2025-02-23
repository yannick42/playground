import { useState } from 'react'
import './Trivia.css';

const triviaQuestions = {
    'History': [
        {
            question: "Which ancient civilization built the city of Petra, carved into rose-colored rock?",
            options: ["Nabataeans", "Romans", "Greeks", "Persians"],
            correct: 0
        },
        {
            question: "What was the capital of the Inca Empire?",
            options: ["Machu Picchu", "Lima", "Cusco", "Quito"],
            correct: 2
        },
        {
            question: "Which country was formerly known as Ceylon?",
            options: ["Myanmar", "Cambodia", "Bangladesh", "Sri Lanka"],
            correct: 3
        },
        {
            question: "The Great Northern War (1700-1721) was primarily fought between which two powers?",
            options: ["Britain vs France", "Sweden vs Russia", "Poland vs Prussia", "Denmark vs Norway"],
            correct: 1
        },
        {
            question: "Which strait separates Asia from North America?",
            options: ["Bering Strait", "Strait of Malacca", "Strait of Gibraltar", "Strait of Hormuz"],
            correct: 0
        },
        {
            question: "Who was the first European explorer to reach India by sea?",
            options: ["Christopher Columbus", "Ferdinand Magellan", "Vasco da Gama", "Marco Polo"],
            correct: 2
        },
        {
            question: "The ancient city of Timbuktu is located in which modern country?",
            options: ["Nigeria", "Mali", "Chad", "Sudan"],
            correct: 1
        },
        {
            question: "Which empire was ruled by Suleiman the Magnificent in the 16th century?",
            options: ["Mongol Empire", "Persian Empire", "Ottoman Empire", "Byzantine Empire"],
            correct: 2
        },
        {
            question: "What is the world's oldest known living tree species?",
            options: ["Sequoia", "Ginkgo Biloba", "Giant Redwood", "Bristlecone Pine"],
            correct: 1
        },
        {
            question: "The Khmer Rouge regime ruled which Southeast Asian country in the 1970s?",
            options: ["Vietnam", "Laos", "Thailand", "Cambodia"],
            correct: 3
        },
        {
            question: "Which ancient wonder of the world was located in Alexandria, Egypt?",
            options: ["The Colossus of Rhodes", "The Lighthouse", "The Hanging Gardens", "The Great Pyramid"],
            correct: 1
        },
        {
            question: "What was the first capital of Japan?",
            options: ["Kyoto", "Tokyo", "Nara", "Osaka"],
            correct: 2
        },
        {
            question: "Which civilization is credited with inventing the concept of zero?",
            options: ["Mayans", "Greeks", "Indians", "Chinese"],
            correct: 2
        },
        {
            question: "The Great Schism of 1054 divided which religion?",
            options: ["Buddhism", "Islam", "Christianity", "Hinduism"],
            correct: 2
        },
        {
            question: "Which ancient trade route connected China with Europe and Africa?",
            options: ["Spice Route", "Silk Road", "Tea Trail", "Amber Road"],
            correct: 1
        }
    ],
    'Geography': [
        {
            question: "What is the longest river in the world?",
            options: ["Amazon River", "Nile River", "Yangtze River", "Mississippi River"],
            correct: 1
        },
        {
            question: "Which continent has the most countries?",
            options: ["Asia", "Europe", "Africa", "South America"],
            correct: 2
        },
        {
            question: "What is the capital of Canada?",
            options: ["Toronto", "Ottawa", "Vancouver", "Montreal"],
            correct: 1
        },
        {
            question: "Which ocean is the largest by surface area?",
            options: ["Atlantic Ocean", "Indian Ocean", "Pacific Ocean", "Arctic Ocean"],
            correct: 2
        },
        {
            question: "Which country has the highest population?",
            options: ["India", "United States", "China", "Brazil"],
            correct: 2
        },
        {
            question: "What is the term for a narrow strip of land connecting two larger landmasses?",
            options: ["Peninsula", "Isthmus", "Archipelago", "Plateau"],
            correct: 1
        },
        {
            question: "Which of these is a landlocked country?",
            options: ["Argentina", "Germany", "Thailand", "South Korea"],
            correct: 1
        },
        {
            question: "Mount Everest is part of which mountain range?",
            options: ["Andes", "Rockies", "Alps", "Himalayas"],
            correct: 3
        },
        {
            question: "What is the Earth's largest desert?",
            options: ["Sahara", "Gobi", "Antarctic Desert", "Kalahari"],
            correct: 2
        },
        {
            question: "Which country is known as the Land of the Rising Sun?",
            options: ["China", "Japan", "South Korea", "Vietnam"],
            correct: 1
        }
    ]
}

export function TriviaApp({ deckName = 'History' }) {
    const [message, setMessage] = useState("");

    const [messageColor, setMessageColor] = useState("");
    const [currentQuestion, setCurrentQuestion] = useState(Math.floor(Math.random() * 10));
    const [score, setScore] = useState(0);

    const checkAnswer = (selectedOption) => {
        // Track correct answers
        if (selectedOption === triviaQuestions[deckName][currentQuestion].options[triviaQuestions[deckName][currentQuestion].correct]) {
            setScore(prevScore => prevScore + 1);
        }
        if (selectedOption === triviaQuestions[deckName][currentQuestion].options[triviaQuestions[deckName][currentQuestion].correct]) {
            setMessage("Correct!");
            setMessageColor("#4CAF50"); // Green
            setTimeout(() => {
                setCurrentQuestion(Math.floor(Math.random() * triviaQuestions[deckName].length));
                setMessage("");
                setMessageColor("");
            }, 2000);
        } else {
            setMessage("Sorry, that's incorrect.");
            setMessageColor("#f44336"); // Red
            setTimeout(() => {
                setMessage("");
                setMessageColor("");
            }, 5000);
        }
    };

    const messageStyle = {
        marginBottom: '20px',
        color: messageColor,
        fontSize: '18px',
        fontWeight: 'bold',
        textAlign: 'center',
        minHeight: '27px'
    };

    const questionStyle = {
        fontSize: '24px',
        color: '#2c3e50',
        marginBottom: '20px',
        fontWeight: 'bold'
    };

    return (
        <div id="content">

            <div class="font-bold underline hover:bg-sky-700 hover:text-white text-xl font-medium text-black dark:text-white">Trivia</div>

            <p id="score" class="text-gray-500 dark:text-gray-400">
                Score: {score} / {score + (message === "Sorry, that's incorrect." ? 1 : 0)} 
                &nbsp;({Math.round((score / (score + (message === "Sorry, that's incorrect." ? 1 : 0))) * 100 || 0)}%)
            </p>

            <div style={messageStyle}>{message}</div>

            <div id="question-section" class="question-section">
                <div id="question" style={questionStyle}>
                    {triviaQuestions[deckName][currentQuestion].question}
                </div>
                <div id="options" class="options">
                    {triviaQuestions[deckName][currentQuestion].options.sort(Math.random).map((option, index) => (
                        <div 
                            key={index} class="option-style" 
                            onClick={() => checkAnswer(triviaQuestions[deckName][currentQuestion].options[index])}
                            onMouseEnter={(e) => {
                                e.target.style.backgroundColor = '#3498db';
                                e.target.style.color = 'white';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.backgroundColor = 'white';
                                e.target.style.color = '#34495e';
                            }}
                        >
                            {option}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
