"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sdk_1 = require("@conversationlearner/sdk");
const models_1 = require("@conversationlearner/models");
const botbuilder_dialogs_1 = require("botbuilder-dialogs");
const botbuilder_1 = require("botbuilder");
exports.CLDialog_ENDED = "CLDialog_ENDED";
exports.CLDialog_Result = "CLResult";
class CLContext extends botbuilder_1.TurnContext {
    constructor(dc) {
        super(dc.context);
        this.dialogContext = dc;
    }
}
exports.CLContext = CLContext;
class CLDialog extends botbuilder_dialogs_1.Dialog {
    constructor(options, storage, dialogId) {
        super(dialogId);
        this.sessionEnded = false;
        this.clRouter = sdk_1.ConversationLearner.Init(options, storage);
    }
    configure(config) {
        this.cl = new sdk_1.ConversationLearner(config.modelId);
        return super.configure(this);
    }
    async beginDialog(dc, options) {
        await this.cl.StartSession(this.CreateContextForCL(dc));
        const consultation = await this.consultDialog(dc);
        this.sessionEnded = false;
        this.cl.OnSessionEndCallback(async (context, memoryManager) => {
            const dContext = context.dialogContext;
            await context.sendActivity('Ending CLDialog Session!');
            await dContext.emitEvent(exports.CLDialog_ENDED, memoryManager, false);
            dContext.state.turn.set(exports.CLDialog_Result, memoryManager.curMemories);
        });
        return await consultation.processor(dc);
    }
    async consultDialog(dc) {
        return {
            desire: botbuilder_dialogs_1.DialogConsultationDesire.shouldProcess,
            processor: async (dialogContext) => {
                const result = await this.cl.recognize(this.CreateContextForCL(dialogContext));
                if (result) {
                    await this.cl.SendResult(result);
                    return {
                        status: this.sessionEnded ? botbuilder_dialogs_1.DialogTurnStatus.complete : botbuilder_dialogs_1.DialogTurnStatus.waiting,
                        result: this.sessionEnded ? models_1.getEntityDisplayValueMap(dialogContext.state.turn.get(exports.CLDialog_Result)) : undefined
                    };
                }
                else {
                    await dialogContext.context.sendActivity("Conversation Leaner couldn't predict any action! Ending CLDialog...");
                    return await dialogContext.endDialog();
                }
            }
        };
    }
    async onDialogEvent(dc, event) {
        switch (event.name) {
            case exports.CLDialog_ENDED:
                this.sessionEnded = true;
                return false;
        }
    }
    CreateContextForCL(dc) {
        return new CLContext(dc);
    }
}
exports.CLDialog = CLDialog;
//# sourceMappingURL=clDialog.js.map