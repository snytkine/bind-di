export const jsonStringify = (o: any, pretty: boolean = true) => {

    try {
        return JSON.stringify(o, null, 2)
    } catch(e){
        return `JSON.stringify error ${e.message}`;
    }
}
