export interface User {
    id: number;
    firstname: string;
    lastname: string;
    email: string;
    groups: any[],
    creation: string;
    lastconnexion: string;
}
