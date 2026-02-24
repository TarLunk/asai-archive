export type ParsedAnswer ={
    actions: ParsedAction[]
}

export type ParsedAction = {
    trigger: string,
    value: string
}