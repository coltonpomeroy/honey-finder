import { Expo } from 'expo-server-sdk';

let expo = new Expo();

export async function POST(req, res) {
    const { tokens, message } = await req.json();

    let messages = [];
    for (let token of tokens) {
        if (!Expo.isExpoPushToken(token)) {
            console.error(`Push token ${token} is not a valid Expo push token`);
            continue;
        }
        messages.push({
            to: token,
            sound: 'default',
            body: message,
            data: { withSome: 'data' },
        });
    }

    let chunks = expo.chunkPushNotifications(messages);
    let tickets = [];
    for (let chunk of chunks) {
        try {
            let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
            tickets.push(...ticketChunk);
        } catch (error) {
            console.error(error);
        }
    }

    return new Response(JSON.stringify({ success: true, tickets }), { status: 200 });
}