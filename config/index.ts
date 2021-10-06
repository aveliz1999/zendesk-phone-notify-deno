import {
    parse
} from "https://deno.land/std@0.110.0/encoding/yaml.ts"

export type TwilioConfig = {
    accountSid: string,
    authToken: string,
    fromNumber: string,
    toNumber: string,
    messageFormat: string,
    callFormat: string
}

export type ZendeskConfig = {
    zendeskUrl: string,
    email: string,
    apiToken: string,
    monitoredQueueId: string,
    checkQueueCron: string,
    messagesBeforeCalling: number
}

const configDirectory = new URL('.', import.meta.url).pathname.substring(1);
const twilioFile = new URL('./twilio.yaml', import.meta.url).pathname.substring(1);
const zendeskFile = new URL('./zendesk.yaml', import.meta.url).pathname.substring(1);

const configReadDesc = { name: "read", path: configDirectory } as const;
await Deno.permissions.request(configReadDesc);

export const twilioConfig = parse(await Deno.readTextFile(twilioFile)) as TwilioConfig;
export const zendeskConfig = parse(await Deno.readTextFile(zendeskFile)) as ZendeskConfig;