import { ConversationLearner, ICLOptions } from '@conversationlearner/sdk';
import { Dialog, DialogContext, DialogTurnResult, DialogConfiguration, DialogConsultation, DialogEvent } from 'botbuilder-dialogs';
import { Storage, TurnContext } from 'botbuilder';
export interface CLDialogConfiguration extends DialogConfiguration {
    modelId: string;
}
export declare const CLDialog_ENDED = "CLDialog_ENDED";
export declare const CLDialog_Result = "CLResult";
export declare class CLContext extends TurnContext {
    readonly dialogContext: DialogContext;
    constructor(dc: DialogContext);
}
export declare class CLDialog<O extends object = {}> extends Dialog<O> {
    cl: ConversationLearner;
    protected clRouter: any;
    private sessionEnded;
    constructor(options: ICLOptions, storage: Storage, dialogId?: string);
    configure(config: CLDialogConfiguration): this;
    beginDialog(dc: DialogContext, options?: {}): Promise<DialogTurnResult<any>>;
    consultDialog(dc: DialogContext): Promise<DialogConsultation>;
    onDialogEvent(dc: DialogContext, event: DialogEvent): Promise<boolean>;
    private CreateContextForCL;
}
