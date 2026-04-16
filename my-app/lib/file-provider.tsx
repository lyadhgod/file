'use client';

import { createContext, Dispatch, useContext, useReducer } from "react";
import { DictionaryProvider } from "../contexts/DictionaryContext"; 

const initialState = {
    jwt: null as string | null,
};

type State = typeof initialState;

type Action = {
    type: 'SET_JWT',
    payload: string | null,
};

function reducer(state: State, action: Action) {
    switch (action.type) {
        case 'SET_JWT':
            return { ...state, jwt: action.payload };
        default:
            return state;
    }
}

const FileContext = createContext(initialState);

const FileDispatchContext = createContext<Dispatch<Action>>(() => {});

export default function FileProvider({
    children,
    jwt
}: {
    children: React.ReactNode,
    jwt?: string | null
}) {
    const [state, dispatch] = useReducer(reducer, { ...initialState, jwt: jwt ?? null });
    
    return (
        <DictionaryProvider>
            <FileContext value={state}>
                <FileDispatchContext value={dispatch}>
                    {children}
                </FileDispatchContext>
            </FileContext>
        </DictionaryProvider>
    );
}

export function useFileContext() {
    return useContext(FileContext);    
}

export function useFileDispatchContext() {
    return useContext(FileDispatchContext);    
}
