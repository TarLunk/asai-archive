import { FuseResult } from "fuse.js"

export type IFuseService = {
    findProducts(products: string[][], query:string, limit: number):Promise<FuseResult<string[]>[]>
}