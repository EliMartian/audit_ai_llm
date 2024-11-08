# similarity.py
from flask import Flask, request, jsonify
from transformers import AutoTokenizer, AutoModel
from sentence_transformers import SentenceTransformer
from rouge_score import rouge_scorer
import numpy as np

app = Flask(__name__)

# Choose a sentence transformer model built on top of BERT for
# better semantic understanding to compare sentence similarity
tokenizer = AutoTokenizer.from_pretrained("distilbert-base-uncased")
model = SentenceTransformer('sentence-transformers/all-mpnet-base-v2')

def get_embedding(sentence):
    return model.encode(sentence)

def cosine_similarity(vec_a, vec_b):
    # Reshape the vectors to be 1D arrays
    vec_a = vec_a.flatten()
    vec_b = vec_b.flatten()
    
    # Compute the dot product
    dot_product = np.dot(vec_a, vec_b)
    
    # Compute the norms
    norm_a = np.linalg.norm(vec_a)
    norm_b = np.linalg.norm(vec_b)
    
    # Compute and return cosine similarity
    return dot_product / (norm_a * norm_b)

def calculate_rouge_l(reference, hypothesis):
    # Initialize the ROUGE scorer
    scorer = rouge_scorer.RougeScorer(['rougeL'], use_stemmer=True)
    scores = scorer.score(reference, hypothesis)
    
    # Extract and return the ROUGE-L score
    rouge_l_score = scores['rougeL'].fmeasure
    return rouge_l_score

@app.route('/similarity', methods=['POST'])
def calculate_similarity():
    data = request.get_json()
    question = data.get('question')
    answer = data.get('answer')
    
    vec_question = get_embedding(question)
    vec_answer = get_embedding(answer)

    # Calculate a cosine similarity score and associated rating
    similarity_score = cosine_similarity(vec_question, vec_answer)
    similarity_rating, similarity_sentence = calculateSimilarityRating(float(similarity_score))

    # Calculate ROUGE-L score
    rouge_l_score = calculate_rouge_l(question, answer)

    return jsonify({
    'message': 'Cosine Similarity Calculated',
    'similarityScore': float(similarity_score),
    'rougeLScore': float(rouge_l_score),
    'similarityRating': similarity_rating,
    'similaritySentence': similarity_sentence,
    'question': question,
    'answer': answer
})

@app.route('/source_similarity', methods=['POST'])
def calculate_source_similarity():
    data = request.get_json()
    question = data.get('question')
    source = data.get('source')
    
    vec_question = get_embedding(question)
    vec_source = get_embedding(source)

    # Calculate a cosine similarity score and associated rating
    similarity_score = cosine_similarity(vec_question, vec_source)

    return jsonify({
    'similarityScore': float(similarity_score),
    'question': question,
    'source': source
})

# Calculates and returns the similarity score qualitative rating
def calculateSimilarityRating(similarityScore):
    if similarityScore < 0.2:
        return "Very Dissimilar", "The question asked is very dissimlar to the answer received"
    elif similarityScore < 0.4:
        return "Dissimilar", "The question asked is dissimilar to the answer received"
    elif similarityScore < 0.6:
        return "Similar", "The question asked is similar to the answer received"
    elif similarityScore < 1.0:
        return "Very Similar", "The question asked is very similar to the answer received"
    else:
        return "Identical", "The question asked and the answer received are identical"

if __name__ == '__main__':
    app.run(port=5002)
