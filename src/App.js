import { useEffect, useState } from "react";
import StarRating from "./StarRating";

const average = (arr) =>
  arr.reduce((acc, cur, i, arr) => acc + cur / arr.length, 0);

//api key for OMDB API
const KEY = "7142b64b";

export default function App() {
  const [query, setQuery] = useState("");
  const [movies, setMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  //pass in a callback function to init state of func call, but cannot pass args
  //only used on init run
  const [watched, setWatched] = useState(function () {
    const storedValue = JSON.parse(localStorage.getItem("watched")) || [];
    //localstorage is a string, so JSON it
    return storedValue;
  });
  //const [watched, setWatched] = useState([]);

  function handleSelectMovie(id) {
    setSelectedId((selectedId) => (id === selectedId ? null : id));
  }

  function handleCloseMovie(id) {
    setSelectedId(null);
  }

  function handleAddWatched(movie) {
    //set watched array to current, plus a new one
    setWatched((watched) => [...watched, movie]);

    //need to build array as its async
    //convert to string as localStorage takes string
    //moved to effect
    //localStorage.setItem("watched", JSON.stringify([...watched, movie]));
  }

  function handleDeleteWatched(id) {
    //get the movie array and filter the one to delete
    setWatched((watched) => watched.filter((movie) => movie.imdbID !== id));
  }

  //use an effect so we can update the dependency to the watched state
  //pass in watched as the async process should already have handled data
  useEffect(
    function () {
      localStorage.setItem("watched", JSON.stringify(watched));
    },
    [watched]
  );

  //doesnt return anything, but pass a function to run as a side effect
  //runs it after first mount
  useEffect(
    function () {
      const controller = new AbortController(); //browser control API for cancelling requests

      async function fetchMovies() {
        try {
          setIsLoading(true);
          //clear any errors
          setError("");
          const res = await fetch(
            `http://www.omdbapi.com/?apikey=${KEY}&s=${query}`,
            { signal: controller.signal } //pass as param
          );

          //check for error
          if (!res.ok) throw new Error("Unable to get movies");

          const data = await res.json();
          if (data.Response === "False") throw new Error("Movie not found");

          setMovies(data.Search);
          // console.log(data.Search);
          setError(""); //clears the aborted fetch requests
        } catch (err) {
          console.error(err.message);
          setError(err.message);
        } finally {
          setIsLoading(false);
        }
      }
      if (query.length < 3) {
        setMovies([]);
        setError("");
        return; //clear the array and do nothing
      }
      //close any old movie open
      handleCloseMovie();
      //now get movies
      fetchMovies();
      //Cleanup function, runs when component is unloaded / removed, prevent multiple runs of this func
      return function () {
        controller.abort();
      };
    },
    [query]
  ); //empty array means run "onMount" ie. first run, but setting to query, it will refresh on each change of that state

  return (
    <>
      <NavBar>
        <Logo />
        <Search query={query} setQuery={setQuery} />
        <NumResults movies={movies} />
      </NavBar>
      <Main>
        <Box>
          {/* {isLoading ? <Loader /> : <MovieList movies={movies} />} */}
          {isLoading && <Loader />}
          {!isLoading && !error && (
            <MovieList movies={movies} onSelectMovie={handleSelectMovie} />
          )}
          {error && <ErrorMessage message={error} />}
        </Box>
        <Box>
          {selectedId ? (
            <MovieDetails
              selectedId={selectedId}
              onCloseMovie={handleCloseMovie}
              onAddWatched={handleAddWatched} //pass in the handler to the func
              watched={watched} //pass it in to check for dupe add
            />
          ) : (
            <>
              <WatchedSummary watched={watched} />
              <WatchedMoviesList
                watched={watched}
                onDeleteWatched={handleDeleteWatched}
              />
            </>
          )}
        </Box>
      </Main>
    </>
  );
}

function Loader() {
  return <p className="loader">Loading...</p>;
}

function ErrorMessage({ message }) {
  return (
    <p className="error">
      <span>⛔</span> {message}
    </p>
  );
}
function NavBar({ children }) {
  return <nav className="nav-bar">{children}</nav>;
}
function NumResults({ movies }) {
  return (
    <p className="num-results">
      Found <strong>{movies ? movies.length - 1 : 0}</strong> results
    </p>
  );
}
function Logo() {
  return (
    <div className="logo">
      <span role="img">🍿</span>
      <h1>usePopcorn</h1>
    </div>
  );
}

function Search({ query, setQuery }) {
  useEffect(function () {
    const el = document.querySelector(".search");
    el.focus();
  });

  return (
    <input
      className="search"
      type="text"
      placeholder="Search movies..."
      value={query}
      onChange={(e) => setQuery(e.target.value)}
    />
  );
}

function Main({ children }) {
  return <main className="main">{children}</main>;
}

function WatchedSummary({ watched }) {
  const avgImdbRating = average(
    watched.map((movie) => movie.imdbRating)
  ).toFixed(2);
  const avgUserRating = average(
    watched.map((movie) => movie.userRating)
  ).toFixed(2);
  const avgRuntime = average(watched.map((movie) => movie.runtime));

  return (
    <div className="summary">
      <h2>Movies you watched</h2>
      <div>
        <p>
          <span>#️⃣</span>
          <span>{watched.length} movies</span>
        </p>
        <p>
          <span>⭐️</span>
          <span>{avgImdbRating}</span>
        </p>
        <p>
          <span>🌟</span>
          <span>{avgUserRating}</span>
        </p>
        <p>
          <span>⏳</span>
          <span>{avgRuntime} min</span>
        </p>
      </div>
    </div>
  );
}
function WatchedMoviesList({ watched, onDeleteWatched }) {
  return (
    <ul className="list">
      {watched.map((movie) => (
        <WatchedMovie
          movie={movie}
          key={movie.imdbID}
          onDeleteWatched={onDeleteWatched}
        />
      ))}
    </ul>
  );
}
function WatchedMovie({ movie, onDeleteWatched }) {
  return (
    <li>
      <img src={movie.poster} alt={`${movie.title} poster`} />
      <h3>{movie.title}</h3>
      <div>
        <p>
          <span>⭐️</span>
          <span>{movie.imdbRating}</span>
        </p>
        <p>
          <span>🌟</span>
          <span>{movie.userRating}</span>
        </p>
        <p>
          <span>⏳</span>
          <span>{movie.runtime} min</span>
        </p>
        <button
          className="btn-delete"
          onClick={() => onDeleteWatched(movie.imdbID)}
        >
          x
        </button>
      </div>
    </li>
  );
}
function MovieList({ movies, onSelectMovie }) {
  return (
    <ul className="list list-movies">
      {movies?.map((movie) => (
        <Movie movie={movie} key={movie.imdbID} onSelectMovie={onSelectMovie} />
      ))}
    </ul>
  );
}
function Movie({ movie, onSelectMovie }) {
  return (
    <li onClick={() => onSelectMovie(movie.imdbID)}>
      <img src={movie.Poster} alt={`${movie.Title} poster`} />
      <h3>{movie.Title}</h3>
      <div>
        <p>
          <span>🗓</span>
          <span>{movie.Year}</span>
        </p>
      </div>
    </li>
  );
}

function MovieDetails({ selectedId, onCloseMovie, onAddWatched, watched }) {
  const [movie, setMovie] = useState({});
  //use loading to hide the flicker whilst component loads / calls
  const [isLoading, setIsLoading] = useState(false);
  const [userRating, setUserRating] = useState("");

  //check this selected movie isnt already in the watched list
  const isWatched = watched.map((movie) => movie.imdbID).includes(selectedId);
  //console.log(isWatched);

  //use optional chaining to only take that item if it exists
  const watchedUserRating = watched.find(
    (movie) => movie.imdbID === selectedId
  )?.userRating;

  //destructure the object
  const {
    Title: title,
    Year: year,
    Poster: poster,
    Runtime: runtime,
    imdbRating,
    Plot: plot,
    Released: released,
    Actors: actors,
    Director: director,
    Genre: genre,
  } = movie;

  //set the initial state and this is used on mount so this does not fire
  // const [isTop, setIsTop] = useState(imdbRating > 8);
  // console.log(isTop);
  // //fix this with useEffect
  // useEffect(
  //   function () {
  //     setIsTop(imdbRating > 8);
  //   },
  //   [imdbRating]
  // );
  //should use derived state as this updates all the time
  const isTop = imdbRating > 8;
  //console.log(isTop);
  const [avgRating, setAvgRating] = useState(0);

  //cannot change the number or order of hooks returned
  /*eslint-disable*/
  //if (imdbRating > 8) [isTop, setIsTop] = useState(true);

  //will be null on first run
  //console.log(title, year);

  //handler needs to do a lot so add another handler here
  function handleAdd() {
    const newWatchedMovie = {
      imdbID: selectedId,
      title,
      year,
      poster,
      imdbRating: Number(imdbRating),
      runtime: runtime.split(" ").at(0),
      userRating,
    };
    onAddWatched(newWatchedMovie);
    // setAvgRating(Number(imdbRating));
    // //use a callback function otherwise it wont get the latest value, avgRating can be called anything as its a param
    // setAvgRating((avgRating) => avgRating + userRating / 2);

    onCloseMovie();
  }

  //only listen on this component
  useEffect(
    function () {
      //define the add as a function as we need to remove THIS SPECIFIC instance
      //when the component is unloaded
      function callback(e) {
        if (e.code === "Escape") {
          onCloseMovie();
          //console.log("Closing");
        }
      }
      //add this function instance
      document.addEventListener("keydown", callback);

      //define the cleanup
      return function () {
        document.removeEventListener("keydown", callback);
      };
    },
    [onCloseMovie] //reference the function as a dependency
  );

  //load the data
  useEffect(
    function () {
      async function getmovieDetails() {
        setIsLoading(true);
        const res = await fetch(
          `http://www.omdbapi.com/?apikey=${KEY}&i=${selectedId}`
        );
        const data = await res.json();
        //console.log(data);
        //store it in state
        setMovie(data);
        setIsLoading(false);
      }
      getmovieDetails();
    },
    [selectedId] //set dependency to monitor when it changes, then re-load
  ); //currently only running when the component mounts []!

  //change page title
  useEffect(
    function () {
      if (!title) return;
      document.title = `Movie | ${title}`;
      //cleanup function to run on unmount
      return function () {
        document.title = "usePopcorn";
      };
    },
    [title] // use the variable change as a dependency
    //need to be aware that a clean up could be necessary otherwise it could enter a race condition
    //when the component is unmounted
  );
  return (
    <div className="details">
      {isLoading ? (
        <Loader />
      ) : (
        <>
          <header>
            <button className="btn-back" onClick={onCloseMovie}>
              &larr;
            </button>
            <img src={poster} alt={`Poster of ${movie} movie`} />
            <div className="details-overview">
              <h2>{title}</h2>
              <p>
                {released} &bull; {runtime}
              </p>
              <p>{genre}</p>
              <p>
                <span>⭐️</span>
                {imdbRating} IMDb rating
              </p>
            </div>
          </header>
          <p>{avgRating}</p>
          <section>
            <div className="rating">
              {!isWatched ? (
                <>
                  <StarRating
                    maxRating={10}
                    size={24}
                    onSetRating={setUserRating}
                  />

                  {userRating > 0 && (
                    <button className="btn-add" onClick={handleAdd}>
                      + Add to list
                    </button>
                  )}
                </>
              ) : (
                <p>
                  You rated this movie {watchedUserRating} <span>⭐</span>
                </p>
              )}
            </div>
            <p>
              <em>{plot}</em>
            </p>
            <p>Starring {actors}</p>
            <p>Directed by {director}</p>
          </section>
        </>
      )}
    </div>
  );
}
function Box({ children }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="box">
      <button className="btn-toggle" onClick={() => setIsOpen((open) => !open)}>
        {isOpen ? "–" : "+"}
      </button>
      {isOpen && children}
    </div>
  );
}
