import {cron} from "https://deno.land/x/deno_cron@v1.0.0/cron.ts";
import {getTickets} from "./zendesk.ts";
import {sendCall, sendMessage} from "./twilio.ts"
import {twilioConfig, zendeskConfig} from "./config/index.ts"
import {exists} from "https://deno.land/std@0.110.0/fs/mod.ts";

// Request read and write permissions for the tracked file
const trackedFilePath = new URL('./tracked.json', import.meta.url).pathname.substring(1);
const trackedReadDesc = { name: "read", path: trackedFilePath } as const;
const trackedWriteDesc = { name: "write", path: trackedFilePath } as const;
await Deno.permissions.request(trackedReadDesc);
await Deno.permissions.request(trackedWriteDesc);

// Run the task to check the tickets at a specific interval defined in the checkQueueCron value in the zendesk config
cron(zendeskConfig.checkQueueCron, async () => {
    // Get the list of tickets in the tracked queue
    const {tickets} = await getTickets(zendeskConfig.monitoredQueueId);

    // Get the list of tickets that are being tracked by the application
    const tracked: {[key: string]: number} = (await exists('./tracked.json')) ? JSON.parse(await Deno.readTextFile('./tracked.json')) : {};

    for(const ticket of tickets) {
        // Skip tickets that are not in the "new" state
        if(!(ticket.status === 'new')) {continue}
        
        // Calculate the time since the ticket was made and skip tickets that have not existed for at least a minute
        const milliSinceSubmitted = Math.abs(new Date(ticket.created_at).getTime() - new Date().getTime());
        const minutesSinceSubmitted = Math.floor(milliSinceSubmitted / 1000 / 60);
        if(minutesSinceSubmitted < 1) {continue}

        // Get how many times a notification has been sent for this ticket
        const amountsNotified = tracked[ticket.id] || 0;

        // Send a message if the amount of notifications is still less than the amount of messages before calling in the config
        // Otherwise, send a call
        if(amountsNotified < zendeskConfig.messagesBeforeCalling) {
            let bodyMessage = twilioConfig.messageFormat
                .replace('$TICKET_ID', ticket.id.toString())
                .replace('$MINUTES_IN_QUEUE', minutesSinceSubmitted.toString());
            if(amountsNotified + 1 === zendeskConfig.messagesBeforeCalling) {
                bodyMessage += `\nThis is the last message before you receive a call.`;
            }

            sendMessage(bodyMessage, twilioConfig.fromNumber, twilioConfig.toNumber);
        }
        else {
            const message = twilioConfig.callFormat
                .replace('$TICKET_ID', ticket.id.toString())
                .replace('$MINUTES_IN_QUEUE', minutesSinceSubmitted.toString());
            sendCall(message, twilioConfig.fromNumber, twilioConfig.toNumber)
        }

        tracked[ticket.id] = amountsNotified + 1;
    }

    // Save the tracked tickets file locally
    Deno.writeTextFile('./tracked.json', JSON.stringify(tracked));
})