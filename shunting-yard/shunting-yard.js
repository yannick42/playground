
import { setUpCanvas, drawPointAt, drawArrow, drawLine } from '../common/canvas.helper.js';
import { randInt } from '../common/common.helper.js';

const expression = document.getElementById('expression');

function main() {
    document.querySelector("#evalBtn").addEventListener('click', (e) => evaluate(expression.value));
    document.getElementById("expression").addEventListener(
        'keypress',
        (e) => e.keyCode == 13 && evaluate(e.target.value)
    );

    evaluate(expression.value);
}

const precedences = {
    '(': Math.inf,
    ')': Math.inf,
    '^': 4,     // uses right associativity, so that 2^(3^2) is 512, not (2^3)^2=64 
    '**': 4,    // //
    '*': 3,
    '/': 3,
    '+': 2,
    '-': 2,
}

function evaluate(expression) {
    console.log("expression to evaluate :", expression);

    const resultingRPN = [],
        operatorStack = [],
        operators = Object.keys(precedences);

    //console.log("operators:", operators)

    // split into tokens
    let tokens = [expression];
    operators.forEach(op => {
        console.log(tokens)
        tokens = tokens.flatMap(tok => {
            if (operators.includes(tok)) return tok;    // if single operator
            if (! tok.includes(op)) return tok;         // or that token doesn't include this operator

            const split = tok.split(op); // TODO: if binary only ?
            console.warn(tok, "split into", split, "by", op);
            const res = split.flatMap(value => [value, op]);
            res.pop();
            return res;
        })
    });
    tokens = tokens.filter(t => t); // remove empty (eg. if parenthesis ?)

    console.log("tokens:", tokens);

    // for each token
    tokens.forEach((token, index) => {
        const isOperator = operators.includes(token) || token == '(' || token == ')';

        // if number -> send to "resulting" array
        if (! isOperator) {
            resultingRPN.push(token);
        } else if (token === '(') {
            operatorStack.push(token);
        } else if (token === ')') {
            let op;
            while ((op = operatorStack.pop()) && op !== '(') {
                resultingRPN.push(op);
            }
        } else {
            // if its precedence > than "last one"
            if (operatorStack.length > 0
                && !(operatorStack.length
                    && precedences[operatorStack.at(-1)] < precedences[token]))
            {
                while (
                    operatorStack.length
                    && precedences[operatorStack.at(-1)] >= precedences[token]
                    // right associativity of powers -> 
                    && !((token == '^' || token == '**')
                        && precedences[operatorStack.at(-1)] == precedences[token])
                )
                {
                    // send top of the stack to the "resulting" (reversed polish notation)
                    const op = operatorStack.pop();
                    resultingRPN.push(op);
                }
            }
            // add this op to the stack
            operatorStack.push(token);
        }
    });
    // clean the opstack
    while(operatorStack.length) {
        resultingRPN.push(operatorStack.pop());
    }

    console.log("RPN:", resultingRPN);
    document.getElementById("reversed_polish_notation").innerHTML = '<i>reversed Polish notation : </i> ' + resultingRPN.join(' ');

    //
    // Evaluate result
    //
    let result = null;
    for(let i = 2; i < resultingRPN.length; i++) {
        const currToken = resultingRPN[i]; // if operator -> calculate, else: skip

        if (operators.includes(currToken))
        {
            // last 2 operands
            const prevPrevToken = parseFloat(resultingRPN[i-2]);
            const prevToken = parseFloat(resultingRPN[i-1]);

            switch (currToken) {
                case '*':
                    result = prevPrevToken * prevToken;
                    break;
                case '+':
                    result = prevPrevToken + prevToken;
                    break;
                case '-':
                    result = prevPrevToken - prevToken;
                    break;
                case '/':
                    result = prevPrevToken / prevToken;
                    break;
                case '**':
                case '^':
                    result = prevPrevToken ** prevToken;
                    break;
            }
            
            // clean / remove unnecessary tokens, and replace it by the intermediate result
            resultingRPN.splice(i-2, 3);
            resultingRPN.splice(i-2, 0, result);
            i = i - 3; // decrease current analyzed position
        }
    }
    //console.log("result:", result);
    document.getElementById('result').innerHTML = 'result is : <i><b>' + result + '</b></i>';
}

main();
