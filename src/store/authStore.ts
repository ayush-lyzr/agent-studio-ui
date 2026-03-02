import { create } from "zustand";
import Keycloak from "keycloak-js";

interface IAuthStore {
    idp: 'memberstack' | 'keycloak',
    token: string | null,
    keycloak: Keycloak | null,
    initialized: boolean,
    setToken : ( token : string ) => void;
    setKeycloak : (keycloak : Keycloak) => void;
    setInitialized : ( initialized : boolean ) => void;
}



export const useAuthStore = create<IAuthStore>((set) => ({
    idp: 'memberstack', // by default 
    token: null,
    keycloak: null,
    initialized: false,
    setToken : (token : string) => set({ token }),
    setKeycloak : (keycloak : Keycloak ) => set({ keycloak }),
    setInitialized : ( initialized : boolean) => set({ initialized })
})) 