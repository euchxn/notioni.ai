
import { tool } from 'ai';
import * as v from 'valibot';

export const weatherToolValibot = tool({
    description: 'Get the weather in a location',
    parameters: v.object({
        location: v.string(),
    }),
    execute: async ({ location }) => ({
        location,
        temperature: 72 + Math.floor(Math.random() * 21) - 10,
    }),
});
