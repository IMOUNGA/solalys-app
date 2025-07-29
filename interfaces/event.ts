export interface EventInfos {
    id: number;
    name: string;
    hours: any;
    city: string;
    country: string;
    adress: string;
    link: string;
    user_id: number;
    group_id: number;
    location: {
        type: string;
        coordinates: [number, number];
    };
}
