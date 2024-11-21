from flask import Flask, request, jsonify
import requests
import heapq
from bs4 import BeautifulSoup

app = Flask(__name__)

def scrape_text(url, sentence_bound, question, answer):
    try:

        # Check if "reddit" is in the URL to avoid scraping
        if "reddit" in url or "r/" in url:
            raise ValueError("Scraping Reddit URLs is not allowed to avoid potential bans.")

        # Simulates being a web user (at a very low level) but could bypass simple attempts to prevent web scrapers
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
        }
        
        # Fetch the content from the URL
        response = requests.get(url, headers=headers, timeout=3, allow_redirects=True)
        response.raise_for_status()  # Raise an error for bad status codes
        
        # Parse the HTML content with BeautifulSoup
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Find all p-tags
        p_tags = soup.find_all('p')
        
        # Initialize a min-heap for the top 3 sentences based on similarity score
        top_3_sentences = []
        # Initialize the most correlated sentence to the answer (to show the user is anything similar to their answer in the source)
        most_correlated_answer_sentence = ""
        most_correlated_answer_similarity = 0

        # Loop through each p-tag and calculate similarity with the question
        for i, p_tag in enumerate(p_tags):
            p_text = p_tag.get_text()
            
            # Prepare data for determining sentence similarity to question via microservice
            similarity_question_payload = {
                'user_qa_element': question,
                'source': p_text
            }
            
            try:
                # Send POST request to the similarity microservice
                similarity_response = requests.post(
                    'http://localhost:5002/source_similarity',  # URL for the microservice
                    json=similarity_question_payload
                )
                
                # Parse the JSON response
                similarity_data = similarity_response.json()
                similarity_score = similarity_data.get('similarityScore')

                # Maintain a max heap of the top 3 similarity scores and sentences
                if len(top_3_sentences) < 3:
                    heapq.heappush(top_3_sentences, (similarity_score, p_text))
                else:
                    # Only push if the new similarity score is higher than the lowest in the heap
                    if similarity_score > top_3_sentences[0][0]:
                        heapq.heappushpop(top_3_sentences, (similarity_score, p_text))
            
            except requests.exceptions.RequestException as e:
                print(f"Error calculating similarity for p tag #{i + 1}: {e}")

            # Prepare data for determining sentence similarity to question via microservice
            similarity_answer_payload = {
                'user_qa_element': answer,
                'source': p_text
            }
            
            try:
                # Send POST request to the similarity microservice
                similarity_response = requests.post(
                    'http://localhost:5002/source_similarity',  # URL for the microservice
                    json=similarity_answer_payload
                )
                
                # Parse the JSON response
                similarity_data = similarity_response.json()
                similarity_score = similarity_data.get('similarityScore')

                # Maintain the most correlated sentence in the source to the answer
                if similarity_score > most_correlated_answer_similarity:
                    most_correlated_answer_similarity = similarity_score
                    most_correlated_answer_sentence = similarity_data.get('source')
            
            except requests.exceptions.RequestException as e:
                print(f"Error calculating similarity for p tag #{i + 1}: {e}")

            # Stop once we reach the sentence_bound * 15 limit (soup is quite fast at parsing)
            # 15 was determined to be robust through user testing using a broad selection of topics / source articles
            if i + 1 >= sentence_bound * 15:
                break

        # Sort the top 3 sentences by score in descending order
        top_3_sentences = sorted(top_3_sentences, key=lambda x: x[0], reverse=True)

        # Poll the top response and leave the remaining top 4 (this is done to remove the 
        # most similar sentence because it is usually a paraphrase of the original user question, ie not relevant or helpful)
        top_response = top_3_sentences.pop(0) if top_3_sentences else None
        top_2_correlated_question_sentences = [(score, sentence) for score, sentence in top_3_sentences]

        # Return the most correlated answer sentence and top 2 most correlated question sentences with scores
        return most_correlated_answer_sentence, top_2_correlated_question_sentences

    except requests.exceptions.RequestException as e:
        print(f"An error occurred while fetching the URL: {e}")
        return None, None
    except ValueError as e:
        print(f"Error: {e}")
        return None, None

@app.route('/scrape', methods=['POST'])
def scrape_website():
    data = request.get_json()
    
    url = data.get("url", "")
    sentence_bound = data.get("sentence_bound", "")
    question = data.get("question", "")
    answer = data.get("answer", "")

    # Extract the excerpt and top related content from the url, staying with a sentence bound
    # to keep time complexity reasonable and a function of the original answer provided (ie short
    # answers might receive a somewhat shorter excerpts / top content than a lengthy more
    # substantial answer might get)
    most_correlated_answer_sentence,  top_2_correlated_question_sentences = scrape_text(url, sentence_bound, question, answer)
    
    # Return the excerpt and top related content as a JSON response
    return jsonify({
        'message': 'Source Successfully Scraped',
        'most_correlated_answer_sentence': most_correlated_answer_sentence,
        'top_2_correlated_question_sentences': top_2_correlated_question_sentences,
        'most_correlated_answer_sentence': most_correlated_answer_sentence
    })

if __name__ == '__main__':
    app.run(port=5004)