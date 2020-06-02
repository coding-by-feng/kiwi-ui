const env = process.env;

let baseUrl = '';

let codeUrl = `${window.location.host}/code`

let encodeKey = 'MyKiwiVocabulary'

if (env.NODE_ENV === 'development') {

} else if (env.NODE_ENV === 'production') {

} else if (env.NODE_ENV === 'test') {

}

export {
    baseUrl,
    codeUrl
}
