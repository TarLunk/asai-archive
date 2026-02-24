export type Message = {
  role?: string,
  content?: string,
  reasoning?: string,
  chat_id?:number,
  message_id?:number,
  bot_message_id?:string,
  created?:string,
  edited?:string,
  focus?:boolean,
  images?:MessageImage[]
  type?:string
}

export type MessageImage = {
  url: string;
}