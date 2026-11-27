/** Utilisateur connecté, tel que renvoyé par GET /auth/me. */
export interface User {
    id: number,
    email: string,
    firstname: string,
    lastname: string,
    creation?: string,
    avatar?: string | null,
    metier?: string | null,
    offre?: string | null,
    recherche?: string | null,
    primaryGroupId?: number | null,
}
