export default function Transpose<T>(array: T[][]): T[][] {
    return array[0].map((_, colIndex) => array.map(row => row[colIndex]));
}
