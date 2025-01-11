import { createHash } from 'crypto';

export default function GenerateID(input: string) {
    const hash =  createHash('sha256').update(input).digest('hex');

    return hash.substring(0, 20);
}
