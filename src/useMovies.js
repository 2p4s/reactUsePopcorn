import { useState, useEffect } from "react";

//api key for OMDB API
const KEY = "7142b64b";

//custom hook, so not using export custom. not mandatory
export function useMovies(query, callback) {
  const [movies, setMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  //doesnt return anything, but pass a function to run as a side effect
  //runs it after first mount
  useEffect(
    function () {
      //call it only if it exists
      callback?.();
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

      //now get movies
      fetchMovies();
      //Cleanup function, runs when component is unloaded / removed, prevent multiple runs of this func
      return function () {
        controller.abort();
      };
    },
    [query]
  ); //empty array means run "onMount" ie. first run, but setting to query, it will refresh on each change of that state

  //return what we need
  return { movies, isLoading, error };
}
