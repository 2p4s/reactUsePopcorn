import { useState, useEffect } from "react";

export function useLocalStorageState(initialState, key) {
  //pass in a callback function to init state of func call, but cannot pass args
  //only used on init run
  const [value, setValue] = useState(function () {
    //includes check if value exists
    const storedValue = JSON.parse(localStorage.getItem(key)) || [];
    //localstorage is a string, so JSON it
    return storedValue;
  });

  //use an effect so we can update the dependency to the watched state
  //pass in watched as the async process should already have handled data
  useEffect(
    function () {
      localStorage.setItem(key, JSON.stringify(value));
    },
    [value, key]
  );

  return [value, setValue];
}
