export class QuoteChangeEvent {
    message: {
        attributes: {
            [key: string]: string
        },
        data: string,
        messageId: string,
        message_id: string,
        publishTime: string,
        publish_time: string
    };

    subscription: string;
}