export default function GetEmail(name: string) {
    return `${name.replace(/[^a-zA-Z0-9]/g, '')}@gmail.com`;
};
