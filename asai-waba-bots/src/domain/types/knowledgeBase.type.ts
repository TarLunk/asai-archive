import { KnowledgeBaseText } from "./knowledgeBaseText.type";

export type KnowledgeBase = {
    text: KnowledgeBaseText[]
    last_update?: string;
    created?: string;
    faq_id?: number;
}