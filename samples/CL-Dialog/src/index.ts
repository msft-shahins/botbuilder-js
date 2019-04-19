// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import * as restify from 'restify';
import { BotFrameworkAdapter, MemoryStorage, ActivityTypes } from 'botbuilder';
import { AdaptiveDialog, UnknownIntentRule, SendActivity, IfCondition, SetProperty, EventRule, RuleDialogEventNames, LogStep, CodeStep } from 'botbuilder-dialogs-adaptive';
import { DialogManager, DialogTurnResult, DialogTurnStatus } from 'botbuilder-dialogs';
import { ICLOptions } from '@conversationlearner/sdk'
import { CLDialog, CLDialogConfiguration, CLDialog_Result } from './clDialog'
import { getEntityDisplayValueMap } from '@conversationlearner/models'

// Create HTTP server.
const server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, () => {
    console.log(`\n${server.name} listening to ${server.url}`);
    console.log(`\nGet Bot Framework Emulator: https://aka.ms/botframework-emulator`);
    console.log(`\nTo talk to your bot, open echobot.bot file in the Emulator.`);
});

// Create adapter.
// See https://aka.ms/about-bot-adapter to learn more about .bot file its use and bot configuration.
const adapter = new BotFrameworkAdapter({
    appId: process.env.microsoftAppID,
    appPassword: process.env.microsoftAppPassword,
});

// Create bots DialogManager and bind to state storage
const bot = new DialogManager();
bot.storage = new MemoryStorage();

// Listen for incoming activities.
server.post('/api/messages', (req, res) => {
    adapter.processActivity(req, res, async (context) => {
        // Route activity to bot.
        await bot.onTurn(context);
    });
});


// init conversation learner dialog
const options = <ICLOptions>{
    LUIS_AUTHORING_KEY: '',
    CONVERSATION_LEARNER_SERVICE_URI: 'https://westus.api.cognitive.microsoft.com/conversationlearner/v1.0/',
    botPort: 3978
}
const clDialog = new CLDialog(options, bot.storage)
// name-color 05df6991-6d89-4eec-8e59-cc342c21b363
// hi-bye d14dc392-7b4d-4e7a-8911-2cf672e18ce3
clDialog.configure(<CLDialogConfiguration>{ modelId: '05df6991-6d89-4eec-8e59-cc342c21b363' })

// Initialize bots root dialog
const dialogs = new AdaptiveDialog();
bot.rootDialog = dialogs;

// Handle unknown intents
dialogs.addRule(new UnknownIntentRule([
    new IfCondition(`user.greeted != true`, [
        new SendActivity(`Hi User! Try talking to me!`),
        new SetProperty(`user.greeted`, `true`)
    ]).else([
        clDialog,
        new CodeStep(async (context) => {
            const entityMap = getEntityDisplayValueMap(context.state.turn.get(CLDialog_Result))
            for(let [key, value] of entityMap) {
                context.state.conversation.set(key, value)
                await context.context.sendActivity(`entityName: ${key} - entityValue: ${value}`)
            }
            return <DialogTurnResult> { status : DialogTurnStatus.complete }
        })
        //, new SendActivity(`CLDialog result: {turn.CLResult} - {dialog.result} - {@CLResult}`)
    ])
]));
