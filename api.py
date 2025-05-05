from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
import re
from datetime import datetime

app = Flask(__name__)
CORS(app)

client = MongoClient('mongodb://localhost:27017/')
db = client['webscraping_tp']
collection = db['articles']

@app.route('/api/articles', methods=['GET'])
def get_articles():
    start_date = request.args.get('startDate')
    end_date = request.args.get('endDate')
    author = request.args.get('author')
    category = request.args.get('category')
    subcategory = request.args.get('subcategory')
    title_search = request.args.get('titleSearch')

    query = {}

    if start_date or end_date:
        date_query = {}

        if start_date:
            try:
                start_date_obj = datetime.strptime(start_date, '%Y-%m-%d')
                start_date_formatted = start_date_obj.strftime('%d/%m/%Y')
                date_query['$gte'] = start_date_formatted
            except ValueError as e:
                print(f"Erreur de format de date de début: {e}")

        if end_date:
            try:
                end_date_obj = datetime.strptime(end_date, '%Y-%m-%d')
                end_date_formatted = end_date_obj.strftime('%d/%m/%Y')
                date_query['$lte'] = end_date_formatted
            except ValueError as e:
                print(f"Erreur de format de date de fin: {e}")

        if date_query:
            query['date'] = date_query

    if author:
        query['author'] = author

    if category:
        query['category'] = category

    if subcategory:
        query['subcategory'] = subcategory

    if title_search:
        query['title'] = {'$regex': title_search, '$options': 'i'}

    try:
        articles = list(collection.find(query, {'_id': 0}))

        for article in articles:
            if 'date' in article and article['date']:
                try:
                    date_obj = datetime.strptime(article['date'], '%d/%m/%Y')
                    article['date'] = date_obj.strftime('%d/%m/%Y')
                except ValueError:
                    pass

        return jsonify(articles)
    except Exception as e:
        print(f"Erreur lors de la récupération des articles: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=8000)