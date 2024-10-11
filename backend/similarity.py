# similarity.py
from flask import Flask, request, jsonify
from transformers import AutoTokenizer, AutoModel
from sentence_transformers import SentenceTransformer
import torch
import numpy as np

app = Flask(__name__)

# Load the model and tokenizer once when the app starts
tokenizer = AutoTokenizer.from_pretrained("distilbert-base-uncased")
model = SentenceTransformer('sentence-transformers/all-mpnet-base-v2')

# def get_embedding(sentence):
#     inputs = tokenizer(sentence, return_tensors="pt")
#     with torch.no_grad():
#         outputs = model(**inputs)
#     # Average pooling to get a single vector for the sentence
#     return outputs.last_hidden_state.mean(dim=1).numpy()

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
    print("hey is working")
    data = request.get_json()
    question = data.get('question')
    answer = data.get('answer')
    
    vec_question = get_embedding(question)
    vec_answer = get_embedding(answer)

    similarity_score = cosine_similarity(vec_question, vec_answer)

    similarity_rating = calculateSimilarityRating(float(similarity_score))

    return jsonify({
    'message': 'Cosine Similarity Calculated',
    'similarityScore': float(similarity_score),  # Convert to Python float
    'similarityRating': similarity_rating,
    'question': question,
    'answer': answer
})

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
    app.run(port=5002)  # Run on a different port
