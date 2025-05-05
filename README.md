# Web Scraping et Application de Recherche d'Articles

Ce projet comprend deux parties principales :
1. Un script de web scraping qui extrait des articles du site "Blog du Modérateur" et les stocke dans MongoDB
2. Une application web moderne avec React, Vite et Tailwind CSS pour rechercher les articles selon divers critères

## Prérequis

- Python 3.x
- Node.js et npm
- MongoDB

## Installation

### 1. Cloner le dépôt

```bash
git clone <url-du-repo>
cd web_scrapping_tp1
```

### 2. Configurer l'environnement Python

```bash
# Créer un environnement virtuel
python -m venv .venv

# Activer l'environnement virtuel
# Sur Windows
.venv\Scripts\activate
# Sur macOS/Linux
source .venv/bin/activate

# Installer les dépendances
pip install -r requirements.txt
```

### 3. Configurer le frontend

```bash
cd frontend
npm install
```

## Utilisation

### 1. Exécuter le script de scraping

```bash
python tp_1.py
```

Ce script va :
- Extraire les articles du site "Blog du Modérateur"
- Visiter chaque page d'article pour récupérer le résumé complet
- Stocker les données dans MongoDB

### 2. Démarrer l'API backend

```bash
python api.py
```

L'API sera accessible à l'adresse : http://localhost:8000

### 3. Démarrer l'application frontend

```bash
cd frontend
npm run dev
```

L'application sera accessible à l'adresse : http://localhost:5173

## Fonctionnalités

### Script de scraping (tp_1.py)

- Extraction des articles du site "Blog du Modérateur"
- Récupération des informations suivantes pour chaque article :
  - Image
  - Tag
  - Catégorie (extraite du tag)
  - Sous-catégorie (extraite du tag)
  - Date
  - URL
  - Titre
  - Résumé (extrait de la page de l'article)
  - Auteur (extrait de la page de l'article)
- Stockage des données dans MongoDB

### API Backend (api.py)

- Endpoint `/api/articles` pour récupérer les articles avec filtrage
- Critères de recherche :
  - Date de publication (début/fin)
  - Auteur de l'article
  - Catégorie
  - Sous-catégorie
  - Recherche par sous-chaîne dans le titre

### Frontend (React + Vite + Tailwind CSS)

- Interface moderne et responsive
- Configuration de proxy pour rediriger les requêtes API vers le backend
- Formulaire de recherche avec les critères suivants :
  - Date de publication (début/fin) avec sélecteurs de date
  - Auteur de l'article
  - Catégorie
  - Sous-catégorie
  - Recherche par sous-chaîne dans le titre
- Affichage des résultats de recherche avec :
  - Image de l'article
  - Tag
  - Date
  - Titre
  - Résumé
  - Lien vers l'article complet

## Structure du projet

```
web_scrapping_tp1/
├── tp_1.py                # Script de scraping
├── api.py                 # API backend
├── requirements.txt       # Dépendances Python
├── frontend/              # Application frontend
│   ├── src/
│   │   ├── App.jsx        # Composant principal
│   │   ├── main.jsx       # Point d'entrée React
│   │   └── index.css      # Styles CSS (Tailwind)
│   ├── index.html         # Page HTML principale
│   ├── package.json       # Dépendances npm
│   ├── vite.config.js     # Configuration Vite
│   ├── tailwind.config.js # Configuration Tailwind
│   └── postcss.config.js  # Configuration PostCSS
└── README.md              # Documentation
```
