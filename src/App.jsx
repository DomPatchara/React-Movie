import React, { useRef, useState, useEffect, useCallback } from 'react'
import Search from './components/Search'
import { useDebounce } from 'react-use';
import Switch from './components/Switch';
import Navbar from './components/Navbar';
import TrendingMovie from './components/TrendingMovie';
import apiClient from './API';
import AllMovies from './components/AllMoives'



const API_BASE_URL = 'https://api.themoviedb.org/3';

const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

const API_OPTIONS = {
  method: 'GET',
  headers: {
    accept: 'application/json',
    Authorization: `Bearer ${API_KEY}`
  }
}

const App = () => {

    const [movieList, setMovieList] = useState([]); // set All Movies
    const [trendingMovies,setTrendingMovies] = useState([]) // set TrendingMovie Top 10

    const [active, setActive] = useState('movie') // Toggle movie <--> tv

    // ---------------- Focus Input Search -------------------- //
    const searchRef = useRef()

    const focusInput = () => {
      if (searchRef.current) {
        searchRef.current.focus();
      }
    }

    const [searchTerm, setSearchTerm] = useState('');

    // debounce prevent making too many API requests
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
    useDebounce(() => setDebouncedSearchTerm(searchTerm), 500, [searchTerm]) // ประมาณว่ารอให้ user พิมพ์จบก่อนหลัง 500ms ให้ API request 

    //----------------------------------------------------- //

    const [errorMessage, setErrorMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false); // Loading Page // 

     // ---- Set numpages ------//
    const [numPage, setNumPage] = useState(1)
    const [totalPages, setTotalPages] = useState()

     // handle Select Genrces // 
    const [isGenres, setIsGenres] = useState(false);
    const [genreId, setGenreId] = useState(null);
    const [genreName, setGenreName] = useState('');
    const [showGenres, setShowGenres] = useState(false);
  
    const handleSelectGenres = useCallback((numGenreId, name) => {   // useCallback --> ลดการ re-create function โดยไม่จำเป็น
     
      // Update State
      setGenreId(numGenreId);
      setGenreName(name);
      setNumPage(1);
      setIsGenres(true);
      setShowGenres(false);
      setMovieList([]);
    
    }, []);
    
    // Check ว่ามีการ re-create function ไหม
    useEffect(()=>{    
      console.log(handleSelectGenres);
    }, [handleSelectGenres])

    const handleClick = async(numGenreId, name) => {
      await fetchByGenres();
      handleSelectGenres(numGenreId, name);

      setTimeout(() => {
        document.getElementById("all-movies")?.scrollIntoView({behavior: "smooth"});
      }, 500);

    }



    // ------------------------------------------------------------------Fetch Data ---------------------------------------------------------------------- //

    // ------ Fetch All Movies ( Old Way ) -------//
    const fetchMovies = async (query) => {

      setIsLoading(true);
      setErrorMessage('');

      try {
        const endpoint = query
        ? `${API_BASE_URL}/search/${active}?query=${encodeURIComponent(query)}&page=${numPage}`   
        :`${API_BASE_URL}/discover/${active}?sort_by=vote_count.desc&page=${numPage}`;

        const res = await fetch(endpoint, API_OPTIONS);
        const data = await res.json()
        console.log(data);
        
        if(!res.ok) {    // .ok คือ HTTP response status is in the range of 200-299   ถ้าออกนอกช่วง ( eg. 404, 500 ) ---> res.ok = false ทันที
          throw new Error('Failed to fetch movies');  // "block" flow or furture execution โค้ดอื่นๆ + throw message error
        }
        
        if(!data.results || data.results.length === 0 ) {
          setErrorMessage( data.Error || 'Failed to fetch movies');
          setMovieList([])
          return;   // stop function ตรงนี้ ถ้า data.response "Failed" 
        }

        setMovieList(data.results || [])
        setTotalPages(data.total_pages)

      } catch (error) {
        console.log(`Error fetching movies: ${error}`);
        setErrorMessage('Error fetching movies. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    }

    // ------ Fetch Movies By GenrcesID ( New Way ) -- //
    const fetchByGenres = async (genreId) => {
        setErrorMessage('')
        setIsLoading(true)

        const endpoint = `/discover/${active}?sort_by=vote_count.desc&page=${numPage}&with_genres=${genreId}`;
      try {
        
        const { data } = await apiClient.get(endpoint)  // await คือรอ Server Response ข้อมูลมา ถึงจะ flow code ต่อ
        console.log("Response:", data)       // Check Response
       
        if (!data.results || data.results.length === 0) {
          setErrorMessage( data.Error || 'No Genre founded !')
          setMovieList([])
          return;
        }

        setMovieList(data.results)
        setTotalPages(data.total_pages)
        
      } catch(error) {
        console.log(`Error fetching movies: ${error}`);
      } finally {
        setIsLoading(false);
      }
    }

   // ------ Fetch Trending Movie/TV ( New Way ) ---- //
    const fetchTrending = async () => {
      setIsLoading(true)
      setErrorMessage('')

      const endpoint = `/discover/${active}?sort_by=popularity.desc`

      try {
        const response = await apiClient.get(endpoint);
        const { data } = response;
        console.log("Response:", data) 
        
        if(!data.results || data.results.length === 0) {
          throw new Error("No trending movie found!")
        }

        const Top10 = data.results.slice(0, 10)
        setTrendingMovies(Top10) // select only 10 Arrays.

      } catch (error) {
        console.log(`Error fetching movies: ${error}`);
        setErrorMessage('Error fetching movies. Please try again later.')

      } finally {
        setIsLoading(false)
      }
    }
    

    // ------------------------------------------------------------------------- useEffect ------------------------------------------------------------- //
    useEffect(() => {
      if (isGenres && genreId) {
        fetchByGenres(genreId);
      } else {
        fetchMovies(debouncedSearchTerm);
      }
    }, [debouncedSearchTerm, numPage, active, genreId])

    

    useEffect(() => {
      fetchTrending();
      setSearchTerm('');
    } , [active])

    return (
      <main>

          <div className="pattern ">
            <div className="wrapper">
              
              <header>
                <Navbar
                  active={active}
                  setActive={setActive}
                  showGenres={showGenres}
                  setShowGenres={setShowGenres}
                  handleClick = {handleClick}
                  focusInput={focusInput}
                />
                <img src="/hero.png" alt="Hero-banner" className='lg:mt-10'/>
                <h1>Explore <span className='text-gradient'> Movies & Shows </span> You'll enjoy Without the Fuss</h1>
                <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} searchRef={searchRef}/>
              </header>

              <Switch active={active} setActive={setActive}/>

              <TrendingMovie trendingMovies={trendingMovies} active={active}/>

              <AllMovies 
                movieList={movieList} 
                active={active} 
                genreName={genreName} 
                errorMessage={errorMessage}
                numPage ={numPage}
                totalPages= {totalPages}
                setNumPage={setNumPage}
                isLoading={isLoading}
              />

            </div>
          </div>
      </main>
    )
  }

  export default App