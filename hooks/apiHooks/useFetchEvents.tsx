import {ApiService} from "@/services/apiService";
import {URLS} from "@/constants/apiUrls";
import {EventInfos} from "@/interfaces/event";


const useFetchEvents = () => {

    const fetchOne = async (id: number) => {
        try {
            return await ApiService.get(URLS.EVENT.ROOT + `/${id}`);
        } catch (error) {
            console.error(error);
            return null;
        }
    }

    const fetchAll = async (): Promise<EventInfos[]> => {
        try {
            const response = await ApiService.get(URLS.EVENT.FIND_ALL);
            return response.data.events;
        } catch (error) {
            console.error(error);
            return [];
        }
    }

    return {fetchOne, fetchAll};
}

export default useFetchEvents;
