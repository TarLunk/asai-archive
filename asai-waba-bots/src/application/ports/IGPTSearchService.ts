export type IGPTSearchService = {
    findProducts(products: string[][], query:string, limit: number):Promise<{content:string, tokens: number}>
}