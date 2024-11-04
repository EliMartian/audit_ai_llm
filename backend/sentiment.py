from flask import Flask, request, jsonify
from transformers import pipeline

app = Flask(__name__)

# Initialize the classifier pipeline with the Go Emotions model
classifier = pipeline(task="text-classification", model="SamLowe/roberta-base-go_emotions", top_k=5)

# Define the mapping of emotions to sentiment categories
emotion_sentiment_mapping = {
    'joy': 'positive',
    'optimism': 'positive',
    'amusement': 'positive',
    'love': 'positive',
    'excitement': 'positive',
    'admiration': 'positive',
    'relief': 'positive',
    'gratitude': 'positive',
    'pride': 'positive',
    'caring': 'positive',
    'approval': 'positive',
    'neutral': 'neutral',
    'surprise': 'neutral',
    'realization': 'neutral',
    'confusion': 'neutral',
    'curiosity': 'neutral',
    'disapproval': 'negative',
    'desire': 'negative',
    'remorse': 'negative',
    'disappointment': 'negative',
    'annoyance': 'negative',
    'nervousness': 'negative',
    'anger': 'negative',
    'fear': 'negative',
    'embarassment': 'negative',
    'sadness': 'negative',
    'grief': 'negative',
    'disgust': 'negative',
}

def get_sentiment(text):
    # Use the classifier to get emotions, selecting the top emotion
    emotions = classifier(text)
    top_emotion = emotions[0][0]["label"]
    
    # Check if the top emotion is in the mapping
    if top_emotion not in emotion_sentiment_mapping:
        raise ValueError(f"Emotion '{top_emotion}' not found in sentiment mapping.")
    
    sentiment = emotion_sentiment_mapping[top_emotion]
    
    return sentiment

@app.route('/sentiment', methods=['POST'])
def analyze_sentiment():
    data = request.get_json()
    
    # Extract question and answer
    question = data.get("question", "")
    answer = data.get("answer", "")
    
    # Calculate sentiment for question and answer
    question_sentiment = get_sentiment(question)
    answer_sentiment = get_sentiment(answer)
    
    # Return the sentiments as a JSON response
    return jsonify({
        'message': 'Sentiment Analysis Calculated',
        'question_sentiment': question_sentiment,
        'answer_sentiment': answer_sentiment,
        'question': question,
        'answer': answer
    })

if __name__ == '__main__':
    app.run(port=5003)