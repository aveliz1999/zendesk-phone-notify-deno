// deno-lint-ignore-file camelcase
import { zendeskConfig } from "./config/index.ts"
import { Base64 } from "https://deno.land/x/bb64@1.1.0/mod.ts";

// Define some of the fields in the tickets that we need
type TicketType = {
    url: string,
    assignee_id?: string,
    status: string,
    subject: string,
    created_at: string,
    id: number
}

type ResponseType = {
    tickets: TicketType[]
}


// The required format is {email}/token:{apiToken} and then base64 encoded
const zendeskKey = Base64.fromString(`${zendeskConfig.email}/token:${zendeskConfig.apiToken}`).toString();

/**
 * Use the zendesk API to retrieve a list of tickets that are in a specific view
 * 
 * @param queueId The ID of the view/queue to get the tickets from
 * @returns The tickets in the queue
 */
export const getTickets = async (queueId: string): Promise<ResponseType> => {
    let baseZendeskUrl = zendeskConfig.zendeskUrl;
    if(!baseZendeskUrl.endsWith('/')) {
        baseZendeskUrl += '/';
    }

    const fullUrl = `${baseZendeskUrl}api/v2/views/${queueId}/tickets`;

    const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
            'Authorization': `Basic ${zendeskKey}`
        }
    });

    return response.json();
}