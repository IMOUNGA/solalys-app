import React, {useEffect, useRef, useState} from 'react';
import {ApiService} from "@/services/apiService";
import {URLS} from "@/constants/apiUrls";

const UseFetchEvents = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const isMounted = useRef(true);

    useEffect(() => {
        return () => {
            isMounted.current = false;
        }
    }, []);

    const fetchOne = async (id: number) => {
        setLoading(true);

        try {
            return await ApiService.get(URLS.EVENT.ROOT + `/${id}`);
        } catch (error) {
            console.error(error);
            if (isMounted.current) setError(true);
        } finally {
            if (isMounted.current) setLoading(false);
        }
    }

    const fetchAll = async () => {
        setLoading(true);

        try {
            return await ApiService.get(URLS.EVENT.FIND_ALL);
        } catch (error) {
            console.error(error);
            if (isMounted.current) setError(true);
        } finally {
            if (isMounted.current) setLoading(false);
        }
    }

    return {loading, error, fetchOne, fetchAll};
};

export default UseFetchEvents;
