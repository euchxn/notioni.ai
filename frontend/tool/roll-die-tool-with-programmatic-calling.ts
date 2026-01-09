
import { tool } from 'ai';
import { z } from 'zod';

export const rollDieToolWithProgrammaticCalling = tool({
    description: 'Roll a die',
    parameters: z.object({
        sides: z.number().describe('The number of sides on the die'),
    }),
    execute: async ({ sides }) => {
        return Math.floor(Math.random() * sides) + 1;
    },
});
