export interface User {
    id: string,
    email: string,
    firstName: string,
    lastName: string,
    refreshTokenHash: string,
    createdAt: string,
    avatar?: string | null,
    metier?: string | null,
    offre?: string | null,
    recherche?: string | null,
}
