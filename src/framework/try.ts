/**
 * Created by snytkind on 8/9/17.
 */

export interface Try<T, E extends Error = Error> {
  Success: T
  Failure: Error
}


export function TryCatch<T>(f: Function): Try<T, Error> {

  try {

     return {
       Success: f(),
       Failure: null
     }

  } catch(e){

    return {
      Success: null,
      Failure: e
    }
  }

}


let done = TryCatch(function(){
  const g = 2 -2
  if(g === 0){
    throw new Error("Division by zero")
  } else {
    return 17/g
  }
})

const {Success, Failure} = done;
console.log("DONE=", Success, "Failure=", Failure);
