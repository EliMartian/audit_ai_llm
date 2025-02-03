from flask import Flask, request, jsonify
from transformers import pipeline
from flask_cors import CORS

app = Flask(__name__)
# Remedy CORS errors and related CORS shennanigans
CORS(app)

import torch
from transformers import RobertaTokenizer, RobertaForSequenceClassification

@app.route('/fact_check', methods=['POST'])
def fact_check_answer():
    data = request.get_json()
    
    # Load the summary (related snippets from user's selected source article) and the answer (being audited to check for misinformation)
    summary = data.get("summary", "")
    answer = data.get("answer", "")

    # Ensure that both summary sentences (of source) and answer are in proper form
    if (not isinstance(answer, str)):
        raise ValueError("answer must be of type: str")
    elif not isinstance(summary, list) or not all(isinstance(item, str) for item in summary):
        raise ValueError("summary must be of type: list of strings (string[])")
    
    # Load the tokenizer and fact-check model 
    # Source: https://huggingface.co/Dzeniks/roberta-fact-check
    tokenizer = RobertaTokenizer.from_pretrained('Dzeniks/roberta-fact-check')
    model = RobertaForSequenceClassification.from_pretrained('Dzeniks/roberta-fact-check')

    # Assign answer supported to be true, until proven otherwise if any of the snippets disagree with the answer
    # ie, "Innocent until proven guilty", but for AI answers. 
    answerSupported = True

    for evidence in summary:
        # Tokenize the claim with evidence (indivual sentence from most similar portions of user's selected source to QA pair)
        x = tokenizer.encode_plus(answer, evidence, return_tensors="pt")
        
        # Initialize tokenizer, and also assert the evidence to be the summary (ie use the information in the source the
        # user chose as the ground truth), and use the answer from the LLM (or AI agent) as the "claim" in this case, which is 
        # to be evaluated using the scraped content from the user's source. 
        model.eval()
        with torch.no_grad():
            prediction = model(**x)
            print("prediction")
            print(prediction)

        label = torch.argmax(prediction[0]).item()
        if (label == 1):
            # If the answer is refuted by any piece of evidence, then the answer cannot be supported by all evidences
            # ie, you're proven wrong once, then you are wrong on all accounts (in regards to misinformation)
            answerSupported = False

    return jsonify({
        'message': 'Answer Successfully Fact Checked Using Source',
        'summary': summary,
        'answer': answer,
        'fact_check_decision': answerSupported
    })


if __name__ == '__main__':
    app.run(port=5005)