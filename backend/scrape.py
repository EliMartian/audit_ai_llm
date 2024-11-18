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
        
        # Initialize a min-heap for the top 5 sentences based on similarity score
        top_5_sentences = []

        # Loop through each p-tag and calculate similarity with the question
        for i, p_tag in enumerate(p_tags):
            p_text = p_tag.get_text()
            
            # Prepare data for similarity service
            similarity_payload = {
                'question': question,
                'source': p_text
            }
            
            try:
                # Send POST request to the similarity microservice
                similarity_response = requests.post(
                    'http://localhost:5002/source_similarity',  # URL for the microservice
                    json=similarity_payload
                )
                
                # Parse the JSON response
                similarity_data = similarity_response.json()
                similarity_score = similarity_data.get('similarityScore')

                # Maintain a max heap of the top 5 similarity scores and sentences
                if len(top_5_sentences) < 5:
                    heapq.heappush(top_5_sentences, (similarity_score, p_text))
                else:
                    # Only push if the new similarity score is higher than the lowest in the heap
                    if similarity_score > top_5_sentences[0][0]:
                        heapq.heappushpop(top_5_sentences, (similarity_score, p_text))
            
            except requests.exceptions.RequestException as e:
                print(f"Error calculating similarity for p tag #{i + 1}: {e}")

            # Stop once we reach the sentence_bound * 2 limit
            if i + 1 >= sentence_bound * 15:
                break
        
        # Extract and combine the first `sentence_bound` p-tags into one paragraph
        paragraph = ' '.join(p.text for p in p_tags[:sentence_bound])
        
        # Sort the top 5 sentences by score in descending order
        top_5_sentences = sorted(top_5_sentences, key=lambda x: x[0], reverse=True)

        # Poll the top response and leave the remaining top 4 (this is done to remove the 
        # most similar sentence because it is usually a paraphrase of the original user question, ie not relevant or helpful)
        top_response = top_5_sentences.pop(0) if top_5_sentences else None
        remaining_top_4 = [(score, sentence) for score, sentence in top_5_sentences]

        # Return the combined paragraph and top 5 sentences with scores
        return paragraph, remaining_top_4

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
    related_question_text_excerpt, top_related_answer = scrape_text(url, sentence_bound, question, answer)
    
    # Return the excerpt and top related content as a JSON response
    return jsonify({
        'message': 'Source Successfully Scraped',
        'related_question_text_excerpt': related_question_text_excerpt,
        'top_related_answer': top_related_answer
    })

if __name__ == '__main__':
    app.run(port=5004)