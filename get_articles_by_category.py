from pymongo import MongoClient
import sys

def get_articles_by_category(category=None, subcategory=None):
    """
    Retourne tous les articles d'une catégorie ou d'une sous-catégorie
    """
    client = MongoClient('mongodb://localhost:27017/')
    db = client['webscraping_tp']
    collection = db['articles']

    query = {}

    if category:
        query['category'] = category

    if subcategory:
        query['subcategory'] = subcategory

    articles = list(collection.find(query, {'_id': 0}))
    return articles

def print_article_info(article):
    """
    Affiche les informations d'un article
    """
    print(f"Titre: {article.get('title')}")
    print(f"Auteur: {article.get('author')}")
    print(f"Date: {article.get('date')}")
    print(f"Catégorie: {article.get('category')}")
    print(f"Sous-catégorie: {article.get('subcategory', 'N/A')}")
    print(f"URL: {article.get('url')}")
    print("-" * 50)

def list_categories_and_subcategories():
    """
    Liste toutes les catégories et sous-catégories disponibles
    """
    client = MongoClient('mongodb://localhost:27017/')
    db = client['webscraping_tp']
    collection = db['articles']

    categories = collection.distinct("category")

    print("Catégories disponibles:")
    print("=" * 50)

    for category in sorted(categories):
        if not category:
            continue

        print(f"- {category}")

        # Récupération des sous-catégories pour cette catégorie
        subcategories = collection.distinct("subcategory", {"category": category})
        if subcategories:
            for subcategory in sorted(subcategories):
                if subcategory:
                    print(f"  └─ {subcategory}")

    print("\n")

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1].lower() == "list":
        list_categories_and_subcategories()
        sys.exit(0)

    if len(sys.argv) < 2:
        print("Usage: python get_articles_by_category.py [category] [subcategory]")
        print("       python get_articles_by_category.py list")
        print("Example: python get_articles_by_category.py 'Tech'")
        print("Example: python get_articles_by_category.py 'Tech' 'IA'")
        sys.exit(1)

    category = sys.argv[1] if len(sys.argv) > 1 else None
    subcategory = sys.argv[2] if len(sys.argv) > 2 else None

    articles = get_articles_by_category(category, subcategory)

    print(f"Nombre d'articles trouvés: {len(articles)}")
    print("=" * 50)

    for article in articles:
        print_article_info(article)