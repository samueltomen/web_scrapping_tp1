import { useState, useEffect, useMemo } from 'react'
import DatePicker from 'react-datepicker'
import "react-datepicker/dist/react-datepicker.css"
import axios from 'axios'

function App() {
  const [startDate, setStartDate] = useState(null)
  const [endDate, setEndDate] = useState(null)
  const [author, setAuthor] = useState('')
  const [category, setCategory] = useState('')
  const [subcategory, setSubcategory] = useState('')
  const [titleSearch, setTitleSearch] = useState('')

  const [allArticles, setAllArticles] = useState([])
  const [filteredArticles, setFilteredArticles] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [uniqueAuthors, setUniqueAuthors] = useState([])
  const [uniqueCategories, setUniqueCategories] = useState([])
  const [uniqueSubcategories, setUniqueSubcategories] = useState([])

  const filteredSubcategories = useMemo(() => {
    if (!category) return uniqueSubcategories

    return uniqueSubcategories.filter(subcat => {
      const articles = allArticles.filter(article =>
          article.category === category && article.subcategory === subcat
      )
      return articles.length > 0
    })
  }, [category, uniqueSubcategories, allArticles])

  useEffect(() => {
    const fetchAllArticles = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await axios.get('http://localhost:8000/api/articles')
        setAllArticles(response.data)
        setFilteredArticles(response.data)
      } catch (err) {
        setError('Erreur lors du chargement des articles. Veuillez réessayer.')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchAllArticles()
  }, [])

  useEffect(() => {
    if (allArticles.length === 0) return

    const authors = [...new Set(allArticles
        .filter(article => article.author)
        .map(article => article.author))]
        .sort()

    const categories = [...new Set(allArticles
        .filter(article => article.category)
        .map(article => article.category))]
        .sort()

    const subcategories = [...new Set(allArticles
        .filter(article => article.subcategory)
        .map(article => article.subcategory))]
        .filter(Boolean)
        .sort()

    setUniqueAuthors(authors)
    setUniqueCategories(categories)
    setUniqueSubcategories(subcategories)
  }, [allArticles])

  useEffect(() => {
    if (category && subcategory) {
      const isValidSubcategory = filteredSubcategories.includes(subcategory)
      if (!isValidSubcategory) {
        setSubcategory('')
      }
    }
  }, [category, subcategory, filteredSubcategories])

  useEffect(() => {
    if (allArticles.length === 0) return

    let isActive = true
    setLoading(true)

    const parseArticleDate = (dateStr) => {
      if (!dateStr) return null

      try {
        const dateParts = dateStr.split('/')
        if (dateParts.length !== 3) return null

        const day = parseInt(dateParts[0], 10)
        const month = parseInt(dateParts[1], 10) - 1
        const year = parseInt(dateParts[2], 10)

        return new Date(year, month, day)
      } catch (err) {
        console.error("Error parsing date:", err)
        return null
      }
    }

    let filtered = [...allArticles]

    // Filtre par date
    if (startDate || endDate) {
      filtered = filtered.filter(article => {
        const articleDate = parseArticleDate(article.date)
        if (!articleDate) return true

        if (startDate && endDate) {
          const startDay = new Date(startDate)
          startDay.setHours(0, 0, 0, 0)

          const endDay = new Date(endDate)
          endDay.setHours(23, 59, 59, 999)

          return articleDate >= startDay && articleDate <= endDay
        } else if (startDate) {
          const startDay = new Date(startDate)
          startDay.setHours(0, 0, 0, 0)
          return articleDate >= startDay
        } else {
          const endDay = new Date(endDate)
          endDay.setHours(23, 59, 59, 999)
          return articleDate <= endDay
        }
      })
    }

    if (author) {
      filtered = filtered.filter(article => article.author === author)
    }

    if (category) {
      filtered = filtered.filter(article => article.category === category)
    }

    if (subcategory) {
      filtered = filtered.filter(article => article.subcategory === subcategory)
    }

    if (titleSearch) {
      const titleLower = titleSearch.toLowerCase()
      filtered = filtered.filter(article =>
          article.title && article.title.toLowerCase().includes(titleLower)
      )
    }

    const filterTimeout = setTimeout(() => {
      if (isActive) {
        setFilteredArticles(filtered)
        setLoading(false)
      }
    }, 300)

    return () => {
      isActive = false
      clearTimeout(filterTimeout)
    }
  }, [allArticles, startDate, endDate, author, category, subcategory, titleSearch])

  const resetSearch = () => {
    setStartDate(null)
    setEndDate(null)
    setAuthor('')
    setCategory('')
    setSubcategory('')
    setTitleSearch('')
    setFilteredArticles(allArticles)
  }

  const formatDateForDisplay = (dateStr) => {
    if (!dateStr) return '';

    try {
      const dateParts = dateStr.split('/');
      if (dateParts.length !== 3) return dateStr;

      const day = parseInt(dateParts[0], 10);
      const month = parseInt(dateParts[1], 10) - 1;
      const year = parseInt(dateParts[2], 10);

      const date = new Date(year, month, day);

      if (isNaN(date.getTime())) return dateStr;

      const options = { day: 'numeric', month: 'long', year: 'numeric' };
      return date.toLocaleDateString('fr-FR', options);
    } catch (err) {
      console.error("Error formatting date:", err);
      return dateStr;
    }
  }

  return (
      <div className="container mx-auto px-4 py-8 animate-fade-in">
        <h1 className="text-3xl font-bold text-center mb-8 relative">
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
          Recherche d'Articles
        </span>
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full"></div>
        </h1>

        <div className="bg-white p-6 rounded-lg shadow-lg mb-8 transform transition-all duration-300 hover:shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div className="transition-all duration-300 transform hover:scale-105">
              <label className="block text-sm font-medium text-gray-700 mb-1">Date de début</label>
              <DatePicker
                  selected={startDate}
                  onChange={date => setStartDate(date)}
                  selectsStart
                  startDate={startDate}
                  endDate={endDate}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                  placeholderText="Sélectionner une date"
                  dateFormat="dd/MM/yyyy"
                  disabled={loading}
              />
            </div>

            <div className="transition-all duration-300 transform hover:scale-105">
              <label className="block text-sm font-medium text-gray-700 mb-1">Date de fin</label>
              <DatePicker
                  selected={endDate}
                  onChange={date => setEndDate(date)}
                  selectsEnd
                  startDate={startDate}
                  endDate={endDate}
                  minDate={startDate}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                  placeholderText="Sélectionner une date"
                  dateFormat="dd/MM/yyyy"
                  disabled={loading}
              />
            </div>

            <div className="transition-all duration-300 transform hover:scale-105">
              <label className="block text-sm font-medium text-gray-700 mb-1">Auteur</label>
              <div className="relative">
                <select
                    value={author}
                    onChange={e => setAuthor(e.target.value)}
                    className="w-full p-2 pl-8 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 appearance-none"
                    disabled={loading}
                >
                  <option value="">Tous les auteurs</option>
                  {uniqueAuthors.map(authorName => (
                      <option key={authorName} value={authorName}>{authorName}</option>
                  ))}
                </select>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 absolute left-2 top-1/2 transform -translate-y-1/2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="transition-all duration-300 transform hover:scale-105">
              <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
              <div className="relative">
                <select
                    value={category}
                    onChange={e => {
                      setCategory(e.target.value)
                      // Réinitialiser la sous-catégorie lors du changement de catégorie
                      setSubcategory('')
                    }}
                    className="w-full p-2 pl-8 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 appearance-none"
                    disabled={loading}
                >
                  <option value="">Toutes les catégories</option>
                  {uniqueCategories.map(categoryName => (
                      <option key={categoryName} value={categoryName}>{categoryName}</option>
                  ))}
                </select>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 absolute left-2 top-1/2 transform -translate-y-1/2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>

            <div className="transition-all duration-300 transform hover:scale-105">
              <label className="block text-sm font-medium text-gray-700 mb-1">Sous-catégorie</label>
              <div className="relative">
                <select
                    value={subcategory}
                    onChange={e => setSubcategory(e.target.value)}
                    className="w-full p-2 pl-8 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 appearance-none"
                    disabled={loading || !category} // Désactiver si aucune catégorie n'est sélectionnée
                >
                  <option value="">Toutes les sous-catégories</option>
                  {filteredSubcategories.map(subcategoryName => (
                      subcategoryName && <option key={subcategoryName} value={subcategoryName}>{subcategoryName}</option>
                  ))}
                </select>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 absolute left-2 top-1/2 transform -translate-y-1/2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>

            <div className="transition-all duration-300 transform hover:scale-105">
              <label className="block text-sm font-medium text-gray-700 mb-1">Recherche dans le titre</label>
              <div className="relative">
                <input
                    type="text"
                    value={titleSearch}
                    onChange={e => setTitleSearch(e.target.value)}
                    className="w-full p-2 pl-8 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                    placeholder="Mot-clé dans le titre"
                    disabled={loading}
                />
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 absolute left-2 top-1/2 transform -translate-y-1/2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
          <div className="flex justify-end space-x-4 mt-6">
            <button
                onClick={resetSearch}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-all duration-300 transform hover:scale-105 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                disabled={loading}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Chargement...
                </>
              ) : (
                <>
                  <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                  </svg>
                  Réinitialiser
                </>
              )}
            </button>
            <div className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-md transition-all duration-300 transform hover:scale-105 hover:shadow-md animate-pulse-shadow">
            <span className="flex items-center">
              <svg className="h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
              {filteredArticles.length} article(s) trouvé(s)
            </span>
            </div>
          </div>
        </div>

        {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
        )}

        {loading && (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        )}
        <div className="space-y-6">
          {!loading && filteredArticles.length === 0 ? (
              <div className="text-center py-10 animate-fade-in">
                <p className="text-gray-500 text-lg">Aucun article trouvé. Veuillez modifier vos critères de recherche.</p>
              </div>
          ) : (
              !loading && (
                  <div className="grid grid-cols-1 gap-6">
                    {filteredArticles.map((article, index) => (
                        <div
                            key={index}
                            className="bg-white p-6 rounded-lg shadow-md transform transition duration-300 hover:shadow-xl hover:-translate-y-1"
                            style={{
                              animation: `fadeIn 0.5s ease-out ${index * 0.1}s both`
                            }}
                        >
                          <div className="flex flex-col md:flex-row">
                            {article.image && (
                                <div className="md:w-1/4 mb-4 md:mb-0 md:mr-6 overflow-hidden rounded-md">
                                  <img
                                      src={article.image}
                                      alt={article.title || 'Image article'}
                                      className="w-full h-auto rounded-md transition-transform duration-500 hover:scale-105"
                                      onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = 'https://via.placeholder.com/400x300?text=Image+non+disponible';
                                      }}
                                  />
                                </div>
                            )}
                            <div className={article.image ? "md:w-3/4" : "w-full"}>
                              <div className="flex flex-wrap items-center mb-2">
                                {article.category && (
                                    <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full mr-2 mb-1 transition-all duration-300 hover:bg-blue-200 shadow-sm">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="inline-block h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                                        </svg>
                                        {article.category}
                                    </span>
                                )}
                                {article.subcategory && (
                                    <span className="bg-indigo-100 text-indigo-800 text-xs font-semibold px-2.5 py-0.5 rounded-full mr-2 mb-1 transition-all duration-300 hover:bg-indigo-200 shadow-sm border-l-2 border-indigo-300">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="inline-block h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5z" />
                                            <path d="M11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                        </svg>
                                        {article.subcategory}
                                    </span>
                                )}
                                {article.date && (
                                    <span className="text-sm text-gray-500 mb-1 flex items-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                        </svg>
                                        {formatDateForDisplay(article.date)}
                                    </span>
                                )}
                              </div>
                              <h2 className="text-xl font-bold mb-2 transition-colors duration-300 hover:text-blue-600">{article.title}</h2>
                              {article.author && (
                                  <p className="text-sm text-gray-600 mb-2 flex items-center">
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                      </svg>
                                      <span className="font-medium">{article.author}</span>
                                  </p>
                              )}
                              {article.summary && (
                                  <p className="text-gray-700 mb-4 line-clamp-3 hover:line-clamp-none transition-all duration-300">{article.summary}</p>
                              )}
                              {article.url && (
                                  <a
                                      href={article.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center mt-3 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-md transition-all duration-300 hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
                                    </svg>
                                    Lire l'article complet
                                  </a>
                              )}
                            </div>
                          </div>
                        </div>
                    ))}
                  </div>
              )
          )}
        </div>
      </div>
  )
}

export default App
