from bs4 import BeautifulSoup
import requests

from pymongo import MongoClient
client = MongoClient('mongodb://localhost:27017/')
db = client['webscraping_tp']

website_url = "https://www.blogdumoderateur.com/"

def get_page_content(url):
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        return BeautifulSoup(response.text, 'html.parser')
    except requests.exceptions.RequestException as e:
        print(f"Erreur: {e}")
        return None

def find_articles(soup):
    main_tag = soup.find('main')
    if not main_tag:
        print("Balise <main> non trouvée.")
        return []
    return soup.find_all('article')

def get_image(article):
    img_div = article.find('div', class_='post-thumbnail picture rounded-img')
    img_tag = img_div.find('img') if img_div else None
    return img_tag['data-lazy-src'] if img_tag and img_tag.has_attr('data-lazy-src') else None

def get_meta_div(article):
    return article.find('div', class_='entry-meta ms-md-5 pt-md-0 pt-3')

def get_tag(meta_div):
    tag_span = meta_div.find('span', class_='favtag color-b') if meta_div else None
    return tag_span.get_text(strip=True) if tag_span else None

def get_date(meta_div):
    date_span = meta_div.find('span', class_='posted-on t-def px-3') if meta_div else None
    date_text = date_span.get_text(strip=True) if date_span else None

    if not date_text:
        return None

    return date_text

def get_article_info(meta_div):
    header = meta_div.find('header', class_='entry-header pt-1') if meta_div else None
    a_tag = header.find('a') if header else None
    url = a_tag['href'] if a_tag and a_tag.has_attr('href') else None
    title = a_tag.find('h3').get_text(strip=True) if a_tag and a_tag.find('h3') else None
    return url, title

def get_summary(article_soup):
    if not article_soup:
        return None

    summary_div = article_soup.find('div', class_='entry-content')
    if not summary_div:
        summary_div = article_soup.find('div', class_='post-content')

    if not summary_div:
        return None

    excerpt = summary_div.find('div', class_='excerpt') or summary_div.find('p', class_='chapo')
    if excerpt:
        return excerpt.get_text(strip=True)

    first_p = summary_div.find('p')
    if first_p:
        return first_p.get_text(strip=True)

    return summary_div.get_text(strip=True)

def get_article_images(article_soup):
    if not article_soup:
        return {}

    images_dict = {}
    content_div = article_soup.find('div', class_='entry-content') or article_soup.find('div', class_='post-content')

    if not content_div:
        return {}

    img_tags = content_div.find_all('img')

    for i, img in enumerate(img_tags):
        img_url = None
        if img.has_attr('data-lazy-src'):
            img_url = img['data-lazy-src']
        elif img.has_attr('src'):
            img_url = img['src']

        if not img_url:
            continue

        caption = None

        parent_figure = img.find_parent('figure')
        if parent_figure:
            figcaption = parent_figure.find('figcaption')
            if figcaption:
                caption = figcaption.get_text(strip=True)

        if not caption and img.has_attr('alt') and img['alt'].strip():
            caption = img['alt'].strip()

        if not caption and img.has_attr('title') and img['title'].strip():
            caption = img['title'].strip()

        if not caption:
            caption = f"Image {i+1}"

        images_dict[img_url] = caption

    return images_dict

def get_author(article_soup):
    if not article_soup:
        return None

    meta_div = article_soup.find('div', class_='entry-meta article-meta d-flex')
    if meta_div:
        byline = meta_div.find('span', class_='byline')
        if byline:
            author_link = byline.find('a')
            if author_link:
                return author_link.text.strip()

    author_meta = article_soup.find('meta', {'name': 'author'})
    if author_meta and author_meta.has_attr('content') and author_meta['content'].strip():
        return author_meta['content'].strip()

    author_div = article_soup.find('div', class_='author-info')
    if author_div:
        author_name = author_div.find('span', class_='author-name')
        if author_name and author_name.get_text(strip=True):
            return author_name.get_text(strip=True)

    byline = article_soup.find(class_=['byline', 'author-byline', 'entry-meta'])
    if byline:
        author_text = byline.get_text(strip=True)
        if 'par' in author_text.lower() or 'by' in author_text.lower():
            parts = author_text.split('par', 1) if 'par' in author_text.lower() else author_text.split('by', 1)
            if len(parts) > 1 and parts[1].strip():
                return parts[1].strip()

    schema = article_soup.find('script', {'type': 'application/ld+json'})
    if schema:
        import json
        try:
            data = json.loads(schema.string)
            if isinstance(data, dict):
                if 'author' in data:
                    author_data = data['author']
                    if isinstance(author_data, dict) and 'name' in author_data:
                        return author_data['name']
                    elif isinstance(author_data, str):
                        return author_data
        except (json.JSONDecodeError, AttributeError):
            pass

    for selector in ['.author', '.author-name', '.entry-author', '.post-author']:
        author_elem = article_soup.select_one(selector)
        if author_elem and author_elem.get_text(strip=True):
            return author_elem.get_text(strip=True)

    return "Auteur inconnu"

def extract_article_data(article):
    img_url = get_image(article)
    meta_div = get_meta_div(article)
    tag = get_tag(meta_div)
    date = get_date(meta_div)
    article_url, title = get_article_info(meta_div)

    article_soup = get_page_content(article_url)

    summary = get_summary(article_soup)
    author = get_author(article_soup)
    images = get_article_images(article_soup)

    category = None
    subcategory = None

    if tag:
        if '/' in tag:
            parts = tag.split('/')
            category = parts[0].strip()
            subcategory = parts[1].strip()
        else:
            category = tag

            if article_soup:
                # Chercher dans les breadcrumbs ou la navigation
                breadcrumbs = article_soup.find('nav', class_='breadcrumbs')
                if breadcrumbs:
                    links = breadcrumbs.find_all('a')
                    if len(links) >= 2:
                        for i in range(len(links)):
                            link_text = links[i].get_text(strip=True)
                            if link_text.lower() == category.lower() and i+1 < len(links):
                                subcategory = links[i+1].get_text(strip=True)
                                break

                if not subcategory:
                    meta_keywords = article_soup.find('meta', {'name': 'keywords'})
                    if meta_keywords and meta_keywords.has_attr('content'):
                        keywords = meta_keywords['content'].split(',')
                        keywords = [k.strip() for k in keywords if k.strip()]
                        if len(keywords) > 1 and keywords[0].lower() == category.lower():
                            subcategory = keywords[1]

                if not subcategory and title:
                    words = title.split()
                    important_words = [w for w in words if len(w) > 4 and w.lower() != category.lower()]
                    if important_words:
                        subcategory = important_words[0]

    return {
        'image': img_url,
        'tag': tag,
        'category': category,
        'subcategory': subcategory,
        'date': date,
        'url': article_url,
        'title': title,
        'summary': summary,
        'author': author,
        'images': images
    }

def fetch_articles(url):
    soup = get_page_content(url)
    if not soup:
        return []

    articles = find_articles(soup)
    articles_data = []

    for article in articles:
        article_data = extract_article_data(article)
        articles_data.append(article_data)

    return articles_data

def save_to_mongo(data):
    collection = db['articles']
    print(f"Sauvegarde de {len(data)} articles dans MongoDB...")

    if data:
        collection.insert_many(data)
        print(f"{len(data)} documents insérés dans la collection 'articles'.")
    else:
        print("Aucun article à insérer.")

articles = fetch_articles(website_url)
save_to_mongo(articles)
