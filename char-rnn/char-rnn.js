
import { randInt } from '../common/common.helper.js';

async function main() {

    //const modelName = "sentiment_analysis"; // IMDB Movie
    const modelName = "char-rnn"; // on 40 000 lines of Shakespeare
    // const modelName = "nmt"; // en -> es

    const model = await tf.loadGraphModel(`./${modelName}/model.json`); // exported as a "GraphModel"

    //const model = await tf.loadLayersModel(`./${modelName}/model.json`);
    //console.log(model.summary()); // not a function ! (only on LayersModel)
    
    // only on "LayersModel" ?
    //model.print();



    //
    // Shakespeare
    //
    const toBeOrNotToB = [4,  5,  2, 23,  3,  2,  5, 10, 2, 11,  5,  4,  2,  4,  5,  2, 23]
    console.log(">>>", toBeOrNotToB.length) // 17 words

    const value = await model.executeAsync(tf.tensor2d([toBeOrNotToB], [1, toBeOrNotToB.length], 'float32'));
    
    value.print(); // Tensor

    const data = await value.data();

    console.log("value:", value) // shape [1, 17, 39]
    console.log("data:", data)

    //console.log(">", await value.argMax(1 /* axis */).data()) // [1, 39]
    console.log(">", await value.argMax(2 /* axis */).data()) // [1, 17]







    //
    // Sentiment Analysis
    //

    // "This is DiCaprio's best role."
    //const predictions = await model.predictAsync(tf.tensor2d([[ 11,   7,   1, 116, 217]], [1, 5], 'float32'), 1);
    /*
    This execution contains the node 'StatefulPartitionedCall/sequential_1/gru_4/PartitionedCall/while/exit/_58',
    which has the dynamic op 'Exit'. Please use model.executeAsync() instead. Alternatively, to avoid the dynamic ops,
    specify the inputs [StatefulPartitionedCall/sequential_1/gru_4/PartitionedCall/TensorArrayV2Stack/TensorListStack]
    */
    //console.log("predictions:", predictions); // 3d tensor ?!




















    //model.compile({loss: 'meanSquaredError', optimizer: 'sgd'});

    // Generate some synthetic data for training.
    //const xs = tf.tensor2d([1, 2, 3, 4], [4, 1]);
    //const ys = tf.tensor2d([1, 3, 5, 7], [4, 1]);
    //model.predict(tf.tensor2d([5], [1, 1])).print();

    /*
    const maxLength = 50;
    let sentence = "I like soccer";

    let translation = ""
    for(let word_idx = 0; word_idx < max_length; word_idx++) {

        const X = tf.tensor1d([sentence_en]).astype(object) // encoder input
        const X_dec = tf.tensor1d(["startofseq " + translation]).astype(object) // decoder input

        const y_proba = model.predict((X, X_dec), verbose=0)[0, word_idx] // last token's probas
        const predicted_word_id = tf.argmax(y_proba)
        const predicted_word = text_vec_layer_es.get_vocabulary()[predicted_word_id]
        
        if(predicted_word == "endofseq") {
            break;
        }
        translation += " " + predicted_word
        return translation.trim()
    }
    */
}

main();
