# similarity.py
from flask import Flask, request, jsonify
from transformers import AutoTokenizer, AutoModel
from sentence_transformers import SentenceTransformer
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

@app.route('/similarity', methods=['POST'])
def calculate_similarity():
    data = request.get_json()
    question = data.get('question')
    answer = data.get('answer')
    
    vec_question = get_embedding(question)
    vec_answer = get_embedding(answer)

    # Calculate a cosine similarity score and associated rating
    similarity_score = cosine_similarity(vec_question, vec_answer)
    similarity_rating = calculateSimilarityRating(float(similarity_score))

    return jsonify({
    'message': 'Cosine Similarity Calculated',
    'similarityScore': float(similarity_score),
    'similarityRating': similarity_rating,
    'question': question,
    'answer': answer
})

# Calculates and returns the similarity score qualitative rating
def calculateSimilarityRating(similarityScore):
    if similarityScore < 0.2:
        return "Very Not Similar"
    elif similarityScore < 0.4:
        return "Not Similar"
    elif similarityScore < 0.6:
        return "Somewhat Similar"
    elif similarityScore < 0.8:
        return "Similar"
    else:
        return "Very Similar"

if __name__ == '__main__':
    app.run(port=5002)
