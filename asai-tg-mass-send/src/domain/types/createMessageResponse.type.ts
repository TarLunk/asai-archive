import { ChatProps } from "./chatProps.type";
import { Message } from "./message.type";

export type CreateMessageResponse={
    messages?:Message[];
    chatProps?:ChatProps;
}