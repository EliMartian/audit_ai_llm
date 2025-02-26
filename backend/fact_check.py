from flask import Flask, request, jsonify
from transformers import pipeline, AutoTokenizer, AutoModelForTokenClassification
from transformers import RobertaTokenizer, RobertaForSequenceClassification
from flask_cors import CORS
import requests
import torch

app = Flask(__name__)
# Remedy CORS errors and related CORS shennanigans
CORS(app)

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
    
    # Load the tokenizer and misinformation (fact-check based on claim,evidence) model 
    # Source: https://huggingface.co/Dzeniks/roberta-fact-check
    tokenizer = RobertaTokenizer.from_pretrained('Dzeniks/roberta-fact-check')
    model = RobertaForSequenceClassification.from_pretrained('Dzeniks/roberta-fact-check')

    # Load the Named-Entity-Recognition model (NER) to extract important entities (topics) from both answer and sources
    # Source: https://huggingface.co/dslim/bert-base-NER
    ner_tokenizer = AutoTokenizer.from_pretrained("dslim/bert-base-NER")
    ner_model = AutoModelForTokenClassification.from_pretrained("dslim/bert-base-NER")
    ner = pipeline("ner", model=ner_model, tokenizer=ner_tokenizer)
    ner_answer = ner(answer)
    # Create a list of the NER determined words present in the answer 
    ner_answer_words = [item['word'] for item in ner_answer]

    # Majority Vote is a multi-faceted metric to determine whether or not the source supports the answer (due to Misinformation
    # model performance varying depending on topic), this new score encompasses: Named-Entity-Recognition (NER) and Similarity Score
    # alongside the NLP Misinformation model to ensure the most holistic approach to determining answer auditing
    majorityVoteSupport = 0
    # Create a set of supporting sentences (ie distinct) to be used as evidence in favor of supporting the answer
    supporting_set = set()

    for evidence in summary:
        # Break each evidence paragraph inside the source summary into individual sentences
        evidence_sentences = evidence.split(".")
        
        for sentence in evidence_sentences:
            # Tokenize the claim with evidence (indivual sentence from most similar portions of user's selected source to QA pair)
            x = tokenizer.encode_plus(answer, sentence, return_tensors="pt")
            
            # Initialize tokenizer, and also assert the "evidence" to be the summary (ie use the information in the source the
            # user chose as the ground truth), and use the answer from the LLM (or AI agent) as the "claim" in this case, which is 
            # to be evaluated using the scraped content from the user's source. 
            model.eval()
            with torch.no_grad():
                prediction = model(**x)

            # Receive the label from the Misinformation model being used
            label = torch.argmax(prediction[0]).item()
            logits = prediction.logits  # Extract the logits tensor
            value_1, value_2 = logits.squeeze().tolist()  # Convert to list and unpack

            # If label says that the sentence supports answer, and logits confer (not arbitrary values, tested on robust amount of QA topics)
            if (label == 0 and value_1 >= -0.2 and value_2 < 0.805):
                # Ensure the sentence is unique (not part of our current set of evidence)
                if not sentence in supporting_set:
                    supporting_set.add(sentence)

                    # Extract the Named-Entity-Recognition (NER) for the sentence
                    ner_sentence = ner(sentence)
                    ner_sentence_words = [item['word'] for item in ner_sentence]
                    
                    # Prepare data for determining sentence similarity to answer and source via my microservice
                    similarity_question_payload = {
                        'user_qa_element': answer,
                        'source': sentence
                    }
                    
                    try:
                        # Send POST request to my similarity microservice
                        similarity_response = requests.post(
                            'http://localhost:5002/source_similarity',
                            json=similarity_question_payload
                        )
                        
                        # Parse the JSON response
                        similarity_data = similarity_response.json()
                        similarity_score = similarity_data.get('similarityScore')

                        # Ensure the similarity score between the sentence and answer is on track (since the
                        # Misinformation model that we are using is not reliable all the time, we need to perform
                        # a few extra checks to determine if it actually supports the answer or not)
                        # Note: the specific values have been calibrated by debugging and exmaining thresholds
                        # to perform robustly across different QA pair topics and categories, and reflect these findings (not arbitrary)
                        if (similarity_score > 0.575):
                            # Opportunity to earn extra majority votes for the source (to determine
                            # if the source supports the answer) if:
                            #   1: NER sentence words match at least one of the words in the NER answer words
                            #   2: The similarity score between the sentence and the answer are very high
                            if len(ner_sentence_words) > 0:
                                words_found = 0
                                for word in ner_sentence_words:
                                    if word in ner_answer_words:
                                        words_found += 1
                                if words_found > (0):
                                    #  Earn a bonus point for NER category
                                    majorityVoteSupport += 1
                            if (similarity_score > 0.77):
                                # Earn a bonus point for high sentence-answer similarity score
                                majorityVoteSupport += 1
                                
                            majorityVoteSupport += 1
                    
                    except requests.exceptions.RequestException as e:
                        print(f"Error calculating similarity between source data and answer")
    # At least 2 points need to be earned to support (so not a repeated piece of evidence, unless that 
    # evidence is extremely compelling), ideally a combination of distinct sentences and compelling sentences
    answerSupported = majorityVoteSupport >= 2
    # Convert supporting set of sentences back into a list to render to the user
    supporting_set = list(supporting_set)

    return jsonify({
        'message': 'Answer Successfully Fact Checked Using Source',
        'summary': summary,
        'answer': answer,
        'fact_check_decision': answerSupported,
        'supporting_set': supporting_set
    })

if __name__ == '__main__':
    app.run(port=5005)