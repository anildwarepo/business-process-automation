import * as sdk from "microsoft-cognitiveservices-speech-sdk";
import { SpeechConfig } from "microsoft-cognitiveservices-speech-sdk";
import { BpaServiceObject } from '../engine/types'


export class Speech {

    private _client : sdk.SpeechConfig

    constructor(subscriptionKey : string, region : string){
        this._client  = sdk.SpeechConfig.fromSubscription(subscriptionKey, region)
        this._client.setProfanity(sdk.ProfanityOption.Raw)
    }

    public process = (input : BpaServiceObject) : Promise<BpaServiceObject> => {

        return new Promise<BpaServiceObject>((resolve, reject)=> {
            try{
                let audioConfig = sdk.AudioConfig.fromWavFileInput(input.data);
                let speechRecognizer = new sdk.SpeechRecognizer(this._client, audioConfig);
            
                let out = ""
                speechRecognizer.recognizing = (s, e) => {
                    //console.log(`RECOGNIZING: Text=${e.result.text}`);
                };
                
                speechRecognizer.recognized = (s, e) => {
                    if (e.result.reason == sdk.ResultReason.RecognizedSpeech) {
                        //console.log(`RECOGNIZED: Text=${e.result.text}`);
                        out += e.result.text + " "
                    }
                    else if (e.result.reason == sdk.ResultReason.NoMatch) {
                        console.log("NOMATCH: Speech could not be recognized.");
                    }
                };
                
                speechRecognizer.canceled = (s, e) => {
                    console.log(`CANCELED: Reason=${e.reason}`);
                
                    if (e.reason === sdk.CancellationReason.Error) {
                        console.log(`"CANCELED: ErrorCode=${e.errorCode}`);
                        console.log(`"CANCELED: ErrorDetails=${e.errorDetails}`);
                        console.log("CANCELED: Did you set the speech resource key and region values?");
                        reject(new Error(e.errorDetails))
                    }


                    //speechRecognizer.stopContinuousRecognitionAsync();
                };
                
                speechRecognizer.sessionStopped = (s, e) => {
                    console.log("\n    Session stopped event.");
                    speechRecognizer.stopContinuousRecognitionAsync();
                    const results = input.aggregatedResults
                    results["speechToText"] = out
                    resolve( {
                        data : out,
                        label : "speechToText",
                        bpaId : input.bpaId,
                        type : 'text',
                        projectName : input.projectName,
                        aggregatedResults : results
                    })
                };

                speechRecognizer.startContinuousRecognitionAsync();
            } catch(err){
                console.log(err)
                reject(new Error(err.message))
            }
        })
    }
}