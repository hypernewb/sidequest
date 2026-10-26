export type TranslationFailure='quota'|'provider'|'network'|'invalid_response';
export function translationFailureMessage(reason?:TranslationFailure){
 return reason==='quota'?'The translation service has reached its limit. Try again later. The Japanese source and extracted details are still available.':reason==='network'?'The translation service could not be reached. The Japanese source and extracted details are still available.':'The translation service could not translate this text. The Japanese source and extracted details are still available.';
}
