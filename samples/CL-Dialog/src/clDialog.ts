import { ConversationLearner, ICLOptions } from '@conversationlearner/sdk'
import { getEntityDisplayValueMap } from '@conversationlearner/models'
import { Dialog, DialogContext, DialogTurnResult, DialogConfiguration, DialogConsultation, DialogTurnStatus, DialogConsultationDesire, DialogEvent } from 'botbuilder-dialogs'
import { Storage, TurnContext } from 'botbuilder'

export interface CLDialogConfiguration extends DialogConfiguration {
    modelId: string
}

export const CLDialog_ENDED = "CLDialog_ENDED"
export const CLDialog_Result = "CLResult"

export class CLContext extends TurnContext {
    public readonly dialogContext: DialogContext

    public constructor(dc: DialogContext) {
        super(dc.context)
        this.dialogContext = dc
    }
}

export class CLDialog<O extends object = {}> extends Dialog<O> {

    public cl: ConversationLearner
    protected clRouter: any
    private sessionEnded: boolean = false

    constructor(options: ICLOptions, storage: Storage, dialogId?: string) {
        super(dialogId)
        this.clRouter = ConversationLearner.Init(options, storage)
    }

    public configure(config: CLDialogConfiguration): this {
        this.cl = new ConversationLearner(config.modelId)
        return super.configure(this);
    }

    public async beginDialog(dc: DialogContext, options?: {}): Promise<DialogTurnResult<any>> {
        await this.cl.StartSession(this.CreateContextForCL(dc) as any)
        const consultation = await this.consultDialog(dc)
        this.sessionEnded = false
        this.cl.OnSessionEndCallback(async (context, memoryManager) => {
            const dContext = (<CLContext>(context as any)).dialogContext
            await context.sendActivity('Ending CLDialog Session!')
            await dContext.emitEvent(CLDialog_ENDED, memoryManager, false)
            dContext.state.turn.set(CLDialog_Result, memoryManager.curMemories)
        })
        return await consultation.processor(dc)
    }

    public async consultDialog(dc: DialogContext): Promise<DialogConsultation> {
        return <DialogConsultation>{
            desire: DialogConsultationDesire.shouldProcess,
            processor: async (dialogContext): Promise<DialogTurnResult> => {
                const result = await this.cl.recognize(this.CreateContextForCL(dialogContext) as any)

                if (result) {
                    await this.cl.SendResult(result);
                    return <DialogTurnResult>{
                        status: this.sessionEnded ? DialogTurnStatus.complete : DialogTurnStatus.waiting,
                        result: this.sessionEnded ? getEntityDisplayValueMap(dialogContext.state.turn.get(CLDialog_Result)) : undefined
                    }
                } else {
                    await dialogContext.context.sendActivity("Conversation Leaner couldn't predict any action! Ending CLDialog...")
                    return await dialogContext.endDialog()
                }
            }
        }
    }

    public async onDialogEvent(dc: DialogContext, event: DialogEvent): Promise<boolean> {
        switch (event.name) {
            case CLDialog_ENDED:
                this.sessionEnded = true
                return false
        }
    }

    private CreateContextForCL(dc: DialogContext): CLContext {
        return new CLContext(dc)
    }
}