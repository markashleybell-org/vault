import { ITag } from './all';

export interface ITagIndex {
    tags: ITag[];
    index: Map<string, string>;
}
