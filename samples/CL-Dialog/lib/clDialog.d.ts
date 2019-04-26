import { ConversationLearner, ICLOptions, OnSessionEndCallback, OnSessionStartCallback, ICallbackInput, EntityDetectionCallback } from '@conversationlearner/sdk';
import { Dialog, DialogContext, DialogTurnResult, DialogConfiguration, DialogConsultation, DialogEvent } from 'botbuilder-dialogs';
import { Storage, TurnContext } from 'botbuilder';
export interface CLDialogConfiguration extends DialogConfiguration {
    modelId: string;
}
export declare const CLDialog_ENDED_EVENT = "CLDialog_ENDED_EVENT";
export declare class CLContext extends TurnContext {
    readonly dialogContext: DialogContext;
    constructor(dc: DialogContext);
}
export declare class CLDialog<O extends object = {}> extends Dialog<O> {
    protected cl: ConversationLearner;
    protected clRouter: any;
    private readonly defaultOnSessionEndCallback;
    constructor(options: ICLOptions, storage: Storage, dialogId?: string);
    resultProperty: string;
    configure(config: CLDialogConfiguration): this;
    beginDialog(dc: DialogContext, options?: O): Promise<DialogTurnResult<any>>;
    consultDialog(dc: DialogContext): Promise<DialogConsultation>;
    onDialogEvent(dc: DialogContext, event: DialogEvent): Promise<boolean>;
    OnSessionStartCallback(target: OnSessionStartCallback): void;
    OnSessionEndCallback(target: OnSessionEndCallback): void;
    AddCallback<T>(callback: ICallbackInput<T>): void;
    EntityDetectionCallback(target: EntityDetectionCallback): void;
    private CreateContextForCL;
}
