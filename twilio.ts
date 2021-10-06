import { twilioConfig } from "./config/index.ts"
import { Base64 } from "https://deno.land/x/bb64@1.1.0/mod.ts";

const {accountSid, authToken} = twilioConfig;

/**
 * Use twilio to send a text message
 * 
 * @param message The body of the message to send
 * @param fromNumber The number to send the message from
 * @param toNumber The number to send the message to
 * @returns The Twilio API returned data
 */
// deno-lint-ignore no-explicit-any
export const sendMessage = async (message: string, fromNumber: string, toNumber: string): Promise<any> => {
    if(!message) {
        throw 'No message provided';
    }
    if(!fromNumber) {
        throw 'No from number provided';
    }
    if(!toNumber) {
        throw 'No to number provided';
    }

    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Message.json`;

    const encodedCredentials = Base64.fromString(`${accountSid}:${authToken}`).toString();

    const body = new URLSearchParams({
        To: toNumber,
        From: fromNumber,
        Body: message
    });

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${encodedCredentials}`
        },
        body
    });
    return response.json();
}

/**
 * Use twilio to send a call and speak a message with TTS
 * 
 * @param message The message to read out in the call
 * @param fromNumber The number to send the call from
 * @param toNumber The number to send the call to
 * @returns The Twilio API returned data
 */
// deno-lint-ignore no-explicit-any
export const sendCall = async (message: string, fromNumber: string, toNumber: string): Promise<any> => {
    if(!message) {
        throw 'No message provided';
    }
    if(!fromNumber) {
        throw 'No from number provided';
    }
    if(!toNumber) {
        throw 'No to number provided';
    }

    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`;

    const encodedCredentials = Base64.fromString(`${accountSid}:${authToken}`).toString();

    const twiMl = (await Deno.readTextFile('./twiml/call.xml')).replace('$REPLACE_ME$', message);

    const body = new URLSearchParams({
        To: toNumber,
        From: fromNumber,
        Twiml: twiMl
    });

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${encodedCredentials}`
        },
        body
    });
    return response.json();
}