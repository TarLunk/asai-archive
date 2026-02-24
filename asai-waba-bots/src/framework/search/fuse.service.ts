import Fuse from 'fuse.js';
import { FuseResult } from 'fuse.js';
const options = {
    includeScore: true,
    threshold: 1,
    useExtendedSearch: true,
    keys: [{
        name: '0',
        weight: 1
    }, {
        name: '1',
        weight: 0.8
    }]
};
export default class FuseService {
    async findProducts(products: string[][], query: string, limit: number): Promise<FuseResult<string[]>[]> {
        const fuse = new Fuse(products, options);
        const result = fuse.search(query, { limit });
        return result;
    }
}