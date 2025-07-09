import { useEffect } from "react";

export function useKey(key, action) {
  //only listen on this component
  useEffect(
    function () {
      //define the add as a function as we need to remove THIS SPECIFIC instance
      //when the component is unloaded
      function callback(e) {
        if (e.code.toLowerCase() === key.toLowerCase()) {
          action();
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
    [action, key] //reference the function as a dependency
  );
}
